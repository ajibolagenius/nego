import type { ImageLoaderProps } from 'next/image'

const DEFAULT_QUALITY = 75

export default function imageLoader({ src, width, quality }: ImageLoaderProps) {
  if (!src || src.startsWith('/')) {
    return src
  }

  const imageQuality = quality ?? DEFAULT_QUALITY

  try {
    const url = new URL(src)

    if (url.hostname === 'images.unsplash.com') {
      url.searchParams.set('auto', 'format')
      url.searchParams.set('fit', 'max')
      url.searchParams.set('w', width.toString())
      url.searchParams.set('q', imageQuality.toString())
      return url.toString()
    }

    return url.toString()
  } catch {
    return src
  }
}
