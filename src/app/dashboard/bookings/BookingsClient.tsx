'use client'

import {
    ArrowLeft, CalendarCheck, User, MapPin, Clock,
    CheckCircle, XCircle, Hourglass, CaretRight, Coin,
    MagnifyingGlass, ShieldCheck
} from '@phosphor-icons/react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import type { Profile, Booking } from '@/types/database'
import type { User as SupabaseUser } from '@supabase/supabase-js'

// Use complete Profile type for talent and client
interface BookingWithParties extends Omit<Booking, 'talent' | 'client'> {
    talent: Profile | null
    client: Profile | null
}

interface BookingsClientProps {
    user: SupabaseUser
    profile: Profile | null
    bookings: BookingWithParties[]
    isClient: boolean
}

const statusConfig: Record<string, { bg: string; text: string; icon: typeof CheckCircle; label: string }> = {
    payment_pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: Hourglass, label: 'Payment Pending' },
    verification_pending: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: ShieldCheck, label: 'Verification Needed' },
    confirmed: { bg: 'bg-green-500/10', text: 'text-green-400', icon: CheckCircle, label: 'Confirmed' },
    completed: { bg: 'bg-green-500/10', text: 'text-green-400', icon: CheckCircle, label: 'Completed' },
    cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', icon: XCircle, label: 'Cancelled' },
}

export function BookingsClient({ user: _user, profile, bookings, isClient }: BookingsClientProps) {
    const [filter, setFilter] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-NG', {
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    // Filter bookings
    const filteredBookings = bookings.filter(booking => {
        const matchesFilter = filter === 'all' || booking.status === filter
        const otherParty = isClient ? booking.talent : booking.client
        const matchesSearch = !searchQuery ||
            otherParty?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.id.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesFilter && matchesSearch
    })

    const filterOptions = [
        { value: 'all', label: 'All' },
        { value: 'verification_pending', label: 'Needs Verification' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
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
                                    <h1 className="text-xl font-bold text-white">My Bookings</h1>
                                    <p className="text-white/50 text-sm">{bookings.length} total bookings</p>
                                </div>
                            </div>
                        </div>

                        {/* Search & Filters */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search bookings..."
                                    className="w-full pl-12 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#df2531]/50"
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {filterOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setFilter(option.value)}
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
                    {filteredBookings.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                                <CalendarCheck size={40} weight="duotone" className="text-white/20" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">
                                {bookings.length === 0 ? 'No bookings yet' : 'No matching bookings'}
                            </h2>
                            <p className="text-white/50 mb-6">
                                {bookings.length === 0
                                    ? isClient
                                        ? 'Browse talent and make your first booking'
                                        : 'Your bookings will appear here'
                                    : 'Try adjusting your filters'
                                }
                            </p>
                            {bookings.length === 0 && isClient && (
                                <Link
                                    href="/dashboard/browse"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#df2531] text-white font-medium hover:bg-[#c41f2a] transition-colors"
                                >
                                    Browse Talent
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredBookings.map((booking) => {
                                const defaultStatus = { icon: Hourglass, bg: 'bg-white/10', text: 'text-white/40', label: 'Unknown' }
                                const status = statusConfig[booking.status] ?? statusConfig.payment_pending ?? defaultStatus
                                // const _StatusIcon = status.icon
                                const otherParty = isClient ? booking.talent : booking.client

                                return (
                                    <Link
                                        key={booking.id}
                                        href={`/dashboard/bookings/${booking.id}`}
                                        className="block p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Avatar */}
                                            <div className="w-14 h-14 rounded-xl bg-white/10 overflow-hidden shrink-0 relative">
                                                {otherParty?.avatar_url ? (
                                                    <Image
                                                        src={otherParty.avatar_url}
                                                        alt={otherParty?.display_name || 'User avatar'}
                                                        fill
                                                        sizes="56px"
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <User size={24} weight="duotone" className="text-white/40" aria-hidden="true" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-white font-semibold truncate">
                                                        {otherParty?.display_name || 'Unknown'}
                                                    </h3>
                                                    {otherParty?.is_verified && otherParty?.role === 'talent' && (
                                                        <span className="px-1.5 py-0.5 rounded bg-[#df2531]/20 text-[#df2531] text-[10px] font-medium">
                                                            ✓ Verified
                                                        </span>
                                                    )}
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                                                        {status.label}
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/50 text-sm">
                                                    {booking.scheduled_at && (
                                                        <span className="flex items-center gap-1">
                                                            <CalendarCheck size={14} weight="duotone" aria-hidden="true" />
                                                            {formatDate(booking.scheduled_at)}
                                                        </span>
                                                    )}
                                                    {booking.scheduled_at && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={14} weight="duotone" aria-hidden="true" />
                                                            {formatTime(booking.scheduled_at)}
                                                        </span>
                                                    )}
                                                    {isClient && booking.talent?.location && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin size={14} weight="duotone" aria-hidden="true" />
                                                            {booking.talent.location || 'Location not specified'}
                                                        </span>
                                                    )}
                                                    {!isClient && booking.client?.location && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin size={14} weight="duotone" aria-hidden="true" />
                                                            {booking.client.location || 'Location not specified'}
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Bio preview for talents */}
                                                {isClient && booking.talent?.bio && (
                                                    <p className="text-white/40 text-xs mt-1 line-clamp-1">{booking.talent.bio}</p>
                                                )}
                                            </div>

                                            {/* Price & Arrow */}
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <p className="text-white font-bold flex items-center gap-1">
                                                        <Coin size={16} weight="duotone" className="text-[#df2531]" />
                                                        {booking.total_price}
                                                    </p>
                                                    <p className="text-white/40 text-xs">coins</p>
                                                </div>
                                                <CaretRight size={20} className="text-white/30" />
                                            </div>
                                        </div>

                                        {/* Services Preview */}
                                        {booking.services_snapshot && Array.isArray(booking.services_snapshot) && (
                                            <div className="mt-3 pt-3 border-t border-white/5">
                                                <div className="flex flex-wrap gap-2">
                                                    {(booking.services_snapshot as Array<{ service_name?: string }>).slice(0, 3).map((service, i) => (
                                                        <span key={i} className="px-2 py-1 rounded-full bg-white/5 text-white/60 text-xs">
                                                            {service.service_name || 'Service'}
                                                        </span>
                                                    ))}
                                                    {(booking.services_snapshot as Array<unknown>).length > 3 && (
                                                        <span className="px-2 py-1 rounded-full bg-white/5 text-white/40 text-xs">
                                                            +{(booking.services_snapshot as Array<unknown>).length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
            <MobileBottomNav userRole={profile?.role === 'talent' ? 'talent' : 'client'} />
        </>
    )
}
