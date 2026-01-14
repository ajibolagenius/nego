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
    const { senderId, recipientId, amount, message, senderName, recipientName } = body

    // Validate input
    if (!senderId || !recipientId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(senderId) || !uuidRegex.test(recipientId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
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
    const { data: rpcData, error: rpcError } = await supabase.rpc('handle_gift', {
      p_sender_id: senderId,
      p_recipient_id: recipientId,
      p_amount: amount,
      p_message: message || null
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
        message: 'Gift sent successfully!',
        newSenderBalance: rpcData.new_balance
      })
    }

    // Log RPC error for debugging
    console.log('RPC handle_gift not available or failed:', rpcError?.message)

    // Fallback: Direct operations using service role (bypasses RLS)
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

    // Get recipient wallet
    const { data: recipientWallet, error: recipientWalletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', recipientId)
      .single()

    if (recipientWalletError || !recipientWallet) {
      return NextResponse.json(
        { error: 'Recipient wallet not found' },
        { status: 404 }
      )
    }

    // Deduct from sender
    const { error: deductError } = await supabase
      .from('wallets')
      .update({ balance: senderWallet.balance - amount })
      .eq('user_id', senderId)

    if (deductError) {
      console.error('Deduct error:', deductError)
      return NextResponse.json(
        { error: 'Failed to process gift' },
        { status: 500 }
      )
    }

    // Add to recipient
    const { error: addError } = await supabase
      .from('wallets')
      .update({ balance: recipientWallet.balance + amount })
      .eq('user_id', recipientId)

    if (addError) {
      // Rollback sender deduction
      await supabase
        .from('wallets')
        .update({ balance: senderWallet.balance })
        .eq('user_id', senderId)
      
      console.error('Add to recipient error:', addError)
      return NextResponse.json(
        { error: 'Failed to credit recipient' },
        { status: 500 }
      )
    }

    // Create gift record
    try {
      await supabase.from('gifts').insert({
        sender_id: senderId,
        recipient_id: recipientId,
        amount,
        message: message || null
      })
    } catch {
      // Ignore gift record errors
    }

    // Create transaction records
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
      // Ignore transaction record errors
    }

    // Create notification
    try {
      await supabase.from('notifications').insert({
        user_id: recipientId,
        type: 'general',
        title: 'You received a gift! 🎁',
        message: `${senderName || 'Someone'} sent you ${amount} coins`,
        data: { gift_amount: amount, sender_id: senderId }
      })
    } catch {
      // Ignore notification errors
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

export const runtime = 'edge'
