/**
 * Gift API Route
 *
 * POST /api/gifts - Send coins as a gift to another user
 * Uses database function handle_gift for atomic transactions
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { validateGiftRequest, sanitizeGiftRequest } from '@/lib/gift-validation'
import { notifyUser } from '@/lib/notifications'
import { createClient as createServerClient } from '@/lib/supabase/server'

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

        // Authenticate the caller. The sender is always the signed-in user —
        // never a value taken from the request body, otherwise anyone could
        // move coins out of any wallet by supplying another user's id.
        const sessionSupabase = await createServerClient()
        const { data: { user }, error: authError } = await sessionSupabase.auth.getUser()
        if (authError || !user) {
            return errorResponse('Unauthorized. Please sign in to continue.', 401)
        }

        // Parse request body
        let body: Record<string, unknown>
        try {
            body = await request.json()
        } catch (parseError) {
            console.error('[Gift API] JSON parse error:', parseError)
            return errorResponse('Invalid request format', 400)
        }

        // Force the sender to the authenticated user before validation/sanitization,
        // so any client-supplied senderId is ignored.
        body.senderId = user.id

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
                // Create low balance notification
                try {
                    await notifyUser({
                        userId: sanitized.senderId,
                        type: 'low_balance',
                        title: 'Insufficient Balance ⚠️',
                        message: `You don't have enough coins to send this gift. Please top up your wallet.`,
                        data: {
                            required_amount: sanitized.amount,
                            error: errorMsg,
                        },
                        url: '/dashboard/wallet',
                    })
                } catch (notifError) {
                    console.error('[Gift API] Failed to create low balance notification:', notifError)
                }

                return errorResponse('Insufficient balance. Please top up your wallet.', 400, 'balance')
            }
            if (errorMsg.includes('wallet')) {
                return errorResponse('Wallet not found. Please contact support.', 400, 'wallet')
            }

            return errorResponse(errorMsg, 400)
        }

        // Get recipient name for notifications
        const { data: recipientProfile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', sanitized.recipientId)
            .single()

        const recipientName = recipientProfile?.display_name || 'the talent'

        // Create notifications for both sender and recipient
        try {
            // Notification for sender
            await notifyUser({
                userId: sanitized.senderId,
                type: 'gift_sent',
                title: 'Gift Sent! 🎁',
                message: `You sent ${sanitized.amount.toLocaleString()} coins to ${recipientName}. Your new balance is ${resultObj.new_balance?.toLocaleString() || 0} coins.`,
                data: {
                    gift_id: resultObj.gift_id,
                    recipient_id: sanitized.recipientId,
                    recipient_name: recipientName,
                    amount: sanitized.amount,
                    new_balance: resultObj.new_balance,
                },
                url: '/dashboard/gifts',
            })

            // Notification for recipient
            await notifyUser({
                userId: sanitized.recipientId,
                type: 'gift_received',
                title: 'You received a gift! 🎁',
                message: `You received ${sanitized.amount.toLocaleString()} coins as a gift.`,
                data: {
                    gift_id: resultObj.gift_id,
                    sender_id: sanitized.senderId,
                    amount: sanitized.amount,
                    message: sanitized.message || null,
                },
                url: '/dashboard/gifts',
            })

            // Check for low balance warning for sender
            if (resultObj.new_balance && resultObj.new_balance < 100) {
                await notifyUser({
                    userId: sanitized.senderId,
                    type: 'low_balance',
                    title: 'Low Balance Warning ⚠️',
                    message: `Your balance is low (${resultObj.new_balance.toLocaleString()} coins). Consider topping up to continue enjoying our services.`,
                    data: {
                        current_balance: resultObj.new_balance,
                        threshold: 100,
                    },
                    url: '/dashboard/wallet',
                })
            }
        } catch (notifError) {
            console.error('[Gift API] Failed to create notifications:', notifError)
            // Don't fail the gift if notification fails
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
