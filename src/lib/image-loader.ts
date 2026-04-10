import type { ImageLoaderProps } from 'next/image'

const DEFAULT_QUALITY = 75
const CLOUDINARY_UPLOAD_SEGMENT = '/upload/'

function buildCloudinaryPath(pathname: string, width: number, quality: number) {
  if (!pathname.includes(CLOUDINARY_UPLOAD_SEGMENT)) {
    return pathname
  }

  const transforms = `f_auto,q_${quality},w_${width},c_limit`

  return pathname.replace(
    CLOUDINARY_UPLOAD_SEGMENT,
    `${CLOUDINARY_UPLOAD_SEGMENT}${transforms}/`
  )
}

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

    if (url.hostname === 'res.cloudinary.com') {
      url.pathname = buildCloudinaryPath(url.pathname, width, imageQuality)
      return url.toString()
    }

    url.hash = `img-width=${width}&img-quality=${imageQuality}`
    return url.toString()
  } catch {
    return src
  }
}
