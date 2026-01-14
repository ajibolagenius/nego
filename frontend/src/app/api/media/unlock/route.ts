import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
    
    const body = await request.json()
    const { userId, mediaId, talentId, unlockPrice } = body

    // Validate input
    if (!userId || !mediaId || !talentId || !unlockPrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId) || !uuidRegex.test(mediaId) || !uuidRegex.test(talentId)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
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
        return NextResponse.json(
          { error: rpcData.error || 'Unlock failed' },
          { status: 400 }
        )
      }
      return NextResponse.json({
        success: true,
        message: rpcData.message,
        newUserBalance: rpcData.new_balance
      })
    }

    // Log RPC error for debugging
    console.log('RPC unlock_media not available:', rpcError?.message)

    // Fallback: Direct operations using service role
    const { data: userWallet, error: userError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (userError || !userWallet) {
      return NextResponse.json(
        { error: 'User wallet not found' },
        { status: 404 }
      )
    }

    if (userWallet.balance < unlockPrice) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
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
      return NextResponse.json(
        { error: 'Talent wallet not found' },
        { status: 404 }
      )
    }

    // Deduct from user
    const { error: deductError } = await supabase
      .from('wallets')
      .update({ balance: userWallet.balance - unlockPrice })
      .eq('user_id', userId)

    if (deductError) {
      console.error('Deduct error:', deductError)
      return NextResponse.json(
        { error: 'Failed to process unlock' },
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
      
      console.error('Add to talent error:', addError)
      return NextResponse.json(
        { error: 'Failed to credit talent' },
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
    console.error('Unlock API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const runtime = 'edge'
