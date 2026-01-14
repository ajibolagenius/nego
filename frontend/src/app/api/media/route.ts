import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create admin client lazily to avoid errors at module load time
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  })
}

export async function GET(request: NextRequest) {
  try {
    // Get admin client
    let supabaseAdmin
    try {
      supabaseAdmin = getSupabaseAdmin()
    } catch (envError) {
      console.error('Supabase config error:', envError)
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

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
