'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, Calendar, Clock, MapPin, CheckCircle,
    SpinnerGap, WarningCircle, CreditCard, ShieldCheck,
    Receipt, Coin, CaretRight, XCircle, User, Star, Hourglass
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useWallet } from '@/hooks/useWallet'
import { WriteReviewModal } from '@/components/Reviews'
import { getTalentUrl } from '@/lib/talent-url'
import { toast } from 'sonner'
import type { Profile, Wallet, BookingStatus, Review } from '@/types/database'

interface BookingWithTalent {
    id: string
    client_id: string
    talent_id: string
    total_price: number
    services_snapshot: { service_name: string; price: number }[]
    status: BookingStatus
    scheduled_at: string
    notes: string | null
    created_at: string
    talent: Pick<Profile, 'id' | 'display_name' | 'avatar_url' | 'location'>
    client?: Pick<Profile, 'id' | 'display_name' | 'avatar_url' | 'location'> | null
    review?: Review | null
}

interface BookingDetailClientProps {
    booking: BookingWithTalent
    wallet: Wallet | null
    userId: string
}

const statusConfig: Record<BookingStatus, { label: string; color: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
    payment_pending: { label: 'Payment Pending', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', icon: CreditCard },
    verification_pending: { label: 'Verification Required', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', icon: ShieldCheck },
    confirmed: { label: 'Confirmed', color: 'text-green-400 bg-green-500/10 border-green-500/30', icon: CheckCircle },
    completed: { label: 'Completed', color: 'text-white/60 bg-white/5 border-white/10', icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: 'text-red-400 bg-red-500/10 border-red-500/30', icon: WarningCircle },
    expired: { label: 'Expired', color: 'text-gray-400 bg-gray-500/10 border-gray-500/30', icon: Hourglass },
}

export function BookingDetailClient({ booking, wallet: initialWallet, userId }: BookingDetailClientProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Real-time wallet synchronization
    const { wallet } = useWallet({ userId, initialWallet })
    const [rejectLoading, setRejectLoading] = useState(false)
    const [error, setError] = useState('')
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [rejectReason, setRejectReason] = useState('')
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [hasReviewed, setHasReviewed] = useState(!!booking.review)

    const isClient = booking.client_id === userId
    const isTalent = booking.talent_id === userId
    const status = statusConfig[booking.status] || statusConfig.cancelled
    const StatusIcon = status.icon

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
        console.log('[BookingDetail] Booking status:', booking.status)
        console.log('[BookingDetail] isTalent:', isTalent, 'talent_id:', booking.talent_id, 'userId:', userId)
        console.log('[BookingDetail] isClient:', isClient, 'client_id:', booking.client_id)
    }

    const formatPrice = (price: number) => {
        return `${new Intl.NumberFormat('en-NG', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price)} coins`
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-NG', {
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const handlePayment = async () => {
        setLoading(true)
        setError('')

        try {
            const supabase = createClient()

            // In real app, this would integrate with Paystack
            // For now, we'll simulate payment by updating status

            // Check wallet balance (if using coins)
            // For demo, we'll just update the booking status

            const { error: updateError } = await supabase
                .from('bookings')
                .update({ status: 'verification_pending' })
                .eq('id', booking.id)

            if (updateError) throw updateError

            // Refresh the page
            router.refresh()
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Payment failed'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel this booking?')) return

        setLoading(true)
        setError('')

        try {
            const supabase = createClient()

            const { error: updateError } = await supabase
                .from('bookings')
                .update({ status: 'cancelled' })
                .eq('id', booking.id)

            if (updateError) throw updateError

            router.refresh()
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to cancel'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    // Talent: Accept booking
    const handleAcceptBooking = async () => {
        console.log('[BookingDetail] Accept booking clicked for booking:', booking.id)
        console.log('[BookingDetail] Current user ID:', userId)
        console.log('[BookingDetail] Booking talent_id:', booking.talent_id)
        console.log('[BookingDetail] isTalent check:', booking.talent_id === userId)

        setLoading(true)
        setError('')

        try {
            // Use API route to bypass RLS policies
            const response = await fetch(`/api/bookings/${booking.id}/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to accept booking')
            }

            console.log('[BookingDetail] Booking accepted successfully:', result.booking)

            toast.success('Booking Accepted', {
                description: 'The booking has been confirmed successfully.'
            })

            // Small delay before refresh to ensure state updates
            setTimeout(() => {
                router.refresh()
            }, 500)
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to accept booking'
            console.error('[BookingDetail] Accept booking error:', err)
            setError(errorMessage)
            toast.error('Failed to Accept Booking', {
                description: errorMessage
            })
        } finally {
            setLoading(false)
        }
    }

    // Talent: Reject booking
    const handleRejectBooking = async () => {
        console.log('[BookingDetail] Reject booking clicked for booking:', booking.id)
        console.log('[BookingDetail] Reject reason:', rejectReason)

        setRejectLoading(true)
        setError('')

        try {
            // Use API route to bypass RLS policies
            const response = await fetch(`/api/bookings/${booking.id}/decline`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: rejectReason }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to decline booking')
            }

            console.log('[BookingDetail] Booking declined successfully:', result.booking)

            toast.success('Booking Declined', {
                description: 'The booking has been declined and the client will be notified.'
            })

            // TODO: Refund client's coins in a production app
            // For now, just close the modal and refresh
            setShowRejectModal(false)
            setRejectReason('')

            // Small delay before refresh to ensure state updates
            setTimeout(() => {
                router.refresh()
            }, 500)
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to reject booking'
            console.error('[BookingDetail] Reject booking error:', err)
            setError(errorMessage)
            toast.error('Failed to Decline Booking', {
                description: errorMessage
            })
        } finally {
            setRejectLoading(false)
        }
    }

    // Talent: Mark booking as completed
    const handleCompleteBooking = async () => {
        if (!confirm('Mark this booking as completed? This action cannot be undone.')) return

        console.log('[BookingDetail] Complete booking clicked for booking:', booking.id)

        setLoading(true)
        setError('')

        try {
            // Use API route to bypass RLS policies
            const response = await fetch(`/api/bookings/${booking.id}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to complete booking')
            }

            console.log('[BookingDetail] Booking completed successfully:', result.booking)

            toast.success('Booking Completed', {
                description: 'The booking has been marked as completed successfully.'
            })

            // Small delay before refresh to ensure state updates
            setTimeout(() => {
                router.refresh()
            }, 500)
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to complete booking'
            console.error('[BookingDetail] Complete booking error:', err)
            setError(errorMessage)
            toast.error('Failed to Complete Booking', {
                description: errorMessage
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black pt-16 lg:pt-0">
            {/* Header */}
            <header className="fixed lg:sticky top-[64px] lg:top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 border-t-0">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="text-white/60 hover:text-white transition-colors"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h1 className="text-lg font-bold text-white">Booking Details</h1>
                                <p className="text-white/50 text-sm">#{booking.id.slice(0, 8)}</p>
                            </div>
                        </div>
                        <Link
                            href="/dashboard/bookings"
                            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-sm font-medium transition-colors"
                        >
                            All Bookings
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-6 pt-[128px] lg:pt-6 space-y-6">
                {/* Status Banner */}
                <div className={`flex items-center gap-3 p-4 rounded-xl border ${status.color}`}>
                    <StatusIcon size={24} />
                    <div className="flex-1">
                        <p className="font-semibold">{status.label}</p>
                        {booking.status === 'payment_pending' && (
                            <p className="text-sm opacity-80">Complete payment to confirm your booking</p>
                        )}
                        {booking.status === 'verification_pending' && (
                            <p className="text-sm opacity-80">Identity verification required before meeting</p>
                        )}
                    </div>
                    {booking.status === 'verification_pending' && isClient && (
                        <Link
                            href={`/dashboard/verify?booking=${booking.id}`}
                            className="px-4 py-2 rounded-full bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
                        >
                            Verify Now
                        </Link>
                    )}
                </div>

                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Talent Card */}
                <Link
                    href={getTalentUrl(booking.talent)}
                    className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
                >
                    <div className="relative w-16 h-16 rounded-full overflow-hidden">
                        <Image
                            src={booking.talent.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80'}
                            alt={booking.talent.display_name || 'Talent'}
                            fill
                            sizes="64px"
                            className="object-cover"
                        />
                    </div>
                    <div className="flex-1">
                        <p className="text-white font-semibold">{booking.talent.display_name || 'Talent'}</p>
                        <p className="text-white/50 text-sm flex items-center gap-1">
                            <MapPin size={14} weight="duotone" aria-hidden="true" />
                            {booking.talent.location || 'Location not specified'}
                        </p>
                        {booking.talent.bio && (
                            <p className="text-white/40 text-xs mt-1 line-clamp-2">{booking.talent.bio}</p>
                        )}
                    </div>
                    <CaretRight size={20} className="text-white/40" />
                </Link>

                {/* Date & Time */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h3 className="text-white/50 text-sm mb-3">Scheduled For</h3>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-white">
                            <Calendar size={18} className="text-[#df2531]" />
                            <span>{formatDate(booking.scheduled_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white">
                            <Clock size={18} className="text-[#df2531]" />
                            <span>{formatTime(booking.scheduled_at)}</span>
                        </div>
                    </div>
                </div>

                {/* Services */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h3 className="text-white/50 text-sm mb-3">Services</h3>
                    <div className="space-y-3">
                        {booking.services_snapshot.map((service, i) => (
                            <div key={i} className="flex justify-between text-white">
                                <span>{service.service_name}</span>
                                <span>{formatPrice(service.price)}</span>
                            </div>
                        ))}
                        <div className="border-t border-white/10 pt-3 flex justify-between text-white font-bold text-lg">
                            <span>Total</span>
                            <span>{formatPrice(booking.total_price)}</span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {booking.notes && (
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <h3 className="text-white/50 text-sm mb-2">Notes</h3>
                        <p className="text-white">{booking.notes}</p>
                    </div>
                )}

                {/* Actions */}
                {booking.status === 'payment_pending' && isClient && (
                    <div className="space-y-4">
                        {/* Wallet Balance */}
                        <div className="flex items-center justify-between p-4 bg-[#df2531]/10 rounded-xl border border-[#df2531]/20">
                            <div className="flex items-center gap-3">
                                <Coin size={24} weight="duotone" className="text-[#df2531]" />
                                <div>
                                    <p className="text-white/50 text-xs">Your Balance</p>
                                    <p className="text-white font-bold">{wallet?.balance || 0} coins</p>
                                </div>
                            </div>
                            <Link href="/dashboard/wallet" className="text-[#df2531] text-sm hover:underline">
                                Top up
                            </Link>
                        </div>

                        <Button
                            onClick={handlePayment}
                            disabled={loading}
                            className="w-full bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold py-4 rounded-xl disabled:opacity-50"
                        >
                            {loading ? (
                                <SpinnerGap size={20} className="animate-spin" />
                            ) : (
                                <>
                                    <CreditCard size={20} className="mr-2" />
                                    Pay {formatPrice(booking.total_price)}
                                </>
                            )}
                        </Button>

                        <button
                            onClick={handleCancel}
                            disabled={loading}
                            className="w-full py-3 text-white/50 hover:text-red-400 transition-colors text-sm"
                        >
                            Cancel Booking
                        </button>
                    </div>
                )}

                {booking.status === 'verification_pending' && isClient && (
                    <div className="space-y-4">
                        <div className="bg-blue-500/10 rounded-xl p-6 border border-blue-500/20 text-center">
                            <ShieldCheck size={48} className="text-blue-400 mx-auto mb-4" />
                            <h3 className="text-white font-bold text-lg mb-2">Verification Required</h3>
                            <p className="text-white/60 text-sm mb-4">
                                Before your meeting, we need to verify your identity for safety.
                                This helps protect both you and the talent.
                            </p>
                            <Button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl">
                                Start Verification
                            </Button>
                        </div>
                    </div>
                )}

                {booking.status === 'confirmed' && isClient && (
                    <div className="bg-green-500/10 rounded-xl p-6 border border-green-500/20 text-center">
                        <CheckCircle size={48} weight="fill" className="text-green-400 mx-auto mb-4" />
                        <h3 className="text-white font-bold text-lg mb-2">Booking Confirmed!</h3>
                        <p className="text-white/60 text-sm">
                            Your booking is confirmed. Contact details will be shared closer to the date.
                        </p>
                    </div>
                )}

                {/* TALENT ACTIONS - Verification Pending (Accept/Reject) */}
                {booking.status === 'verification_pending' && isTalent && (
                    <div className="space-y-4">
                        <div className="bg-amber-500/10 rounded-xl p-6 border border-amber-500/20">
                            <div className="flex items-center gap-3 mb-4">
                                <User size={24} className="text-amber-400" />
                                <div>
                                    <h3 className="text-white font-bold">New Booking Request</h3>
                                    <p className="text-white/60 text-sm">
                                        {booking.client?.display_name || 'A client'} wants to book your services
                                    </p>
                                </div>
                            </div>

                            <div className="bg-black/20 rounded-lg p-4 mb-4">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-white/60">Total Amount</span>
                                    <span className="text-white font-bold">{formatPrice(booking.total_price)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/60">Date</span>
                                    <span className="text-white">{formatDate(booking.scheduled_at)}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={handleAcceptBooking}
                                    disabled={loading || rejectLoading}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl"
                                >
                                    {loading ? (
                                        <SpinnerGap size={20} className="animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle size={20} className="mr-2" />
                                            Accept
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={() => setShowRejectModal(true)}
                                    disabled={loading || rejectLoading}
                                    variant="outline"
                                    className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10 font-bold py-3 rounded-xl"
                                >
                                    <XCircle size={20} className="mr-2" />
                                    Decline
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TALENT ACTIONS - Confirmed (Complete) */}
                {booking.status === 'confirmed' && isTalent && (
                    <div className="space-y-4">
                        <div className="bg-green-500/10 rounded-xl p-6 border border-green-500/20">
                            <div className="flex items-center gap-3 mb-4">
                                <CheckCircle size={24} weight="fill" className="text-green-400" />
                                <div>
                                    <h3 className="text-white font-bold">Booking Confirmed</h3>
                                    <p className="text-white/60 text-sm">
                                        This booking is confirmed. Mark as complete after the session.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-black/20 rounded-lg p-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
                                        {booking.client?.avatar_url ? (
                                            <Image
                                                src={booking.client.avatar_url}
                                                alt={booking.client.display_name || 'Client'}
                                                width={40}
                                                height={40}
                                                className="object-cover"
                                            />
                                        ) : (
                                            <User size={20} className="text-white/40" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{booking.client?.display_name || 'Client'}</p>
                                        <p className="text-white/50 text-xs">Verified Client</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={handleCompleteBooking}
                                    disabled={loading}
                                    className="flex-1 bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold py-3 rounded-xl"
                                >
                                    {loading ? (
                                        <SpinnerGap size={20} className="animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle size={20} className="mr-2" />
                                            Mark as Completed
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Completed Status for both */}
                {booking.status === 'completed' && (
                    <div className="space-y-4">
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
                            <CheckCircle size={48} weight="fill" className="text-green-400 mx-auto mb-4" />
                            <h3 className="text-white font-bold text-lg mb-2">Booking Completed</h3>
                            <p className="text-white/60 text-sm">
                                This booking has been completed. Thank you for using Nego!
                            </p>
                        </div>

                        {/* Review Section - Only for Clients */}
                        {isClient && (
                            <div className="bg-amber-500/5 rounded-xl p-6 border border-amber-500/10">
                                {hasReviewed ? (
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1 mb-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    size={24}
                                                    weight={star <= (booking.review?.rating || 0) ? 'fill' : 'regular'}
                                                    className={star <= (booking.review?.rating || 0) ? 'text-amber-400' : 'text-white/20'}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-white/60 text-sm">You've already reviewed this booking</p>
                                        {booking.review?.comment && (
                                            <p className="text-white/50 text-sm mt-2 italic">"{booking.review.comment}"</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <Star size={32} weight="duotone" className="text-amber-400 mx-auto mb-3" />
                                        <h3 className="text-white font-bold mb-2">How was your experience?</h3>
                                        <p className="text-white/60 text-sm mb-4">
                                            Share your feedback to help others and support the talent.
                                        </p>
                                        <Button
                                            onClick={() => setShowReviewModal(true)}
                                            className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 py-3 rounded-xl"
                                        >
                                            <Star size={18} weight="fill" className="mr-2" />
                                            Write a Review
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Cancelled Status */}
                {booking.status === 'cancelled' && (
                    <div className="bg-red-500/10 rounded-xl p-6 border border-red-500/20 text-center">
                        <XCircle size={48} weight="fill" className="text-red-400 mx-auto mb-4" />
                        <h3 className="text-white font-bold text-lg mb-2">Booking Cancelled</h3>
                        <p className="text-white/60 text-sm">
                            {booking.notes?.includes('Declined by talent')
                                ? 'This booking was declined by the talent.'
                                : 'This booking has been cancelled.'}
                        </p>
                    </div>
                )}

                {/* Receipt */}
                <div className="pt-4 border-t border-white/10">
                    <button className="flex items-center gap-2 text-white/50 hover:text-white text-sm">
                        <Receipt size={18} />
                        Download Receipt
                    </button>
                </div>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowRejectModal(false)}
                    />
                    <div className="relative bg-[#1a1a1a] rounded-2xl p-6 max-w-md w-full border border-white/10">
                        <h3 className="text-xl font-bold text-white mb-2">Decline Booking</h3>
                        <p className="text-white/60 text-sm mb-4">
                            Are you sure you want to decline this booking? The client will be notified.
                        </p>

                        <div className="mb-4">
                            <label className="block text-white/70 text-sm mb-2">Reason (optional)</label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Let the client know why you're declining..."
                                className="w-full h-24 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531] resize-none"
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => setShowRejectModal(false)}
                                variant="ghost"
                                className="flex-1 text-white/60 hover:text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleRejectBooking}
                                disabled={rejectLoading}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                            >
                                {rejectLoading ? (
                                    <SpinnerGap size={20} className="animate-spin" />
                                ) : (
                                    'Decline Booking'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Review Modal */}
            {showReviewModal && (
                <WriteReviewModal
                    bookingId={booking.id}
                    talentId={booking.talent_id}
                    clientId={booking.client_id}
                    onReviewSubmit={() => {
                        setHasReviewed(true)
                        setShowReviewModal(false)
                        router.refresh()
                    }}
                    onClose={() => setShowReviewModal(false)}
                />
            )}
        </div>
    )
}
