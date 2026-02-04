import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApiClient } from '@/lib/supabase/api'

export async function POST(
    _request: NextRequest,
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

        // Fetch the booking to verify ownership
        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select('id, talent_id, status')
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
                { error: 'You are not authorized to accept this booking' },
                { status: 403 }
            )
        }

        // Verify booking is in the correct status
        if (booking.status !== 'verification_pending') {
            return NextResponse.json(
                { error: `Booking cannot be accepted. Current status: ${booking.status}` },
                { status: 400 }
            )
        }

        // Check if verification has been approved by admin
        const apiClient = createApiClient()
        const { data: verification, error: verificationError } = await apiClient
            .from('verifications')
            .select('status')
            .eq('booking_id', id)
            .maybeSingle()

        if (verificationError) {
            console.error('[API] Error checking verification:', verificationError)
            return NextResponse.json(
                { error: 'Failed to verify booking status. Please try again.' },
                { status: 500 }
            )
        }

        if (!verification) {
            return NextResponse.json(
                { error: 'Verification not found. The client must complete verification before you can accept this booking.' },
                { status: 400 }
            )
        }

        if (verification.status !== 'approved') {
            return NextResponse.json(
                {
                    error: verification.status === 'pending'
                        ? 'This booking is awaiting admin verification approval. Please wait for admin to review the client verification before accepting.'
                        : 'This booking cannot be accepted. The verification has been rejected.'
                },
                { status: 400 }
            )
        }

        console.log('[API] Attempting to update booking:', {
            bookingId: id,
            talentId: user.id,
            currentStatus: booking.status,
            targetStatus: 'confirmed',
            verificationStatus: verification.status
        })

        // Use API client (service role) for update to bypass RLS
        // We've already verified ownership and verification approval above
        const { data: updatedBookings, error: updateError } = await apiClient
            .from('bookings')
            .update({ status: 'confirmed' })
            .eq('id', id)
            .select()

        console.log('[API] Update result:', {
            updatedCount: updatedBookings?.length || 0,
            hasError: !!updateError,
            error: updateError,
            updatedBookings
        })

        if (updateError) {
            console.error('[API] Error accepting booking:', updateError)
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
                expectedStatus: 'verification_pending',
                actualStatus: currentBooking?.status
            })

            if (currentBooking) {
                if (currentBooking.talent_id !== user.id) {
                    return NextResponse.json(
                        { error: 'You are not authorized to accept this booking' },
                        { status: 403 }
                    )
                }
                if (currentBooking.status !== 'verification_pending') {
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

        return NextResponse.json({
            success: true,
            booking: updatedBooking,
            message: 'Booking accepted successfully'
        })
    } catch (error) {
        console.error('Error accepting booking:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
