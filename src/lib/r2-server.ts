// Server-only Cloudflare R2 storage helper using the native `MEDIA_BUCKET` binding.

export interface R2HttpMetadata {
    contentType?: string
    cacheControl?: string
    contentDisposition?: string
}

export interface R2ObjectLike {
    key: string
    size: number
    etag: string
    httpEtag: string
    httpMetadata?: R2HttpMetadata
    range?: { offset: number; length: number } | { suffix: number }
    body?: ReadableStream<Uint8Array>
    writeHttpMetadata(headers: Headers): void
}

export interface R2BucketLike {
    put(
        key: string,
        value: ReadableStream<Uint8Array> | ArrayBuffer | ArrayBufferView | string | Blob | null,
        options?: { httpMetadata?: R2HttpMetadata }
    ): Promise<R2ObjectLike | null>
    get(
        key: string,
        options?: { range?: Headers | { offset?: number; length?: number; suffix?: number } }
    ): Promise<R2ObjectLike | null>
    head(key: string): Promise<R2ObjectLike | null>
    delete(keys: string | string[]): Promise<void>
}

interface CloudflareWorkersModule {
    env?: {
        MEDIA_BUCKET?: R2BucketLike
    }
}

const CLOUDFLARE_WORKERS_SPECIFIER: string = ['cloudflare', 'workers'].join(':')

export async function getR2Bucket(): Promise<R2BucketLike | null> {
    try {
        const mod = (await import(
            /* webpackIgnore: true */
            /* @vite-ignore */
            CLOUDFLARE_WORKERS_SPECIFIER
        )) as CloudflareWorkersModule
        return mod.env?.MEDIA_BUCKET ?? null
    } catch {
        return null
    }
}

export function encodeR2KeyForUrl(key: string): string {
    return key
        .replace(/^\/+/, '')
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/')
}

export function getR2PublicUrl(key: string): string {
    const encodedKey = encodeR2KeyForUrl(key)
    const configuredBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim().replace(/\/+$/, '')
    if (configuredBase) {
        return `${configuredBase}/${encodedKey}`
    }
    return `/api/storage/object/${encodedKey}`
}

export async function putR2Object(
    key: string,
    body: ReadableStream<Uint8Array> | ArrayBuffer | Uint8Array,
    contentType: string
): Promise<{ key: string; url: string }> {
    const bucket = await getR2Bucket()
    if (!bucket) {
        throw new Error('R2 MEDIA_BUCKET binding is not available in this runtime')
    }

    await bucket.put(key, body, {
        httpMetadata: {
            contentType,
            cacheControl: 'public, max-age=31536000, immutable',
        },
    })

    return {
        key,
        url: getR2PublicUrl(key),
    }
}

export async function deleteR2Object(key: string): Promise<boolean> {
    const bucket = await getR2Bucket()
    if (!bucket) {
        return false
    }
    await bucket.delete(key)
    return true
}
