import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApiClient } from '@/lib/supabase/api'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!

/**
 * Verify payment status with Paystack and update transaction/wallet
 * This endpoint is called after Paystack payment callback to verify payment
 * and credit coins immediately (useful for test API where webhooks don't work)
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { reference } = body

        if (!reference) {
            return NextResponse.json({ error: 'Reference is required' }, { status: 400 })
        }

        // Verify payment with Paystack API
        const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET}`,
                'Content-Type': 'application/json',
            },
        })

        if (!paystackResponse.ok) {
            const errorData = await paystackResponse.json()
            console.error('[Verify Payment] Paystack API error:', errorData)
            return NextResponse.json({ error: 'Failed to verify payment with Paystack' }, { status: 500 })
        }

        const paystackData = await paystackResponse.json() as {
            status: boolean
            data?: {
                reference: string
                amount: number
                status: string
                customer?: unknown
            }
            message?: string
        }

        // Check if payment was successful
        if (!paystackData.status || !paystackData.data || paystackData.data.status !== 'success') {
            return NextResponse.json({
                error: 'Payment not successful',
                status: paystackData.data?.status || 'unknown'
            }, { status: 400 })
        }

        const { reference: verifiedReference, amount } = paystackData.data
        const amountInNaira = amount / 100 // Convert from kobo to naira

        // Use API client (service role) to bypass RLS for wallet operations
        const apiClient = createApiClient()

        // Find pending transaction by reference
        const { data: transaction, error: fetchError } = await apiClient
            .from('transactions')
            .select('*')
            .eq('reference', verifiedReference)
            .eq('status', 'pending')
            .eq('user_id', user.id) // Ensure user owns this transaction
            .single()

        if (fetchError || !transaction) {
            console.error('[Verify Payment] Transaction not found:', verifiedReference)
            return NextResponse.json({ error: 'Transaction not found or already processed' }, { status: 404 })
        }

        // Verify amount matches
        if (amountInNaira !== transaction.amount) {
            console.error('[Verify Payment] Amount mismatch:', {
                expected: transaction.amount,
                received: amountInNaira,
            })
            return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
        }

        // Update transaction status to completed (only if still pending - prevents double processing)
        const { data: updatedTransaction, error: updateError } = await apiClient
            .from('transactions')
            .update({
                status: 'completed',
            })
            .eq('id', transaction.id)
            .eq('status', 'pending') // Atomic check: only update if still pending
            .select()
            .single()

        if (updateError || !updatedTransaction) {
            // Update failed - check if transaction is already completed
            console.log('[Verify Payment] Status update failed, checking transaction status...', updateError)

            const { data: currentTransaction } = await apiClient
                .from('transactions')
                .select('*')
                .eq('reference', verifiedReference)
                .eq('user_id', user.id)
                .single()

            if (currentTransaction && currentTransaction.status === 'completed') {
                // Transaction is already completed, verify wallet was credited
                const { data: currentWallet } = await apiClient
                    .from('wallets')
                    .select('balance')
                    .eq('user_id', user.id)
                    .single()

                console.log('[Verify Payment] Transaction already completed, current wallet balance:', currentWallet?.balance)

                // Return success with current balance
                return NextResponse.json({
                    success: true,
                    alreadyCompleted: true,
                    transaction: currentTransaction,
                    currentBalance: currentWallet?.balance || 0
                })
            }

            // Transaction is still pending - this shouldn't happen, but try to process it
            console.error('[Verify Payment] Transaction update failed but transaction is still pending:', updateError)
            return NextResponse.json({
                error: 'Failed to update transaction status',
                details: updateError?.message || 'Unknown error'
            }, { status: 500 })
        }

        // Credit coins to user's wallet
        const { data: wallet, error: walletError } = await apiClient
            .from('wallets')
            .select('balance')
            .eq('user_id', transaction.user_id)
            .single()

        if (walletError) {
            console.error('[Verify Payment] Wallet not found:', walletError)

            // Create failure notification
            await apiClient.from('notifications').insert({
                user_id: transaction.user_id,
                type: 'purchase_failed',
                title: 'Purchase Failed ❌',
                message: `Your purchase could not be completed. Wallet not found. Please contact support. Reference: ${verifiedReference}`,
                data: {
                    transaction_id: transaction.id,
                    reference: verifiedReference,
                    error: 'Wallet not found',
                },
            })

            return NextResponse.json({ error: 'Wallet not found' }, { status: 500 })
        }

        const newBalance = (wallet.balance || 0) + transaction.coins

        const { error: creditError } = await apiClient
            .from('wallets')
            .update({
                balance: newBalance,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', transaction.user_id)

        if (creditError) {
            console.error('[Verify Payment] Failed to credit wallet:', creditError)

            // Create failure notification
            await apiClient.from('notifications').insert({
                user_id: transaction.user_id,
                type: 'purchase_failed',
                title: 'Purchase Failed ❌',
                message: `Your payment was received but we couldn't credit your wallet. Please contact support immediately. Reference: ${verifiedReference}`,
                data: {
                    transaction_id: transaction.id,
                    reference: verifiedReference,
                    error: 'Wallet credit failed',
                },
            })

            return NextResponse.json({ error: 'Failed to credit wallet' }, { status: 500 })
        }

        // Create success notification
        await apiClient.from('notifications').insert({
            user_id: transaction.user_id,
            type: 'purchase_success',
            title: 'Purchase Successful! 🎉',
            message: `Your purchase of ${transaction.coins.toLocaleString()} coins was successful. Your new balance is ${newBalance.toLocaleString()} coins.`,
            data: {
                transaction_id: transaction.id,
                coins: transaction.coins,
                amount: transaction.amount,
                new_balance: newBalance,
                reference: transaction.reference,
            },
        })

        // Check for low balance warning (below 100 coins)
        if (newBalance < 100) {
            await apiClient.from('notifications').insert({
                user_id: transaction.user_id,
                type: 'low_balance',
                title: 'Low Balance Warning ⚠️',
                message: `Your balance is low (${newBalance.toLocaleString()} coins). Consider topping up to continue enjoying our services.`,
                data: {
                    current_balance: newBalance,
                    threshold: 100,
                },
            })
        }

        console.log('[Verify Payment] Successfully credited', transaction.coins, 'coins to user', transaction.user_id)

        return NextResponse.json({
            success: true,
            transaction: {
                ...transaction,
                status: 'completed',
            },
            newBalance,
        })
    } catch (error) {
        console.error('[Verify Payment] Error:', error)
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
    }
}
