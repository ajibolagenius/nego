import { NextRequest, NextResponse } from 'next/server'
import { notifyUser } from '@/lib/notifications'
import { createApiClient } from '@/lib/supabase/api'

// This endpoint should be called by a cron job (e.g., Vercel Cron, external service)
// It expires stale bookings based on configurable timeframes
//
// NOTE: Currently configured to run daily (0 0 * * *) due to Vercel Hobby plan limitations.
// For hourly expiration of payment_pending bookings, upgrade to Vercel Pro plan and change
// the schedule to "0 * * * *" in vercel.json
//
// Alternative: Consider client-side expiration checks or webhook-based expiration for
// payment_pending bookings that need to expire after exactly 1 hour.

const EXPIRATION_RULES = {
    // Bookings in 'payment_pending' status expire after 1 hour
    // NOTE: With daily cron, these will expire within 24 hours instead of exactly 1 hour
    payment_pending: 1 * 60 * 60 * 1000, // 1 hour in milliseconds
    // Bookings in 'pending' status expire after 24 hours
    pending: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
}

type ExpirationResult = {
    expired?: boolean
    refunded?: boolean
    notified?: boolean
    skipped?: boolean
    error?: string
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

        // Process each status type in parallel
        await Promise.all(Object.entries(EXPIRATION_RULES).map(async ([status, maxAge]) => {
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
                return
            }

            if (!staleBookings || staleBookings.length === 0) return

            // Process stale bookings in parallel to reduce Fluid CPU wall-clock time
            const processingResults = await Promise.allSettled(
                staleBookings.map(async (booking) => {
                    try {
                        // Update booking status to expired
                        const { data: updatedRows, error: updateError } = await supabase
                            .from('bookings')
                            .update({
                                status: 'expired',
                                updated_at: now.toISOString()
                            })
                            .eq('id', booking.id)
                            .eq('status', status)
                            .select('id')

                        if (updateError) {
                            throw new Error(`Failed to expire booking ${booking.id}: ${updateError.message}`)
                        }

                        if (!updatedRows || updatedRows.length === 0) {
                            return { skipped: true } satisfies ExpirationResult
                        }

                        // If booking was payment_pending and coins were held in escrow, refund them
                        if (status === 'payment_pending' && booking.total_price > 0) {
                            const { data: existingRefund } = await supabase
                                .from('transactions')
                                .select('id')
                                .eq('reference_id', booking.id)
                                .eq('type', 'refund')
                                .maybeSingle()

                            if (existingRefund) {
                                return { expired: true, refunded: true, notified: false } satisfies ExpirationResult
                            }

                            const { data: walletData, error: walletError } = await supabase
                                .from('wallets')
                                .select('balance, escrow_balance')
                                .eq('user_id', booking.client_id)
                                .single()

                            if (!walletError && walletData && walletData.escrow_balance >= booking.total_price) {
                                const { error: refundError } = await supabase
                                    .from('wallets')
                                    .update({
                                        escrow_balance: walletData.escrow_balance - booking.total_price,
                                        balance: walletData.balance + booking.total_price
                                    })
                                    .eq('user_id', booking.client_id)

                                if (!refundError) {
                                    // Create refund transaction (fire and forget)
                                    await supabase.from('transactions').insert({
                                        user_id: booking.client_id,
                                        amount: 0,
                                        coins: booking.total_price,
                                        type: 'refund',
                                        status: 'completed',
                                        description: `Refund for expired booking #${booking.id.slice(0, 8)}`,
                                        reference_id: booking.id
                                    })
                                    
                                    return { expired: true, refunded: true, notified: false } satisfies ExpirationResult
                                }
                            }
                        }

                        // Create notification for client
                        const talentData = booking.talent as unknown as { display_name: string; id: string } | null
                        await notifyUser({
                            userId: booking.client_id,
                            type: 'booking_expired',
                            title: 'Booking Expired',
                            message: `Your booking with ${talentData?.display_name || 'the talent'} has expired due to inactivity.`,
                            data: { booking_id: booking.id },
                            url: `/dashboard/bookings/${booking.id}`,
                        })

                        return { expired: true, refunded: false, notified: true } satisfies ExpirationResult
                    } catch (err) {
                        return { error: err instanceof Error ? err.message : String(err) } satisfies ExpirationResult
                    }
                })
            )

            // Collect results
            processingResults.forEach((res) => {
                if (res.status === 'fulfilled') {
                    const val = res.value
                    if (val.error) {
                        results.errors.push(val.error)
                    } else if ('skipped' in val) {
                        return
                    } else {
                        if (val.expired) results.expired++
                        if (val.refunded) results.refunded++
                        if (val.notified) results.notified++
                    }
                } else {
                    results.errors.push(String(res.reason))
                }
            })

        }))

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
