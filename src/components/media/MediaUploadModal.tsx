'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import {
    Upload, X, Warning, Crown
} from '@phosphor-icons/react'
import { compressImage } from '@/lib/media-utils'
import { createClient } from '@/lib/supabase/client'

interface MediaUploadModalProps {
    talentId: string,
    initialIsPremium: boolean,
    onSuccess: () => void,
    onClose: () => void
}

export function MediaUploadModal({ talentId, initialIsPremium, onClose, onSuccess }: MediaUploadModalProps) {
    const supabase = createClient()
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadError, setUploadError] = useState('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [isPremium, setIsPremium] = useState(initialIsPremium)
    const [unlockPrice, setUnlockPrice] = useState('50')

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        const isImage = file.type.startsWith('image/')
        const isVideo = file.type.startsWith('video/')

        if (!isImage && !isVideo) {
            setUploadError('Please select an image or video file')
            return
        }

        // Validate file size (max 50MB for Supabase Storage)
        const maxSize = 50 * 1024 * 1024 // 50MB
        if (file.size > maxSize) {
            setUploadError(`File size must be less than ${(maxSize / 1024 / 1024).toFixed(0)}MB`)
            return
        }

        setSelectedFile(file)
        setUploadError('')

        // Create preview
        const reader = new FileReader()
        reader.onload = (e) => {
            setPreviewUrl(e.target?.result as string)
        }
        reader.readAsDataURL(file)
    }, [])

    const handleUpload = async () => {
        if (!selectedFile) return

        setUploading(true)
        setUploadProgress(0)
        setUploadError('')

        try {
            const isVideo = selectedFile.type.startsWith('video/')
            const isImage = selectedFile.type.startsWith('image/')

            let fileToUpload = selectedFile
            let fileName = ''
            let contentType = selectedFile.type

            // Compress images before upload
            if (isImage) {
                setUploadProgress(10)
                try {
                    fileToUpload = await compressImage(selectedFile, 1920, 0.85)
                    setUploadProgress(20)
                    fileName = `${talentId}/${Date.now()}_${selectedFile.name.replace(/\.[^/.]+$/, '')}.jpg`
                    contentType = 'image/jpeg'
                } catch (compressError) {
                    console.warn('[MediaManager] Compression failed, uploading original:', compressError)
                    // Continue with original file if compression fails
                    fileName = `${talentId}/${Date.now()}_${selectedFile.name}`
                }
            } else if (isVideo) {
                fileName = `${talentId}/${Date.now()}_${selectedFile.name}`
            } else {
                throw new Error('Unsupported file type')
            }

            setUploadProgress(30)

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('media')
                .upload(fileName, fileToUpload, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: contentType,
                })

            if (uploadError) {
                // Check if it's a duplicate file error
                if (uploadError.message.includes('already exists')) {
                    // Try with a different filename
                    fileName = `${talentId}/${Date.now()}_${Math.random().toString(36).substring(7)}_${selectedFile.name}`
                    const { error: retryError } = await supabase.storage
                        .from('media')
                        .upload(fileName, fileToUpload, {
                            cacheControl: '3600',
                            upsert: false,
                            contentType: contentType,
                        })
                    if (retryError) throw retryError
                } else {
                    throw uploadError
                }
            }

            setUploadProgress(60)

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('media')
                .getPublicUrl(fileName)

            if (!urlData?.publicUrl) {
                throw new Error('Failed to get public URL')
            }

            setUploadProgress(80)

            // Insert media record in Supabase
            const { error: insertErr } = await supabase
                .from('media')
                .insert({
                    talent_id: talentId,
                    url: urlData.publicUrl,
                    type: isVideo ? 'video' : 'image',
                    is_premium: isPremium,
                    unlock_price: isPremium ? parseInt(unlockPrice) || 50 : 0,
                })

            if (insertErr) throw insertErr

            setUploadProgress(100)

            // Reset and close modal
            setSelectedFile(null)
            setPreviewUrl(null)
            setIsPremium(initialIsPremium)
            setUnlockPrice('50')
            setUploadProgress(0)

            // Small delay to show 100% progress
            setTimeout(() => {
                onSuccess()
            }, 300)

        } catch (err: unknown) {
            console.error('[MediaManager] Upload error:', err)
            const errorMessage = err instanceof Error
                ? err.message
                : 'Failed to upload media. Please try again.'
            setUploadError(errorMessage)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose()
                }
            }}
            onKeyDown={(e) => {
                if (e.key === 'Escape') onClose()
            }}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-modal-title"
        >
            <div
                className="bg-[#0a0a0f] rounded-2xl w-full max-w-md border border-white/10 overflow-hidden shadow-2xl animate-fade-in-up"
                data-testid="upload-media-modal"
                onClick={(e) => e.stopPropagation()}
                role="document"
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isPremium
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30'
                            : 'bg-green-500 shadow-lg shadow-green-500/30'
                            }`}>
                            {isPremium ? (
                                <Crown size={24} weight="fill" className="text-white" aria-hidden="true" />
                            ) : (
                                <Upload size={24} weight="duotone" className="text-white" aria-hidden="true" />
                            )}
                        </div>
                        <div>
                            <h2 id="upload-modal-title" className="text-xl font-bold text-white">
                                Upload {isPremium ? 'Premium' : 'Free'} Content
                            </h2>
                            <p className="text-white/50 text-sm">
                                {isPremium ? 'Exclusive content for paying clients' : 'Visible to everyone on your profile'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close upload modal"
                        className="text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                    >
                        <X size={24} weight="duotone" aria-hidden="true" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {uploadError && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3" role="alert">
                            <Warning size={20} weight="duotone" className="shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{uploadError}</span>
                        </div>
                    )}

                    {/* File Upload Area */}
                    {!selectedFile && (
                        <div
                            onClick={() => !uploading && fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${previewUrl
                                ? 'border-[#df2531]/50 bg-[#df2531]/5'
                                : 'border-white/20 hover:border-white/40 bg-white/5'
                                } ${uploading ? 'cursor-not-allowed opacity-75' : ''}`}
                            role="button"
                            tabIndex={uploading ? -1 : 0}
                            aria-label="Click to select file"
                            onKeyDown={(e) => {
                                if ((e.key === 'Enter' || e.key === ' ') && !uploading) {
                                    e.preventDefault()
                                    fileInputRef.current?.click()
                                }
                            }}
                        >
                            <Upload size={56} weight="duotone" className="text-white/30 mx-auto mb-4" aria-hidden="true" />
                            <p className="text-white/70 mb-2 font-medium">Click to select a file</p>
                            <p className="text-white/40 text-sm">Maximum 50MB • Images & Videos supported</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,video/*"
                                onChange={handleFileSelect}
                                className="hidden"
                                disabled={uploading}
                                aria-label="Select media file"
                            />
                        </div>
                    )}

                    {selectedFile && (
                        <div className="border border-white/20 rounded-xl p-4 bg-white/5">
                            <div className="relative mb-4">
                                {selectedFile.type.startsWith('video/') ? (
                                    <video
                                        src={previewUrl!}
                                        className="max-h-48 mx-auto rounded-lg object-contain"
                                        controls={false}
                                        aria-label="Video preview"
                                    />
                                ) : (
                                    <div className="relative w-full h-48">
                                        <Image
                                            src={previewUrl!}
                                            alt="Preview"
                                            fill
                                            className="object-contain rounded-lg"
                                            unoptimized // For local blob URLs
                                        />
                                    </div>
                                )}
                                <button
                                    onClick={() => {
                                        setSelectedFile(null)
                                        setPreviewUrl(null)
                                    }}
                                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                                    aria-label="Remove file"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Premium Options inside file area */}
                            <div className="flex items-center gap-4 mb-4">
                                <label className="flex items-center gap-2 text-white cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={isPremium}
                                        onChange={(e) => setIsPremium(e.target.checked)}
                                        className="w-4 h-4 rounded border-white/30 bg-white/10 text-amber-500 focus:ring-amber-500 focus:ring-offset-black"
                                    />
                                    <span className="text-sm">Make Premium</span>
                                </label>

                                {isPremium && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-white/50 text-sm">Price: </span>
                                        <input
                                            type="number"
                                            value={unlockPrice}
                                            onChange={(e) => setUnlockPrice(e.target.value)}
                                            className="w-20 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm"
                                            min="1"
                                        />
                                    </div>
                                )}
                            </div>

                            {uploading ? (
                                <div className="mt-4">
                                    <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-[#df2531] to-orange-500 h-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                            role="progressbar"
                                            aria-valuenow={uploadProgress}
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                        />
                                    </div>
                                    <p className="text-white/70 text-sm mt-2 font-medium">
                                        Uploading... {uploadProgress}%
                                    </p>
                                </div>
                            ) : (
                                <button
                                    onClick={handleUpload}
                                    className="w-full py-2.5 bg-[#df2531] hover:bg-[#c41f2a] text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <Upload size={18} />
                                    Start Upload
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
