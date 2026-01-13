'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Camera, Upload, X, SpinnerGap, Check, User } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface ProfileImageUploadProps {
  userId: string
  currentImageUrl: string | null
  displayName: string | null
  onUploadComplete: (url: string) => void
}

export function ProfileImageUpload({ 
  userId, 
  currentImageUrl, 
  displayName,
  onUploadComplete 
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setError(null)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
      setShowModal(true)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) return

    const file = fileInputRef.current.files[0]
    setIsUploading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/avatar_${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        // If bucket doesn't exist, try profiles bucket
        const { error: altUploadError } = await supabase.storage
          .from('profiles')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true
          })
        
        if (altUploadError) throw altUploadError
        
        // Get public URL from profiles bucket
        const { data: urlData } = supabase.storage
          .from('profiles')
          .getPublicUrl(fileName)
        
        // Update profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            avatar_url: urlData.publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (updateError) throw updateError
        
        onUploadComplete(urlData.publicUrl)
      } else {
        // Get public URL from avatars bucket
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)

        // Update profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            avatar_url: urlData.publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (updateError) throw updateError
        
        onUploadComplete(urlData.publicUrl)
      }

      setShowModal(false)
      setPreview(null)
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setShowModal(false)
    setPreview(null)
    setError(null)
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
        >
          <Camera size={28} weight="duotone" className="text-white" />
        </button>
        
        {/* Small camera badge */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#df2531] flex items-center justify-center border-2 border-black hover:bg-[#c41f2a] transition-colors"
        >
          <Camera size={16} weight="bold" className="text-white" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Error message */}
      {error && !showModal && (
        <p className="text-red-400 text-sm mt-2">{error}</p>
      )}

      {/* Preview Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Update Profile Photo</h3>
              <button
                onClick={handleCancel}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Preview */}
            <div className="flex justify-center mb-6">
              <div className="relative w-40 h-40 rounded-full overflow-hidden border-2 border-[#df2531]/30">
                {preview && (
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
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
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                className="flex-1 bg-[#df2531] hover:bg-[#c41f2a] text-white"
                disabled={isUploading}
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <SpinnerGap size={18} className="animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check size={18} weight="bold" />
                    Save Photo
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
