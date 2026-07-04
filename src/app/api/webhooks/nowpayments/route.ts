import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { processSuccessfulTransaction } from '@/services/paymentResponse'

const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET!

/**
 * Recursively sort object keys so the JSON we hash matches how NOWPayments builds
 * the signature. Per their IPN docs the signature is:
 *   HMAC-SHA512( JSON.stringify(payload, Object.keys(payload).sort()) )
 * with keys sorted at every level of nesting.
 */
function sortKeysDeep(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(sortKeysDeep)
    }
    if (value && typeof value === 'object') {
        return Object.keys(value as Record<string, unknown>)
            .sort()
            .reduce((acc, key) => {
                acc[key] = sortKeysDeep((value as Record<string, unknown>)[key])
                return acc
            }, {} as Record<string, unknown>)
    }
    return value
}

function timingSafeEqualHex(a: string, b: string): boolean {
    const aBuf = Buffer.from(a)
    const bBuf = Buffer.from(b)
    return aBuf.length === bBuf.length && crypto.timingSafeEqual(aBuf, bBuf)
}

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

        // Parse first so we can canonicalize with sorted keys before hashing.
        let event: Record<string, unknown>
        try {
            event = JSON.parse(bodyText)
        } catch {
            console.error('[NOWPayments Webhook] Invalid JSON body')
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
        }

        // Verify signature over the deeply key-sorted JSON, per NOWPayments IPN spec.
        const canonicalBody = JSON.stringify(sortKeysDeep(event))
        const expectedSignature = crypto
            .createHmac('sha512', NOWPAYMENTS_IPN_SECRET)
            .update(canonicalBody)
            .digest('hex')

        if (!timingSafeEqualHex(signature, expectedSignature)) {
            console.error('[NOWPayments Webhook] Invalid signature')
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
        }

        console.log('[NOWPayments Webhook] Event:', event)

        const payment_status = String(event.payment_status ?? '')
        const order_id = event.order_id != null ? String(event.order_id) : '' // We use this as our reference
        const price_amount = event.price_amount // Amount we asked for (fiat)

        // Check if completed
        // specific 'finished' status means user paid and it's confirmed
        if (payment_status !== 'finished') {
            console.log('[NOWPayments Webhook] Payment not finished/confirmed yet:', payment_status)
            return NextResponse.json({ status: 'ignored', message: 'Status not finished' })
        }

        // processSuccessfulTransaction expects amount in Naira.
        // price_amount should be what we requested (e.g. 5000 NGN converted to USD? or purely NGN if supported)
        // Assuming we asked for 'price_amount' in key currency.
        const amount = parseFloat(String(price_amount ?? '0'))
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
