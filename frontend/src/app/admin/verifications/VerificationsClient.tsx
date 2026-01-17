'use client'

import { useState, useEffect, useRef } from 'react'
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
    Funnel
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
import { Download } from '@phosphor-icons/react'

interface Verification {
    id: string // This maps to booking_id from the database
    booking_id: string
    selfie_url: string | null
    full_name: string | null
    phone: string | null
    gps_coords: string | null
    status: 'pending' | 'approved' | 'rejected'
    admin_notes: string | null
    created_at: string
    booking: {
        id: string
        total_price: number
        status: string
        created_at: string
        client: {
            id: string
            display_name: string | null
            email: string | null
            avatar_url: string | null
        } | null
        talent: {
            id: string
            display_name: string | null
        } | null
    } | null
}

interface VerificationsClientProps {
    verifications: Verification[]
}


export function VerificationsClient({ verifications: initialVerifications }: VerificationsClientProps) {
    const router = useRouter()
    const supabase = createClient()
    const [verifications, setVerifications] = useState<Verification[]>(initialVerifications)
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [adminNotes, setAdminNotes] = useState('')
    const [showConfirmApprove, setShowConfirmApprove] = useState(false)
    const [showConfirmReject, setShowConfirmReject] = useState(false)
    const verificationChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

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

                    // Refetch verifications to get updated data with relations
                    const { data: updatedVerifications } = await supabase
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

                    if (updatedVerifications) {
                        const transformed = updatedVerifications.map(v => ({
                            ...v,
                            id: v.booking_id,
                        })) as Verification[]
                        setVerifications(transformed)
                    }
                }
            )
            .subscribe((status) => {
                console.log('[Verifications] Channel subscription status:', status)
            })

        verificationChannelRef.current = verificationChannel

        return () => {
            if (verificationChannelRef.current) {
                supabase.removeChannel(verificationChannelRef.current)
                verificationChannelRef.current = null
            }
        }
    }, [supabase])

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

  const handleApprove = async (verification: Verification) => {
        setIsProcessing(true)
        const supabase = createClient()

        try {
            // Update verification status
            const { error: verifyError } = await supabase
                .from('verifications')
                .update({
                    status: 'approved',
                    admin_notes: adminNotes || null,
                })
                .eq('booking_id', verification.booking_id)

            if (verifyError) {
                throw new Error(`Unable to update verification status: ${verifyError.message}`)
            }

            // Update booking status to confirmed
            const { error: bookingError } = await supabase
                .from('bookings')
                .update({ status: 'confirmed' })
                .eq('id', verification.booking_id)

            if (bookingError) {
                throw new Error(`Unable to update booking status: ${bookingError.message}`)
            }

            setSelectedVerification(null)
            setAdminNotes('')
            setShowConfirmApprove(false)

            toast.success('Verification Approved', {
                description: `Client verification has been approved and booking is now confirmed.`
            })

            router.refresh()
        } catch (error) {
            console.error('Error approving verification:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to approve verification. Please try again.'
            toast.error('Approval Failed', {
                description: errorMessage
            })
        } finally {
            setIsProcessing(false)
        }
    }

    const handleReject = async (verification: Verification) => {
        if (!adminNotes.trim()) {
            toast.error('Reason Required', {
                description: 'Please provide a reason for rejection before proceeding.'
            })
            return
        }

        setIsProcessing(true)
        const supabase = createClient()

        try {
            // Get booking details to refund
            const { data: bookingData, error: bookingFetchError } = await supabase
                .from('bookings')
                .select('id, client_id, total_price, status')
                .eq('id', verification.booking_id)
                .single()

            if (bookingFetchError) {
                throw new Error(`Unable to fetch booking details: ${bookingFetchError.message}`)
            }

            if (!bookingData) {
                throw new Error('Booking not found')
            }

            // Update verification status
            const { error: verifyError } = await supabase
                .from('verifications')
                .update({
                    status: 'rejected',
                    admin_notes: adminNotes,
                })
                .eq('booking_id', verification.booking_id)

            if (verifyError) {
                throw new Error(`Unable to update verification status: ${verifyError.message}`)
            }

            // Update booking status to cancelled
            const { error: bookingError } = await supabase
                .from('bookings')
                .update({ status: 'cancelled' })
                .eq('id', verification.booking_id)

            if (bookingError) {
                throw new Error(`Unable to update booking status: ${bookingError.message}`)
            }

            // Refund coins to client wallet
            if (bookingData.total_price > 0 && bookingData.client_id) {
                // Get current wallet balance
                const { data: walletData, error: walletFetchError } = await supabase
                    .from('wallets')
                    .select('balance')
                    .eq('user_id', bookingData.client_id)
                    .single()

                if (!walletFetchError && walletData) {
                    const currentBalance = walletData.balance || 0
                    const refundAmount = bookingData.total_price

                    // Update wallet with refund
                    const { error: walletUpdateError } = await supabase
                        .from('wallets')
                        .update({ balance: currentBalance + refundAmount })
                        .eq('user_id', bookingData.client_id)

                    if (walletUpdateError) {
                        console.error('Failed to refund wallet:', walletUpdateError)
                        // Don't throw - log error but continue
                    } else {
                        // Create refund transaction record
                        await supabase.from('transactions').insert({
                            user_id: bookingData.client_id,
                            amount: 0,
                            coins: refundAmount,
                            type: 'refund',
                            status: 'completed',
                            description: `Refund for rejected verification - Booking #${bookingData.id.slice(0, 8)}`,
                            reference_id: bookingData.id
                        })

                        // Create notification for client
                        await supabase.from('notifications').insert({
                            user_id: bookingData.client_id,
                            type: 'booking_cancelled',
                            title: 'Booking Cancelled & Refunded',
                            message: `Your booking has been cancelled due to verification rejection. ${refundAmount.toLocaleString()} coins have been refunded to your wallet.`,
                            data: { booking_id: bookingData.id, refund_amount: refundAmount }
                        })
                    }
                }
            }

            setSelectedVerification(null)
            setAdminNotes('')
            setShowConfirmReject(false)

            toast.success('Verification Rejected', {
                description: `Client verification has been rejected. ${bookingData.total_price > 0 ? `${bookingData.total_price.toLocaleString()} coins have been refunded to the client.` : ''}`
            })

            router.refresh()
        } catch (error) {
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
          <p className="text-white/60 text-sm sm:text-base">
            Review client identity verifications
            {pendingCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-sm">
                {pendingCount} pending
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
          aria-label="Export verifications to CSV"
        >
          <Download size={18} />
          <span className="text-sm font-medium">Export CSV</span>
        </button>
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
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50 transition-colors"
                        aria-label="Search verifications"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                            aria-label="Clear search"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Status Filters */}
                <div className="flex flex-wrap gap-2">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === status
                                    ? 'bg-[#df2531] text-white'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                }`}
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
                                        className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto"
                                    >
                                        <Eye size={16} className="mr-1" />
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
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#111] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[90vh] overflow-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 sticky top-0 bg-[#111] z-10">
                            <h3 className="text-lg sm:text-xl font-bold text-white">Review Verification</h3>
                            <button
                                onClick={() => setSelectedVerification(null)}
                                className="text-white/60 hover:text-white transition-colors p-1"
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
                                        <Image
                                            src={selectedVerification.selfie_url}
                                            alt="Verification Selfie"
                                            fill
                                            className="object-cover"
                                        />
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
