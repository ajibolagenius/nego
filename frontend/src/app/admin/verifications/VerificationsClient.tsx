'use client'

import { useState } from 'react'
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

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-amber-500/10 text-amber-400', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-500/10 text-green-400', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-500/10 text-red-400', icon: XCircle },
}

export function VerificationsClient({ verifications }: VerificationsClientProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')

  const filteredVerifications = verifications.filter((v) => {
    if (filter === 'all') return true
    return v.status === filter
  })

  const pendingCount = verifications.filter((v) => v.status === 'pending').length

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

      if (verifyError) throw verifyError

      // Update booking status to confirmed
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', verification.booking_id)

      if (bookingError) throw bookingError

      setSelectedVerification(null)
      setAdminNotes('')
      router.refresh()
    } catch (error) {
      console.error('Error approving verification:', error)
      alert('Failed to approve verification')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (verification: Verification) => {
    if (!adminNotes.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    setIsProcessing(true)
    const supabase = createClient()

    try {
      // Update verification status
      const { error: verifyError } = await supabase
        .from('verifications')
        .update({
          status: 'rejected',
          admin_notes: adminNotes,
        })
        .eq('booking_id', verification.booking_id)

      if (verifyError) throw verifyError

      // Update booking status to cancelled
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', verification.booking_id)

      if (bookingError) throw bookingError

      // TODO: Refund coins to client wallet

      setSelectedVerification(null)
      setAdminNotes('')
      router.refresh()
    } catch (error) {
      console.error('Error rejecting verification:', error)
      alert('Failed to reject verification')
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
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === status
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

      {/* Verifications List */}
      {filteredVerifications.length === 0 ? (
        <div className="text-center py-12 sm:py-16 rounded-2xl bg-white/5 border border-white/10">
          <CheckCircle size={40} weight="duotone" className="text-white/20 mx-auto mb-4 sm:w-12 sm:h-12" />
          <p className="text-white/50 mb-2">No verifications found</p>
          <p className="text-white/30 text-sm">
            {filter === 'pending' ? 'All verifications have been reviewed' : 'No verifications match this filter'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredVerifications.map((verification) => {
            const status = statusConfig[verification.status]
            const StatusIcon = status.icon

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
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${status.color}`}>
                      <StatusIcon size={12} weight="fill" />
                      {status.label}
                    </span>
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
              <div className="flex flex-col sm:flex-row gap-3 p-4 sm:p-6 border-t border-white/10 sticky bottom-0 bg-[#111]">
                <Button
                  onClick={() => handleReject(selectedVerification)}
                  disabled={isProcessing}
                  className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                >
                  <XCircle size={18} className="mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleApprove(selectedVerification)}
                  disabled={isProcessing}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                >
                  <CheckCircle size={18} className="mr-2" />
                  Approve
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
