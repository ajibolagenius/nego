import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApiClient } from '@/lib/supabase/api'

/**
 * Utility endpoint to release escrow for a completed booking
 * This can be used to fix bookings that were completed before escrow release logic was added
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin or the talent for this booking
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    // Fetch the booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, talent_id, client_id, total_price, status')
      .eq('id', id)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Verify user is admin or the talent
    if (!isAdmin && booking.talent_id !== user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to release escrow for this booking' },
        { status: 403 }
      )
    }

    // Only process completed bookings
    if (booking.status !== 'completed') {
      return NextResponse.json(
        { error: `Booking is not completed. Current status: ${booking.status}` },
        { status: 400 }
      )
    }

    const apiClient = createApiClient()

    // Check if escrow has already been released by checking if transaction exists
    const { data: existingTransaction } = await apiClient
      .from('transactions')
      .select('id')
      .eq('reference_id', booking.id)
      .eq('type', 'booking')
      .eq('user_id', booking.talent_id)
      .maybeSingle()

    if (existingTransaction) {
      return NextResponse.json({
        success: true,
        message: 'Escrow has already been released for this booking',
        alreadyReleased: true
      })
    }

    console.log('[API] Releasing escrow for completed booking:', {
      bookingId: id,
      clientId: booking.client_id,
      talentId: booking.talent_id,
      totalPrice: booking.total_price
    })

    // Get client's wallet to release escrow
    const { data: clientWallet, error: clientWalletError } = await apiClient
      .from('wallets')
      .select('escrow_balance, balance')
      .eq('user_id', booking.client_id)
      .single()

    if (clientWalletError || !clientWallet) {
      return NextResponse.json(
        { error: 'Client wallet not found' },
        { status: 404 }
      )
    }

    // Check if escrow has enough balance
    if ((clientWallet.escrow_balance || 0) < booking.total_price) {
      return NextResponse.json(
        { error: `Insufficient escrow balance. Expected: ${booking.total_price}, Available: ${clientWallet.escrow_balance || 0}` },
        { status: 400 }
      )
    }

    // Release escrow from client's wallet
    const newClientEscrow = (clientWallet.escrow_balance || 0) - booking.total_price
    const { error: releaseEscrowError } = await apiClient
      .from('wallets')
      .update({ escrow_balance: newClientEscrow })
      .eq('user_id', booking.client_id)

    if (releaseEscrowError) {
      console.error('[API] Error releasing escrow:', releaseEscrowError)
      return NextResponse.json(
        { error: `Failed to release escrow: ${releaseEscrowError.message}` },
        { status: 500 }
      )
    }

    // Get talent's wallet to add balance
    const { data: talentWallet, error: talentWalletError } = await apiClient
      .from('wallets')
      .select('balance')
      .eq('user_id', booking.talent_id)
      .single()

    if (talentWalletError || !talentWallet) {
      // Create wallet if it doesn't exist
      const { error: createWalletError } = await apiClient
        .from('wallets')
        .insert({
          user_id: booking.talent_id,
          balance: booking.total_price,
          escrow_balance: 0
        })

      if (createWalletError) {
        // Rollback escrow release
        await apiClient
          .from('wallets')
          .update({ escrow_balance: clientWallet.escrow_balance })
          .eq('user_id', booking.client_id)

        return NextResponse.json(
          { error: `Failed to create talent wallet: ${createWalletError.message}` },
          { status: 500 }
        )
      }
    } else {
      // Add to talent's balance
      const { error: addBalanceError } = await apiClient
        .from('wallets')
        .update({ balance: (talentWallet.balance || 0) + booking.total_price })
        .eq('user_id', booking.talent_id)

      if (addBalanceError) {
        // Rollback escrow release
        await apiClient
          .from('wallets')
          .update({ escrow_balance: clientWallet.escrow_balance })
          .eq('user_id', booking.client_id)

        return NextResponse.json(
          { error: `Failed to add to talent balance: ${addBalanceError.message}` },
          { status: 500 }
        )
      }
    }

    // Create transaction record for talent
    const { error: transactionError } = await apiClient.from('transactions').insert({
      user_id: booking.talent_id,
      amount: 0,
      coins: booking.total_price,
      type: 'booking',
      status: 'completed',
      description: `Earnings from completed booking #${booking.id.slice(0, 8)}`,
      reference_id: booking.id
    })

    if (transactionError) {
      console.error('[API] Error creating transaction record:', transactionError)
      // Don't fail the whole operation if transaction record fails
    }

    return NextResponse.json({
      success: true,
      message: 'Escrow released successfully',
      releasedAmount: booking.total_price
    })
  } catch (error) {
    console.error('Error releasing escrow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
