// Cloudinary upload utilities for client-side

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  url: string
  resource_type: 'image' | 'video'
  format: string
  width: number
  height: number
  bytes: number
  created_at: string
}

export interface CloudinarySignature {
  signature: string
  timestamp: number
  cloud_name: string
  api_key: string
  folder: string
  resource_type: string
}

// Get upload signature from backend
async function getSignature(resourceType: 'image' | 'video', folder: string): Promise<CloudinarySignature> {
  const response = await fetch(`/api/cloudinary/signature?resource_type=${resourceType}&folder=${folder}`)
  if (!response.ok) {
    throw new Error('Failed to get upload signature')
  }
  return response.json()
}

// Upload image to Cloudinary
export async function uploadImage(
  file: File,
  folder: string = 'uploads',
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResult> {
  const sig = await getSignature('image', folder)

  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', sig.api_key)
  formData.append('timestamp', sig.timestamp.toString())
  formData.append('signature', sig.signature)
  formData.append('folder', sig.folder)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      })
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText))
      } else {
        reject(new Error('Upload failed'))
      }
    }

    xhr.onerror = () => reject(new Error('Upload failed'))

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`)
    xhr.send(formData)
  })
}

// Upload video to Cloudinary
export async function uploadVideo(
  file: File,
  folder: string = 'uploads',
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResult> {
  const sig = await getSignature('video', folder)

  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', sig.api_key)
  formData.append('timestamp', sig.timestamp.toString())
  formData.append('signature', sig.signature)
  formData.append('folder', sig.folder)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      })
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText))
      } else {
        reject(new Error('Upload failed'))
      }
    }

    xhr.onerror = () => reject(new Error('Upload failed'))

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloud_name}/video/upload`)
    xhr.send(formData)
  })
}

// Upload any media file (auto-detect type)
export async function uploadMedia(
  file: File,
  folder: string = 'uploads',
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResult> {
  const isVideo = file.type.startsWith('video/')
  
  if (isVideo) {
    return uploadVideo(file, folder, onProgress)
  }
  return uploadImage(file, folder, onProgress)
}

// Delete asset from Cloudinary (via backend)
export async function deleteAsset(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<boolean> {
  const response = await fetch('/api/cloudinary/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicId, resourceType })
  })
  
  if (!response.ok) {
    throw new Error('Failed to delete asset')
  }
  
  const data = await response.json()
  return data.success
}

// Generate optimized Cloudinary URL
export function getOptimizedUrl(
  publicId: string,
  options: {
    width?: number
    height?: number
    crop?: 'fill' | 'fit' | 'thumb' | 'scale'
    gravity?: 'face' | 'auto' | 'center'
    quality?: 'auto' | number
    format?: 'auto' | 'webp' | 'jpg' | 'png'
    resourceType?: 'image' | 'video'
  } = {}
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const {
    width,
    height,
    crop = 'fill',
    gravity = 'auto',
    quality = 'auto',
    format = 'auto',
    resourceType = 'image'
  } = options

  const transformations: string[] = []
  
  if (width) transformations.push(`w_${width}`)
  if (height) transformations.push(`h_${height}`)
  if (crop) transformations.push(`c_${crop}`)
  if (gravity) transformations.push(`g_${gravity}`)
  if (quality) transformations.push(`q_${quality}`)
  if (format) transformations.push(`f_${format}`)

  const transformString = transformations.length > 0 
    ? transformations.join(',') + '/'
    : ''

  return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${transformString}${publicId}`
}

// Get video thumbnail URL
export function getVideoThumbnail(publicId: string, width: number = 400, height: number = 300): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  return `https://res.cloudinary.com/${cloudName}/video/upload/w_${width},h_${height},c_fill,q_auto,f_jpg/${publicId}.jpg`
}
