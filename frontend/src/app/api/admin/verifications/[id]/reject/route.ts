import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateAdmin, validateVerification } from '@/lib/admin/validation'
import { logAdminAction, getClientIP, getUserAgent } from '@/lib/admin/audit-log'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate admin access
    const adminCheck = await validateAdmin()
    if (!adminCheck.isValid) {
      return NextResponse.json(
        { error: adminCheck.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const bookingId = params.id
    const body = await request.json()
    const { adminNotes } = body

    // Validate admin notes are provided
    if (!adminNotes || !adminNotes.trim()) {
      return NextResponse.json(
        { error: 'Admin notes are required for rejection' },
        { status: 400 }
      )
    }

    // Validate verification exists
    const verificationCheck = await validateVerification(bookingId)
    if (!verificationCheck.isValid) {
      return NextResponse.json(
        { error: verificationCheck.error || 'Verification not found' },
        { status: 404 }
      )
    }

    const verification = verificationCheck.verification

    // Check if already processed
    if (verification.status !== 'pending') {
      return NextResponse.json(
        { error: `Verification is already ${verification.status}` },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get booking details for refund
    const { data: bookingData, error: bookingFetchError } = await supabase
      .from('bookings')
      .select('id, client_id, total_price, status')
      .eq('id', bookingId)
      .single()

    if (bookingFetchError || !bookingData) {
      return NextResponse.json(
        { error: 'Unable to fetch booking details' },
        { status: 404 }
      )
    }

    // Update verification status
    const { error: verifyError } = await supabase
      .from('verifications')
      .update({
        status: 'rejected',
        admin_notes: adminNotes,
      })
      .eq('booking_id', bookingId)

    if (verifyError) {
      return NextResponse.json(
        { error: `Failed to update verification: ${verifyError.message}` },
        { status: 500 }
      )
    }

    // Update booking status to cancelled
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)

    if (bookingError) {
      // Rollback verification update
      await supabase
        .from('verifications')
        .update({ status: 'pending' })
        .eq('booking_id', bookingId)

      return NextResponse.json(
        { error: `Failed to update booking: ${bookingError.message}` },
        { status: 500 }
      )
    }

    // Refund coins to client wallet
    if (bookingData.total_price > 0 && bookingData.client_id) {
      const { data: walletData, error: walletFetchError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', bookingData.client_id)
        .single()

      if (!walletFetchError && walletData) {
        const currentBalance = walletData.balance || 0
        const refundAmount = bookingData.total_price

        // Update wallet with refund
        const { error: walletUpdateError } = await supabase
          .from('wallets')
          .update({ balance: currentBalance + refundAmount })
          .eq('user_id', bookingData.client_id)

        if (walletUpdateError) {
          console.error('Failed to refund wallet:', walletUpdateError)
          // Don't fail the request, but log the error
        } else {
          // Create refund transaction record
          await supabase.from('transactions').insert({
            user_id: bookingData.client_id,
            amount: 0,
            coins: refundAmount,
            type: 'refund',
            status: 'completed',
            description: `Refund for rejected verification - Booking #${bookingData.id.slice(0, 8)}`,
            reference_id: bookingData.id
          })

          // Create notification for client
          await supabase.from('notifications').insert({
            user_id: bookingData.client_id,
            type: 'booking_cancelled',
            title: 'Booking Cancelled & Refunded',
            message: `Your booking has been cancelled due to verification rejection. ${refundAmount.toLocaleString()} coins have been refunded to your wallet.`,
            data: { booking_id: bookingData.id, refund_amount: refundAmount }
          })
        }
      }
    }

    // Log admin action
    await logAdminAction({
      admin_id: adminCheck.userId!,
      action: 'reject_verification',
      resource_type: 'verification',
      resource_id: bookingId,
      details: {
        booking_id: bookingId,
        admin_notes,
        refund_amount: bookingData.total_price,
      },
      ip_address: getClientIP(request.headers),
      user_agent: getUserAgent(request.headers),
    })

    return NextResponse.json({
      success: true,
      message: 'Verification rejected and refund processed',
      refundAmount: bookingData.total_price,
    })
  } catch (error) {
    console.error('Error rejecting verification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
