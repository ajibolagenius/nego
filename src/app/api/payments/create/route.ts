import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCoinPackageByIdFromDB } from '@/lib/coinPackages'
import crypto from 'crypto'

// Environment variables
const SEGPAY_URL = process.env.SEGPAY_URL || 'https://secure.segpay.com/billing/poset' // Example URL
const SEGPAY_PACKAGE_ID = process.env.SEGPAY_PACKAGE_ID // e.g. '12345'
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY
const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1/invoice'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { packageId, provider, currency = 'NGN' } = body

        if (!packageId || !provider) {
            return NextResponse.json({ error: 'Missing packageId or provider' }, { status: 400 })
        }

        // Get package details
        const coinPackage = await getCoinPackageByIdFromDB(supabase, packageId)
        if (!coinPackage) {
            return NextResponse.json({ error: 'Invalid coin package' }, { status: 400 })
        }

        // Create a unique reference
        const reference = `${provider}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

        // Create pending transaction in DB
        const { data: transaction, error: dbError } = await supabase
            .from('transactions')
            .insert({
                user_id: user.id,
                amount: coinPackage.price, // Storing in local currency (e.g. NGN)
                coins: coinPackage.coins,
                reference: reference,
                status: 'pending',
                type: 'purchase',
                description: `Purchase ${coinPackage.displayName}`,
                metadata: {
                    provider,
                    packageId,
                    currency
                }
            })
            .select()
            .single()

        if (dbError) {
            console.error('[Payment Create] DB Error:', dbError)
            return NextResponse.json({ error: 'Failed to create transaction record' }, { status: 500 })
        }

        // Handle specific provider logic
        if (provider === 'paystack') {
            // For Paystack, we just return the reference and the frontend uses the SDK
            return NextResponse.json({
                status: 'success',
                reference,
                amount: coinPackage.price,
                provider: 'paystack'
            })
        }

        else if (provider === 'segpay') {
            // Construct Segpay Redirect URL
            // This is highly dependent on Segpay's specific integration method (Post, Get, Iframe)
            // simplified example:
            const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet?status=success&ref=${reference}`
            const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet?status=cancel&ref=${reference}`

            // Mock URL construction - REPLACE with actual logic based on Segpay docs
            const params = new URLSearchParams({
                'x-eticketid': SEGPAY_PACKAGE_ID!,
                'x-amount': coinPackage.price.toString(),
                'x-currency': currency,
                'x-description': coinPackage.displayName,
                'x-biller-ref': reference, // Our reference
                'approved_url': returnUrl,
                'declined_url': cancelUrl
            })

            const paymentUrl = `${SEGPAY_URL}?${params.toString()}`

            return NextResponse.json({
                status: 'success',
                url: paymentUrl,
                reference,
                provider: 'segpay'
            })
        }

        else if (provider === 'nowpayments') {
            // Create Invoice via NOWPayments API
            if (!NOWPAYMENTS_API_KEY) {
                return NextResponse.json({ error: 'NOWPayments not configured' }, { status: 500 })
            }

            // Estimate price in USD if needed, or pass NGN if supported
            // NOWPayments often takes 'price_amount' and 'price_currency'
            const response = await fetch(NOWPAYMENTS_API_URL, {
                method: 'POST',
                headers: {
                    'x-api-key': NOWPAYMENTS_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    price_amount: coinPackage.price,
                    price_currency: 'ngn', // or 'usd' if we convert
                    pay_currency: 'btc', // default, user can change on invoice page
                    ipn_callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/nowpayments`,
                    order_id: reference,
                    order_description: coinPackage.displayName,
                    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet?status=success&ref=${reference}`,
                    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet?status=cancel`
                })
            })

            const data = await response.json()

            if (!response.ok) {
                console.error('[NOWPayments] Error creating invoice:', data)
                return NextResponse.json({ error: `Failed to create crypto invoice: ${data.message || JSON.stringify(data)}` }, { status: 500 })
            }

            return NextResponse.json({
                status: 'success',
                url: data.invoice_url, // Redirect user here
                reference,
                provider: 'nowpayments',
                data // extra data
            })
        }

        return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })

    } catch (error) {
        console.error('[Payment Create] Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
