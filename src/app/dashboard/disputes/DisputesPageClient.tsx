'use client'

import {
    Warning, Plus, X, Calendar, User, ChatCircle, ArrowLeft, CaretRight
} from '@phosphor-icons/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { Dispute, Booking } from '@/types/database'

interface DisputesPageClientProps {
    userId: string
    disputes: Dispute[]
    bookings: Booking[]
}

export function DisputesPageClient({ userId, disputes, bookings }: DisputesPageClientProps) {
    const router = useRouter()
    const supabase = createClient()
    const [showForm, setShowForm] = useState(false)
    const [_selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [userRole, setUserRole] = useState<'client' | 'talent'>('client')
    const [filter, setFilter] = useState<'all' | 'open' | 'under_review' | 'resolved' | 'closed'>('all')
    const [searchQuery, setSearchQuery] = useState('')

    // Fetch user role
    useEffect(() => {
        const fetchUserRole = async () => {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single()

            if (profile?.role === 'talent') {
                setUserRole('talent')
            }
        }
        fetchUserRole()
    }, [userId, supabase])

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

    const availableBookings = useMemo(() => {
        return bookings.filter(booking => {
            // Only show bookings that don't already have an open dispute
            return !disputes.some(d => d.booking_id === booking.id && d.status === 'open')
        })
    }, [bookings, disputes])

    // Filter disputes
    const filteredDisputes = useMemo(() => {
        return disputes.filter(dispute => {
            const matchesFilter = filter === 'all' || dispute.status === filter
            const matchesSearch = !searchQuery ||
                dispute.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                dispute.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                dispute.client?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                dispute.talent?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
            return matchesFilter && matchesSearch
        })
    }, [disputes, filter, searchQuery])

    const filterOptions = [
        { value: 'all', label: 'All' },
        { value: 'open', label: 'Open' },
        { value: 'under_review', label: 'Under Review' },
        { value: 'resolved', label: 'Resolved' },
        { value: 'closed', label: 'Closed' },
    ]

    return (
        <>
            <div className="min-h-screen bg-black pt-16 lg:pt-0 pb-20 lg:pb-0">
                {/* Header */}
                <header className="fixed lg:sticky top-[64px] lg:top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 border-t-0">
                    <div className="max-w-4xl mx-auto px-4 py-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
                                    <ArrowLeft size={24} />
                                </Link>
                                <div>
                                    <h1 className="text-xl font-bold text-white">Disputes</h1>
                                    <p className="text-white/50 text-sm">{disputes.length} total dispute{disputes.length !== 1 ? 's' : ''}</p>
                                </div>
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

                        {/* Search & Filters */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <ChatCircle size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search disputes..."
                                    className="w-full pl-12 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#df2531]/50"
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {filterOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setFilter(option.value as typeof filter)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === option.value
                                            ? 'bg-[#df2531] text-white'
                                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="max-w-4xl mx-auto px-4 py-6 pt-[128px] lg:pt-6">
                    {filteredDisputes.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                                <Warning size={40} weight="duotone" className="text-white/20" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">
                                {disputes.length === 0 ? 'No disputes yet' : 'No matching disputes'}
                            </h2>
                            <p className="text-white/50 mb-6">
                                {disputes.length === 0
                                    ? 'File a dispute if you have an issue with a booking'
                                    : 'Try adjusting your filters or search query'
                                }
                            </p>
                            {disputes.length === 0 && availableBookings.length > 0 && (
                                <Button
                                    onClick={() => setShowForm(true)}
                                    className="bg-[#df2531] hover:bg-[#df2531]/90"
                                >
                                    <Plus size={18} />
                                    File Your First Dispute
                                </Button>
                            )}
                            {disputes.length === 0 && availableBookings.length === 0 && bookings.length > 0 && (
                                <p className="text-white/40 text-sm">Only confirmed/completed bookings can have disputes</p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredDisputes.map((dispute) => (
                                <Link
                                    key={dispute.id}
                                    href={`/dashboard/disputes/${dispute.id}`}
                                    className="block p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Status Icon */}
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${dispute.status === 'open' ? 'bg-blue-500/10' :
                                                dispute.status === 'under_review' ? 'bg-amber-500/10' :
                                                    dispute.status === 'resolved' ? 'bg-green-500/10' :
                                                        'bg-white/10'
                                            }`}>
                                            <Warning size={24} weight="duotone" className={
                                                dispute.status === 'open' ? 'text-blue-400' :
                                                    dispute.status === 'under_review' ? 'text-amber-400' :
                                                        dispute.status === 'resolved' ? 'text-green-400' :
                                                            'text-white/40'
                                            } />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(dispute.status)}`}>
                                                    {dispute.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                                <span className="px-2.5 py-1 rounded-full text-xs bg-white/10 text-white/60 border border-white/10">
                                                    {dispute.dispute_type.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-1 truncate">{dispute.title}</h3>
                                            <p className="text-white/70 text-sm mb-3 line-clamp-2">{dispute.description}</p>
                                            <div className="flex items-center gap-4 text-xs text-white/60">
                                                <div className="flex items-center gap-1.5">
                                                    <User size={14} />
                                                    <span>
                                                        {dispute.client_id === userId ? 'You' : dispute.client?.display_name || 'Client'} vs {' '}
                                                        {dispute.talent_id === userId ? 'You' : dispute.talent?.display_name || 'Talent'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={14} />
                                                    <span>{formatDate(dispute.created_at)}</span>
                                                </div>
                                                {dispute.resolution && (
                                                    <div className="text-green-400">
                                                        ✓ Resolved
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Arrow */}
                                        <div className="text-white/40">
                                            <CaretRight size={20} />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
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
                </div>
            )}
            <MobileBottomNav userRole={userRole} />
        </>
    )
}
