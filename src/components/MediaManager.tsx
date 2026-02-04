
'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Plus, Lock, Eye, FunnelSimple, GridFour, List, Crown, Image as ImageIcon
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { TalentMedia, MediaTab, SortOption, FilterOption, ViewMode } from './media/types'
import { MediaFilterPanel } from './media/MediaFilterPanel'
import { MediaGallery } from './media/MediaGallery'
import { MediaUploadModal } from './media/MediaUploadModal'

interface MediaManagerProps {
    talentId: string
    media: TalentMedia[]
    onRefresh: () => void
}

export function MediaManager({ talentId, media, onRefresh }: MediaManagerProps) {
    const supabase = createClient()
    const [activeTab, setActiveTab] = useState<MediaTab>('free')
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Sorting and filtering states
    const [sortBy, setSortBy] = useState<SortOption>('newest')
    const [filterBy, setFilterBy] = useState<FilterOption>('all')
    const [viewMode, setViewMode] = useState<ViewMode>('grid')
    const [showFilters, setShowFilters] = useState(false)

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
                        .remove([pathMatch[1]!])

                    if (storageError) {
                        console.warn('[MediaManager] Failed to delete from storage:', storageError)
                    }
                } catch (storageErr) {
                    console.warn('[MediaManager] Storage deletion error:', storageErr)
                }
            }

            onRefresh()

        } catch (err) {
            console.error('[MediaManager] Delete error:', err)
            // Ideally show toast or alert here
            alert('Failed to delete media. Please try again.')
        } finally {
            setDeletingId(null)
        }
    }

    const openUploadModal = () => {
        setShowUploadModal(true)
    }

    return (
        <div className="space-y-4" data-testid="media-manager">
            {/* Header Section */}
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
                        onClick={openUploadModal}
                        data-testid="upload-media-button"
                        aria-label={`Upload ${activeTab === 'premium' ? 'premium' : 'free'} content`}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#df2531] text-white text-sm font-medium hover:bg-[#df2531]/80 transition-colors focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black"
                    >
                        <Plus size={18} weight="duotone" aria-hidden="true" />
                        Upload {activeTab === 'premium' ? 'Premium' : 'Free'}
                    </button>
                </div>
            </div>

            {/* Tab Headers */}
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

            {/* Tab Description */}
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

            {/* Filter Panel */}
            <MediaFilterPanel
                show={showFilters}
                onClose={() => setShowFilters(false)}
                sortBy={sortBy}
                onSortChange={setSortBy}
                filterBy={filterBy}
                onFilterChange={setFilterBy}
            />

            {/* Media Gallery / Empty State */}
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
                        onClick={openUploadModal}
                        className="bg-[#df2531] hover:bg-[#c41f2a] text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-[#df2531]/20 hover:shadow-[#df2531]/30 transition-all"
                        aria-label={`Upload your first ${activeTab === 'premium' ? 'premium' : 'free'} content`}
                    >
                        <Plus size={20} weight="duotone" className="mr-2" aria-hidden="true" />
                        Upload First {activeTab === 'premium' ? 'Premium' : ''} Content
                    </Button>
                </div>
            ) : (
                <MediaGallery
                    items={currentMedia}
                    viewMode={viewMode}
                    deletingId={deletingId}
                    onDelete={handleDelete}
                />
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <MediaUploadModal
                    talentId={talentId}
                    initialIsPremium={activeTab === 'premium'}
                    onClose={() => setShowUploadModal(false)}
                    onSuccess={() => {
                        onRefresh()
                        setShowUploadModal(false)
                    }}
                />
            )}
        </div>
    )
}
