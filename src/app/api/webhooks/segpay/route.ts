import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { processSuccessfulTransaction } from '@/services/paymentResponse'

const SEGPAY_SECRET = process.env.SEGPAY_WEBHOOK_SECRET

function verifySegpaySignature(body: string, signature: string | null): boolean {
    if (!SEGPAY_SECRET) {
        console.error('[Segpay Webhook] SEGPAY_WEBHOOK_SECRET not configured - rejecting request')
        return false
    }
    if (!signature) {
        return false
    }
    const hash = crypto.createHmac('sha256', SEGPAY_SECRET).update(body).digest('hex')
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature))
}

export async function POST(request: NextRequest) {
    try {
        const bodyText = await request.text()

        const signature = request.headers.get('x-segpay-signature') || request.headers.get('x-signature')
        if (!verifySegpaySignature(bodyText, signature)) {
            console.error('[Segpay Webhook] Invalid or missing signature')
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
        }

        const urlParams = new URLSearchParams(bodyText)
        const data = Object.fromEntries(urlParams.entries())

        console.log('[Segpay Webhook] Received:', data)

        const reference = data.merchant_ref || data.ref || data.extra_info
        const status = data.stage

        if (!reference) {
            console.error('[Segpay Webhook] Missing reference')
            return NextResponse.json({ status: 'ignored', message: 'Missing reference' })
        }

        if (status !== 'approved' && status !== 'success') {
            console.log('[Segpay Webhook] Transaction not approved:', status)
            return NextResponse.json({ status: 'ignored', message: 'Not approved' })
        }

        const amount = parseFloat(data.amount || '0')

        const result = await processSuccessfulTransaction(reference, amount, 'segpay')

        if (result.status === 'failed') {
            return NextResponse.json({ error: result.error }, { status: 400 })
        }

        return new NextResponse('OK')
    } catch (error) {
        console.error('[Segpay Webhook] Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
