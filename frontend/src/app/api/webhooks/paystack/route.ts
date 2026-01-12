import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
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

    const event = JSON.parse(bodyText)
    console.log('[Paystack Webhook] Event received:', event.event)

    // Only process successful charges
    if (event.event !== 'charge.success') {
      return NextResponse.json({ status: 'ignored' })
    }

    const { reference, amount, customer } = event.data
    const amountInNaira = amount / 100 // Convert from kobo to naira

    // Create Supabase client with service role
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() {},
        },
      }
    )

    // Find pending transaction by reference
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('reference', reference)
      .eq('status', 'pending')
      .single()

    if (fetchError || !transaction) {
      console.error('[Paystack Webhook] Transaction not found:', reference)
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

    // Update transaction status to completed
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', transaction.id)

    if (updateError) {
      console.error('[Paystack Webhook] Failed to update transaction:', updateError)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    // Credit coins to user's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', transaction.user_id)
      .single()

    if (walletError) {
      console.error('[Paystack Webhook] Wallet not found:', walletError)
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
      return NextResponse.json({ error: 'Credit failed' }, { status: 500 })
    }

    console.log('[Paystack Webhook] Successfully credited', transaction.coins, 'coins to user', transaction.user_id)

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('[Paystack Webhook] Error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
