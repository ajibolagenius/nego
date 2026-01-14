import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const body = await request.json()
    const { senderId, recipientId, amount, message, senderName, recipientName } = body

    // Validate input
    if (!senderId || !recipientId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Call the database function that handles the gift transaction
    const { data, error } = await supabase.rpc('send_gift', {
      p_sender_id: senderId,
      p_recipient_id: recipientId,
      p_amount: amount,
      p_message: message || null,
      p_sender_name: senderName || 'Someone',
      p_recipient_name: recipientName || 'Talent'
    })

    if (error) {
      console.error('Gift RPC error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to send gift' },
        { status: 500 }
      )
    }

    // The function returns a JSON object
    if (!data?.success) {
      return NextResponse.json(
        { error: data?.error || 'Gift failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: data.message,
      newSenderBalance: data.newSenderBalance
    })

  } catch (error) {
    console.error('Gift API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
