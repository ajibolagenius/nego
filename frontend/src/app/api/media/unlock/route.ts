import { createApiClient } from '@/lib/supabase/api'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createApiClient()
    
    const body = await request.json()
    const { userId, mediaId, talentId, unlockPrice } = body

    // Validate input
    if (!userId || !mediaId || !talentId || !unlockPrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
        newUserBalance: rpcData.newUserBalance
      })
    }

    // Fallback: Direct operations (may fail due to RLS)
    console.log('RPC not available, trying direct operations:', rpcError?.message)

    // Get user's wallet
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

    // Deduct from user (this should work - user updating their own wallet)
    const { error: deductError } = await supabase
      .from('wallets')
      .update({ balance: userWallet.balance - unlockPrice })
      .eq('user_id', userId)

    if (deductError) {
      console.error('Deduct error:', deductError)
      return NextResponse.json(
        { error: 'Failed to process unlock - please run the SQL script supabase_gift_unlock_functions.sql' },
        { status: 500 }
      )
    }

    // Try to add to talent (may fail due to RLS)
    const { data: talentWallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', talentId)
      .single()

    const { error: addError } = await supabase
      .from('wallets')
      .update({ balance: (talentWallet?.balance || 0) + unlockPrice })
      .eq('user_id', talentId)

    if (addError) {
      // Rollback
      await supabase
        .from('wallets')
        .update({ balance: userWallet.balance })
        .eq('user_id', userId)
      
      console.error('Add to talent error:', addError)
      return NextResponse.json(
        { error: 'Failed to credit talent - please run the SQL script supabase_gift_unlock_functions.sql' },
        { status: 500 }
      )
    }

    // Create records (best effort)
    await supabase.from('transactions').insert([
      {
        user_id: userId,
        amount: -unlockPrice,
        coins: -unlockPrice,
        type: 'unlock',
        status: 'completed',
        reference_id: mediaId,
        description: 'Unlocked premium content'
      },
      {
        user_id: talentId,
        amount: unlockPrice,
        coins: unlockPrice,
        type: 'unlock',
        status: 'completed',
        reference_id: mediaId,
        description: 'Content unlock payment'
      }
    ]).catch(() => {})

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
