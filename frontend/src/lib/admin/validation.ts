import { createClient } from '@/lib/supabase/server'

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
    verification?: any
    error?: string
}> {
    const supabase = await createClient()

    const { data: verification, error } = await supabase
        .from('verifications')
        .select('*, booking:bookings(*)')
        .eq('booking_id', bookingId)
        .single()

    if (error || !verification) {
        return { isValid: false, error: 'Verification not found' }
    }

    return { isValid: true, verification }
}

/**
 * Validates that a withdrawal request exists and is in a valid state
 */
export async function validateWithdrawalRequest(requestId: string): Promise<{
    isValid: boolean
    request?: any
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
 */
export async function validateWalletBalance(userId: string, amount: number): Promise<{
    isValid: boolean
    currentBalance?: number
    error?: string
}> {
    const supabase = await createClient()

    const { data: wallet, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single()

    if (error || !wallet) {
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
