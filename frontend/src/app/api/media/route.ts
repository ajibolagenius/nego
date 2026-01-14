import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create admin client with service role key for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const talentId = searchParams.get('talentId')

    if (!talentId) {
      return NextResponse.json(
        { error: 'Missing talentId parameter' },
        { status: 400 }
      )
    }

    // Fetch all media for the talent (including premium) using service role
    const { data: media, error } = await supabaseAdmin
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
