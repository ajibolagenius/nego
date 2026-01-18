import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApiClient } from '@/lib/supabase/api'

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

    // Fetch the booking with full details including client_id and total_price
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

    // Verify user is the talent for this booking
    if (booking.talent_id !== user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to complete this booking' },
        { status: 403 }
      )
    }

    // Verify booking is in the correct status
    if (booking.status !== 'confirmed') {
      return NextResponse.json(
        { error: `Booking cannot be completed. Current status: ${booking.status}` },
        { status: 400 }
      )
    }

    console.log('[API] Attempting to complete booking:', {
      bookingId: id,
      talentId: user.id,
      currentStatus: booking.status,
      targetStatus: 'completed'
    })

    // Use API client (service role) for update to bypass RLS
    // We've already verified ownership above
    const apiClient = createApiClient()
    const { data: updatedBookings, error: updateError } = await apiClient
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', id)
      .select()

    console.log('[API] Update result:', {
      updatedCount: updatedBookings?.length || 0,
      hasError: !!updateError,
      error: updateError,
      updatedBookings
    })

    if (updateError) {
      console.error('[API] Error completing booking:', updateError)
      console.error('[API] Error details:', JSON.stringify(updateError, null, 2))
      return NextResponse.json(
        { error: `Failed to update booking: ${updateError.message}` },
        { status: 500 }
      )
    }

    if (!updatedBookings || updatedBookings.length === 0) {
      // Try to fetch the booking again to see its current state
      const { data: currentBooking } = await supabase
        .from('bookings')
        .select('id, talent_id, status')
        .eq('id', id)
        .single()

      console.error('[API] No booking was updated.', {
        bookingId: id,
        currentBookingState: currentBooking,
        expectedTalentId: user.id,
        actualTalentId: currentBooking?.talent_id,
        expectedStatus: 'confirmed',
        actualStatus: currentBooking?.status
      })

      if (currentBooking) {
        if (currentBooking.talent_id !== user.id) {
          return NextResponse.json(
            { error: 'You are not authorized to complete this booking' },
            { status: 403 }
          )
        }
        if (currentBooking.status !== 'confirmed') {
          return NextResponse.json(
            { error: `Booking status has changed. Current status: ${currentBooking.status}` },
            { status: 400 }
          )
        }
      }

      return NextResponse.json(
        { error: 'Failed to update booking. The booking may have been modified or you may not have permission to update it.' },
        { status: 500 }
      )
    }

    const updatedBooking = updatedBookings[0]

    console.log('[API] Starting escrow release process:', {
      bookingId: id,
      clientId: booking.client_id,
      talentId: booking.talent_id,
      totalPrice: booking.total_price
    })

    // Release escrow and transfer to talent's balance
    // Get client's wallet to release escrow
    const { data: clientWallet, error: clientWalletError } = await apiClient
      .from('wallets')
      .select('escrow_balance, balance')
      .eq('user_id', booking.client_id)
      .single()

    if (clientWalletError || !clientWallet) {
      console.error('[API] Error fetching client wallet:', clientWalletError)
      // Continue even if client wallet fetch fails - booking is already marked complete
    } else {
      console.log('[API] Client wallet before escrow release:', {
        escrowBalance: clientWallet.escrow_balance,
        balance: clientWallet.balance
      })

      // Release escrow from client's wallet
      const newClientEscrow = Math.max(0, (clientWallet.escrow_balance || 0) - booking.total_price)
      const { error: releaseEscrowError } = await apiClient
        .from('wallets')
        .update({ escrow_balance: newClientEscrow })
        .eq('user_id', booking.client_id)

      if (releaseEscrowError) {
        console.error('[API] Error releasing escrow:', releaseEscrowError)
        console.error('[API] Escrow release error details:', JSON.stringify(releaseEscrowError, null, 2))
        // Continue even if escrow release fails - booking is already marked complete
      } else {
        console.log('[API] Escrow released from client wallet. New escrow:', newClientEscrow)

        // Get talent's wallet to add balance
        const { data: talentWallet, error: talentWalletError } = await apiClient
          .from('wallets')
          .select('balance, escrow_balance')
          .eq('user_id', booking.talent_id)
          .single()

        if (talentWalletError || !talentWallet) {
          console.log('[API] Talent wallet not found, creating new wallet')
          // Create wallet if it doesn't exist
          const { data: newWallet, error: createWalletError } = await apiClient
            .from('wallets')
            .insert({
              user_id: booking.talent_id,
              balance: booking.total_price,
              escrow_balance: 0
            })
            .select()
            .single()

          if (createWalletError) {
            console.error('[API] Error creating talent wallet:', createWalletError)
            console.error('[API] Create wallet error details:', JSON.stringify(createWalletError, null, 2))
          } else {
            console.log('[API] Talent wallet created with balance:', newWallet.balance)
            // Create transaction record for talent
            const { error: transactionError } = await apiClient.from('transactions').insert({
              user_id: booking.talent_id,
              amount: booking.total_price,
              coins: booking.total_price,
              type: 'booking',
              status: 'completed',
              description: `Earnings from completed booking #${booking.id.slice(0, 8)}`,
              reference_id: booking.id
            })
            if (transactionError) {
              console.error('[API] Error creating transaction record:', transactionError)
            }
          }
        } else {
          console.log('[API] Talent wallet before balance update:', {
            currentBalance: talentWallet.balance,
            escrowBalance: talentWallet.escrow_balance,
            amountToAdd: booking.total_price
          })

          // Add to talent's balance
          const newTalentBalance = (talentWallet.balance || 0) + booking.total_price
          const { error: addBalanceError } = await apiClient
            .from('wallets')
            .update({ balance: newTalentBalance })
            .eq('user_id', booking.talent_id)

          if (addBalanceError) {
            console.error('[API] Error adding to talent balance:', addBalanceError)
            console.error('[API] Add balance error details:', JSON.stringify(addBalanceError, null, 2))
          } else {
            console.log('[API] Successfully added to talent balance. New balance:', newTalentBalance)
            // Create transaction record for talent
            const { error: transactionError } = await apiClient.from('transactions').insert({
              user_id: booking.talent_id,
              amount: booking.total_price,
              coins: booking.total_price,
              type: 'booking',
              status: 'completed',
              description: `Earnings from completed booking #${booking.id.slice(0, 8)}`,
              reference_id: booking.id
            })

            if (transactionError) {
              console.error('[API] Error creating transaction record:', transactionError)
            } else {
              console.log('[API] Transaction record created successfully')
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: 'Booking completed successfully'
    })
  } catch (error) {
    console.error('Error completing booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
