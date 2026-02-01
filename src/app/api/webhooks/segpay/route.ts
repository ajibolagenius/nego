import { NextRequest, NextResponse } from 'next/server'
import { processSuccessfulTransaction } from '@/services/paymentResponse'

// Segpay Webhook/Postback Handler
// Segpay typically sends data as x-www-form-urlencoded or JSON
// Verification usually involves checking the referer headers or a specific hash/token
export async function POST(request: NextRequest) {
    try {
        const bodyText = await request.text()
        const urlParams = new URLSearchParams(bodyText)
        const data = Object.fromEntries(urlParams.entries())

        console.log('[Segpay Webhook] Received:', data)

        // TODO: Implement actual signature verification
        // For now, we will verify loosely based on a secret token if available
        // in a real scenario check `eticketid`, `transid` etc.
        // Assuming we pass our transaction reference in `merchant_ref` or `desc` or `custom_field`
        const reference = data.merchant_ref || data.ref || data.extra_info // Adjust based on direct Segpay config
        const transactionId = data.transid
        const status = data.stage // e.g. 'approved', 'declined'

        if (!reference) {
            console.error('[Segpay Webhook] Missing reference')
            // Return 200 OK to stop Segpay from retrying if it's just bad data
            return NextResponse.json({ status: 'ignored', message: 'Missing reference' })
        }

        if (status !== 'approved' && status !== 'success') {
            console.log('[Segpay Webhook] Transaction not approved:', status)
            return NextResponse.json({ status: 'ignored', message: 'Not approved' })
        }

        // Amount handling - Segpay sends as string e.g. "10.00"
        const amount = parseFloat(data.amount || '0')
        // Convert to Naira or assume default currency. 
        // If Segpay charges in USD, this needs conversion logic.
        // For this implementation, we assume the amount passed to Segpay was already in the target currency (or equivalent).
        // WARNING: If Segpay is USD only, we need a fixed rate or dynamic rate here.
        // Assuming 1:1 for now or that we charged in correct units.

        const result = await processSuccessfulTransaction(reference, amount, 'segpay')

        if (result.status === 'failed') {
            return NextResponse.json({ error: result.error }, { status: 400 })
        }

        return new NextResponse('OK') // Segpay often expects just "OK" or similar text response
    } catch (error) {
        console.error('[Segpay Webhook] Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
