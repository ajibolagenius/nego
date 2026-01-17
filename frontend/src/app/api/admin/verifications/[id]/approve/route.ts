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

    // Update verification status
    const { error: verifyError } = await supabase
      .from('verifications')
      .update({
        status: 'approved',
        admin_notes: adminNotes || null,
      })
      .eq('booking_id', bookingId)

    if (verifyError) {
      return NextResponse.json(
        { error: `Failed to update verification: ${verifyError.message}` },
        { status: 500 }
      )
    }

    // Update booking status to confirmed
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
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

    // Log admin action
    await logAdminAction({
      admin_id: adminCheck.userId!,
      action: 'approve_verification',
      resource_type: 'verification',
      resource_id: bookingId,
      details: {
        booking_id: bookingId,
        admin_notes: adminNotes || null,
      },
      ip_address: getClientIP(request.headers),
      user_agent: getUserAgent(request.headers),
    })

    return NextResponse.json({
      success: true,
      message: 'Verification approved successfully',
    })
  } catch (error) {
    console.error('Error approving verification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
