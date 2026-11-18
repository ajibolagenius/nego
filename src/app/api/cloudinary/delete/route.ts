import { NextRequest, NextResponse } from 'next/server'
import { destroyCloudinaryAsset } from '@/lib/cloudinary-server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { publicId, resourceType = 'image' } = body

    if (!publicId) {
      return NextResponse.json({ error: 'Missing publicId' }, { status: 400 })
    }

    // Verify the user owns the media they're trying to delete
    // Check profiles (avatar_url) and media table
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, avatar_url, role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'
    const ownsAvatar = profile?.avatar_url?.includes(publicId)

    let ownsMedia = false
    if (!ownsAvatar && !isAdmin) {
      const { data: media } = await supabase
        .from('media')
        .select('id, talent_id')
        .eq('talent_id', user.id)
        .like('url', `%${publicId}%`)
        .maybeSingle()

      ownsMedia = !!media
    }

    if (!ownsAvatar && !ownsMedia && !isAdmin) {
      return NextResponse.json({ error: 'You do not have permission to delete this asset' }, { status: 403 })
    }

    const result = await destroyCloudinaryAsset(
      publicId,
      resourceType === 'video' ? 'video' : 'image'
    )

    if (result.ok) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Failed to delete asset', details: result.details },
      { status: 500 }
    )
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
