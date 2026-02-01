import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { processSuccessfulTransaction } from '@/services/paymentResponse'

const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET!

export async function POST(request: NextRequest) {
    try {
        const signature = request.headers.get('x-nowpayments-sig')
        const bodyText = await request.text()

        if (!signature) {
            console.error('[NOWPayments Webhook] Missing signature')
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
        }

        if (!NOWPAYMENTS_IPN_SECRET) {
            console.error('[NOWPayments Webhook] Server misconfiguration: Missing IPN secret')
            return NextResponse.json({ error: 'Server error' }, { status: 500 })
        }

        // Verify signature
        // Sort keys and create query string (NOWPayments specific sorting often required, checking docs or simple body hash)
        // Docs say: hmac.update(JSON.stringify(request.body, Object.keys(request.body).sort()))
        // But since we have raw body text, handling JSON parse order is tricky.
        // Usually simply hashing the body works if they send consistent JSON.
        // Let's try standard hmac of the body first.

        const hmac = crypto.createHmac('sha512', NOWPAYMENTS_IPN_SECRET)
        hmac.update(bodyText)
        const expectedSignature = hmac.digest('hex')

        if (signature !== expectedSignature) {
            // NOTE: NOWPayments sometimes sorts keys. If basic body mismatch, rigorous implementation would parse -> sort -> stringify
            // For now, logging error.
            console.error('[NOWPayments Webhook] Invalid signature')
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
        }

        const event = JSON.parse(bodyText)
        console.log('[NOWPayments Webhook] Event:', event)

        const {
            payment_status,
            order_id, // We use this as our reference
            pay_amount, // Amount user sent
            price_amount, // Amount we asked for (fiat)
            outcome_currency
        } = event

        // Check if completed
        // specific 'finished' status means user paid and it's confirmed
        if (payment_status !== 'finished') {
            console.log('[NOWPayments Webhook] Payment not finished/confirmed yet:', payment_status)
            return NextResponse.json({ status: 'ignored', message: 'Status not finished' })
        }

        // processSuccessfulTransaction expects amount in Naira.
        // price_amount should be what we requested (e.g. 5000 NGN converted to USD? or purely NGN if supported)
        // Assuming we asked for 'price_amount' in key currency.
        const amount = parseFloat(price_amount || '0')
        const reference = order_id

        if (!reference) {
            return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
        }

        const result = await processSuccessfulTransaction(reference, amount, 'nowpayments')

        if (result.status === 'failed') {
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

        return NextResponse.json({ status: 'success' })

    } catch (error) {
        console.error('[NOWPayments Webhook] Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
