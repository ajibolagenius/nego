import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'
import crypto from 'crypto'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!

function verifyPaystackSignature(signature: string, body: string): boolean {
    const hash = crypto
        .createHmac('sha512', PAYSTACK_SECRET)
        .update(body)
        .digest('hex')
    return hash === signature
}

export async function POST(request: NextRequest) {
    try {
        // Get raw body for signature verification
        const bodyText = await request.text()
        const signature = request.headers.get('x-paystack-signature')

        if (!signature) {
            console.error('[Paystack Webhook] Missing signature header')
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
        }

        // Verify signature
        if (!verifyPaystackSignature(signature, bodyText)) {
            console.error('[Paystack Webhook] Invalid signature')
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
        }

        const event = JSON.parse(bodyText) as {
            event: string
            data?: {
                reference: string
                amount: number
                customer?: unknown
            }
        }
        console.log('[Paystack Webhook] Event received:', event.event)

        // Only process successful charges
        if (event.event !== 'charge.success' || !event.data) {
            return NextResponse.json({ status: 'ignored' })
        }

        const { reference, amount } = event.data
        const amountInNaira = amount / 100 // Convert from kobo to naira

        // Use API client (service role) to bypass RLS for wallet operations
        const supabase = createApiClient()

        // Find pending transaction by reference
        const { data: transaction, error: fetchError } = await supabase
            .from('transactions')
            .select('*')
            .eq('reference', reference)
            .eq('status', 'pending')
            .single()

        if (fetchError || !transaction) {
            console.error('[Paystack Webhook] Transaction not found:', reference)

            // Create failure notification if we can identify the user
            // Note: We can't create notification here since we don't have user_id
            // This will be handled by the client-side error handling

            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
        }

        // Verify amount matches
        if (amountInNaira !== transaction.amount) {
            console.error('[Paystack Webhook] Amount mismatch:', {
                expected: transaction.amount,
                received: amountInNaira,
            })
            return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
        }

        // Update transaction status to completed (only if still pending - prevents double processing)
        const { data: updatedTransaction, error: updateError } = await supabase
            .from('transactions')
            .update({
                status: 'completed',
                updated_at: new Date().toISOString(),
            })
            .eq('id', transaction.id)
            .eq('status', 'pending') // Atomic check: only update if still pending
            .select()
            .single()

        if (updateError || !updatedTransaction) {
            // Transaction was already processed (likely by verification endpoint)
            console.log('[Paystack Webhook] Transaction already processed or update failed:', updateError)
            // Return success since transaction was already handled
            return NextResponse.json({
                status: 'success',
                message: 'Transaction already processed'
            })
        }

        // Credit coins to user's wallet
        const { data: wallet, error: walletError } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', transaction.user_id)
            .single()

        if (walletError) {
            console.error('[Paystack Webhook] Wallet not found:', walletError)

            // Create failure notification
            await supabase.from('notifications').insert({
                user_id: transaction.user_id,
                type: 'purchase_failed',
                title: 'Purchase Failed ❌',
                message: `Your purchase could not be completed. Wallet not found. Please contact support. Reference: ${reference}`,
                data: {
                    transaction_id: transaction.id,
                    reference: reference,
                    error: 'Wallet not found',
                },
            })

            return NextResponse.json({ error: 'Wallet not found' }, { status: 500 })
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
            console.error('[Paystack Webhook] Failed to credit wallet:', creditError)

            // Create failure notification
            await supabase.from('notifications').insert({
                user_id: transaction.user_id,
                type: 'purchase_failed',
                title: 'Purchase Failed ❌',
                message: `Your payment was received but we couldn't credit your wallet. Please contact support immediately. Reference: ${reference}`,
                data: {
                    transaction_id: transaction.id,
                    reference: reference,
                    error: 'Wallet credit failed',
                },
            })

            return NextResponse.json({ error: 'Credit failed' }, { status: 500 })
        }

        // Create success notification
        await supabase.from('notifications').insert({
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
            await supabase.from('notifications').insert({
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

        console.log('[Paystack Webhook] Successfully credited', transaction.coins, 'coins to user', transaction.user_id)

        return NextResponse.json({ status: 'success' })
    } catch (error) {
        console.error('[Paystack Webhook] Error:', error)
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
    }
}
