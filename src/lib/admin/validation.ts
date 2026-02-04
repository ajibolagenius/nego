import { createApiClient } from '@/lib/supabase/api'
import { createClient } from '@/lib/supabase/server'
import type { VerificationWithBooking, WithdrawalRequestWithTalent } from '@/types/admin'

/**
 * Validates that the current user is an admin
 */
export async function validateAdmin(): Promise<{ isValid: boolean; userId?: string; error?: string }> {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { isValid: false, error: 'Unauthorized: User not authenticated' }
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
        return { isValid: false, error: 'User profile not found' }
    }

    if (profile.role !== 'admin') {
        return { isValid: false, error: 'Forbidden: Admin access required' }
    }

    return { isValid: true, userId: user.id }
}

/**
 * Validates that a verification exists and is in a valid state
 */
export async function validateVerification(bookingId: string): Promise<{
    isValid: boolean
    verification?: VerificationWithBooking
    error?: string
}> {
    // Use API client to bypass RLS for admin operations
    const apiClient = createApiClient()

    const { data: verification, error } = await apiClient
        .from('verifications')
        .select('*, booking:bookings(*)')
        .eq('booking_id', bookingId)
        .single()

    if (error || !verification) {
        console.error('[validateVerification] Error fetching verification:', {
            bookingId,
            error,
            errorCode: error?.code,
            errorMessage: error?.message
        })
        return { isValid: false, error: 'Verification not found' }
    }

    return { isValid: true, verification }
}

/**
 * Validates that a withdrawal request exists and is in a valid state
 */
export async function validateWithdrawalRequest(requestId: string): Promise<{
    isValid: boolean
    request?: WithdrawalRequestWithTalent
    error?: string
}> {
    const supabase = await createClient()

    const { data: request, error } = await supabase
        .from('withdrawal_requests')
        .select('*, talent:profiles(id, display_name)')
        .eq('id', requestId)
        .single()

    if (error || !request) {
        return { isValid: false, error: 'Withdrawal request not found' }
    }

    if (request.status !== 'pending') {
        return { isValid: false, error: `Withdrawal request is already ${request.status}` }
    }

    return { isValid: true, request }
}

/**
 * Validates wallet balance is sufficient for withdrawal
 * Creates wallet if it doesn't exist
 */
export async function validateWalletBalance(userId: string, amount: number): Promise<{
    isValid: boolean
    currentBalance?: number
    error?: string
}> {
    // Use API client to bypass RLS and check if wallet exists
    const apiClient = createApiClient()

    let { data: wallet, error } = await apiClient
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single()

    // If wallet doesn't exist, create it
    if (error && (error.code === 'PGRST116' || error.message?.includes('No rows'))) {
        console.log('[validateWalletBalance] Wallet not found, creating new wallet for user:', userId)
        const { data: newWallet, error: createError } = await apiClient
            .from('wallets')
            .insert({
                user_id: userId,
                balance: 0,
                escrow_balance: 0
            })
            .select('balance')
            .single()

        if (createError) {
            // If we get a duplicate key error, the wallet exists - fetch it instead
            if (createError.code === '23505' || createError.message?.includes('duplicate key')) {
                console.log('[validateWalletBalance] Wallet already exists (duplicate key), fetching it')
                const { data: existingWallet, error: fetchError } = await apiClient
                    .from('wallets')
                    .select('balance')
                    .eq('user_id', userId)
                    .single()

                if (fetchError || !existingWallet) {
                    console.error('[validateWalletBalance] Failed to fetch existing wallet:', fetchError)
                    return { isValid: false, error: 'Wallet exists but could not be retrieved' }
                }

                wallet = existingWallet
                error = null
            } else {
                console.error('[validateWalletBalance] Failed to create wallet:', {
                    error: createError,
                    code: createError.code,
                    message: createError.message,
                    details: createError.details,
                    hint: createError.hint
                })
                return { isValid: false, error: `Failed to create wallet: ${createError.message || 'Unknown error'}` }
            }
        } else if (!newWallet) {
            console.error('[validateWalletBalance] Wallet creation returned no data')
            return { isValid: false, error: 'Failed to create wallet: No data returned' }
        } else {
            console.log('[validateWalletBalance] Wallet created successfully:', newWallet)
            wallet = newWallet
            error = null
        }
    } else if (error) {
        // Some other error occurred
        console.error('[validateWalletBalance] Error fetching wallet:', {
            error,
            code: error.code,
            message: error.message
        })
        return { isValid: false, error: `Wallet lookup failed: ${error.message || 'Unknown error'}` }
    }

    if (!wallet) {
        return { isValid: false, error: 'Wallet not found' }
    }

    const currentBalance = wallet.balance || 0

    if (currentBalance < amount) {
        return {
            isValid: false,
            currentBalance,
            error: `Insufficient balance. Current: ${currentBalance.toLocaleString()} coins, Required: ${amount.toLocaleString()} coins`
        }
    }

    return { isValid: true, currentBalance }
}
