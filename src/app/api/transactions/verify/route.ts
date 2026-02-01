import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processSuccessfulTransaction } from '@/services/paymentResponse'

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

        // Verify transaction ownership
        const { data: transaction } = await supabase
            .from('transactions')
            .select('user_id')
            .eq('reference', verifiedReference)
            .single()

        if (transaction && transaction.user_id !== user.id) {
            console.error('[Verify Payment] Transaction ownership mismatch:', {
                expected: user.id,
                actual: transaction.user_id
            })
            return NextResponse.json({ error: 'Unauthorized transaction verification' }, { status: 403 })
        }

        const result = await processSuccessfulTransaction(verifiedReference, amountInNaira, 'paystack')

        if (result.status === 'failed') {
            return NextResponse.json({
                error: result.error,
                details: result.message
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            newBalance: result.newBalance
        })

    } catch (error) {
        console.error('[Verify Payment] Error:', error)
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
    }
}
