import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const body = await request.json()
    const { userId, mediaId, talentId, unlockPrice } = body

    // Validate input
    if (!userId || !mediaId || !talentId || !unlockPrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Call the database function that handles the unlock transaction
    const { data, error } = await supabase.rpc('unlock_media', {
      p_user_id: userId,
      p_media_id: mediaId,
      p_talent_id: talentId,
      p_unlock_price: unlockPrice
    })

    if (error) {
      console.error('Unlock RPC error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to unlock content' },
        { status: 500 }
      )
    }

    // The function returns a JSON object
    if (!data?.success) {
      return NextResponse.json(
        { error: data?.error || 'Unlock failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: data.message,
      newUserBalance: data.newUserBalance
    })

  } catch (error) {
    console.error('Unlock API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
