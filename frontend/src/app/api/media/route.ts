import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { searchParams } = new URL(request.url)
    const talentId = searchParams.get('talentId')

    if (!talentId) {
      return NextResponse.json(
        { error: 'Missing talentId parameter' },
        { status: 400 }
      )
    }

    // Fetch all media for the talent
    const { data: media, error } = await supabase
      .from('media')
      .select('id, talent_id, url, type, is_premium, unlock_price, created_at')
      .eq('talent_id', talentId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Media fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch media' },
        { status: 500 }
      )
    }

    return NextResponse.json({ media: media || [] })

  } catch (error) {
    console.error('Media API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
