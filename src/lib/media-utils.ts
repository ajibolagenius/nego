
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

export const isVideo = (url: string) => url.match(/\.(mp4|webm|ogg|mov)$/i) !== null
