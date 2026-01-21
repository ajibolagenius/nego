'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Warning, Plus, Eye, X, Calendar, User, Message
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Dispute, Booking } from '@/types/database'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DisputesPageClientProps {
    userId: string
    disputes: Dispute[]
    bookings: Booking[]
}

export function DisputesPageClient({ userId, disputes, bookings }: DisputesPageClientProps) {
    const router = useRouter()
    const supabase = createClient()
    const [showForm, setShowForm] = useState(false)
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        booking_id: '',
        dispute_type: 'service_not_delivered' as Dispute['dispute_type'],
        title: '',
        description: '',
        evidence_urls: [] as string[]
    })

    const handleFileDispute = async () => {
        if (!formData.booking_id || !formData.title || !formData.description) {
            toast.error('Please fill in all required fields')
            return
        }

        setIsSubmitting(true)
        try {
            const booking = bookings.find(b => b.id === formData.booking_id)
            if (!booking) {
                toast.error('Booking not found')
                return
            }

            const { error } = await supabase
                .from('disputes')
                .insert({
                    booking_id: formData.booking_id,
                    client_id: booking.client_id,
                    talent_id: booking.talent_id,
                    dispute_type: formData.dispute_type,
                    title: formData.title,
                    description: formData.description,
                    evidence_urls: formData.evidence_urls,
                    status: 'open'
                })

            if (error) throw error

            toast.success('Dispute filed successfully')
            setShowForm(false)
            setFormData({
                booking_id: '',
                dispute_type: 'service_not_delivered',
                title: '',
                description: '',
                evidence_urls: []
            })
            router.refresh()
        } catch (error) {
            console.error('File dispute error:', error)
            toast.error('Failed to file dispute')
        } finally {
            setIsSubmitting(false)
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

    const getStatusColor = (status: Dispute['status']) => {
        switch (status) {
            case 'open':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
            case 'under_review':
                return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            case 'resolved':
                return 'bg-green-500/20 text-green-400 border-green-500/30'
            case 'closed':
                return 'bg-white/10 text-white/60 border-white/10'
            default:
                return 'bg-white/10 text-white/60 border-white/10'
        }
    }

    const availableBookings = bookings.filter(booking => {
        // Only show bookings that don't already have an open dispute
        return !disputes.some(d => d.booking_id === booking.id && d.status === 'open')
    })

    return (
        <div className="min-h-screen bg-black pt-16 lg:pt-0 pb-20 lg:pb-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Disputes</h1>
                        <p className="text-white/60">File and manage booking disputes</p>
                    </div>
                    {availableBookings.length > 0 && (
                        <Button
                            onClick={() => setShowForm(true)}
                            className="bg-[#df2531] hover:bg-[#df2531]/90"
                        >
                            <Plus size={18} />
                            File Dispute
                        </Button>
                    )}
                </div>

                {/* My Disputes */}
                {disputes.length === 0 ? (
                    <div className="text-center py-20">
                        <Warning size={64} className="text-white/20 mx-auto mb-4" />
                        <p className="text-white/50 text-lg mb-2">No disputes found</p>
                        <p className="text-white/30 text-sm">File a dispute if you have an issue with a booking</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {disputes.map((dispute) => (
                            <div
                                key={dispute.id}
                                className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(dispute.status)}`}>
                                                {dispute.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                            <span className="px-3 py-1 rounded-full text-xs bg-white/10 text-white/60 border border-white/10">
                                                {dispute.dispute_type.replace('_', ' ')}
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-bold text-white mb-2">{dispute.title}</h3>
                                        <p className="text-white/70 mb-4">{dispute.description}</p>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            <div className="flex items-center gap-2 text-white/60">
                                                <User size={16} />
                                                <span>
                                                    {dispute.client_id === userId ? 'You' : dispute.client?.display_name || 'Client'} vs {' '}
                                                    {dispute.talent_id === userId ? 'You' : dispute.talent?.display_name || 'Talent'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-white/60">
                                                <Calendar size={16} />
                                                <span>{formatDate(dispute.created_at)}</span>
                                            </div>
                                            {dispute.resolution && (
                                                <div className="text-green-400">
                                                    Resolution: {dispute.resolution}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Link href={`/dashboard/disputes/${dispute.id}`}>
                                        <Button variant="outline" className="ml-4 border-white/10">
                                            <Eye size={18} />
                                            View
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* File Dispute Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">File Dispute</h2>
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="text-white/60 hover:text-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-white font-medium mb-2">Select Booking *</label>
                                    <select
                                        value={formData.booking_id}
                                        onChange={(e) => {
                                            setFormData({ ...formData, booking_id: e.target.value })
                                            const booking = bookings.find(b => b.id === e.target.value)
                                            setSelectedBooking(booking || null)
                                        }}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#df2531]/50"
                                    >
                                        <option value="">Select a booking...</option>
                                        {availableBookings.map(booking => (
                                            <option key={booking.id} value={booking.id}>
                                                Booking #{booking.id.substring(0, 8)} - {booking.total_price} coins - {booking.status}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-white font-medium mb-2">Dispute Type *</label>
                                    <select
                                        value={formData.dispute_type}
                                        onChange={(e) => setFormData({ ...formData, dispute_type: e.target.value as Dispute['dispute_type'] })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#df2531]/50"
                                    >
                                        <option value="service_not_delivered">Service Not Delivered</option>
                                        <option value="payment_issue">Payment Issue</option>
                                        <option value="cancellation">Cancellation</option>
                                        <option value="quality_issue">Quality Issue</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-white font-medium mb-2">Title *</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Brief title for your dispute"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-white font-medium mb-2">Description *</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Describe the issue in detail..."
                                        rows={6}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        onClick={handleFileDispute}
                                        disabled={isSubmitting}
                                        className="flex-1 bg-[#df2531] hover:bg-[#df2531]/90"
                                    >
                                        {isSubmitting ? 'Filing...' : 'File Dispute'}
                                    </Button>
                                    <Button
                                        onClick={() => setShowForm(false)}
                                        variant="outline"
                                        className="flex-1 border-white/10"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            )}
        </div>
    )
}
