import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'

// This endpoint should be called by a cron job (e.g., Vercel Cron, external service)
// It expires stale bookings based on configurable timeframes

const EXPIRATION_RULES = {
    // Bookings in 'payment_pending' status expire after 1 hour
    payment_pending: 1 * 60 * 60 * 1000, // 1 hour in milliseconds
    // Bookings in 'pending' status expire after 24 hours
    pending: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
}

export async function POST(request: NextRequest) {
    try {
        // Verify cron secret (optional security)
        const authHeader = request.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Use API client (service role) to bypass RLS
        const supabase = createApiClient()

        const now = new Date()
        const results = {
            expired: 0,
            refunded: 0,
            notified: 0,
            errors: [] as string[],
        }

        // Process each status type
        for (const [status, maxAge] of Object.entries(EXPIRATION_RULES)) {
            const cutoffTime = new Date(now.getTime() - maxAge).toISOString()

            // Find stale bookings
            const { data: staleBookings, error: fetchError } = await supabase
                .from('bookings')
                .select(`
          id,
          client_id,
          talent_id,
          total_price,
          status,
          created_at,
          client:profiles!bookings_client_id_fkey(display_name, id),
          talent:profiles!bookings_talent_id_fkey(display_name, id)
        `)
                .eq('status', status)
                .lt('created_at', cutoffTime)

            if (fetchError) {
                results.errors.push(`Error fetching ${status} bookings: ${fetchError.message}`)
                continue
            }

            if (!staleBookings || staleBookings.length === 0) continue

            // Process each stale booking
            for (const booking of staleBookings) {
                try {
                    // Update booking status to expired
                    const { error: updateError } = await supabase
                        .from('bookings')
                        .update({
                            status: 'expired',
                            updated_at: now.toISOString()
                        })
                        .eq('id', booking.id)

                    if (updateError) {
                        results.errors.push(`Failed to expire booking ${booking.id}: ${updateError.message}`)
                        continue
                    }

                    results.expired++

                    // If booking was payment_pending and coins were held in escrow, refund them
                    if (status === 'payment_pending' && booking.total_price > 0) {
                        // Check if coins were deducted (they might have been in escrow)
                        const { data: walletData, error: walletError } = await supabase
                            .from('wallets')
                            .select('balance, escrow_balance')
                            .eq('user_id', booking.client_id)
                            .single()

                        if (!walletError && walletData) {
                            // Refund from escrow if applicable
                            if (walletData.escrow_balance >= booking.total_price) {
                                const { error: refundError } = await supabase
                                    .from('wallets')
                                    .update({
                                        escrow_balance: walletData.escrow_balance - booking.total_price,
                                        balance: walletData.balance + booking.total_price
                                    })
                                    .eq('user_id', booking.client_id)

                                if (!refundError) {
                                    results.refunded++

                                    // Create refund transaction
                                    await supabase.from('transactions').insert({
                                        user_id: booking.client_id,
                                        amount: 0,
                                        coins: booking.total_price,
                                        type: 'refund',
                                        status: 'completed',
                                        description: `Refund for expired booking #${booking.id.slice(0, 8)}`,
                                        reference_id: booking.id
                                    })
                                }
                            }
                        }
                    }

                    // Create notification for client
                    const clientData = booking.client as unknown as { display_name: string; id: string } | null
                    const talentData = booking.talent as unknown as { display_name: string; id: string } | null

                    await supabase.from('notifications').insert({
                        user_id: booking.client_id,
                        type: 'booking_expired',
                        title: 'Booking Expired',
                        message: `Your booking with ${talentData?.display_name || 'the talent'} has expired due to inactivity.`,
                        data: { booking_id: booking.id },
                        is_read: false
                    })

                    results.notified++

                } catch (err) {
                    results.errors.push(`Error processing booking ${booking.id}: ${err}`)
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processed expired bookings`,
            results,
            timestamp: now.toISOString()
        })

    } catch (error) {
        console.error('Auto-expire error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        )
    }
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
    return POST(request)
}
