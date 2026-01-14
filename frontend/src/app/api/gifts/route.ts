/**
 * Gift API Route - Standard Node.js Runtime
 * 
 * POST /api/gifts - Send coins as a gift to another user
 * 
 * Using standard Node.js runtime for better compatibility.
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Use standard Node.js runtime (NOT Edge) for better compatibility
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================
// CONSTANTS
// ============================================
const MIN_AMOUNT = 100
const MAX_AMOUNT = 1000000
const MAX_MESSAGE_LENGTH = 500

// UUID validation regex - accepts standard UUID format (8-4-4-4-12 hex digits)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ============================================
// VALIDATION FUNCTIONS (inlined for Edge compatibility)
// ============================================

function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false
  return UUID_REGEX.test(value)
}

interface ValidationResult {
  valid: boolean
  error?: string
  field?: string
}

function validateGiftRequest(data: unknown): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body', field: 'body' }
  }

  const request = data as Record<string, unknown>

  // Validate senderId
  if (!request.senderId) {
    return { valid: false, error: 'Sender ID is required', field: 'senderId' }
  }
  if (!isValidUUID(request.senderId)) {
    return { valid: false, error: 'Invalid sender ID format. Must be a valid UUID.', field: 'senderId' }
  }

  // Validate recipientId
  if (!request.recipientId) {
    return { valid: false, error: 'Recipient ID is required', field: 'recipientId' }
  }
  if (!isValidUUID(request.recipientId)) {
    return { valid: false, error: 'Invalid recipient ID format. Must be a valid UUID.', field: 'recipientId' }
  }

  // Check self-gifting
  if (request.senderId === request.recipientId) {
    return { valid: false, error: 'You cannot send a gift to yourself', field: 'recipientId' }
  }

  // Validate amount
  if (request.amount === undefined || request.amount === null) {
    return { valid: false, error: 'Gift amount is required', field: 'amount' }
  }
  
  const amount = Number(request.amount)
  if (isNaN(amount) || !Number.isInteger(amount)) {
    return { valid: false, error: 'Gift amount must be a whole number', field: 'amount' }
  }
  
  if (amount < MIN_AMOUNT) {
    return { valid: false, error: `Minimum gift amount is ${MIN_AMOUNT} coins`, field: 'amount' }
  }
  
  if (amount > MAX_AMOUNT) {
    return { valid: false, error: `Maximum gift amount is ${MAX_AMOUNT} coins`, field: 'amount' }
  }

  // Validate message (optional)
  if (request.message !== undefined && request.message !== null && request.message !== '') {
    if (typeof request.message !== 'string') {
      return { valid: false, error: 'Message must be a string', field: 'message' }
    }
    if (request.message.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, error: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`, field: 'message' }
    }
  }

  return { valid: true }
}

interface GiftRequest {
  senderId: string
  recipientId: string
  amount: number
  message: string | null
  senderName: string
  recipientName: string
}

function sanitizeGiftRequest(data: Record<string, unknown>): GiftRequest {
  return {
    senderId: String(data.senderId || '').trim(),
    recipientId: String(data.recipientId || '').trim(),
    amount: Math.floor(Number(data.amount) || 0),
    message: data.message ? String(data.message).trim().slice(0, MAX_MESSAGE_LENGTH) : null,
    senderName: data.senderName ? String(data.senderName).trim() : 'Someone',
    recipientName: data.recipientName ? String(data.recipientName).trim() : 'Talent',
  }
}

// ============================================
// RESPONSE HELPERS
// ============================================

function successResponse(data: object, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status })
}

function errorResponse(error: string, status = 400, field?: string) {
  return NextResponse.json({ success: false, error, field }, { status })
}

// ============================================
// MAIN API HANDLER
// ============================================

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)
  
  try {
    // 1. Validate environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return errorResponse('Server configuration error. Please try again later.', 500)
    }

    // 2. Parse request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return errorResponse('Invalid request format. Please try again.', 400)
    }

    // 3. Validate request
    const validation = validateGiftRequest(body)
    if (!validation.valid) {
      return errorResponse(validation.error || 'Invalid request', 400, validation.field)
    }

    // 4. Sanitize and extract data
    const giftRequest = sanitizeGiftRequest(body as Record<string, unknown>)

    // 5. Create Supabase admin client
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // 6. Execute gift transaction directly (no external imports)
    
    // Step 6a: Get sender's wallet
    const { data: senderWallet, error: senderWalletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', giftRequest.senderId)
      .single()

    if (senderWalletError || !senderWallet) {
      return errorResponse('Your wallet was not found. Please try again.', 400)
    }

    // Step 6b: Check sender balance
    if (senderWallet.balance < giftRequest.amount) {
      return errorResponse(
        `Insufficient balance. You have ${senderWallet.balance} coins but tried to send ${giftRequest.amount}.`,
        400
      )
    }

    // Step 6c: Get or create recipient wallet
    const { data: recipientWallet, error: recipientWalletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', giftRequest.recipientId)
      .single()

    if (recipientWalletError && recipientWalletError.code !== 'PGRST116') {
      return errorResponse('Recipient wallet could not be verified.', 400)
    }

    // If recipient wallet doesn't exist, create it
    if (!recipientWallet) {
      const { error: createWalletError } = await supabase
        .from('wallets')
        .insert({ user_id: giftRequest.recipientId, balance: 0, escrow_balance: 0 })

      if (createWalletError) {
        return errorResponse('Could not initialize recipient wallet.', 500)
      }
    }

    const currentRecipientBalance = recipientWallet?.balance || 0
    const newSenderBalance = senderWallet.balance - giftRequest.amount
    const newRecipientBalance = currentRecipientBalance + giftRequest.amount

    // Step 6d: Deduct from sender
    const { error: deductError } = await supabase
      .from('wallets')
      .update({ balance: newSenderBalance })
      .eq('user_id', giftRequest.senderId)
      .gte('balance', giftRequest.amount)

    if (deductError) {
      return errorResponse('Failed to process gift. Please try again.', 500)
    }

    // Step 6e: Credit recipient
    const { error: creditError } = await supabase
      .from('wallets')
      .update({ balance: newRecipientBalance })
      .eq('user_id', giftRequest.recipientId)

    if (creditError) {
      // Rollback sender deduction
      await supabase
        .from('wallets')
        .update({ balance: senderWallet.balance })
        .eq('user_id', giftRequest.senderId)
      return errorResponse('Failed to credit recipient. Your coins have been restored.', 500)
    }

    // Step 6f: Create gift record (non-critical)
    let giftId: string | undefined
    try {
      const { data: giftRecord } = await supabase
        .from('gifts')
        .insert({
          sender_id: giftRequest.senderId,
          recipient_id: giftRequest.recipientId,
          amount: giftRequest.amount,
          message: giftRequest.message,
        })
        .select('id')
        .single()
      giftId = giftRecord?.id
    } catch {
      // Non-critical - continue
    }

    // Step 6g: Create transaction records (non-critical)
    try {
      await supabase.from('transactions').insert([
        {
          user_id: giftRequest.senderId,
          amount: -giftRequest.amount,
          coins: -giftRequest.amount,
          type: 'gift',
          status: 'completed',
          description: `Gift to ${giftRequest.recipientName}`,
          reference_id: giftId || null,
        },
        {
          user_id: giftRequest.recipientId,
          amount: giftRequest.amount,
          coins: giftRequest.amount,
          type: 'gift',
          status: 'completed',
          description: `Gift from ${giftRequest.senderName}`,
          reference_id: giftId || null,
        },
      ])
    } catch {
      // Non-critical - continue
    }

    // Step 6h: Create notification (non-critical)
    try {
      const notificationMessage = giftRequest.message 
        ? `${giftRequest.senderName} sent you ${giftRequest.amount} coins with a message: "${giftRequest.message.slice(0, 100)}${giftRequest.message.length > 100 ? '...' : ''}"`
        : `${giftRequest.senderName} sent you ${giftRequest.amount} coins`

      await supabase.from('notifications').insert({
        user_id: giftRequest.recipientId,
        type: 'general',
        title: 'You received a gift! 🎁',
        message: notificationMessage,
        data: {
          gift_id: giftId,
          gift_amount: giftRequest.amount,
          sender_id: giftRequest.senderId,
          sender_name: giftRequest.senderName,
        },
      })
    } catch {
      // Non-critical - continue
    }

    return successResponse({
      message: 'Gift sent successfully! 🎁',
      newSenderBalance,
      giftId,
    })

  } catch (error) {
    console.error(`[Gift API ${requestId}] Unexpected error:`, error)
    return errorResponse('An unexpected error occurred. Please try again.', 500)
  }
}

// Handle unsupported methods
export async function GET() {
  return errorResponse('Method not allowed. Use POST to send a gift.', 405)
}

export async function PUT() {
  return errorResponse('Method not allowed. Use POST to send a gift.', 405)
}

export async function DELETE() {
  return errorResponse('Method not allowed. Use POST to send a gift.', 405)
}
