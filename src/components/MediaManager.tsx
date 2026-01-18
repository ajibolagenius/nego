'use client'

import { useState, useRef, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
    Image as ImageIcon, Plus, Trash, X, Upload, Lock, Eye,
    SpinnerGap, Check, Crown, Star, SortAscending, SortDescending,
    VideoCamera, FunnelSimple, GridFour, List, Warning
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface TalentMedia {
    id: string
    talent_id: string
    url: string
    type: 'image' | 'video'
    is_premium: boolean
    unlock_price: number
    created_at: string
}

interface MediaManagerProps {
    talentId: string
    media: TalentMedia[]
    onRefresh: () => void
}

type MediaTab = 'free' | 'premium'
type SortOption = 'newest' | 'oldest'
type FilterOption = 'all' | 'images' | 'videos'
type ViewMode = 'grid' | 'list'

// Image compression helper (similar to ProfileImageUpload)
const compressImage = async (file: File, maxWidth: number = 1920, quality: number = 0.85): Promise<File> => {
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
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
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

export function MediaManager({ talentId, media, onRefresh }: MediaManagerProps) {
    const supabase = createClient()
    const [activeTab, setActiveTab] = useState<MediaTab>('free')
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadError, setUploadError] = useState('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [isPremium, setIsPremium] = useState(false)
    const [unlockPrice, setUnlockPrice] = useState('50')
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Sorting and filtering states
    const [sortBy, setSortBy] = useState<SortOption>('newest')
    const [filterBy, setFilterBy] = useState<FilterOption>('all')
    const [viewMode, setViewMode] = useState<ViewMode>('grid')
    const [showFilters, setShowFilters] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const freeMedia = media.filter(m => !m.is_premium)
    const premiumMedia = media.filter(m => m.is_premium)

    // Apply sorting and filtering
    const currentMedia = useMemo(() => {
        let filtered = activeTab === 'free' ? freeMedia : premiumMedia

        // Apply type filter
        if (filterBy === 'images') {
            filtered = filtered.filter(m => m.type === 'image' || !m.url.match(/\.(mp4|webm|ogg|mov)$/i))
        } else if (filterBy === 'videos') {
            filtered = filtered.filter(m => m.type === 'video' || m.url.match(/\.(mp4|webm|ogg|mov)$/i))
        }

        // Apply sorting
        return filtered.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime()
            const dateB = new Date(b.created_at).getTime()
            return sortBy === 'newest' ? dateB - dateA : dateA - dateB
        })
    }, [activeTab, freeMedia, premiumMedia, sortBy, filterBy])

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
            const { error: uploadError, data: uploadData } = await supabase.storage
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
            setIsPremium(false)
            setUnlockPrice('50')
            setShowUploadModal(false)
            setUploadProgress(0)

            // Small delay to show 100% progress
            setTimeout(() => {
                onRefresh()
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

    const handleDelete = async (mediaItem: TalentMedia) => {
        if (!confirm(`Are you sure you want to delete this ${mediaItem.is_premium ? 'premium' : 'free'} ${mediaItem.type}?`)) return

        setDeletingId(mediaItem.id)

        try {
            // Extract file path from URL
            const urlParts = new URL(mediaItem.url)
            const pathMatch = urlParts.pathname.match(/\/media\/(.+)$/)

            // Delete from database first
            const { error: deleteErr } = await supabase
                .from('media')
                .delete()
                .eq('id', mediaItem.id)

            if (deleteErr) throw deleteErr

            // Delete from Supabase Storage if we can extract the path
            if (pathMatch) {
                try {
                    const { error: storageError } = await supabase.storage
                        .from('media')
                        .remove([pathMatch[1]])

                    if (storageError) {
                        console.warn('[MediaManager] Failed to delete from storage:', storageError)
                        // Continue even if storage deletion fails
                    }
                } catch (storageErr) {
                    console.warn('[MediaManager] Storage deletion error:', storageErr)
                    // Continue even if storage deletion fails
                }
            }

            onRefresh()

        } catch (err) {
            console.error('[MediaManager] Delete error:', err)
            setUploadError('Failed to delete media. Please try again.')
            setTimeout(() => setUploadError(''), 5000)
        } finally {
            setDeletingId(null)
        }
    }

    const openUploadModal = (premium: boolean) => {
        setIsPremium(premium)
        setShowUploadModal(true)
    }

    const isVideo = (url: string) => url.match(/\.(mp4|webm|ogg|mov)$/i) !== null

    return (
        <div className="space-y-4" data-testid="media-manager">
            {/* Header Section - Enhanced */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Media Gallery</h3>
                    <p className="text-white/50 text-sm">Manage your free and premium content</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        aria-label={showFilters ? 'Hide filters' : 'Show filters'}
                        aria-pressed={showFilters}
                        className={`p-2.5 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black ${showFilters ? 'bg-[#df2531] text-white' : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
                            }`}
                    >
                        <FunnelSimple size={18} weight="duotone" aria-hidden="true" />
                    </button>

                    {/* View Mode Toggle */}
                    <button
                        onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                        aria-label={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
                        aria-pressed={viewMode === 'list'}
                        className="p-2.5 rounded-lg bg-white/5 text-white/60 hover:text-white border border-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black"
                    >
                        {viewMode === 'grid' ? <List size={18} weight="duotone" aria-hidden="true" /> : <GridFour size={18} weight="duotone" aria-hidden="true" />}
                    </button>

                    <button
                        onClick={() => openUploadModal(activeTab === 'premium')}
                        data-testid="upload-media-button"
                        aria-label={`Upload ${activeTab === 'premium' ? 'premium' : 'free'} content`}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#df2531] text-white text-sm font-medium hover:bg-[#df2531]/80 transition-colors focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black"
                    >
                        <Plus size={18} weight="duotone" aria-hidden="true" />
                        Upload {activeTab === 'premium' ? 'Premium' : 'Free'}
                    </button>
                </div>
            </div>

            {/* Tab Headers - Enhanced */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('free')}
                    data-testid="media-tab-free"
                    aria-label="View free content"
                    aria-pressed={activeTab === 'free'}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black ${activeTab === 'free'
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                        }`}
                >
                    <Eye size={18} weight="duotone" aria-hidden="true" />
                    Free <span className="ml-1">({freeMedia.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab('premium')}
                    data-testid="media-tab-premium"
                    aria-label="View premium content"
                    aria-pressed={activeTab === 'premium'}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-black ${activeTab === 'premium'
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20'
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                        }`}
                >
                    <Crown size={18} weight="fill" aria-hidden="true" />
                    Premium <span className="ml-1">({premiumMedia.length})</span>
                </button>
            </div>

            {/* Tab Description - Enhanced */}
            <div className={`p-4 rounded-xl border ${activeTab === 'premium'
                    ? 'bg-amber-500/10 border-amber-500/20'
                    : 'bg-green-500/10 border-green-500/20'
                }`}>
                <div className="flex items-start gap-3">
                    {activeTab === 'premium' ? (
                        <>
                            <Lock size={20} weight="duotone" className="text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                            <div>
                                <p className="text-amber-400 font-medium text-sm mb-1">Premium Content</p>
                                <p className="text-amber-400/70 text-xs leading-relaxed">
                                    Premium content is locked and requires payment to unlock. Clients will pay the unlock price you set to view this content.
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <Eye size={20} weight="duotone" className="text-green-400 shrink-0 mt-0.5" aria-hidden="true" />
                            <div>
                                <p className="text-green-400 font-medium text-sm mb-1">Free Content</p>
                                <p className="text-green-400/70 text-xs leading-relaxed">
                                    Free content is visible to everyone on your public profile. Use this to showcase your work and attract clients.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Filter Panel - Enhanced */}
            {showFilters && (
                <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-4 animate-fade-in-up">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-semibold text-sm">Filter & Sort Options</h4>
                        <button
                            onClick={() => setShowFilters(false)}
                            className="text-white/40 hover:text-white transition-colors"
                            aria-label="Close filters"
                        >
                            <X size={18} aria-hidden="true" />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        {/* Sort By */}
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-white/60 text-xs mb-2 font-medium uppercase tracking-wide">Sort By</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSortBy('newest')}
                                    aria-pressed={sortBy === 'newest'}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black ${sortBy === 'newest'
                                            ? 'bg-[#df2531] text-white shadow-lg shadow-[#df2531]/20'
                                            : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                                        }`}
                                >
                                    <SortDescending size={16} weight="duotone" aria-hidden="true" />
                                    Newest
                                </button>
                                <button
                                    onClick={() => setSortBy('oldest')}
                                    aria-pressed={sortBy === 'oldest'}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black ${sortBy === 'oldest'
                                            ? 'bg-[#df2531] text-white shadow-lg shadow-[#df2531]/20'
                                            : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                                        }`}
                                >
                                    <SortAscending size={16} weight="duotone" aria-hidden="true" />
                                    Oldest
                                </button>
                            </div>
                        </div>

                        {/* Filter By Type */}
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-white/60 text-xs mb-2 font-medium uppercase tracking-wide">Filter By Type</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilterBy('all')}
                                    aria-pressed={filterBy === 'all'}
                                    className={`flex-1 py-2.5 px-3 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black ${filterBy === 'all'
                                            ? 'bg-[#df2531] text-white shadow-lg shadow-[#df2531]/20'
                                            : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                                        }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilterBy('images')}
                                    aria-pressed={filterBy === 'images'}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black ${filterBy === 'images'
                                            ? 'bg-[#df2531] text-white shadow-lg shadow-[#df2531]/20'
                                            : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                                        }`}
                                >
                                    <ImageIcon size={16} weight="duotone" aria-hidden="true" />
                                    Images
                                </button>
                                <button
                                    onClick={() => setFilterBy('videos')}
                                    aria-pressed={filterBy === 'videos'}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black ${filterBy === 'videos'
                                            ? 'bg-[#df2531] text-white shadow-lg shadow-[#df2531]/20'
                                            : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                                        }`}
                                >
                                    <VideoCamera size={16} weight="duotone" aria-hidden="true" />
                                    Videos
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Media Grid/List - Enhanced */}
            {currentMedia.length === 0 ? (
                <div className="text-center py-16 rounded-2xl bg-white/5 border border-white/10">
                    <div className="mb-6">
                        {activeTab === 'premium' ? (
                            <Crown size={64} weight="duotone" className="text-amber-500/30 mx-auto mb-4" aria-hidden="true" />
                        ) : (
                            <ImageIcon size={64} weight="duotone" className="text-white/20 mx-auto mb-4" aria-hidden="true" />
                        )}
                    </div>
                    <p className="text-white/60 font-medium mb-2 text-lg">
                        No {activeTab} content yet
                    </p>
                    <p className="text-white/40 text-sm mb-6 max-w-md mx-auto leading-relaxed">
                        {activeTab === 'premium'
                            ? 'Upload exclusive premium content to earn coins from client unlocks. Set your unlock price and start monetizing your content.'
                            : 'Upload high-quality photos and videos to showcase your work and attract more clients. Free content is visible to everyone.'}
                    </p>
                    <Button
                        onClick={() => openUploadModal(activeTab === 'premium')}
                        className="bg-[#df2531] hover:bg-[#c41f2a] text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-[#df2531]/20 hover:shadow-[#df2531]/30 transition-all"
                        aria-label={`Upload your first ${activeTab === 'premium' ? 'premium' : 'free'} content`}
                    >
                        <Plus size={20} weight="duotone" className="mr-2" aria-hidden="true" />
                        Upload First {activeTab === 'premium' ? 'Premium' : ''} Content
                    </Button>
                </div>
            ) : viewMode === 'list' ? (
                <div className="space-y-3">
                    {currentMedia.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                            data-testid={`media-item-${item.id}`}
                        >
                            {/* Thumbnail */}
                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-white/10 flex-shrink-0 relative">
                                {isVideo(item.url) ? (
                                    <video src={item.url} className="w-full h-full object-cover" muted aria-label="Video thumbnail" />
                                ) : (
                                    <Image
                                        src={item.url}
                                        alt={`${item.is_premium ? 'Premium' : 'Free'} ${item.type}`}
                                        fill
                                        sizes="80px"
                                        className="object-cover"
                                    />
                                )}
                                {item.is_premium && (
                                    <div className="absolute top-1 right-1">
                                        <Crown size={14} weight="fill" className="text-amber-400" aria-hidden="true" />
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                    {isVideo(item.url) ? (
                                        <VideoCamera size={16} weight="duotone" className="text-purple-400" aria-hidden="true" />
                                    ) : (
                                        <ImageIcon size={16} weight="duotone" className="text-blue-400" aria-hidden="true" />
                                    )}
                                    <span className="text-white font-medium text-sm">
                                        {isVideo(item.url) ? 'Video' : 'Image'}
                                    </span>
                                    {item.is_premium && (
                                        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold border border-amber-500/30">
                                            {item.unlock_price} coins
                                        </span>
                                    )}
                                </div>
                                <p className="text-white/50 text-xs">
                                    Uploaded {new Date(item.created_at).toLocaleDateString('en-NG', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>

                            {/* Delete */}
                            <button
                                onClick={() => handleDelete(item)}
                                disabled={deletingId === item.id}
                                aria-label={`Delete ${item.is_premium ? 'premium' : 'free'} ${item.type}`}
                                className="p-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black"
                            >
                                {deletingId === item.id ? (
                                    <SpinnerGap size={18} className="animate-spin" aria-hidden="true" />
                                ) : (
                                    <Trash size={18} weight="duotone" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {currentMedia.map((item) => (
                        <div
                            key={item.id}
                            className="relative aspect-square rounded-xl overflow-hidden group border border-white/10 hover:border-[#df2531]/30 transition-all"
                            data-testid={`media-item-${item.id}`}
                        >
                            {isVideo(item.url) ? (
                                <video
                                    src={item.url}
                                    className="w-full h-full object-cover"
                                    muted
                                    aria-label={`${item.is_premium ? 'Premium' : 'Free'} video`}
                                />
                            ) : (
                                <Image
                                    src={item.url}
                                    alt={`${item.is_premium ? 'Premium' : 'Free'} content`}
                                    fill
                                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                    className="object-cover"
                                />
                            )}

                            {/* Premium Badge */}
                            {item.is_premium && (
                                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-lg shadow-amber-500/30">
                                    <Crown size={14} weight="fill" aria-hidden="true" />
                                    {item.unlock_price} coins
                                </div>
                            )}

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    onClick={() => handleDelete(item)}
                                    disabled={deletingId === item.id}
                                    aria-label={`Delete ${item.is_premium ? 'premium' : 'free'} ${item.type}`}
                                    className="p-3 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black"
                                >
                                    {deletingId === item.id ? (
                                        <SpinnerGap size={20} className="animate-spin" aria-hidden="true" />
                                    ) : (
                                        <Trash size={20} weight="duotone" aria-hidden="true" />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Modal - Enhanced */}
            {showUploadModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowUploadModal(false)
                            setSelectedFile(null)
                            setPreviewUrl(null)
                            setUploadError('')
                        }
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="upload-modal-title"
                >
                    <div
                        className="bg-[#0a0a0f] rounded-2xl w-full max-w-md border border-white/10 overflow-hidden shadow-2xl animate-fade-in-up"
                        data-testid="upload-media-modal"
                        onClick={(e) => e.stopPropagation()}
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
                                onClick={() => {
                                    setShowUploadModal(false)
                                    setSelectedFile(null)
                                    setPreviewUrl(null)
                                    setUploadError('')
                                }}
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
                                {previewUrl ? (
                                    <div className="relative">
                                        {selectedFile?.type.startsWith('video/') ? (
                                            <video
                                                src={previewUrl}
                                                className="max-h-48 mx-auto rounded-lg object-contain"
                                                controls={false}
                                                aria-label="Video preview"
                                            />
                                        ) : (
                                            <img
                                                src={previewUrl}
                                                alt="Preview"
                                                className="max-h-48 mx-auto rounded-lg object-contain"
                                            />
                                        )}
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
                                            <div className="mt-4 flex items-center justify-center gap-2 text-green-400">
                                                <Check size={20} weight="duotone" aria-hidden="true" />
                                                <span className="text-sm font-medium">{selectedFile?.name}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <Upload size={56} weight="duotone" className="text-white/30 mx-auto mb-4" aria-hidden="true" />
                                        <p className="text-white/70 mb-2 font-medium">Click to select a file</p>
                                        <p className="text-white/40 text-sm">Maximum 50MB • Images & Videos supported</p>
                                    </>
                                )}
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

                            {/* Premium Options - Enhanced */}
                            {isPremium && (
                                <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2.5">
                                            <Lock size={20} weight="duotone" className="text-amber-400" aria-hidden="true" />
                                            <div>
                                                <span className="text-white font-semibold text-sm block">Unlock Price</span>
                                                <span className="text-amber-400/70 text-xs">Set the price clients pay to view</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={unlockPrice}
                                                onChange={(e) => {
                                                    const value = e.target.value
                                                    if (value === '' || (parseInt(value) >= 10 && parseInt(value) <= 1000)) {
                                                        setUnlockPrice(value)
                                                    }
                                                }}
                                                min="10"
                                                max="1000"
                                                aria-label="Unlock price in coins"
                                                className="w-24 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-center font-semibold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50"
                                            />
                                            <span className="text-white/60 text-sm font-medium">coins</span>
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-amber-500/20">
                                        <p className="text-amber-400/80 text-xs leading-relaxed">
                                            Clients will need to pay <span className="font-bold">{unlockPrice || '50'}</span> coins to unlock and view this content.
                                            You&apos;ll receive the full amount when unlocked.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Content Type Toggle - Enhanced */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-3">
                                    {isPremium ? (
                                        <Crown size={24} weight="duotone" className="text-amber-400" aria-hidden="true" />
                                    ) : (
                                        <Eye size={24} weight="duotone" className="text-green-400" aria-hidden="true" />
                                    )}
                                    <div>
                                        <p className="text-white font-semibold">
                                            {isPremium ? 'Premium Content' : 'Free Content'}
                                        </p>
                                        <p className="text-white/50 text-xs">
                                            {isPremium ? 'Requires payment to unlock' : 'Visible to all visitors'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsPremium(!isPremium)}
                                    aria-label={`Switch to ${isPremium ? 'free' : 'premium'} content`}
                                    aria-pressed={isPremium}
                                    className={`relative w-14 h-7 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black ${isPremium ? 'bg-amber-500' : 'bg-white/20'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform shadow-lg ${isPremium ? 'translate-x-7' : 'translate-x-0'
                                            }`}
                                        aria-hidden="true"
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/10">
                            <Button
                                onClick={handleUpload}
                                disabled={!selectedFile || uploading}
                                aria-label={uploading ? 'Uploading...' : `Upload ${isPremium ? 'premium' : 'free'} content`}
                                className={`w-full font-bold py-4 rounded-xl disabled:opacity-50 transition-all ${isPremium
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/40'
                                        : 'bg-[#df2531] hover:bg-[#c41f2a] text-white shadow-lg shadow-[#df2531]/30 hover:shadow-[#df2531]/40'
                                    }`}
                            >
                                {uploading ? (
                                    <>
                                        <SpinnerGap size={20} className="animate-spin mr-2" aria-hidden="true" />
                                        <span className="sr-only">Uploading...</span>
                                        Uploading... {uploadProgress}%
                                    </>
                                ) : (
                                    <>
                                        <Upload size={20} weight="duotone" className="mr-2" aria-hidden="true" />
                                        Upload {isPremium ? 'Premium' : 'Free'} Content
                                    </>
                                )}
                            </Button>
                            {!uploading && selectedFile && (
                                <p className="text-white/40 text-xs text-center mt-3">
                                    File: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
