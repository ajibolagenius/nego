'use client'

import {
    CheckCircle,
    XCircle,
    User,
    MagnifyingGlass,
    ArrowClockwise,
    Trash,
    Calendar,
    MapPin,
    Eye,
    X,
    ShieldCheck,
    ShieldSlash,
    Coins
} from '@phosphor-icons/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Pagination } from '@/components/admin/Pagination'
import { Button } from '@/components/ui/button'
import { usePagination } from '@/hooks/admin/usePagination'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

function DetailItem({ label, value, icon, className = "" }: { label: string, value: string | number | React.ReactNode, icon?: React.ReactNode, className?: string }) {
    return (
        <div className={className}>
            <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-1">{label}</p>
            <div className="flex items-center gap-1.5 text-white font-medium">
                {icon}
                <span className="truncate">{value}</span>
            </div>
        </div>
    )
}

interface WalletData {
    balance: number
    escrow_balance: number
}

type ProfileWithWallet = Profile & { wallets?: WalletData[] }

interface TalentsClientProps {
    talents: ProfileWithWallet[]
}

export function TalentsClient({ talents: initialTalents }: TalentsClientProps) {
    const router = useRouter()
    const supabase = createClient()
    const [talents, setTalents] = useState<ProfileWithWallet[]>(initialTalents)
    const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTalent, setSelectedTalent] = useState<ProfileWithWallet | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [showConfirmVerify, setShowConfirmVerify] = useState(false)
    const [showConfirmUnverify, setShowConfirmUnverify] = useState(false)
    const [showConfirmDelete, setShowConfirmDelete] = useState(false)
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
                    updated_at,
                    wallets (
                        balance,
                        escrow_balance
                    )
                `)
                .eq('role', 'talent')
                .order('created_at', { ascending: false })
                .limit(1000)

            if (error) throw error

            if (data) {
                setTalents(data as unknown as ProfileWithWallet[])
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

    const {
        currentPage,
        totalPages,
        currentData: paginatedData,
        goToPage,
        nextPage: _nextPage,
        previousPage: _previousPage,
        setItemsPerPage
    } = usePagination({ data: filteredTalents, itemsPerPage: 20 })

    const handleViewDetails = (talent: ProfileWithWallet) => {
        setSelectedTalent(talent)
        setAdminNotes(talent.admin_notes || '')
        setIsEditingNotes(false)
        setShowDetailModal(true)
    }

    const handleVerify = async (talent: ProfileWithWallet) => {
        setSelectedTalent(talent)
        setShowConfirmVerify(true)
    }

    const handleUnverify = async (talent: ProfileWithWallet) => {
        setSelectedTalent(talent)
        setShowConfirmUnverify(true)
    }

    const handleDelete = (talent: ProfileWithWallet) => {
        setSelectedTalent(talent)
        setShowConfirmDelete(true)
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
    const confirmDelete = async () => {
        if (!selectedTalent) return

        setIsProcessing(true)
        try {
            const response = await fetch(`/api/admin/users/${selectedTalent.id}`, {
                method: 'DELETE',
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete talent')
            }

            setShowConfirmDelete(false)
            setSelectedTalent(null)

            toast.success('Talent Deleted', {
                description: 'The talent account has been permanently deleted.'
            })

            await refreshTalents()
            router.refresh()
        } catch (error) {
            console.error('Error deleting talent:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete talent. Please try again.'
            toast.error('Deletion Failed', { description: errorMessage })
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
            </div>

            {/* Search and Filters */}
            <div className="mb-8">
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
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === 'all'
                                    ? 'bg-[#df2531] text-white'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            All ({talents.length})
                        </button>
                        <button
                            onClick={() => setFilter('verified')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${filter === 'verified'
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <CheckCircle size={16} weight="fill" />
                            Verified ({talents.filter(t => t.is_verified).length})
                        </button>
                        <button
                            onClick={() => setFilter('unverified')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${filter === 'unverified'
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

            {/* Content Container */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                {paginatedData.length === 0 ? (
                    <div className="p-12 text-center">
                        <User size={48} className="mx-auto text-white/10 mb-4" />
                        <p className="text-white/40 italic">No talents found matching your search.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/5 border-b border-white/10">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Talent</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Username</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Location</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Verified</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Joined</th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-white/60 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {paginatedData.map((talent) => (
                                        <tr key={talent.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                                                        {talent.avatar_url ? (
                                                            <Image
                                                                src={talent.avatar_url}
                                                                alt={talent.display_name || 'Talent'}
                                                                width={40}
                                                                height={40}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <User size={20} className="text-white/40" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium group-hover:text-[#df2531] transition-colors">
                                                            {talent.display_name || talent.full_name || 'No name'}
                                                        </p>
                                                        {talent.bio && (
                                                            <p className="text-white/40 text-sm truncate max-w-xs">{talent.bio}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-white/80">@{talent.username || '—'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1 text-white/60">
                                                    <MapPin size={14} />
                                                    <span className="text-sm">{talent.location || '—'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${talent.status === 'online'
                                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                        : talent.status === 'booked'
                                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                            : 'bg-white/10 text-white/60 border border-white/10'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${talent.status === 'online' ? 'bg-green-400' :
                                                            talent.status === 'booked' ? 'bg-amber-400' : 'bg-white/40'
                                                        }`} />
                                                    {talent.status || 'Offline'}
                                                </span>
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
                                            <td className="px-6 py-4 text-white/60 text-sm">
                                                {formatDate(talent.created_at)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button onClick={() => handleViewDetails(talent)} variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/10 px-2 lg:px-3">
                                                        <Eye size={16} className="lg:mr-2" />
                                                        <span className="hidden lg:inline">View</span>
                                                    </Button>
                                                    <Button onClick={() => handleDelete(talent)} variant="outline" size="sm" className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 px-2 lg:px-3">
                                                        <Trash size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile/Tablet List View */}
                        <div className="lg:hidden divide-y divide-white/10">
                            {paginatedData.map((talent) => (
                                <div key={talent.id} className="p-4 hover:bg-white/5 transition-colors">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                                {talent.avatar_url ? (
                                                    <Image
                                                        src={talent.avatar_url}
                                                        alt={talent.display_name || 'Talent'}
                                                        width={48}
                                                        height={48}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <User size={24} className="text-white/40" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{talent.display_name || talent.full_name || 'No name'}</p>
                                                <p className="text-xs text-[#df2531]">@{talent.username || '—'}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            {talent.is_verified ? (
                                                <CheckCircle size={18} weight="fill" className="text-green-400" />
                                            ) : (
                                                <XCircle size={18} weight="fill" className="text-amber-400" />
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-4 text-[13px]">
                                        <div>
                                            <p className="text-white/40 uppercase font-bold text-[10px] mb-0.5">Location</p>
                                            <div className="flex items-center gap-1 text-white/80">
                                                <MapPin size={12} />
                                                <p className="truncate">{talent.location || '—'}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-white/40 uppercase font-bold text-[10px] mb-0.5">Status</p>
                                            <p className={`capitalize ${talent.status === 'online' ? 'text-green-400' : 'text-white/60'}`}>
                                                {talent.status || 'Offline'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button onClick={() => handleViewDetails(talent)} variant="outline" className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 h-10">
                                            <Eye size={18} className="mr-2" />
                                            Details
                                        </Button>
                                        <Button onClick={() => handleDelete(talent)} variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 w-12 h-10 p-0">
                                            <Trash size={18} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6 flex justify-center sm:justify-end">
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

            {/* Talent Detail Modal */}
            {showDetailModal && selectedTalent && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowDetailModal(false)
                            setIsEditingNotes(false)
                        }
                    }}
                >
                    <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
                        <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-[#111] z-10">
                            <h3 className="text-xl font-bold text-white">Talent Profile Details</h3>
                            <button onClick={() => { setShowDetailModal(false); setIsEditingNotes(false); }} className="text-white/60 hover:text-white transition-colors p-1">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                                <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0 border-2 border-white/5">
                                    {selectedTalent.avatar_url ? (
                                        <Image src={selectedTalent.avatar_url} alt="" width={96} height={96} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={48} className="text-white/40" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-2xl font-bold text-white mb-1">{selectedTalent.display_name || selectedTalent.full_name || 'No name'}</h4>
                                    <p className="text-[#df2531] font-medium mb-3">@{selectedTalent.username || '—'}</p>
                                    <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap">
                                        {selectedTalent.is_verified ? (
                                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-bold">
                                                <CheckCircle size={14} weight="fill" /> VERIFIED
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold">
                                                <XCircle size={14} weight="fill" /> UNVERIFIED
                                            </span>
                                        )}
                                        <span className={`px-3 py-1 rounded-full border text-xs font-bold ${selectedTalent.status === 'online' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-white/40 border-white/10'}`}>
                                            {selectedTalent.status?.toUpperCase() || 'OFFLINE'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white/5 p-6 rounded-2xl border border-white/5">
                                <DetailItem label="Full Name" value={selectedTalent.full_name || '—'} />
                                <DetailItem label="Username" value={selectedTalent.username ? `@${selectedTalent.username}` : '—'} />
                                <DetailItem label="Location" value={selectedTalent.location || '—'} icon={<MapPin size={14} />} />
                                <DetailItem label="Gender" value={selectedTalent.gender || '—'} className="capitalize" />
                                <DetailItem label="Joined" value={formatDate(selectedTalent.created_at)} icon={<Calendar size={14} />} />
                                <DetailItem label="Starting Price" value={selectedTalent.starting_price ? `${selectedTalent.starting_price.toLocaleString()} coins` : '—'} />
                                <DetailItem label="Coin Balance" value={`${selectedTalent.wallets?.[0]?.balance?.toLocaleString() || '0'} Coins`} icon={<Coins size={14} />} className="col-span-1 sm:col-span-2 bg-[#df2531]/10 border border-[#df2531]/20 p-4 rounded-xl" />
                            </div>

                            {selectedTalent.bio && (
                                <div>
                                    <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-2">About / Bio</p>
                                    <p className="text-white/80 text-sm leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5 italic">&quot;{selectedTalent.bio}&quot;</p>
                                </div>
                            )}

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Admin Internal Notes</p>
                                    {!isEditingNotes && (
                                        <button onClick={() => setIsEditingNotes(true)} className="text-[#df2531] text-xs font-bold hover:underline">EDIT</button>
                                    )}
                                </div>
                                {isEditingNotes ? (
                                    <div className="space-y-3">
                                        <textarea
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            className="w-full h-24 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#df2531]/50 text-sm resize-none"
                                            placeholder="Add internal notes..."
                                        />
                                        <div className="flex gap-2">
                                            <Button onClick={handleSaveAdminNotes} disabled={isSavingNotes} size="sm" className="bg-[#df2531] hover:bg-[#c41f2a] text-white">Save</Button>
                                            <Button onClick={() => { setIsEditingNotes(false); setAdminNotes(selectedTalent.admin_notes || ''); }} variant="ghost" size="sm" className="text-white/60 hover:text-white">Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white/5 rounded-xl p-4 min-h-[50px] border border-white/5">
                                        <p className={`text-sm ${selectedTalent.admin_notes ? 'text-white/80' : 'text-white/20 italic'}`}>
                                            {selectedTalent.admin_notes || 'No internal notes added yet...'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                                {selectedTalent.is_verified ? (
                                    <Button onClick={() => { setShowDetailModal(false); handleUnverify(selectedTalent); }} disabled={isProcessing} variant="outline" className="flex-1 bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20">
                                        <ShieldSlash size={18} className="mr-2" /> Unverify
                                    </Button>
                                ) : (
                                    <Button onClick={() => { setShowDetailModal(false); handleVerify(selectedTalent); }} disabled={isProcessing} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                                        <ShieldCheck size={18} className="mr-2" /> Verify Talent
                                    </Button>
                                )}
                                <Button onClick={() => { setShowDetailModal(false); handleDelete(selectedTalent); }} disabled={isProcessing} variant="outline" className="flex-1 bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white">
                                    <Trash size={18} className="mr-2" /> Delete Account
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Dialogs */}
            <ConfirmDialog
                isOpen={showConfirmVerify}
                onClose={() => setShowConfirmVerify(false)}
                onConfirm={confirmVerify}
                title="Verify Talent"
                description={`Are you sure you want to verify ${selectedTalent?.display_name}? This will give them a verification badge.`}
                confirmLabel="Verify User"
                variant="default"
                isLoading={isProcessing}
            />

            <ConfirmDialog
                isOpen={showConfirmUnverify}
                onClose={() => setShowConfirmUnverify(false)}
                onConfirm={confirmUnverify}
                title="Unverify Talent"
                description={`Are you sure you want to remove verification from ${selectedTalent?.display_name}?`}
                confirmLabel="Remove Verification"
                variant="destructive"
                isLoading={isProcessing}
            />

            <ConfirmDialog
                isOpen={showConfirmDelete}
                onClose={() => setShowConfirmDelete(false)}
                onConfirm={confirmDelete}
                title="Delete Talent Account"
                description={`CRITICAL: Are you sure you want to permanently delete ${selectedTalent?.display_name}'s account? This action CANNOT be undone.`}
                confirmLabel="Delete Permanently"
                variant="destructive"
                isLoading={isProcessing}
            />
        </div>
    )
}

