'use client'

import { useState, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Image as ImageIcon, Plus, Trash, X, Upload, Lock, Eye,
  SpinnerGap, Check, Crown, Star, SortAscending, SortDescending,
  VideoCamera, FunnelSimple, GridFour, List
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

export function MediaManager({ talentId, media, onRefresh }: MediaManagerProps) {
  const [activeTab, setActiveTab] = useState<MediaTab>('free')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setUploadError('Please select an image or video file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB')
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
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setUploadError('')

    try {
      const supabase = createClient()
      
      // Upload to storage
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${talentId}/${Date.now()}.${fileExt}`
      
      const { error: uploadErr, data } = await supabase.storage
        .from('media')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadErr) throw uploadErr

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName)

      // Insert media record
      const { error: insertErr } = await supabase
        .from('media')
        .insert({
          talent_id: talentId,
          url: publicUrl,
          type: selectedFile.type.startsWith('video/') ? 'video' : 'image',
          is_premium: isPremium,
          unlock_price: isPremium ? parseInt(unlockPrice) : 0
        })

      if (insertErr) throw insertErr

      // Reset and close modal
      setSelectedFile(null)
      setPreviewUrl(null)
      setIsPremium(false)
      setUnlockPrice('50')
      setShowUploadModal(false)
      onRefresh()

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload'
      setUploadError(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (mediaId: string, mediaUrl: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    setDeletingId(mediaId)

    try {
      const supabase = createClient()

      // Delete from database
      const { error: deleteErr } = await supabase
        .from('media')
        .delete()
        .eq('id', mediaId)

      if (deleteErr) throw deleteErr

      // Try to delete from storage (extract path from URL)
      try {
        const urlParts = new URL(mediaUrl)
        const pathMatch = urlParts.pathname.match(/\/media\/(.+)$/)
        if (pathMatch) {
          await supabase.storage.from('media').remove([pathMatch[1]])
        }
      } catch {
        // Ignore storage deletion errors
      }

      onRefresh()

    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete media')
    } finally {
      setDeletingId(null)
    }
  }

  const openUploadModal = (premium: boolean) => {
    setIsPremium(premium)
    setShowUploadModal(true)
  }

  return (
    <div className="space-y-4" data-testid="media-manager">
      {/* Tab Headers */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('free')}
            data-testid="media-tab-free"
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'free'
                ? 'bg-green-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <Eye size={18} />
            Free ({freeMedia.length})
          </button>
          <button
            onClick={() => setActiveTab('premium')}
            data-testid="media-tab-premium"
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'premium'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <Crown size={18} weight="fill" />
            Premium ({premiumMedia.length})
          </button>
        </div>
        
        <button
          onClick={() => openUploadModal(activeTab === 'premium')}
          data-testid="upload-media-button"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#df2531] text-white text-sm font-medium hover:bg-[#df2531]/80 transition-colors"
        >
          <Plus size={18} />
          Upload {activeTab === 'premium' ? 'Premium' : 'Free'}
        </button>
      </div>

      {/* Tab Description */}
      <div className={`p-3 rounded-xl border ${
        activeTab === 'premium' 
          ? 'bg-amber-500/10 border-amber-500/20' 
          : 'bg-green-500/10 border-green-500/20'
      }`}>
        <div className="flex items-center gap-2">
          {activeTab === 'premium' ? (
            <>
              <Lock size={16} className="text-amber-400" />
              <p className="text-amber-400 text-sm">
                Premium content is locked. Clients can unlock it by paying coins.
              </p>
            </>
          ) : (
            <>
              <Eye size={16} className="text-green-400" />
              <p className="text-green-400 text-sm">
                Free content is visible to everyone on your profile.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Media Grid */}
      {currentMedia.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-white/5 border border-white/10">
          <ImageIcon size={48} weight="duotone" className="text-white/20 mx-auto mb-4" />
          <p className="text-white/50 mb-2">
            No {activeTab} content yet
          </p>
          <p className="text-white/30 text-sm mb-4">
            {activeTab === 'premium' 
              ? 'Upload exclusive content to earn from unlocks' 
              : 'Upload photos to showcase your work'}
          </p>
          <Button
            onClick={() => openUploadModal(activeTab === 'premium')}
            className="bg-[#df2531] hover:bg-[#c41f2a] text-white"
          >
            <Plus size={18} className="mr-2" />
            Upload First {activeTab === 'premium' ? 'Premium' : ''} Photo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentMedia.map((item) => (
            <div 
              key={item.id} 
              className="relative aspect-square rounded-xl overflow-hidden group"
              data-testid={`media-item-${item.id}`}
            >
              <img 
                src={item.url} 
                alt="" 
                className="w-full h-full object-cover"
              />
              
              {/* Premium Badge */}
              {item.is_premium && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium">
                  <Crown size={12} weight="fill" />
                  {item.unlock_price} coins
                </div>
              )}
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button 
                  onClick={() => handleDelete(item.id, item.url)}
                  disabled={deletingId === item.id}
                  className="p-3 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  {deletingId === item.id ? (
                    <SpinnerGap size={20} className="animate-spin" />
                  ) : (
                    <Trash size={20} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div 
            className="bg-[#0a0a0f] rounded-2xl w-full max-w-md border border-white/10 overflow-hidden"
            data-testid="upload-media-modal"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isPremium 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                    : 'bg-green-500'
                }`}>
                  {isPremium ? <Crown size={20} weight="fill" className="text-white" /> : <Upload size={20} className="text-white" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Upload {isPremium ? 'Premium' : 'Free'} Content
                  </h2>
                  <p className="text-white/50 text-sm">
                    {isPremium ? 'Locked content for paying clients' : 'Visible to everyone'}
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
                className="text-white/60 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {uploadError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {uploadError}
                </div>
              )}

              {/* File Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  previewUrl 
                    ? 'border-[#df2531]/50 bg-[#df2531]/5' 
                    : 'border-white/20 hover:border-white/40 bg-white/5'
                }`}
              >
                {previewUrl ? (
                  <div className="relative">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-h-48 mx-auto rounded-lg object-contain"
                    />
                    <div className="mt-4 flex items-center justify-center gap-2 text-green-400">
                      <Check size={18} />
                      <span className="text-sm font-medium">{selectedFile?.name}</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload size={48} weight="duotone" className="text-white/30 mx-auto mb-4" />
                    <p className="text-white/60 mb-2">Click to select a file</p>
                    <p className="text-white/30 text-sm">Max 10MB • Images & Videos</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Premium Options */}
              {isPremium && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Lock size={18} className="text-amber-400" />
                      <span className="text-white font-medium">Unlock Price</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={unlockPrice}
                        onChange={(e) => setUnlockPrice(e.target.value)}
                        min="10"
                        max="1000"
                        className="w-20 px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-center focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-white/60 text-sm">coins</span>
                    </div>
                  </div>
                  <p className="text-amber-400/70 text-xs">
                    Clients will pay this amount to view this content
                  </p>
                </div>
              )}

              {/* Content Type Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  {isPremium ? (
                    <Crown size={20} weight="fill" className="text-amber-400" />
                  ) : (
                    <Eye size={20} className="text-green-400" />
                  )}
                  <div>
                    <p className="text-white font-medium">
                      {isPremium ? 'Premium Content' : 'Free Content'}
                    </p>
                    <p className="text-white/50 text-xs">
                      {isPremium ? 'Requires coins to unlock' : 'Visible to all visitors'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPremium(!isPremium)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    isPremium ? 'bg-amber-500' : 'bg-white/20'
                  }`}
                >
                  <span 
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      isPremium ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10">
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className={`w-full font-bold py-4 rounded-xl disabled:opacity-50 ${
                  isPremium 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                    : 'bg-[#df2531] hover:bg-[#c41f2a] text-white'
                }`}
              >
                {uploading ? (
                  <SpinnerGap size={20} className="animate-spin" />
                ) : (
                  <>
                    <Upload size={20} className="mr-2" />
                    Upload {isPremium ? 'Premium' : 'Free'} Content
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
