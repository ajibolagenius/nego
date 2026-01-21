'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
    CheckCircle, XCircle, Flag, Eye, User, Calendar,
    Funnel, X, VideoCamera, Image as ImageIcon, ShieldCheck, ArrowCounterClockwise
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Media } from '@/types/database'
import { useRouter } from 'next/navigation'

interface ContentModerationClientProps {
    pendingMedia: Media[]
    flaggedMedia: Media[]
    allMedia: Media[]
}

type FilterType = 'all' | 'pending' | 'approved' | 'rejected' | 'flagged'

interface UndoAction {
    id: string
    type: 'moderate' | 'flag' | 'unflag' | 'suspend' | 'unsuspend'
    mediaId?: string
    userId?: string
    previousStatus?: string | null
    previousFlagged?: boolean
    previousFlaggedReason?: string | null
    previousSuspended?: boolean
    timestamp: number
}

export function ContentModerationClient({
    pendingMedia,
    flaggedMedia,
    allMedia
}: ContentModerationClientProps) {
    const router = useRouter()
    const supabase = createClient()
    const [filter, setFilter] = useState<FilterType>('pending')
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [moderationNotes, setModerationNotes] = useState('')
    const [undoActions, setUndoActions] = useState<UndoAction[]>([])

    const filteredMedia = useMemo(() => {
        switch (filter) {
            case 'pending':
                return pendingMedia
            case 'flagged':
                return flaggedMedia
            case 'approved':
                return allMedia.filter(m => m.moderation_status === 'approved')
            case 'rejected':
                return allMedia.filter(m => m.moderation_status === 'rejected')
            default:
                return allMedia
        }
    }, [filter, pendingMedia, flaggedMedia, allMedia])

    const handleModerate = async (mediaId: string, status: 'approved' | 'rejected') => {
        setIsProcessing(true)
        try {
            // Get current state before update
            const media = allMedia.find(m => m.id === mediaId)
            const previousStatus = media?.moderation_status || null

            const { error } = await supabase
                .from('media')
                .update({
                    moderation_status: status,
                    moderation_notes: moderationNotes || null,
                    moderated_at: new Date().toISOString()
                })
                .eq('id', mediaId)

            if (error) throw error

            // Store undo action
            const undoAction: UndoAction = {
                id: `moderate-${mediaId}-${Date.now()}`,
                type: 'moderate',
                mediaId,
                previousStatus,
                timestamp: Date.now()
            }
            setUndoActions(prev => [undoAction, ...prev.slice(0, 9)]) // Keep last 10 actions

            toast.success(`Media ${status === 'approved' ? 'Approved' : 'Rejected'}`, {
                action: {
                    label: 'Undo',
                    onClick: () => handleUndo(undoAction)
                },
                duration: 5000
            })
            setShowDetailModal(false)
            setModerationNotes('')
            router.refresh()
        } catch (error) {
            console.error('Moderation error:', error)
            toast.error('Failed to moderate content')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleFlag = async (mediaId: string, reason: string) => {
        setIsProcessing(true)
        try {
            // Get current state before update
            const media = allMedia.find(m => m.id === mediaId)
            const previousFlagged = media?.flagged || false
            const previousFlaggedReason = media?.flagged_reason || null

            const { error } = await supabase
                .from('media')
                .update({
                    flagged: true,
                    flagged_reason: reason
                })
                .eq('id', mediaId)

            if (error) throw error

            // Store undo action
            const undoAction: UndoAction = {
                id: `flag-${mediaId}-${Date.now()}`,
                type: 'flag',
                mediaId,
                previousFlagged,
                previousFlaggedReason,
                timestamp: Date.now()
            }
            setUndoActions(prev => [undoAction, ...prev.slice(0, 9)])

            toast.success('Media flagged', {
                action: {
                    label: 'Undo',
                    onClick: () => handleUndo(undoAction)
                },
                duration: 5000
            })
            router.refresh()
        } catch (error) {
            console.error('Flag error:', error)
            toast.error('Failed to flag content')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleUnflag = async (mediaId: string) => {
        setIsProcessing(true)
        try {
            // Get current state before update
            const media = allMedia.find(m => m.id === mediaId)
            const previousFlagged = media?.flagged || false
            const previousFlaggedReason = media?.flagged_reason || null

            const { error } = await supabase
                .from('media')
                .update({
                    flagged: false,
                    flagged_reason: null
                })
                .eq('id', mediaId)

            if (error) throw error

            // Store undo action
            const undoAction: UndoAction = {
                id: `unflag-${mediaId}-${Date.now()}`,
                type: 'unflag',
                mediaId,
                previousFlagged,
                previousFlaggedReason,
                timestamp: Date.now()
            }
            setUndoActions(prev => [undoAction, ...prev.slice(0, 9)])

            toast.success('Flag removed', {
                action: {
                    label: 'Undo',
                    onClick: () => handleUndo(undoAction)
                },
                duration: 5000
            })
            router.refresh()
        } catch (error) {
            console.error('Unflag error:', error)
            toast.error('Failed to remove flag')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleSuspendUser = async (userId: string, reason: string) => {
        setIsProcessing(true)
        try {
            // Get current state before update
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_suspended')
                .eq('id', userId)
                .single()
            
            const previousSuspended = profile?.is_suspended || false

            const { error } = await supabase
                .from('profiles')
                .update({
                    is_suspended: true,
                    suspension_reason: reason,
                    suspended_at: new Date().toISOString()
                })
                .eq('id', userId)

            if (error) throw error

            // Store undo action
            const undoAction: UndoAction = {
                id: `suspend-${userId}-${Date.now()}`,
                type: 'suspend',
                userId,
                previousSuspended,
                timestamp: Date.now()
            }
            setUndoActions(prev => [undoAction, ...prev.slice(0, 9)])

            toast.success('User suspended', {
                action: {
                    label: 'Undo',
                    onClick: () => handleUndo(undoAction)
                },
                duration: 5000
            })
            router.refresh()
        } catch (error) {
            console.error('Suspend error:', error)
            toast.error('Failed to suspend user')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleUndo = async (action: UndoAction) => {
        setIsProcessing(true)
        try {
            if (action.type === 'moderate' && action.mediaId) {
                // Restore previous moderation status
                const { error } = await supabase
                    .from('media')
                    .update({
                        moderation_status: action.previousStatus as 'approved' | 'rejected' | 'pending' | null,
                        moderation_notes: null,
                        moderated_at: null
                    })
                    .eq('id', action.mediaId)

                if (error) throw error
                toast.success('Moderation action undone')
            } else if (action.type === 'flag' && action.mediaId) {
                // Restore previous flag state
                const { error } = await supabase
                    .from('media')
                    .update({
                        flagged: action.previousFlagged || false,
                        flagged_reason: action.previousFlaggedReason || null
                    })
                    .eq('id', action.mediaId)

                if (error) throw error
                toast.success('Flag action undone')
            } else if (action.type === 'unflag' && action.mediaId) {
                // Restore flag
                const { error } = await supabase
                    .from('media')
                    .update({
                        flagged: action.previousFlagged || true,
                        flagged_reason: action.previousFlaggedReason || 'Previously flagged'
                    })
                    .eq('id', action.mediaId)

                if (error) throw error
                toast.success('Unflag action undone')
            } else if (action.type === 'suspend' && action.userId) {
                // Restore previous suspension state
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        is_suspended: action.previousSuspended || false,
                        suspension_reason: null,
                        suspended_at: null
                    })
                    .eq('id', action.userId)

                if (error) throw error
                toast.success('Suspension undone')
            }

            // Remove undo action from list
            setUndoActions(prev => prev.filter(a => a.id !== action.id))
            router.refresh()
        } catch (error) {
            console.error('Undo error:', error)
            toast.error('Failed to undo action')
        } finally {
            setIsProcessing(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Content Moderation</h1>
                    <p className="text-white/60">Review and moderate talent media content</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {[
                        { value: 'pending', label: 'Pending', count: pendingMedia.length },
                        { value: 'flagged', label: 'Flagged', count: flaggedMedia.length },
                        { value: 'approved', label: 'Approved', count: allMedia.filter(m => m.moderation_status === 'approved').length },
                        { value: 'rejected', label: 'Rejected', count: allMedia.filter(m => m.moderation_status === 'rejected').length },
                        { value: 'all', label: 'All', count: allMedia.length },
                    ].map(option => (
                        <button
                            key={option.value}
                            onClick={() => setFilter(option.value as FilterType)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                filter === option.value
                                    ? 'bg-[#df2531] text-white'
                                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                            }`}
                        >
                            {option.label}
                            {option.count > 0 && (
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                                    filter === option.value ? 'bg-white/20' : 'bg-[#df2531]/20 text-[#df2531]'
                                }`}>
                                    {option.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Media Grid */}
                {filteredMedia.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-white/50 text-lg">No media found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredMedia.map((media) => (
                            <div
                                key={media.id}
                                className="bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:border-[#df2531]/30 transition-all cursor-pointer"
                                onClick={() => {
                                    setSelectedMedia(media)
                                    setShowDetailModal(true)
                                }}
                            >
                                <div className="aspect-square relative bg-black/20">
                                    {media.type === 'image' ? (
                                        <Image
                                            src={media.url}
                                            alt="Media"
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <VideoCamera size={48} className="text-white/40" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        {media.flagged && (
                                            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">
                                                Flagged
                                            </span>
                                        )}
                                        {media.moderation_status === 'pending' && (
                                            <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/30">
                                                Pending
                                            </span>
                                        )}
                                        {media.moderation_status === 'approved' && (
                                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                                                Approved
                                            </span>
                                        )}
                                        {media.moderation_status === 'rejected' && (
                                            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">
                                                Rejected
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        {media.talent?.avatar_url ? (
                                            <Image
                                                src={media.talent.avatar_url}
                                                alt={media.talent.display_name || 'Talent'}
                                                width={24}
                                                height={24}
                                                className="rounded-full"
                                            />
                                        ) : (
                                            <User size={24} className="text-white/40" />
                                        )}
                                        <p className="text-white text-sm font-medium truncate">
                                            {media.talent?.display_name || 'Unknown'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/40 text-xs">
                                        <Calendar size={12} />
                                        <span>{formatDate(media.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedMedia && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">Media Details</h2>
                                <button
                                    onClick={() => {
                                        setShowDetailModal(false)
                                        setModerationNotes('')
                                    }}
                                    className="text-white/60 hover:text-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <div className="aspect-square relative bg-black/20 rounded-xl overflow-hidden mb-4">
                                        {selectedMedia.type === 'image' ? (
                                            <Image
                                                src={selectedMedia.url}
                                                alt="Media"
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 100vw, 50vw"
                                            />
                                        ) : (
                                            <video
                                                src={selectedMedia.url}
                                                controls
                                                className="w-full h-full"
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-white font-semibold mb-2">Talent Information</h3>
                                        <div className="bg-white/5 rounded-lg p-4 space-y-2">
                                            <div className="flex items-center gap-2">
                                                {selectedMedia.talent?.avatar_url ? (
                                                    <Image
                                                        src={selectedMedia.talent.avatar_url}
                                                        alt={selectedMedia.talent.display_name || 'Talent'}
                                                        width={40}
                                                        height={40}
                                                        className="rounded-full"
                                                    />
                                                ) : (
                                                    <User size={40} className="text-white/40" />
                                                )}
                                                <div>
                                                    <p className="text-white font-medium">
                                                        {selectedMedia.talent?.display_name || 'Unknown'}
                                                    </p>
                                                    <p className="text-white/60 text-sm">
                                                        @{selectedMedia.talent?.username || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-white font-semibold mb-2">Media Information</h3>
                                        <div className="bg-white/5 rounded-lg p-4 space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-white/60">Type:</span>
                                                <span className="text-white capitalize">{selectedMedia.type}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/60">Premium:</span>
                                                <span className="text-white">
                                                    {selectedMedia.is_premium ? 'Yes' : 'No'}
                                                </span>
                                            </div>
                                            {selectedMedia.is_premium && (
                                                <div className="flex justify-between">
                                                    <span className="text-white/60">Unlock Price:</span>
                                                    <span className="text-white">{selectedMedia.unlock_price} coins</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between">
                                                <span className="text-white/60">Uploaded:</span>
                                                <span className="text-white">{formatDate(selectedMedia.created_at)}</span>
                                            </div>
                                            {selectedMedia.moderation_status && (
                                                <div className="flex justify-between">
                                                    <span className="text-white/60">Status:</span>
                                                    <span className={`capitalize ${
                                                        selectedMedia.moderation_status === 'approved' ? 'text-green-400' :
                                                        selectedMedia.moderation_status === 'rejected' ? 'text-red-400' :
                                                        'text-amber-400'
                                                    }`}>
                                                        {selectedMedia.moderation_status}
                                                    </span>
                                                </div>
                                            )}
                                            {selectedMedia.flagged && selectedMedia.flagged_reason && (
                                                <div className="mt-2 p-2 bg-red-500/10 rounded border border-red-500/30">
                                                    <p className="text-red-400 text-xs">
                                                        <strong>Flagged:</strong> {selectedMedia.flagged_reason}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Moderation Actions */}
                            <div className="border-t border-white/10 pt-6 space-y-4">
                                <div>
                                    <label className="block text-white font-medium mb-2">Moderation Notes (Optional)</label>
                                    <textarea
                                        value={moderationNotes}
                                        onChange={(e) => setModerationNotes(e.target.value)}
                                        placeholder="Add notes about this moderation decision..."
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    {selectedMedia.moderation_status !== 'approved' && (
                                        <Button
                                            onClick={() => handleModerate(selectedMedia.id, 'approved')}
                                            disabled={isProcessing}
                                            className="bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30"
                                        >
                                            <CheckCircle size={18} />
                                            Approve
                                        </Button>
                                    )}
                                    {selectedMedia.moderation_status !== 'rejected' && (
                                        <Button
                                            onClick={() => handleModerate(selectedMedia.id, 'rejected')}
                                            disabled={isProcessing}
                                            className="bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
                                        >
                                            <XCircle size={18} />
                                            Reject
                                        </Button>
                                    )}
                                    {!selectedMedia.flagged && (
                                        <Button
                                            onClick={() => handleFlag(selectedMedia.id, 'Inappropriate content')}
                                            disabled={isProcessing}
                                            variant="outline"
                                            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                                        >
                                            <Flag size={18} />
                                            Flag
                                        </Button>
                                    )}
                                    {selectedMedia.flagged && (
                                        <Button
                                            onClick={() => handleUnflag(selectedMedia.id)}
                                            disabled={isProcessing}
                                            variant="outline"
                                            className="border-white/10 text-white/60 hover:bg-white/10"
                                        >
                                            Remove Flag
                                        </Button>
                                    )}
                                    {selectedMedia.talent && !selectedMedia.talent.is_suspended && (
                                        <Button
                                            onClick={() => {
                                                if (confirm('Suspend this user? They will not be able to use the platform.')) {
                                                    handleSuspendUser(selectedMedia.talent!.id, 'Content violation')
                                                }
                                            }}
                                            disabled={isProcessing}
                                            variant="outline"
                                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                        >
                                            <ShieldCheck size={18} />
                                            Suspend User
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
