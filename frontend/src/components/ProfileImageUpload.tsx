'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Camera, Upload, X, SpinnerGap, Check, User, Warning, Info } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface ProfileImageUploadProps {
  userId: string
  currentImageUrl: string | null
  displayName: string | null
  onUploadComplete: (url: string) => void
}

// Image compression helper
const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Resize if needed
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
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(compressedFile)
          },
          'image/jpeg',
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

// Validate image dimensions
const validateImageDimensions = (file: File, minWidth: number = 100, minHeight: number = 100): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new window.Image()
      img.onload = () => {
        if (img.width < minWidth || img.height < minHeight) {
          reject(new Error(`Image must be at least ${minWidth}x${minHeight} pixels`))
        } else {
          resolve(true)
        }
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function ProfileImageUpload({ 
  userId, 
  currentImageUrl, 
  displayName,
  onUploadComplete 
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, or WebP)')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB. Large images will be automatically compressed.')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Validate dimensions
    try {
      await validateImageDimensions(file, 100, 100)
    } catch (dimError) {
      setError(dimError instanceof Error ? dimError.message : 'Image dimensions are too small')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setSelectedFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
      setShowModal(true)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const supabase = createClient()

      // Compress image
      setUploadProgress(10)
      const compressedFile = await compressImage(selectedFile, 800, 0.8)
      setUploadProgress(30)

      // Generate unique filename
      const fileName = `${userId}/avatar_${Date.now()}.jpg`

      // Delete old avatar if exists
      if (currentImageUrl) {
        try {
          // Extract path from URL
          const urlParts = currentImageUrl.split('/')
          const oldFileName = urlParts[urlParts.length - 1]
          const oldPath = `${userId}/${oldFileName}`

          // Try to delete from both buckets
          await supabase.storage.from('avatars').remove([oldPath]).catch(() => {})
          await supabase.storage.from('profiles').remove([oldPath]).catch(() => {})
        } catch (deleteError) {
          console.warn('[ProfileImageUpload] Failed to delete old avatar:', deleteError)
          // Continue with upload even if deletion fails
        }
      }
      setUploadProgress(40)

      // Upload to Supabase Storage
      let uploadBucket = 'avatars'
      let uploadError = null

      const { error: avatarsError } = await supabase.storage
        .from('avatars')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (avatarsError) {
        // If bucket doesn't exist, try profiles bucket
        uploadBucket = 'profiles'
        const { error: profilesError } = await supabase.storage
          .from('profiles')
          .upload(fileName, compressedFile, {
            cacheControl: '3600',
            upsert: true
          })
        
        if (profilesError) {
          uploadError = profilesError
        }
      }

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      setUploadProgress(70)

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(uploadBucket)
        .getPublicUrl(fileName)

      setUploadProgress(85)

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) throw updateError

      setUploadProgress(100)

      onUploadComplete(urlData.publicUrl)

      setShowModal(false)
      setPreview(null)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      console.error('[ProfileImageUpload] Upload error:', err)
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to upload image. Please try again.'
      setError(errorMessage)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleCancel = () => {
    setShowModal(false)
    setPreview(null)
    setSelectedFile(null)
    setError(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      {/* Avatar with upload button */}
      <div className="relative group">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-[#df2531]/20 border-2 border-[#df2531]/30">
          {currentImageUrl ? (
            <Image
              src={currentImageUrl}
              alt={displayName || 'Profile'}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={40} weight="duotone" className="text-[#df2531]" />
            </div>
          )}
        </div>
        
        {/* Upload overlay */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
          aria-label="Upload profile photo"
        >
          <Camera size={28} weight="duotone" className="text-white" aria-hidden="true" />
        </button>
        
        {/* Small camera badge */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#df2531] flex items-center justify-center border-2 border-black hover:bg-[#c41f2a] transition-colors"
          aria-label="Upload profile photo"
        >
          <Camera size={16} weight="bold" className="text-white" aria-hidden="true" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Select profile photo"
        />
      </div>

      {/* Error message */}
      {error && !showModal && (
        <p className="text-red-400 text-sm mt-2">{error}</p>
      )}

      {/* Preview Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={handleCancel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-modal-title"
        >
          <div 
            className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 id="upload-modal-title" className="text-xl font-bold text-white">Update Profile Photo</h3>
              <button
                onClick={handleCancel}
                className="text-white/60 hover:text-white transition-colors"
                aria-label="Close upload modal"
                disabled={isUploading}
              >
                <X size={24} aria-hidden="true" />
              </button>
            </div>

            {/* Info tip */}
            <div className="mb-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-2">
              <Info size={18} className="text-blue-400 mt-0.5 shrink-0" aria-hidden="true" />
              <p className="text-blue-400 text-xs">
                Images are automatically compressed to reduce file size while maintaining quality. Minimum size: 100x100px.
              </p>
            </div>

            {/* Preview */}
            <div className="flex justify-center mb-6">
              <div className="relative w-40 h-40 rounded-full overflow-hidden border-2 border-[#df2531]/30">
                {preview && (
                  <Image
                    src={preview}
                    alt="Profile photo preview"
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="mb-4" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60 text-sm">Uploading...</span>
                  <span className="text-white/60 text-sm">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#df2531] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2" role="alert">
                <Warning size={18} className="text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
                disabled={isUploading}
                aria-label="Cancel upload"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                className="flex-1 bg-[#df2531] hover:bg-[#c41f2a] text-white"
                disabled={isUploading}
                aria-label="Save profile photo"
              >
                {isUploading ? (
                  <>
                    <SpinnerGap size={18} className="animate-spin mr-2" aria-hidden="true" />
                    <span className="sr-only">Uploading...</span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check size={18} weight="bold" className="mr-2" aria-hidden="true" />
                    Save Photo
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
