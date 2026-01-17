'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
    CheckCircle,
    XCircle,
    Clock,
    Phone,
    MapPin,
    User,
    Eye,
    X,
    Warning,
    CaretLeft,
    CaretRight,
    MagnifyingGlass,
    Funnel,
    ArrowClockwise
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
import { exportVerifications } from '@/lib/admin/export-utils'
import { Download, Info } from '@phosphor-icons/react'
import type { VerificationWithBooking } from '@/types/admin'
import { Tooltip } from '@/components/admin/Tooltip'

interface VerificationsClientProps {
    verifications: VerificationWithBooking[]
}


export function VerificationsClient({ verifications: initialVerifications }: VerificationsClientProps) {
    const router = useRouter()
    const supabase = createClient()
    const [verifications, setVerifications] = useState<VerificationWithBooking[]>(initialVerifications)
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedVerification, setSelectedVerification] = useState<VerificationWithBooking | null>(null)
    const [imageZoomed, setImageZoomed] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [adminNotes, setAdminNotes] = useState('')
    const [showConfirmApprove, setShowConfirmApprove] = useState(false)
    const [showConfirmReject, setShowConfirmReject] = useState(false)
    const verificationChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

    // Debug logging on mount
    useEffect(() => {
        console.log('[VerificationsClient] Initial verifications:', initialVerifications.length)
        console.log('[VerificationsClient] Initial verifications data:', initialVerifications)
        if (initialVerifications.length === 0) {
            console.warn('[VerificationsClient] No verifications received from server')
        }
    }, [initialVerifications])

    // Function to refresh verifications
    const refreshVerifications = useCallback(async () => {
        try {
            console.log('[Verifications] Refreshing verifications...')
            const { data: updatedVerifications, error } = await supabase
                .from('verifications')
                .select(`
                    booking_id,
                    selfie_url,
                    full_name,
                    phone,
                    gps_coords,
                    status,
                    admin_notes,
                    created_at,
                    booking:bookings (
                        id,
                        total_price,
                        status,
                        created_at,
                        client:profiles!bookings_client_id_fkey (
                            id,
                            display_name,
                            email:full_name,
                            avatar_url
                        ),
                        talent:profiles!bookings_talent_id_fkey (
                            id,
                            display_name
                        )
                    )
                `)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('[Verifications] Error fetching verifications:', error)
                console.error('[Verifications] Error details:', JSON.stringify(error, null, 2))
                toast.error('Failed to refresh verifications', {
                    description: error.message || 'Unknown error occurred'
                })
                return
            }

            console.log('[Verifications] Raw verifications from DB:', updatedVerifications?.length || 0)

            if (updatedVerifications) {
                const transformed = updatedVerifications.map(v => ({
                    ...v,
                    id: v.booking_id,
                })) as VerificationWithBooking[]
                setVerifications(transformed)
                console.log('[Verifications] Refreshed:', transformed.length, 'verifications')
                console.log('[Verifications] Pending count:', transformed.filter(v => v.status === 'pending').length)

                if (transformed.length === 0) {
                    console.warn('[Verifications] No verifications found in database')
                }
            } else {
                console.warn('[Verifications] No verifications data returned')
                setVerifications([])
            }
        } catch (error) {
            console.error('[Verifications] Error refreshing:', error)
            toast.error('Failed to refresh verifications', {
                description: error instanceof Error ? error.message : 'Unknown error'
            })
        }
    }, [supabase])

    // Real-time subscription for verifications
    useEffect(() => {
        // Cleanup existing channel
        if (verificationChannelRef.current) {
            supabase.removeChannel(verificationChannelRef.current)
        }

        const verificationChannel = supabase
            .channel('admin-verifications', {
                config: {
                    broadcast: { self: false }
                }
            })
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'verifications',
                },
                async (payload) => {
                    console.log('[Verifications] Real-time change:', payload.eventType, payload.new)
                    // Refresh verifications when changes occur
                    await refreshVerifications()
                }
            )
            .subscribe((status) => {
                console.log('[Verifications] Channel subscription status:', status)
                if (status === 'SUBSCRIBED') {
                    console.log('[Verifications] Successfully subscribed to real-time updates')
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('[Verifications] Channel subscription error')
                    toast.error('Real-time updates unavailable', {
                        description: 'Please refresh the page manually to see updates.'
                    })
                }
            })

        verificationChannelRef.current = verificationChannel

        return () => {
            if (verificationChannelRef.current) {
                supabase.removeChannel(verificationChannelRef.current)
                verificationChannelRef.current = null
            }
        }
    }, [supabase, refreshVerifications])

    const filteredVerifications = verifications.filter((v) => {
        // Filter by status
        if (filter !== 'all' && v.status !== filter) return false

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            const name = (v.full_name || v.booking?.client?.display_name || '').toLowerCase()
            const phone = (v.phone || '').toLowerCase()
            const bookingId = v.booking_id.toLowerCase()

            return name.includes(query) || phone.includes(query) || bookingId.includes(query)
        }

        return true
    })

    const pendingCount = verifications.filter((v) => v.status === 'pending').length

    // Pagination
    const {
        currentData: paginatedVerifications,
        currentPage,
        totalPages,
        totalItems,
        goToPage,
        nextPage,
        previousPage,
        canGoNext,
        canGoPrevious,
        setItemsPerPage,
    } = usePagination({
        data: filteredVerifications,
        itemsPerPage: 10,
    })

    const handleExport = () => {
        exportVerifications(verifications)
        toast.success('Export Started', {
            description: 'Verifications data is being downloaded as CSV.'
        })
    }

    const handleApprove = async (verification: VerificationWithBooking) => {
        setIsProcessing(true)

        // Optimistic update: Update UI immediately
        const previousVerifications = [...verifications]
        setVerifications(prev => prev.map(v =>
            v.id === verification.id
                ? { ...v, status: 'approved' as const, admin_notes: adminNotes || null }
                : v
        ))

        try {
            const response = await fetch(`/api/admin/verifications/${verification.booking_id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminNotes: adminNotes || null }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to approve verification')
            }

            setSelectedVerification(null)
            setAdminNotes('')
            setShowConfirmApprove(false)

            toast.success('Verification Approved', {
                description: `Client verification has been approved and booking is now confirmed.`
            })

            router.refresh()
        } catch (error) {
            // Revert optimistic update on error
            setVerifications(previousVerifications)

            console.error('Error approving verification:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to approve verification. Please try again.'
            toast.error('Approval Failed', {
                description: errorMessage
            })
        } finally {
            setIsProcessing(false)
        }
    }

    const handleReject = async (verification: VerificationWithBooking) => {
        if (!adminNotes.trim()) {
            toast.error('Reason Required', {
                description: 'Please provide a reason for rejection before proceeding.'
            })
            return
        }

        setIsProcessing(true)

        // Optimistic update: Update UI immediately
        const previousVerifications = [...verifications]
        setVerifications(prev => prev.map(v =>
            v.id === verification.id
                ? { ...v, status: 'rejected' as const, admin_notes: adminNotes }
                : v
        ))

        try {
            const response = await fetch(`/api/admin/verifications/${verification.booking_id}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminNotes }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to reject verification')
            }

            setSelectedVerification(null)
            setAdminNotes('')
            setShowConfirmReject(false)

            toast.success('Verification Rejected', {
                description: `Client verification has been rejected. ${data.refundAmount ? `${data.refundAmount.toLocaleString()} coins have been refunded to the client.` : ''}`
            })

            router.refresh()
        } catch (error) {
            // Revert optimistic update on error
            setVerifications(previousVerifications)

            console.error('Error rejecting verification:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to reject verification. Please try again.'
            toast.error('Rejection Failed', {
                description: errorMessage
            })
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
            minute: '2-digit',
        })
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Verifications</h1>
                    <div className="flex items-center gap-2">
                        <p className="text-white/60 text-sm sm:text-base">
                            Review and approve client identity verifications
                            {pendingCount > 0 && (
                                <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-sm">
                                    {pendingCount} pending
                                </span>
                            )}
                        </p>
                        <Tooltip content="Verifications require admin review before bookings can be confirmed. Rejected verifications will automatically refund the client.">
                            <Info size={16} className="text-white/40 hover:text-white/60 cursor-help" />
                        </Tooltip>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={refreshVerifications}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black"
                        aria-label="Refresh verifications"
                    >
                        <ArrowClockwise size={18} aria-hidden="true" />
                        <span className="text-sm font-medium hidden sm:inline">Refresh</span>
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black"
                        aria-label="Export verifications to CSV"
                    >
                        <Download size={18} aria-hidden="true" />
                        <span className="text-sm font-medium hidden sm:inline">Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-4 mb-6">
                {/* Search Bar */}
                <div className="relative">
                    <MagnifyingGlass
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                        size={18}
                        aria-hidden="true"
                    />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, phone, or booking ID..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:border-[#df2531]/50 transition-colors"
                        aria-label="Search verifications"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#df2531] rounded p-1"
                            aria-label="Clear search"
                        >
                            <X size={18} aria-hidden="true" />
                        </button>
                    )}
                </div>

                {/* Status Filters */}
                <div className="flex flex-wrap gap-2">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black ${filter === status
                                ? 'bg-[#df2531] text-white'
                                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                }`}
                            aria-label={`Filter by ${status} status`}
                            aria-pressed={filter === status}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                            {status === 'pending' && pendingCount > 0 && (
                                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Verifications List */}
            {filteredVerifications.length === 0 ? (
                <EmptyState
                    icon={searchQuery ? MagnifyingGlass : CheckCircle}
                    title={searchQuery ? 'No results found' : 'No verifications found'}
                    description={
                        searchQuery
                            ? `No verifications match "${searchQuery}". Try adjusting your search terms.`
                            : filter === 'pending'
                                ? 'All verifications have been reviewed. Great work!'
                                : 'No verifications match this filter.'
                    }
                    size="md"
                />
            ) : (
                <>
                    <div className="space-y-3 sm:space-y-4">
                        {paginatedVerifications.map((verification) => {
                            return (
                                <div
                                    key={verification.id}
                                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                                >
                                    {/* Selfie Thumbnail */}
                                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-white/10 shrink-0">
                                        {verification.selfie_url ? (
                                            <Image
                                                src={verification.selfie_url}
                                                alt="Selfie"
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User size={20} className="text-white/30 sm:w-6 sm:h-6" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <p className="text-white font-medium truncate">
                                                {verification.full_name || verification.booking?.client?.display_name || 'Unknown'}
                                            </p>
                                            <StatusBadge status={verification.status} size="sm" />
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-white/40 text-xs sm:text-sm">
                                            {verification.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone size={12} />
                                                    {verification.phone}
                                                </span>
                                            )}
                                            <span className="hidden sm:inline">Booking #{verification.booking_id.slice(0, 8)}</span>
                                            <span>{formatDate(verification.created_at)}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedVerification(verification)
                                                setAdminNotes('')
                                            }}
                                            className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black"
                                            aria-label={`Review verification for ${verification.full_name || verification.booking?.client?.display_name || 'client'}`}
                                        >
                                            <Eye size={16} className="mr-1" aria-hidden="true" />
                                            Review
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            itemsPerPage={10}
                            onPageChange={goToPage}
                            onItemsPerPageChange={setItemsPerPage}
                        />
                    )}
                </>
            )}

            {/* Review Modal */}
            {selectedVerification && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="verification-modal-title"
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            setSelectedVerification(null)
                            setImageZoomed(false)
                        }
                    }}
                >
                    <div className="bg-[#111] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[90vh] overflow-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 sticky top-0 bg-[#111] z-10">
                            <h3 id="verification-modal-title" className="text-lg sm:text-xl font-bold text-white">Review Verification</h3>
                            <button
                                onClick={() => {
                                    setSelectedVerification(null)
                                    setImageZoomed(false)
                                }}
                                className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-[#111]"
                                aria-label="Close modal"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                            {/* Selfie */}
                            <div>
                                <p className="text-white/60 text-sm mb-2">Selfie</p>
                                <div className="relative aspect-square max-w-[200px] sm:max-w-xs rounded-2xl overflow-hidden bg-white/5 mx-auto sm:mx-0">
                                    {selectedVerification.selfie_url ? (
                                        <>
                                            {!imageZoomed ? (
                                                <div className="relative w-full h-full group">
                                                    <Image
                                                        src={selectedVerification.selfie_url}
                                                        alt="Verification Selfie"
                                                        fill
                                                        className="object-cover cursor-zoom-in transition-transform group-hover:scale-105"
                                                        onClick={() => setImageZoomed(true)}
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                        <span className="text-white/0 group-hover:text-white/80 text-xs font-medium transition-colors">
                                                            Click to zoom
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4"
                                                    onClick={() => setImageZoomed(false)}
                                                    role="button"
                                                    tabIndex={0}
                                                    aria-label="Close zoomed image"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Escape' || e.key === 'Enter') {
                                                            setImageZoomed(false)
                                                        }
                                                    }}
                                                >
                                                    <div className="relative max-w-full max-h-full">
                                                        <Image
                                                            src={selectedVerification.selfie_url}
                                                            alt="Verification Selfie - Zoomed"
                                                            width={1200}
                                                            height={1200}
                                                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <button
                                                            onClick={() => setImageZoomed(false)}
                                                            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/50"
                                                            aria-label="Close zoom"
                                                        >
                                                            <X size={24} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User size={48} className="text-white/30" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="p-4 rounded-xl bg-white/5">
                                    <p className="text-white/40 text-xs mb-1">Full Name</p>
                                    <p className="text-white font-medium">
                                        {selectedVerification.full_name || 'Not provided'}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5">
                                    <p className="text-white/40 text-xs mb-1">Phone Number</p>
                                    <p className="text-white font-medium">
                                        {selectedVerification.phone || 'Not provided'}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5">
                                    <p className="text-white/40 text-xs mb-1">GPS Coordinates</p>
                                    <p className="text-white font-medium text-sm">
                                        {selectedVerification.gps_coords || 'Not provided'}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5">
                                    <p className="text-white/40 text-xs mb-1">Submitted</p>
                                    <p className="text-white font-medium">
                                        {formatDate(selectedVerification.created_at)}
                                    </p>
                                </div>
                            </div>

                            {/* Booking Info */}
                            {selectedVerification.booking && (
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <p className="text-white/40 text-xs mb-2">Booking Details</p>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">
                                                {selectedVerification.booking.talent?.display_name || 'Unknown Talent'}
                                            </p>
                                            <p className="text-white/40 text-sm">
                                                {selectedVerification.booking.total_price} coins
                                            </p>
                                        </div>
                                        <span className="px-3 py-1 rounded-full bg-white/10 text-white/60 text-sm">
                                            {selectedVerification.booking.status}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Admin Notes */}
                            {selectedVerification.status === 'pending' && (
                                <div>
                                    <p className="text-white/60 text-sm mb-2">Admin Notes (required for rejection)</p>
                                    <textarea
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        placeholder="Add notes about this verification..."
                                        className="w-full h-24 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#df2531]/50 resize-none"
                                    />
                                </div>
                            )}

                            {/* Already Reviewed */}
                            {selectedVerification.status !== 'pending' && selectedVerification.admin_notes && (
                                <div className="p-4 rounded-xl bg-white/5">
                                    <p className="text-white/40 text-xs mb-1">Admin Notes</p>
                                    <p className="text-white">{selectedVerification.admin_notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        {selectedVerification.status === 'pending' && (
                            <>
                                <div className="flex flex-col sm:flex-row gap-3 p-4 sm:p-6 border-t border-white/10 sticky bottom-0 bg-[#111]">
                                    <Button
                                        onClick={() => setShowConfirmReject(true)}
                                        disabled={isProcessing}
                                        className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                                    >
                                        <XCircle size={18} className="mr-2" />
                                        Reject
                                    </Button>
                                    <Button
                                        onClick={() => setShowConfirmApprove(true)}
                                        disabled={isProcessing}
                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                                    >
                                        <CheckCircle size={18} className="mr-2" />
                                        Approve
                                    </Button>
                                </div>

                                {/* Confirm Approve Dialog */}
                                {selectedVerification && (
                                    <ConfirmDialog
                                        isOpen={showConfirmApprove}
                                        onClose={() => setShowConfirmApprove(false)}
                                        onConfirm={() => handleApprove(selectedVerification)}
                                        title="Confirm Approval"
                                        description="Are you sure you want to approve this verification? The booking will be confirmed and the client will be notified."
                                        confirmLabel="Confirm Approval"
                                        variant="default"
                                        isLoading={isProcessing}
                                    />
                                )}

                                {/* Confirm Reject Dialog */}
                                {selectedVerification && (
                                    <ConfirmDialog
                                        isOpen={showConfirmReject}
                                        onClose={() => setShowConfirmReject(false)}
                                        onConfirm={() => {
                                            if (!adminNotes.trim()) {
                                                toast.error('Reason Required', {
                                                    description: 'Please provide a reason for rejection before proceeding.'
                                                })
                                                return
                                            }
                                            handleReject(selectedVerification)
                                        }}
                                        title="Confirm Rejection"
                                        description="Are you sure you want to reject this verification? The booking will be cancelled and the client will receive a refund."
                                        confirmLabel="Confirm Rejection"
                                        variant="destructive"
                                        isLoading={isProcessing}
                                        warning={!adminNotes.trim() ? 'Please provide a reason for rejection in the notes field above.' : undefined}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
