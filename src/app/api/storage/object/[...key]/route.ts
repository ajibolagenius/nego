import { NextRequest, NextResponse } from 'next/server'
import { getR2Bucket } from '@/lib/r2-server'

const ALLOWED_PREFIXES = ['avatars/', 'media/'] as const

function resolveAllowedKey(segments: string[]): string | null {
    const key = segments
        .map((segment) => {
            try {
                return decodeURIComponent(segment)
            } catch {
                return ''
            }
        })
        .join('/')
        .replace(/^\/+/, '')

    if (!key || key.includes('..') || key.includes('\\')) return null
    if (!ALLOWED_PREFIXES.some((prefix) => key.startsWith(prefix))) return null
    return key
}

function parseByteRange(rangeHeader: string, totalSize: number): { offset: number; length: number } | null {
    const match = rangeHeader.match(/^bytes=(\d*)-(\d*)$/)
    if (!match) return null

    const startStr = match[1]
    const endStr = match[2]

    if (startStr === '' && endStr === '') return null

    if (startStr === '') {
        const suffix = Number(endStr)
        if (!Number.isFinite(suffix) || suffix <= 0) return null
        const length = Math.min(suffix, totalSize)
        return { offset: totalSize - length, length }
    }

    const start = Number(startStr)
    const end = endStr ? Math.min(Number(endStr), totalSize - 1) : totalSize - 1
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start > end || start >= totalSize) {
        return null
    }
    return { offset: start, length: end - start + 1 }
}

export async function HEAD(
    _request: NextRequest,
    { params }: { params: Promise<{ key: string[] }> }
) {
    const { key: segments } = await params
    const objectKey = resolveAllowedKey(segments)
    if (!objectKey) {
        return new NextResponse(null, { status: 400 })
    }

    const bucket = await getR2Bucket()
    if (!bucket) {
        return new NextResponse(null, { status: 503 })
    }

    const obj = await bucket.head(objectKey)
    if (!obj) {
        return new NextResponse(null, { status: 404 })
    }

    const headers = new Headers()
    obj.writeHttpMetadata(headers)
    headers.set('etag', obj.httpEtag)
    headers.set('content-length', obj.size.toString())
    headers.set('accept-ranges', 'bytes')
    if (!headers.has('cache-control')) {
        headers.set('cache-control', 'public, max-age=31536000, immutable')
    }

    return new NextResponse(null, { status: 200, headers })
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ key: string[] }> }
) {
    const { key: segments } = await params
    const objectKey = resolveAllowedKey(segments)
    if (!objectKey) {
        return NextResponse.json({ error: 'Invalid object key' }, { status: 400 })
    }

    const bucket = await getR2Bucket()
    if (!bucket) {
        return NextResponse.json({ error: 'Storage binding unavailable' }, { status: 503 })
    }

    const rangeHeader = request.headers.get('range')

    if (rangeHeader) {
        const meta = await bucket.head(objectKey)
        if (!meta) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }

        const parsedRange = parseByteRange(rangeHeader, meta.size)
        if (!parsedRange) {
            return new NextResponse(null, {
                status: 416,
                headers: { 'content-range': `bytes */${meta.size}` },
            })
        }

        const rangedObj = await bucket.get(objectKey, { range: parsedRange })
        if (!rangedObj || !rangedObj.body) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }

        const headers = new Headers()
        rangedObj.writeHttpMetadata(headers)
        headers.set('etag', rangedObj.httpEtag)
        headers.set('accept-ranges', 'bytes')
        headers.set(
            'content-range',
            `bytes ${parsedRange.offset}-${parsedRange.offset + parsedRange.length - 1}/${meta.size}`
        )
        headers.set('content-length', parsedRange.length.toString())
        if (!headers.has('cache-control')) {
            headers.set('cache-control', 'public, max-age=31536000, immutable')
        }

        return new NextResponse(rangedObj.body, { status: 206, headers })
    }

    const obj = await bucket.get(objectKey)
    if (!obj || !obj.body) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const headers = new Headers()
    obj.writeHttpMetadata(headers)
    headers.set('etag', obj.httpEtag)
    headers.set('content-length', obj.size.toString())
    headers.set('accept-ranges', 'bytes')
    if (!headers.has('cache-control')) {
        headers.set('cache-control', 'public, max-age=31536000, immutable')
    }

    return new NextResponse(obj.body, { status: 200, headers })
}
