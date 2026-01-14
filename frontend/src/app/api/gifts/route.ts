/**
 * Gift API Route
 * 
 * POST /api/gifts - Send coins as a gift to another user
 * 
 * This endpoint handles the complete gift transaction:
 * 1. Validates the request payload
 * 2. Verifies sender has sufficient balance
 * 3. Transfers coins from sender to recipient
 * 4. Creates gift record, transaction records, and notification
 * 
 * Request Body:
 * {
 *   senderId: string (UUID),
 *   recipientId: string (UUID),
 *   amount: number (min 100, max 1000000),
 *   message?: string (optional, max 500 chars),
 *   senderName?: string (for display),
 *   recipientName?: string (for display)
 * }
 * 
 * Response:
 * Success: { success: true, message: string, newSenderBalance: number, giftId?: string }
 * Error: { success: false, error: string, field?: string }
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { validateGiftRequest, sanitizeGiftRequest, GIFT_CONSTANTS } from '@/lib/gift-validation'
import { executeGiftTransaction } from '@/lib/gift-service'

// Use Edge runtime for better performance and reliability
export const runtime = 'edge'

// Response helpers
function successResponse(data: object, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status })
}

function errorResponse(error: string, status = 400, field?: string) {
  return NextResponse.json({ success: false, error, field }, { status })
}

export async function POST(request: NextRequest) {
  // Log request for debugging
  const requestId = crypto.randomUUID().slice(0, 8)
  console.log(`[Gift API ${requestId}] Processing gift request`)

  try {
    // 1. Validate environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(`[Gift API ${requestId}] Missing Supabase configuration`)
      return errorResponse('Server configuration error. Please try again later.', 500)
    }

    // 2. Parse request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      console.error(`[Gift API ${requestId}] Invalid JSON in request body`)
      return errorResponse('Invalid request format. Please try again.', 400)
    }

    console.log(`[Gift API ${requestId}] Request body:`, JSON.stringify(body))

    // 3. Validate request
    const validation = validateGiftRequest(body)
    if (!validation.valid) {
      console.log(`[Gift API ${requestId}] Validation failed:`, validation.error)
      return errorResponse(validation.error || 'Invalid request', 400, validation.field)
    }

    // 4. Sanitize and extract data
    const giftRequest = sanitizeGiftRequest(body as Record<string, unknown>)
    console.log(`[Gift API ${requestId}] Sanitized request:`, JSON.stringify(giftRequest))

    // 5. Create Supabase admin client
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // 6. Try RPC function first (more reliable, atomic transaction)
    let result: { success: boolean; error?: string; newSenderBalance?: number; giftId?: string }

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('handle_gift', {
        p_sender_id: giftRequest.senderId,
        p_recipient_id: giftRequest.recipientId,
        p_amount: giftRequest.amount,
        p_message: giftRequest.message || null,
      })

      if (!rpcError && rpcData) {
        console.log(`[Gift API ${requestId}] RPC result:`, JSON.stringify(rpcData))
        
        if (rpcData.success) {
          result = {
            success: true,
            newSenderBalance: rpcData.new_balance,
            giftId: rpcData.gift_id,
          }
        } else {
          result = {
            success: false,
            error: rpcData.error || 'Gift failed',
          }
        }
      } else {
        // RPC failed or not available, fall back to direct operations
        console.log(`[Gift API ${requestId}] RPC not available, using fallback:`, rpcError?.message)
        result = await executeGiftTransaction(supabase, {
          senderId: giftRequest.senderId,
          recipientId: giftRequest.recipientId,
          amount: giftRequest.amount,
          message: giftRequest.message,
          senderName: giftRequest.senderName || 'Someone',
          recipientName: giftRequest.recipientName || 'Talent',
        })
      }
    } catch (rpcCatchError) {
      console.log(`[Gift API ${requestId}] RPC exception, using fallback:`, rpcCatchError)
      result = await executeGiftTransaction(supabase, {
        senderId: giftRequest.senderId,
        recipientId: giftRequest.recipientId,
        amount: giftRequest.amount,
        message: giftRequest.message,
        senderName: giftRequest.senderName || 'Someone',
        recipientName: giftRequest.recipientName || 'Talent',
      })
    }

    if (!result.success) {
      console.log(`[Gift API ${requestId}] Transaction failed:`, result.error)
      return errorResponse(result.error || 'Gift failed', 400)
    }

    console.log(`[Gift API ${requestId}] Gift successful, new balance:`, result.newSenderBalance)

    return successResponse({
      message: 'Gift sent successfully! 🎁',
      newSenderBalance: result.newSenderBalance,
      giftId: result.giftId,
    })

  } catch (error) {
    console.error(`[Gift API ${requestId}] Unexpected error:`, error)
    
    // Provide user-friendly error message
    const message = error instanceof Error ? error.message : 'Unknown error'
    
    // Check for specific error patterns
    if (message.includes('pattern') || message.includes('format')) {
      return errorResponse('Invalid data format. Please refresh and try again.', 400)
    }
    
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
