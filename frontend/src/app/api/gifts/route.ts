/**
 * Gift API Route
 * 
 * POST /api/gifts - Send coins as a gift to another user
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Use Edge runtime for consistency with other working routes
export const runtime = 'edge'

// Constants
const MIN_AMOUNT = 100
const MAX_AMOUNT = 1000000
const MAX_MESSAGE_LENGTH = 500
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false
  return UUID_REGEX.test(value)
}

function errorResponse(error: string, status = 400, field?: string) {
  return NextResponse.json({ success: false, error, field }, { status })
}

export async function POST(request: NextRequest) {
  try {
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[Gift API] Missing env vars:', { supabaseUrl: !!supabaseUrl, serviceRoleKey: !!serviceRoleKey })
      return errorResponse('Server configuration error', 500)
    }

    // Parse request body
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return errorResponse('Invalid request format', 400)
    }

    // Extract and validate fields
    const senderId = body.senderId
    const recipientId = body.recipientId
    const amount = body.amount
    const message = body.message
    const senderName = body.senderName || 'Someone'
    const recipientName = body.recipientName || 'Talent'

    // Validate senderId
    if (!senderId || !isValidUUID(senderId)) {
      return errorResponse('Invalid sender ID format', 400, 'senderId')
    }

    // Validate recipientId
    if (!recipientId || !isValidUUID(recipientId)) {
      return errorResponse('Invalid recipient ID format', 400, 'recipientId')
    }

    // Self-gifting check
    if (senderId === recipientId) {
      return errorResponse('You cannot send a gift to yourself', 400, 'recipientId')
    }

    // Validate amount
    const numAmount = Number(amount)
    if (isNaN(numAmount) || !Number.isInteger(numAmount)) {
      return errorResponse('Gift amount must be a whole number', 400, 'amount')
    }
    if (numAmount < MIN_AMOUNT) {
      return errorResponse(`Minimum gift amount is ${MIN_AMOUNT} coins`, 400, 'amount')
    }
    if (numAmount > MAX_AMOUNT) {
      return errorResponse(`Maximum gift amount is ${MAX_AMOUNT} coins`, 400, 'amount')
    }

    // Validate message
    const msgStr = message ? String(message).slice(0, MAX_MESSAGE_LENGTH) : null

    // Create Supabase client
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })

    // Get sender wallet
    const { data: senderWallet, error: senderErr } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', senderId)
      .single()

    if (senderErr || !senderWallet) {
      return errorResponse('Your wallet was not found', 400)
    }

    if (senderWallet.balance < numAmount) {
      return errorResponse(`Insufficient balance. You have ${senderWallet.balance} coins.`, 400)
    }

    // Get or create recipient wallet
    let recipientBalance = 0
    const { data: recipientWallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', recipientId)
      .single()

    if (!recipientWallet) {
      await supabase.from('wallets').insert({ user_id: recipientId, balance: 0, escrow_balance: 0 })
    } else {
      recipientBalance = recipientWallet.balance
    }

    const newSenderBalance = senderWallet.balance - numAmount
    const newRecipientBalance = recipientBalance + numAmount

    // Deduct from sender
    const { error: deductErr } = await supabase
      .from('wallets')
      .update({ balance: newSenderBalance })
      .eq('user_id', senderId)

    if (deductErr) {
      return errorResponse('Failed to process gift', 500)
    }

    // Credit recipient
    const { error: creditErr } = await supabase
      .from('wallets')
      .update({ balance: newRecipientBalance })
      .eq('user_id', recipientId)

    if (creditErr) {
      // Rollback
      await supabase.from('wallets').update({ balance: senderWallet.balance }).eq('user_id', senderId)
      return errorResponse('Failed to credit recipient', 500)
    }

    // Create gift record (non-critical)
    let giftId: string | undefined
    try {
      const { data: gift } = await supabase
        .from('gifts')
        .insert({ sender_id: senderId, recipient_id: recipientId, amount: numAmount, message: msgStr })
        .select('id')
        .single()
      giftId = gift?.id
    } catch { /* non-critical */ }

    // Create transactions (non-critical)
    try {
      await supabase.from('transactions').insert([
        { user_id: senderId, amount: -numAmount, coins: -numAmount, type: 'gift', status: 'completed', description: `Gift to ${recipientName}` },
        { user_id: recipientId, amount: numAmount, coins: numAmount, type: 'gift', status: 'completed', description: `Gift from ${senderName}` }
      ])
    } catch { /* non-critical */ }

    // Create notification (non-critical)
    try {
      await supabase.from('notifications').insert({
        user_id: recipientId,
        type: 'general',
        title: 'You received a gift! 🎁',
        message: `${senderName} sent you ${numAmount} coins`,
        data: { gift_amount: numAmount, sender_id: senderId }
      })
    } catch { /* non-critical */ }

    return NextResponse.json({
      success: true,
      message: 'Gift sent successfully! 🎁',
      newSenderBalance,
      giftId
    })

  } catch (error) {
    console.error('[Gift API] Error:', error)
    return errorResponse('An unexpected error occurred', 500)
  }
}

export async function GET() {
  return errorResponse('Method not allowed', 405)
}
