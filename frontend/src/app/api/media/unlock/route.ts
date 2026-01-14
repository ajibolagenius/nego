import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create admin client with service role key for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, mediaId, talentId, unlockPrice } = body

    // Validate input
    if (!userId || !mediaId || !talentId || !unlockPrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get user's wallet
    const { data: userWallet, error: userError } = await supabaseAdmin
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

    // Get or create talent's wallet
    let { data: talentWallet } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', talentId)
      .single()

    if (!talentWallet) {
      // Create wallet for talent if doesn't exist
      const { data: newWallet } = await supabaseAdmin
        .from('wallets')
        .insert({ user_id: talentId, balance: 0, escrow_balance: 0 })
        .select('balance')
        .single()
      
      talentWallet = newWallet
    }

    // Deduct from user
    const { error: deductError } = await supabaseAdmin
      .from('wallets')
      .update({ balance: userWallet.balance - unlockPrice })
      .eq('user_id', userId)

    if (deductError) {
      console.error('Failed to deduct from user:', deductError)
      return NextResponse.json(
        { error: 'Failed to process unlock' },
        { status: 500 }
      )
    }

    // Add to talent
    const { error: addError } = await supabaseAdmin
      .from('wallets')
      .update({ balance: (talentWallet?.balance || 0) + unlockPrice })
      .eq('user_id', talentId)

    if (addError) {
      // Rollback user deduction
      await supabaseAdmin
        .from('wallets')
        .update({ balance: userWallet.balance })
        .eq('user_id', userId)
      
      console.error('Failed to add to talent:', addError)
      return NextResponse.json(
        { error: 'Failed to process unlock' },
        { status: 500 }
      )
    }

    // Create transaction records
    await supabaseAdmin.from('transactions').insert([
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
    ])

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
