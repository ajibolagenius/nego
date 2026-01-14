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
    const { senderId, recipientId, amount, message, senderName, recipientName } = body

    // Validate input
    if (!senderId || !recipientId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (amount < 100) {
      return NextResponse.json(
        { error: 'Minimum gift amount is 100 coins' },
        { status: 400 }
      )
    }

    if (senderId === recipientId) {
      return NextResponse.json(
        { error: 'Cannot gift to yourself' },
        { status: 400 }
      )
    }

    // Get sender's wallet
    const { data: senderWallet, error: senderError } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', senderId)
      .single()

    if (senderError || !senderWallet) {
      return NextResponse.json(
        { error: 'Sender wallet not found' },
        { status: 404 }
      )
    }

    if (senderWallet.balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // Get or create recipient's wallet
    let { data: recipientWallet, error: recipientError } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', recipientId)
      .single()

    if (recipientError || !recipientWallet) {
      // Create wallet for recipient if it doesn't exist
      const { data: newWallet, error: createError } = await supabaseAdmin
        .from('wallets')
        .insert({ user_id: recipientId, balance: 0, escrow_balance: 0 })
        .select('balance')
        .single()

      if (createError) {
        console.error('Failed to create recipient wallet:', createError)
        return NextResponse.json(
          { error: 'Failed to create recipient wallet' },
          { status: 500 }
        )
      }
      recipientWallet = newWallet
    }

    // Deduct from sender
    const { error: deductError } = await supabaseAdmin
      .from('wallets')
      .update({ balance: senderWallet.balance - amount })
      .eq('user_id', senderId)

    if (deductError) {
      console.error('Failed to deduct from sender:', deductError)
      return NextResponse.json(
        { error: 'Failed to process gift' },
        { status: 500 }
      )
    }

    // Add to recipient
    const { error: addError } = await supabaseAdmin
      .from('wallets')
      .update({ balance: (recipientWallet?.balance || 0) + amount })
      .eq('user_id', recipientId)

    if (addError) {
      // Rollback sender deduction
      await supabaseAdmin
        .from('wallets')
        .update({ balance: senderWallet.balance })
        .eq('user_id', senderId)
      
      console.error('Failed to add to recipient:', addError)
      return NextResponse.json(
        { error: 'Failed to process gift' },
        { status: 500 }
      )
    }

    // Create gift record
    const { error: giftError } = await supabaseAdmin
      .from('gifts')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        amount,
        message: message || null
      })

    if (giftError) {
      console.error('Gift record error:', giftError)
      // Don't fail the whole transaction for this
    }

    // Create transaction records
    await supabaseAdmin.from('transactions').insert([
      {
        user_id: senderId,
        amount: -amount,
        coins: -amount,
        type: 'gift',
        status: 'completed',
        description: `Gift to ${recipientName || 'Talent'}`
      },
      {
        user_id: recipientId,
        amount: amount,
        coins: amount,
        type: 'gift',
        status: 'completed',
        description: `Gift from ${senderName || 'Client'}`
      }
    ])

    // Create notification for recipient
    await supabaseAdmin.from('notifications').insert({
      user_id: recipientId,
      type: 'general',
      title: 'You received a gift! 🎁',
      message: `${senderName || 'Someone'} sent you ${amount} coins${message ? `: "${message}"` : ''}`,
      data: { gift_amount: amount, sender_id: senderId }
    })

    return NextResponse.json({
      success: true,
      message: 'Gift sent successfully',
      newSenderBalance: senderWallet.balance - amount
    })

  } catch (error) {
    console.error('Gift API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
