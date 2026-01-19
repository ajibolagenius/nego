'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
    CheckCircle,
    XCircle,
    User,
    MagnifyingGlass,
    Funnel,
    ArrowClockwise,
    ShieldCheck,
    ShieldSlash,
    Calendar,
    MapPin,
    CurrencyDollar,
    Eye,
    X,
    PencilSimple,
    FloppyDisk
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { EmptyState } from '@/components/admin/EmptyState'
import { LoadingSpinner } from '@/components/admin/LoadingSpinner'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Pagination } from '@/components/admin/Pagination'
import { usePagination } from '@/hooks/admin/usePagination'
import type { Profile } from '@/types/database'

interface TalentsClientProps {
    talents: Profile[]
}

export function TalentsClient({ talents: initialTalents }: TalentsClientProps) {
    const router = useRouter()
    const supabase = createClient()
    const [talents, setTalents] = useState<Profile[]>(initialTalents)
    const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTalent, setSelectedTalent] = useState<Profile | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [showConfirmVerify, setShowConfirmVerify] = useState(false)
    const [showConfirmUnverify, setShowConfirmUnverify] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [adminNotes, setAdminNotes] = useState('')
    const [isEditingNotes, setIsEditingNotes] = useState(false)
    const [isSavingNotes, setIsSavingNotes] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const talentsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

    // Real-time subscription for talent updates
    useEffect(() => {
        if (talentsChannelRef.current) {
            supabase.removeChannel(talentsChannelRef.current)
        }

        const channel = supabase
            .channel('admin-talents')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'profiles',
                    filter: 'role=eq.talent'
                },
                async () => {
                    // Refetch talents
                    await refreshTalents()
                }
            )
            .subscribe()

        talentsChannelRef.current = channel

        return () => {
            if (talentsChannelRef.current) {
                supabase.removeChannel(talentsChannelRef.current)
                talentsChannelRef.current = null
            }
        }
    }, [supabase])

    const refreshTalents = useCallback(async () => {
        setIsRefreshing(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    id,
                    role,
                    username,
                    full_name,
                    display_name,
                    avatar_url,
                    location,
                    bio,
                    is_verified,
                    status,
                    starting_price,
                    admin_notes,
                    created_at,
                    updated_at
                `)
                .eq('role', 'talent')
                .order('created_at', { ascending: false })
                .limit(1000)

            if (error) throw error

            if (data) {
                setTalents(data as Profile[])
            }
        } catch (error) {
            console.error('[TalentsClient] Error refreshing talents:', error)
            toast.error('Failed to refresh talents')
        } finally {
            setIsRefreshing(false)
        }
    }, [supabase])

    // Filter and search talents
    const filteredTalents = talents.filter((talent) => {
        // Filter by verification status
        if (filter === 'verified' && !talent.is_verified) return false
        if (filter === 'unverified' && talent.is_verified) return false

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            const searchFields = [
                talent.display_name,
                talent.full_name,
                talent.username,
                talent.location,
                talent.bio
            ].filter(Boolean).join(' ').toLowerCase()

            if (!searchFields.includes(query)) return false
        }

        return true
    })

    // Pagination
    const {
        currentPage,
        totalPages,
        currentData: paginatedData,
        goToPage,
        nextPage,
        previousPage,
        setItemsPerPage
    } = usePagination({ data: filteredTalents, itemsPerPage: 20 })

    const handleViewDetails = (talent: Profile) => {
        setSelectedTalent(talent)
        setAdminNotes(talent.admin_notes || '')
        setIsEditingNotes(false)
        setShowDetailModal(true)
    }

    const handleVerify = async (talent: Profile) => {
        setSelectedTalent(talent)
        setShowConfirmVerify(true)
    }

    const handleUnverify = async (talent: Profile) => {
        setSelectedTalent(talent)
        setShowConfirmUnverify(true)
    }

    const handleSaveAdminNotes = async () => {
        if (!selectedTalent) return

        setIsSavingNotes(true)
        try {
            const response = await fetch(`/api/admin/talents/${selectedTalent.id}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminNotes: adminNotes.trim() || null })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save admin notes')
            }

            setIsEditingNotes(false)
            toast.success('Admin Notes Saved', {
                description: 'Admin notes have been updated successfully.'
            })

            await refreshTalents()
            // Update selected talent with new notes
            if (selectedTalent) {
                setSelectedTalent({ ...selectedTalent, admin_notes: adminNotes.trim() || null })
            }
        } catch (error) {
            console.error('Error saving admin notes:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to save admin notes. Please try again.'
            toast.error('Save Failed', { description: errorMessage })
        } finally {
            setIsSavingNotes(false)
        }
    }

    const confirmVerify = async () => {
        if (!selectedTalent) return

        setIsProcessing(true)
        try {
            const response = await fetch(`/api/admin/talents/${selectedTalent.id}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to verify talent')
            }

            setShowConfirmVerify(false)
            setSelectedTalent(null)

            toast.success('Talent Verified', {
                description: `${selectedTalent.display_name || selectedTalent.username || 'Talent'} has been verified successfully.`
            })

            await refreshTalents()
            router.refresh()
        } catch (error) {
            console.error('Error verifying talent:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to verify talent. Please try again.'
            toast.error('Verification Failed', { description: errorMessage })
        } finally {
            setIsProcessing(false)
        }
    }

    const confirmUnverify = async () => {
        if (!selectedTalent) return

        setIsProcessing(true)
        try {
            const response = await fetch(`/api/admin/talents/${selectedTalent.id}/unverify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to unverify talent')
            }

            setShowConfirmUnverify(false)
            setSelectedTalent(null)

            toast.success('Talent Unverified', {
                description: `${selectedTalent.display_name || selectedTalent.username || 'Talent'} verification has been removed.`
            })

            await refreshTalents()
            router.refresh()
        } catch (error) {
            console.error('Error unverifying talent:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to unverify talent. Please try again.'
            toast.error('Unverification Failed', { description: errorMessage })
        } finally {
            setIsProcessing(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Talent Management</h1>
                        <p className="text-white/60">Manage talent accounts and verification status</p>
                    </div>
                    <Button
                        onClick={refreshTalents}
                        disabled={isRefreshing}
                        variant="outline"
                        className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                    >
                        <ArrowClockwise size={18} className={isRefreshing ? 'animate-spin' : ''} />
                        Refresh
                    </Button>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <MagnifyingGlass
                            size={20}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                        />
                        <input
                            type="text"
                            placeholder="Search by name, username, location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50"
                        />
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                                filter === 'all'
                                    ? 'bg-[#df2531] text-white'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            All ({talents.length})
                        </button>
                        <button
                            onClick={() => setFilter('verified')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                                filter === 'verified'
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <CheckCircle size={16} weight="fill" />
                            Verified ({talents.filter(t => t.is_verified).length})
                        </button>
                        <button
                            onClick={() => setFilter('unverified')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                                filter === 'unverified'
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <XCircle size={16} weight="fill" />
                            Unverified ({talents.filter(t => !t.is_verified).length})
                        </button>
                    </div>
                </div>
            </div>

            {/* Talents Table */}
            {paginatedData.length === 0 ? (
                <EmptyState
                    icon={User}
                    title="No talents found"
                    description={
                        searchQuery || filter !== 'all'
                            ? 'Try adjusting your search or filter criteria'
                            : 'No talents have registered yet'
                    }
                />
            ) : (
                <>
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/5 border-b border-white/10">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                                            Talent
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                                            Username
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                                            Location
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                                            Verified
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                                            Joined
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-white/60 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {paginatedData.map((talent) => (
                                        <tr
                                            key={talent.id}
                                            className="hover:bg-white/5 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                                                        {talent.avatar_url ? (
                                                            <Image
                                                                src={talent.avatar_url}
                                                                alt={talent.display_name || talent.username || 'Talent'}
                                                                width={40}
                                                                height={40}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <User size={20} className="text-white/40" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium">
                                                            {talent.display_name || talent.full_name || 'No name'}
                                                        </p>
                                                        {talent.bio && (
                                                            <p className="text-white/40 text-sm truncate max-w-xs">
                                                                {talent.bio}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {talent.username ? (
                                                    <span className="text-white/80">@{talent.username}</span>
                                                ) : (
                                                    <span className="text-white/40 text-sm">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {talent.location ? (
                                                    <div className="flex items-center gap-1 text-white/60">
                                                        <MapPin size={14} />
                                                        <span className="text-sm">{talent.location}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-white/40 text-sm">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={talent.status} />
                                            </td>
                                            <td className="px-6 py-4">
                                                {talent.is_verified ? (
                                                    <div className="flex items-center gap-2 text-green-400">
                                                        <CheckCircle size={18} weight="fill" />
                                                        <span className="text-sm font-medium">Verified</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-amber-400">
                                                        <XCircle size={18} weight="fill" />
                                                        <span className="text-sm font-medium">Unverified</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1 text-white/60">
                                                    <Calendar size={14} />
                                                    <span className="text-sm">{formatDate(talent.created_at)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        onClick={() => handleViewDetails(talent)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                                                    >
                                                        <Eye size={16} />
                                                        View
                                                    </Button>
                                                    {talent.is_verified ? (
                                                        <Button
                                                            onClick={() => handleUnverify(talent)}
                                                            disabled={isProcessing}
                                                            variant="outline"
                                                            size="sm"
                                                            className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                                                        >
                                                            <ShieldSlash size={16} />
                                                            Unverify
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            onClick={() => handleVerify(talent)}
                                                            disabled={isProcessing}
                                                            size="sm"
                                                            className="bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30"
                                                        >
                                                            <ShieldCheck size={16} />
                                                            Verify
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-6">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={goToPage}
                                itemsPerPage={20}
                                onItemsPerPageChange={setItemsPerPage}
                                totalItems={filteredTalents.length}
                            />
                        </div>
                    )}
                </>
            )}

            {/* Talent Detail Modal */}
            {showDetailModal && selectedTalent && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="talent-modal-title"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowDetailModal(false)
                            setIsEditingNotes(false)
                        }
                    }}
                >
                    <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-[#111] z-10">
                            <h3 id="talent-modal-title" className="text-xl font-bold text-white">
                                Talent Profile Details
                            </h3>
                            <button
                                onClick={() => {
                                    setShowDetailModal(false)
                                    setIsEditingNotes(false)
                                }}
                                className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                                aria-label="Close modal"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Profile Header */}
                            <div className="flex items-start gap-4">
                                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                    {selectedTalent.avatar_url ? (
                                        <Image
                                            src={selectedTalent.avatar_url}
                                            alt={selectedTalent.display_name || selectedTalent.username || 'Talent'}
                                            width={80}
                                            height={80}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User size={40} className="text-white/40" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xl font-bold text-white mb-1">
                                        {selectedTalent.display_name || selectedTalent.full_name || 'No name'}
                                    </h4>
                                    {selectedTalent.username && (
                                        <p className="text-white/60 mb-2">@{selectedTalent.username}</p>
                                    )}
                                    <div className="flex items-center gap-4 flex-wrap">
                                        {selectedTalent.is_verified ? (
                                            <div className="flex items-center gap-2 text-green-400">
                                                <CheckCircle size={18} weight="fill" />
                                                <span className="text-sm font-medium">Verified</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-amber-400">
                                                <XCircle size={18} weight="fill" />
                                                <span className="text-sm font-medium">Unverified</span>
                                            </div>
                                        )}
                                        <StatusBadge status={selectedTalent.status} />
                                    </div>
                                </div>
                            </div>

                            {/* Profile Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-white/40 text-xs mb-1">Full Name</p>
                                    <p className="text-white">
                                        {selectedTalent.full_name || selectedTalent.display_name || '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-white/40 text-xs mb-1">Username</p>
                                    <p className="text-white">{selectedTalent.username || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-white/40 text-xs mb-1">Location</p>
                                    <div className="flex items-center gap-1 text-white">
                                        {selectedTalent.location ? (
                                            <>
                                                <MapPin size={14} />
                                                <span>{selectedTalent.location}</span>
                                            </>
                                        ) : (
                                            <span>—</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-white/40 text-xs mb-1">Starting Price</p>
                                    <p className="text-white">
                                        {selectedTalent.starting_price
                                            ? `${selectedTalent.starting_price.toLocaleString()} coins`
                                            : '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-white/40 text-xs mb-1">Joined</p>
                                    <div className="flex items-center gap-1 text-white">
                                        <Calendar size={14} />
                                        <span>{formatDate(selectedTalent.created_at)}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-white/40 text-xs mb-1">Last Updated</p>
                                    <p className="text-white">{formatDate(selectedTalent.updated_at)}</p>
                                </div>
                            </div>

                            {/* Bio */}
                            {selectedTalent.bio && (
                                <div>
                                    <p className="text-white/40 text-xs mb-2">Bio</p>
                                    <p className="text-white/80 bg-white/5 rounded-lg p-4">{selectedTalent.bio}</p>
                                </div>
                            )}

                            {/* Admin Notes */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-white/40 text-xs">Admin Notes</p>
                                    {!isEditingNotes && (
                                        <Button
                                            onClick={() => setIsEditingNotes(true)}
                                            variant="outline"
                                            size="sm"
                                            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                                        >
                                            <PencilSimple size={14} />
                                            Edit Notes
                                        </Button>
                                    )}
                                </div>
                                {isEditingNotes ? (
                                    <div className="space-y-3">
                                        <textarea
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            placeholder="Add admin notes about this talent..."
                                            className="w-full h-32 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#df2531]/50 resize-none"
                                        />
                                        <div className="flex items-center gap-2">
                                            <Button
                                                onClick={handleSaveAdminNotes}
                                                disabled={isSavingNotes}
                                                size="sm"
                                                className="bg-[#df2531] hover:bg-[#c41f2a] text-white"
                                            >
                                                <FloppyDisk size={14} />
                                                {isSavingNotes ? 'Saving...' : 'Save Notes'}
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setIsEditingNotes(false)
                                                    setAdminNotes(selectedTalent.admin_notes || '')
                                                }}
                                                variant="outline"
                                                size="sm"
                                                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white/5 rounded-lg p-4 min-h-[60px]">
                                        {selectedTalent.admin_notes ? (
                                            <p className="text-white/80 whitespace-pre-wrap">{selectedTalent.admin_notes}</p>
                                        ) : (
                                            <p className="text-white/40 italic">No admin notes yet</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                                {selectedTalent.is_verified ? (
                                    <Button
                                        onClick={() => {
                                            setShowDetailModal(false)
                                            handleUnverify(selectedTalent)
                                        }}
                                        disabled={isProcessing}
                                        variant="outline"
                                        className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                                    >
                                        <ShieldSlash size={18} />
                                        Unverify Talent
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => {
                                            setShowDetailModal(false)
                                            handleVerify(selectedTalent)
                                        }}
                                        disabled={isProcessing}
                                        className="bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30"
                                    >
                                        <ShieldCheck size={18} />
                                        Verify Talent
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Verify Dialog */}
            <ConfirmDialog
                isOpen={showConfirmVerify}
                onClose={() => {
                    setShowConfirmVerify(false)
                    setSelectedTalent(null)
                }}
                onConfirm={confirmVerify}
                title="Verify Talent"
                description={`Are you sure you want to verify ${selectedTalent?.display_name || selectedTalent?.username || 'this talent'}? This will mark their account as verified.`}
                confirmLabel="Verify"
                cancelLabel="Cancel"
                isLoading={isProcessing}
                variant="default"
            />

            {/* Confirm Unverify Dialog */}
            <ConfirmDialog
                isOpen={showConfirmUnverify}
                onClose={() => {
                    setShowConfirmUnverify(false)
                    setSelectedTalent(null)
                }}
                onConfirm={confirmUnverify}
                title="Unverify Talent"
                description={`Are you sure you want to remove verification from ${selectedTalent?.display_name || selectedTalent?.username || 'this talent'}? This will mark their account as unverified.`}
                confirmLabel="Unverify"
                cancelLabel="Cancel"
                isLoading={isProcessing}
                variant="destructive"
            />
        </div>
    )
}
