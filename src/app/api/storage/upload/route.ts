import { NextRequest, NextResponse } from 'next/server'
import { putR2Object } from '@/lib/r2-server'
import { createClient } from '@/lib/supabase/server'

const MAX_UPLOAD_BYTES = 26 * 1024 * 1024 // 26 MB (25 MB app cap + overhead)

const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'video/mp4',
    'video/quicktime',
    'video/webm',
])

const MIME_TO_EXT: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/webm': 'webm',
}

function sanitizeFilename(rawName: string, contentType: string): string {
    const base = rawName.split('/').pop()?.split('\\').pop() || 'upload'
    const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '').slice(0, 120)
    const fallbackExt = MIME_TO_EXT[contentType] || 'bin'
    if (!cleaned) return `file.${fallbackExt}`
    if (!cleaned.includes('.')) return `${cleaned}.${fallbackExt}`
    return cleaned
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const folder = (searchParams.get('folder') || '').replace(/^\/+|\/+$/g, '')
        const rawFilename = searchParams.get('filename') || 'upload'

        // Allow uploads only into the authenticated user's own `media/<uid>` or `avatars/<uid>` prefix
        // (or any valid `media/<id>` / `avatars/<id>` prefix if the caller is an admin).
        const isOwnPrefix = folder === `media/${user.id}` || folder === `avatars/${user.id}`
        if (!isOwnPrefix) {
            const validGenericFolder = /^(media|avatars)\/[a-zA-Z0-9_-]+$/.test(folder)
            if (!validGenericFolder) {
                return NextResponse.json({ error: 'Invalid upload folder' }, { status: 400 })
            }
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role !== 'admin') {
                return NextResponse.json({ error: 'Forbidden upload folder' }, { status: 403 })
            }
        }

        const rawContentType = (request.headers.get('content-type') || '').split(';')[0]?.trim().toLowerCase() || ''
        if (!ALLOWED_MIME_TYPES.has(rawContentType)) {
            return NextResponse.json(
                { error: `Unsupported file type: ${rawContentType || 'unknown'}` },
                { status: 400 }
            )
        }

        const contentLengthHeader = request.headers.get('content-length')
        if (contentLengthHeader) {
            const declaredBytes = Number(contentLengthHeader)
            if (!Number.isFinite(declaredBytes) || declaredBytes <= 0 || declaredBytes > MAX_UPLOAD_BYTES) {
                return NextResponse.json(
                    { error: 'File size exceeds the 25MB upload limit' },
                    { status: 413 }
                )
            }
        }

        const buffer = await request.arrayBuffer()
        if (buffer.byteLength === 0) {
            return NextResponse.json({ error: 'Empty file body' }, { status: 400 })
        }
        if (buffer.byteLength > MAX_UPLOAD_BYTES) {
            return NextResponse.json(
                { error: 'File size exceeds the 25MB upload limit' },
                { status: 413 }
            )
        }

        const safeName = sanitizeFilename(rawFilename, rawContentType)
        const key = `${folder}/${Date.now()}_${safeName}`

        const { url } = await putR2Object(key, buffer, rawContentType)

        return NextResponse.json({
            key,
            url,
            contentType: rawContentType,
            size: buffer.byteLength,
        })
    } catch (error) {
        console.error('[R2 Upload] Failed:', error)
        const message = error instanceof Error ? error.message : 'Failed to upload file'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
