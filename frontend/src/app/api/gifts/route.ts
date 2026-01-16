/**
 * Gift API Route
 *
 * POST /api/gifts - Send coins as a gift to another user
 * Uses database function handle_gift for atomic transactions
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { validateGiftRequest, sanitizeGiftRequest } from '@/lib/gift-validation'

// Use Node.js runtime for better Supabase compatibility
export const runtime = 'nodejs'

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
        } catch (parseError) {
            console.error('[Gift API] JSON parse error:', parseError)
            return errorResponse('Invalid request format', 400)
        }

        // Validate request using centralized validation
        const validation = validateGiftRequest(body)
        if (!validation.valid) {
            return errorResponse(validation.error || 'Invalid request', 400, validation.field)
        }

        // Sanitize request data
        const sanitized = sanitizeGiftRequest(body)

        // Create Supabase client with service role
        const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        })

        // Call database function for atomic transaction
        const { data: result, error: rpcError } = await supabase.rpc('handle_gift', {
            p_sender_id: sanitized.senderId,
            p_recipient_id: sanitized.recipientId,
            p_amount: sanitized.amount,
            p_message: sanitized.message || null
        })

        if (rpcError) {
            console.error('[Gift API] RPC error:', rpcError)

            // Parse error message for user-friendly feedback
            const errorMessage = rpcError.message || 'Failed to process gift'

            if (errorMessage.includes('balance') || errorMessage.includes('insufficient')) {
                return errorResponse('Insufficient balance. Please top up your wallet.', 400, 'balance')
            }
            if (errorMessage.includes('wallet')) {
                return errorResponse('Wallet not found. Please contact support.', 400, 'wallet')
            }
            if (errorMessage.includes('pattern') || errorMessage.includes('format') || errorMessage.includes('constraint')) {
                return errorResponse('Invalid data format. Please refresh and try again.', 400, 'format')
            }

            return errorResponse(errorMessage, 400)
        }

        // Check result from database function
        if (!result || typeof result !== 'object') {
            console.error('[Gift API] Invalid RPC result:', result)
            return errorResponse('Unexpected response from server', 500)
        }

        // Handle JSON result from database function
        const resultObj = typeof result === 'string' ? JSON.parse(result) : result

        if (!resultObj.success) {
            const errorMsg = resultObj.error || 'Transaction failed'
            console.error('[Gift API] Transaction failed:', errorMsg)

            // Provide user-friendly error messages
            if (errorMsg.includes('balance') || errorMsg.includes('insufficient')) {
                return errorResponse('Insufficient balance. Please top up your wallet.', 400, 'balance')
            }
            if (errorMsg.includes('wallet')) {
                return errorResponse('Wallet not found. Please contact support.', 400, 'wallet')
            }

            return errorResponse(errorMsg, 400)
        }

        // Success!
        return NextResponse.json({
            success: true,
            message: 'Gift sent successfully! 🎁',
            newSenderBalance: resultObj.new_balance || 0,
            giftId: resultObj.gift_id
        })

    } catch (error) {
        console.error('[Gift API] Unexpected error:', error)

        // Handle specific error types
        if (error instanceof Error) {
            if (error.message.includes('JSON')) {
                return errorResponse('Invalid request format', 400)
            }
        }

        return errorResponse('An unexpected error occurred. Please try again.', 500)
    }
}

export async function GET() {
    return errorResponse('Method not allowed', 405)
}
