import { createApiClient } from '@/lib/supabase/api'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createApiClient()
    
    const { searchParams } = new URL(request.url)
    const talentId = searchParams.get('talentId')

    if (!talentId) {
      return NextResponse.json(
        { error: 'Missing talentId parameter' },
        { status: 400 }
      )
    }

    // Fetch all media for the talent (excluding rejected)
    // Talents can see their own rejected media in dashboard, but it won't show in public API
    const { data: media, error } = await supabase
      .from('media')
      .select('id, talent_id, url, type, is_premium, unlock_price, created_at')
      .eq('talent_id', talentId)
      .or('moderation_status.is.null,moderation_status.eq.approved,moderation_status.eq.pending')
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
