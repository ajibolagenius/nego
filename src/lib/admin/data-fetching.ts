import { createClient } from '@/lib/supabase/server'
import type { VerificationWithBooking, WithdrawalRequestWithTalent, PayoutTransaction, BookingWithRelations } from '@/types/admin'

interface FetchOptions {
    retries?: number
    retryDelay?: number
    timeout?: number
}

const DEFAULT_OPTIONS: Required<FetchOptions> = {
    retries: 3,
    retryDelay: 1000,
    timeout: 30000,
}

/**
 * Retry wrapper for async functions
 */
async function withRetry<T>(
    fn: () => Promise<T>,
    options: Required<FetchOptions> = DEFAULT_OPTIONS
): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= options.retries; attempt++) {
        try {
            return await Promise.race([
                fn(),
                new Promise<T>((_, reject) =>
                    setTimeout(() => reject(new Error('Request timeout')), options.timeout)
                ),
            ])
        } catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error')

            // Don't retry on certain errors
            if (error instanceof Error && (
                error.message.includes('not found') ||
                error.message.includes('Unauthorized') ||
                error.message.includes('Forbidden')
            )) {
                throw error
            }

            if (attempt < options.retries) {
                await new Promise(resolve => setTimeout(resolve, options.retryDelay * (attempt + 1)))
            }
        }
    }

    throw lastError || new Error('Failed after retries')
}

/**
 * Fetch verifications with error handling and retry logic
 */
export async function fetchVerifications(options?: FetchOptions): Promise<{
    data: VerificationWithBooking[] | null
    error: Error | null
}> {
    try {
        const data = await withRetry(async () => {
            const supabase = await createClient()

            const { data, error } = await supabase
                .from('verifications')
                .select(`
                    booking_id,
                    selfie_url,
                    full_name,
                    phone,
                    gps_coords,
                    status,
                    admin_notes,
                    created_at,
                    booking:bookings (
                        id,
                        total_price,
                        status,
                        created_at,
                        client:profiles!bookings_client_id_fkey (
                            id,
                            display_name,
                            email:full_name,
                            avatar_url
                        ),
                        talent:profiles!bookings_talent_id_fkey (
                            id,
                            display_name
                        )
                    )
                `)
                .order('created_at', { ascending: false })

            if (error) throw error

            return (data || []).map((v: any) => {
                // Handle booking as array (from join) or single object
                const bookingArray = Array.isArray(v.booking) ? v.booking : (v.booking ? [v.booking] : [])
                const booking = bookingArray[0] || null
                
                if (!booking) {
                    return {
                        ...v,
                        id: v.booking_id,
                        booking: null,
                    } as VerificationWithBooking
                }
                
                // Handle client and talent which may also be arrays
                const clientArray = Array.isArray(booking.client) ? booking.client : (booking.client ? [booking.client] : [])
                const talentArray = Array.isArray(booking.talent) ? booking.talent : (booking.talent ? [booking.talent] : [])
                
                return {
                    ...v,
                    id: v.booking_id,
                    booking: {
                        ...booking,
                        client: clientArray[0] || null,
                        talent: talentArray[0] || null,
                    } as BookingWithRelations,
                } as VerificationWithBooking
            })
        }, { ...DEFAULT_OPTIONS, ...options })

        return { data, error: null }
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error ? error : new Error('Failed to fetch verifications'),
        }
    }
}

/**
 * Fetch withdrawal requests with error handling and retry logic
 */
export async function fetchWithdrawalRequests(options?: FetchOptions): Promise<{
    data: WithdrawalRequestWithTalent[] | null
    error: Error | null
}> {
    try {
        const data = await withRetry(async () => {
            const supabase = await createClient()

            const { data, error } = await supabase
                .from('withdrawal_requests')
                .select(`
                    *,
                    talent:profiles(id, display_name, avatar_url, username)
                `)
                .order('created_at', { ascending: false })

            if (error) throw error

            return data as WithdrawalRequestWithTalent[]
        }, { ...DEFAULT_OPTIONS, ...options })

        return { data, error: null }
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error ? error : new Error('Failed to fetch withdrawal requests'),
        }
    }
}

/**
 * Fetch payout transactions with error handling and retry logic
 */
export async function fetchPayoutTransactions(options?: FetchOptions): Promise<{
    data: PayoutTransaction[] | null
    error: Error | null
}> {
    try {
        const data = await withRetry(async () => {
            const supabase = await createClient()

            const { data, error } = await supabase
                .from('transactions')
                .select(`
                    *,
                    user:profiles(display_name, avatar_url)
                `)
                .eq('type', 'payout')
                .order('created_at', { ascending: false })
                .limit(50)

            if (error) throw error

            return data as PayoutTransaction[]
        }, { ...DEFAULT_OPTIONS, ...options })

        return { data, error: null }
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error ? error : new Error('Failed to fetch payout transactions'),
        }
    }
}

/**
 * Fetch talent wallets with error handling
 */
export async function fetchTalentWallets(options?: FetchOptions): Promise<{
    data: Array<{ profile: any; wallet: any }> | null
    error: Error | null
}> {
    try {
        const data = await withRetry(async () => {
            const supabase = await createClient()

            // Fetch all talents
            const { data: talents, error: talentsError } = await supabase
                .from('profiles')
                .select('id, display_name, avatar_url, username, location')
                .eq('role', 'talent')

            if (talentsError) throw talentsError

            // Fetch wallets for all talents
            const talentIds = talents?.map(t => t.id) || []
            const { data: wallets, error: walletsError } = await supabase
                .from('wallets')
                .select('*')
                .in('user_id', talentIds)

            if (walletsError) throw walletsError

            // Combine data
            return talents?.map(talent => ({
                profile: talent,
                wallet: wallets?.find(w => w.user_id === talent.id) || {
                    user_id: talent.id,
                    balance: 0,
                    escrow_balance: 0,
                },
            })) || []
        }, { ...DEFAULT_OPTIONS, ...options })

        return { data, error: null }
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error ? error : new Error('Failed to fetch talent wallets'),
        }
    }
}
