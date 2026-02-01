import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { processSuccessfulTransaction } from '@/services/paymentResponse'

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

        const result = await processSuccessfulTransaction(reference, amountInNaira, 'paystack')

        if (result.status === 'failed') {
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

        return NextResponse.json({ status: 'success' })

    } catch (error) {
        console.error('[Paystack Webhook] Error:', error)
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
    }
}
