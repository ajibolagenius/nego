import { NextRequest, NextResponse } from 'next/server'
import { extractR2ObjectKey } from '@/lib/media-utils'
import { deleteR2Object } from '@/lib/r2-server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = (await request.json()) as { url?: string; key?: string }
        const rawKey = body.url ? extractR2ObjectKey(body.url) : body.key?.replace(/^\/+/, '') || null

        if (!rawKey || rawKey.includes('..') || rawKey.includes('\\')) {
            return NextResponse.json({ error: 'Invalid R2 object key' }, { status: 400 })
        }

        const isOwnKey =
            rawKey.startsWith(`media/${user.id}/`) ||
            rawKey.startsWith(`avatars/${user.id}/`)

        if (!isOwnKey) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role !== 'admin') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
        }

        const deleted = await deleteR2Object(rawKey)
        if (!deleted) {
            return NextResponse.json({ error: 'R2 storage binding unavailable' }, { status: 503 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[R2 Delete] Failed:', error)
        return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 })
    }
}
