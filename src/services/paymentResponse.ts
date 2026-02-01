import { createApiClient } from '@/lib/supabase/api'

// Shared logic to process a successful transaction
// This handles:
// 1. verifying the transaction exists and is pending
// 2. updating transaction status to 'completed'
// 3. crediting the user's wallet
// 4. creating success/failure notifications
// 5. sending low balance warning if applicable

interface ProcessResult {
    status: 'success' | 'failed' | 'ignored'
    message?: string
    error?: string
    newBalance?: number
}

export async function processSuccessfulTransaction(
    reference: string,
    amountInNaira: number,
    provider: 'paystack' | 'segpay' | 'nowpayments'
): Promise<ProcessResult> {
    const supabase = createApiClient()

    try {
        // 1. Find pending transaction by reference
        const { data: transaction, error: fetchError } = await supabase
            .from('transactions')
            .select('*')
            .eq('reference', reference)
            .eq('status', 'pending')
            .single()

        if (fetchError || !transaction) {
            console.error(`[${provider} Payment] Transaction not found or not pending:`, reference)
            return { status: 'failed', error: 'Transaction not found or already processed' }
        }

        // 2. Verify amount matches (allow small delta for floating point or crypto conversions if needed)
        // For now, strict check for Paystack/Segpay, maybe looser for crypto later
        const expectedAmount = transaction.amount
        // Tolerance of 1% for crypto fluctuations if needed, otherwise exact match
        // For now we enforce exact match or very close
        if (Math.abs(amountInNaira - expectedAmount) > 1.0) {
            console.error(`[${provider} Payment] Amount mismatch:`, {
                expected: expectedAmount,
                received: amountInNaira,
            })
            return { status: 'failed', error: 'Amount mismatch' }
        }

        // 3. Update transaction status to completed
        const { data: updatedTransaction, error: updateError } = await supabase
            .from('transactions')
            .update({
                status: 'completed',
                // metadata: { ...transaction.metadata, provider }, // Optional: store provider if schema supports
                updated_at: new Date().toISOString(),
            })
            .eq('id', transaction.id)
            .eq('status', 'pending') // Atomic check
            .select()
            .single()

        if (updateError || !updatedTransaction) {
            console.log(`[${provider} Payment] Transaction already processed or update failed:`, updateError)

            // Return current balance if already processed
            const { data: currentWallet } = await supabase
                .from('wallets')
                .select('balance')
                .eq('user_id', transaction.user_id)
                .single()

            return {
                status: 'success',
                message: 'Transaction already processed',
                newBalance: currentWallet?.balance
            }
        }

        // 4. Credit user's wallet
        const { data: wallet, error: walletError } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', transaction.user_id)
            .single()

        if (walletError) {
            console.error(`[${provider} Payment] Wallet not found for user:`, transaction.user_id)

            // Notification: Purchase Failed
            await supabase.from('notifications').insert({
                user_id: transaction.user_id,
                type: 'purchase_failed',
                title: 'Purchase Failed ❌',
                message: `Your payment was successful but we couldn't find your wallet. Please contact support. Reference: ${reference}`,
                data: { transaction_id: transaction.id, reference, error: 'Wallet not found' },
            })

            return { status: 'failed', error: 'Wallet not found' }
        }

        const newBalance = (wallet.balance || 0) + transaction.coins

        const { error: creditError } = await supabase
            .from('wallets')
            .update({
                balance: newBalance,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', transaction.user_id)

        if (creditError) {
            console.error(`[${provider} Payment] Failed to credit wallet:`, creditError)

            // Notification: Purchase Failed (Credit Step)
            await supabase.from('notifications').insert({
                user_id: transaction.user_id,
                type: 'purchase_failed',
                title: 'Purchase Failed ❌',
                message: `Your payment was received but we couldn't credit your wallet. Please contact support immediately. Reference: ${reference}`,
                data: { transaction_id: transaction.id, reference, error: 'Wallet credit failed' },
            })

            return { status: 'failed', error: 'Credit failed' }
        }

        // 5. Success Notification
        await supabase.from('notifications').insert({
            user_id: transaction.user_id,
            type: 'purchase_success',
            title: 'Purchase Successful! 🎉',
            message: `Your purchase of ${transaction.coins.toLocaleString()} coins was successful via ${provider}. New balance: ${newBalance.toLocaleString()}.`,
            data: {
                transaction_id: transaction.id,
                coins: transaction.coins,
                amount: transaction.amount,
                new_balance: newBalance,
                reference: transaction.reference,
                provider
            },
        })

        // 6. Low Balance Warning
        if (newBalance < 100) {
            await supabase.from('notifications').insert({
                user_id: transaction.user_id,
                type: 'low_balance',
                title: 'Low Balance Warning ⚠️',
                message: `Your balance is low (${newBalance.toLocaleString()} coins).`,
                data: { current_balance: newBalance, threshold: 100 },
            })
        }

        console.log(`[${provider} Payment] Successfully credited ${transaction.coins} coins to user ${transaction.user_id}`)
        return { status: 'success', newBalance }

    } catch (error: any) {
        console.error(`[${provider} Payment] Unhandled error:`, error)
        return { status: 'failed', error: error.message || 'Unknown processing error' }
    }
}
