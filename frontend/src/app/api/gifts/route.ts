import { createApiClient } from '@/lib/supabase/api'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createApiClient()
    
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

    // Try database function first (most reliable)
    const { data: rpcData, error: rpcError } = await supabase.rpc('send_gift', {
      p_sender_id: senderId,
      p_recipient_id: recipientId,
      p_amount: amount,
      p_message: message || null,
      p_sender_name: senderName || 'Someone',
      p_recipient_name: recipientName || 'Talent'
    })

    // If RPC works, use its result
    if (!rpcError && rpcData) {
      if (!rpcData.success) {
        return NextResponse.json(
          { error: rpcData.error || 'Gift failed' },
          { status: 400 }
        )
      }
      return NextResponse.json({
        success: true,
        message: rpcData.message,
        newSenderBalance: rpcData.newSenderBalance
      })
    }

    // Fallback: Direct operations (may fail due to RLS)
    console.log('RPC not available, trying direct operations:', rpcError?.message)

    // Get sender's wallet
    const { data: senderWallet, error: senderError } = await supabase
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

    // Deduct from sender (this should work - user updating their own wallet)
    const { error: deductError } = await supabase
      .from('wallets')
      .update({ balance: senderWallet.balance - amount })
      .eq('user_id', senderId)

    if (deductError) {
      console.error('Deduct error:', deductError)
      return NextResponse.json(
        { error: 'Failed to process gift - please run the SQL script supabase_gift_unlock_functions.sql' },
        { status: 500 }
      )
    }

    // Try to add to recipient (may fail due to RLS)
    const { data: recipientWallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', recipientId)
      .single()

    const { error: addError } = await supabase
      .from('wallets')
      .update({ balance: (recipientWallet?.balance || 0) + amount })
      .eq('user_id', recipientId)

    if (addError) {
      // Rollback
      await supabase
        .from('wallets')
        .update({ balance: senderWallet.balance })
        .eq('user_id', senderId)
      
      console.error('Add to recipient error:', addError)
      return NextResponse.json(
        { error: 'Failed to credit recipient - please run the SQL script supabase_gift_unlock_functions.sql' },
        { status: 500 }
      )
    }

    // Create records (best effort)
    try {
      await supabase.from('gifts').insert({
        sender_id: senderId,
        recipient_id: recipientId,
        amount,
        message: message || null
      })
    } catch {
      // Ignore errors
    }

    try {
      await supabase.from('transactions').insert([
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
          description: `Gift from ${senderName || 'Someone'}`
        }
      ])
    } catch {
      // Ignore errors
    }

    try {
      await supabase.from('notifications').insert({
        user_id: recipientId,
        type: 'general',
        title: 'You received a gift! 🎁',
        message: `${senderName || 'Someone'} sent you ${amount} coins`,
        data: { gift_amount: amount, sender_id: senderId }
      })
    } catch {
      // Ignore errors
    }

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
