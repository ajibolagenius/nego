import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !serviceRoleKey) {
            console.error('[Media Unlock] Missing environment variables')
            return NextResponse.json(
                { success: false, error: 'Server configuration error' },
                { status: 500 }
            )
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        })

        const body = await request.json()
        const { userId, mediaId, talentId, unlockPrice } = body

        // Validate input
        if (!userId || !mediaId || !talentId || unlockPrice === undefined || unlockPrice === null) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: userId, mediaId, talentId, and unlockPrice are required' },
                { status: 400 }
            )
        }

        // Validate UUIDs
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(userId) || !uuidRegex.test(mediaId) || !uuidRegex.test(talentId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid ID format. All IDs must be valid UUIDs' },
                { status: 400 }
            )
        }

        // Validate unlock price
        if (typeof unlockPrice !== 'number' || unlockPrice <= 0) {
            return NextResponse.json(
                { success: false, error: 'Invalid unlock price. Must be a positive number' },
                { status: 400 }
            )
        }

        // Try database function first (most reliable)
        const { data: rpcData, error: rpcError } = await supabase.rpc('unlock_media', {
            p_user_id: userId,
            p_media_id: mediaId,
            p_talent_id: talentId,
            p_unlock_price: unlockPrice
        })

        // If RPC works, use its result
        if (!rpcError && rpcData) {
            if (!rpcData.success) {
                console.error('[Media Unlock] RPC error:', rpcData.error)
                return NextResponse.json(
                    { success: false, error: rpcData.error || 'Failed to unlock content' },
                    { status: 400 }
                )
            }
            return NextResponse.json({
                success: true,
                message: rpcData.message || 'Content unlocked successfully',
                newUserBalance: rpcData.new_balance
            })
        }

        // Log RPC error for debugging
        console.warn('[Media Unlock] RPC unlock_media not available, using fallback:', rpcError?.message)

        // Fallback: Direct operations using service role
        const { data: userWallet, error: userError } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', userId)
            .single()

        if (userError || !userWallet) {
            console.error('[Media Unlock] User wallet error:', userError)
            return NextResponse.json(
                { success: false, error: 'User wallet not found. Please contact support if this persists.' },
                { status: 404 }
            )
        }

        if (userWallet.balance < unlockPrice) {
            return NextResponse.json(
                { success: false, error: `Insufficient balance. You need ${unlockPrice} coins but only have ${userWallet.balance} coins.` },
                { status: 400 }
            )
        }

        // Get talent wallet
        const { data: talentWallet, error: talentError } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', talentId)
            .single()

        if (talentError || !talentWallet) {
            console.error('[Media Unlock] Talent wallet error:', talentError)
            return NextResponse.json(
                { success: false, error: 'Talent wallet not found. Please contact support.' },
                { status: 404 }
            )
        }

        // Deduct from user
        const { error: deductError } = await supabase
            .from('wallets')
            .update({ balance: userWallet.balance - unlockPrice })
            .eq('user_id', userId)

        if (deductError) {
            console.error('[Media Unlock] Deduct error:', deductError)
            return NextResponse.json(
                { success: false, error: 'Failed to process unlock. Please try again or contact support.' },
                { status: 500 }
            )
        }

        // Add to talent
        const { error: addError } = await supabase
            .from('wallets')
            .update({ balance: talentWallet.balance + unlockPrice })
            .eq('user_id', talentId)

        if (addError) {
            // Rollback
            await supabase
                .from('wallets')
                .update({ balance: userWallet.balance })
                .eq('user_id', userId)

            console.error('[Media Unlock] Add to talent error:', addError)
            return NextResponse.json(
                { success: false, error: 'Failed to complete unlock. Your balance has been restored. Please try again.' },
                { status: 500 }
            )
        }

        // Create media unlock record
        try {
            await supabase.from('media_unlocks').insert({
                user_id: userId,
                media_id: mediaId
            })
        } catch {
            // Ignore media unlock record errors
        }

        // Create transaction records
        try {
            await supabase.from('transactions').insert([
                {
                    user_id: userId,
                    amount: -unlockPrice,
                    coins: -unlockPrice,
                    type: 'premium_unlock',
                    status: 'completed',
                    reference_id: mediaId,
                    description: 'Unlocked premium content'
                },
                {
                    user_id: talentId,
                    amount: unlockPrice,
                    coins: unlockPrice,
                    type: 'premium_unlock',
                    status: 'completed',
                    reference_id: mediaId,
                    description: 'Content unlock payment'
                }
            ])
        } catch {
            // Ignore transaction record errors
        }

        return NextResponse.json({
            success: true,
            message: 'Content unlocked successfully',
            newUserBalance: userWallet.balance - unlockPrice
        })

    } catch (error) {
        console.error('[Media Unlock] Unexpected error:', error)
        const errorMessage = process.env.NODE_ENV === 'development'
            ? (error instanceof Error ? error.message : 'Internal server error')
            : 'An unexpected error occurred. Please try again or contact support.'

        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        )
    }
}

export const runtime = 'nodejs'
