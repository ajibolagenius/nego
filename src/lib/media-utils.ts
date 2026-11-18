
/**
 * Compresses an image file while maintaining aspect ratio
 * @param file The file to compress
 * @param maxWidth The maximum width of the compressed image
 * @param quality The quality of the JPEG compression (0-1)
 * @returns A promise that resolves to the compressed File
 */
export const compressImage = async (file: File, maxWidth: number = 1080, quality: number = 0.75): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const img = document.createElement('img')
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let width = img.width
                let height = img.height

                if (width > maxWidth) {
                    height = (height * maxWidth) / width
                    width = maxWidth
                }

                canvas.width = width
                canvas.height = height

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'))
                    return
                }

                ctx.drawImage(img, 0, 0, width, height)

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image'))
                            return
                        }
                        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', {
                            type: 'image/webp',
                            lastModified: Date.now(),
                        })
                        resolve(compressedFile)
                    },
                    'image/webp',
                    quality
                )
            }
            img.onerror = () => reject(new Error('Failed to load image'))
            img.src = e.target?.result as string
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
    })
}

const VIDEO_BITRATE = 2_000_000 // ~15MB per minute at 720p
const AUDIO_BITRATE = 128_000
const STALL_TIMEOUT_MS = 15_000

/**
 * Re-encodes a video to 720p H.264/AAC MP4 using the browser's WebCodecs encoders
 * @param file The video to compress
 * @param maxBytes Fails fast if the estimated output would exceed this size
 * @param onProgress Called with 0-1 as encoding advances
 * @returns A promise that resolves to the compressed MP4 File; rejects if the browser can't encode it
 */
export const compressVideo = async (
    file: File,
    maxBytes: number,
    onProgress?: (progress: number) => void
): Promise<File> => {
    // Loaded on demand so the encoder library stays out of the main bundle
    const { Input, Output, Conversion, BlobSource, BufferTarget, Mp4OutputFormat, ALL_FORMATS, Quality } = await import('mediabunny')

    const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS })
    try {
        const duration = await input.computeDuration()
        const estimatedBytes = (duration * (VIDEO_BITRATE + AUDIO_BITRATE)) / 8
        if (estimatedBytes > maxBytes) {
            const maxSeconds = Math.floor((maxBytes * 8) / (VIDEO_BITRATE + AUDIO_BITRATE))
            throw new Error(`Video is too long. Please trim it to under ${maxSeconds} seconds.`)
        }

        const hasAudio = (await input.getPrimaryAudioTrack()) !== null
        const target = new BufferTarget()
        const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target })
        const conversion = await Conversion.init({
            input,
            output,
            tracks: 'primary',
            video: async (track) => {
                const width = await track.getDisplayWidth()
                const height = await track.getDisplayHeight()
                const resize = Math.min(width, height) <= 720 ? {}
                    : width < height ? { width: 720 } : { height: 720 }
                return { ...resize, codec: 'avc', quality: new Quality({ bitrate: VIDEO_BITRATE }) }
            },
            audio: { codec: 'aac', quality: new Quality({ bitrate: AUDIO_BITRATE }) },
            showWarnings: false,
        })

        // A missing encoder silently drops the track; treat that as failure rather than upload a mute/blank video
        const kept = conversion.utilizedTracks
        if (!conversion.isValid || !kept.some(t => t.isVideoTrack()) || (hasAudio && !kept.some(t => t.isAudioTrack()))) {
            throw new Error('This browser cannot compress this video')
        }

        // Some browsers' encoders stall without erroring; cancel so the caller can fall back to the original
        let lastProgressAt = Date.now()
        conversion.onProgress = (p) => {
            lastProgressAt = Date.now()
            onProgress?.(p)
        }
        const watchdog = setInterval(() => {
            if (Date.now() - lastProgressAt > STALL_TIMEOUT_MS) void conversion.cancel()
        }, 1000)
        try {
            await conversion.execute()
        } finally {
            clearInterval(watchdog)
        }

        return new File([target.buffer!], file.name.replace(/\.[^/.]+$/, '') + '.mp4', {
            type: 'video/mp4',
            lastModified: Date.now(),
        })
    } finally {
        input.dispose()
    }
}

export const isVideo = (url: string): boolean => {
    if (!url) return false
    if (url.includes('/video/upload/')) return true
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)
}

export const isCloudinaryUrl = (url: string): boolean => {
    if (!url) return false
    try {
        return new URL(url).hostname === 'res.cloudinary.com'
    } catch {
        return false
    }
}

export interface CloudinaryAssetInfo {
    publicId: string
    resourceType: 'image' | 'video'
}

/**
 * Extracts the Cloudinary public_id and resource_type from a res.cloudinary.com URL.
 */
export function getCloudinaryAssetInfo(url: string): CloudinaryAssetInfo | null {
    if (!isCloudinaryUrl(url)) return null
    try {
        const parsed = new URL(url)
        const match = parsed.pathname.match(/\/(image|video)\/upload\/(.+)$/)
        if (!match) return null

        const resourceType = match[1] as 'image' | 'video'
        let remainder = match[2]!

        // Strip any leading transformation segments before the version or public_id
        const segments = remainder.split('/')
        while (segments.length > 1 && segments[0] && (segments[0].includes(',') || /^(f|q|w|h|c|g|e|so)_/.test(segments[0]))) {
            segments.shift()
        }
        if (segments.length > 1 && segments[0] && /^v\d+$/.test(segments[0])) {
            segments.shift()
        }

        remainder = segments.join('/')
        const publicId = remainder.replace(/\.[^./?#]+$/, '')
        if (!publicId) return null

        return { publicId, resourceType }
    } catch {
        return null
    }
}

/**
 * Returns a lightweight JPEG poster frame URL for a Cloudinary video URL, or null for non-Cloudinary URLs.
 */
export function getCloudinaryVideoPosterUrl(url: string, width: number = 480): string | null {
    if (!isCloudinaryUrl(url)) return null
    try {
        const parsed = new URL(url)
        if (!parsed.pathname.includes('/video/upload/')) return null
        parsed.pathname = parsed.pathname
            .replace('/video/upload/', `/video/upload/so_0,w_${width},c_limit,q_auto,f_jpg/`)
            .replace(/\.[^./?#]+$/, '.jpg')
        return parsed.toString()
    } catch {
        return null
    }
}

/**
 * Returns a tiny, pre-blurred Cloudinary image URL for locked premium previews.
 */
export function getCloudinaryBlurredImageUrl(url: string): string | null {
    if (!isCloudinaryUrl(url)) return null
    try {
        const parsed = new URL(url)
        if (!parsed.pathname.includes('/image/upload/')) return null
        parsed.pathname = parsed.pathname.replace(
            '/image/upload/',
            '/image/upload/w_64,q_20,e_blur:800,f_auto/'
        )
        return parsed.toString()
    } catch {
        return null
    }
}

/**
 * Extracts bucket and object path from a Supabase Storage public URL.
 */
export function extractSupabaseStorageObject(url: string): { bucket: string; objectPath: string } | null {
    if (!url) return null
    try {
        const parsed = new URL(url)
        if (!parsed.hostname.endsWith('.supabase.co')) return null
        const match = parsed.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/)
        if (!match) return null
        return {
            bucket: decodeURIComponent(match[1]!),
            objectPath: decodeURIComponent(match[2]!),
        }
    } catch {
        return null
    }
}
