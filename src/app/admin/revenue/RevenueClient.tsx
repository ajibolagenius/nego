'use client'

import { 
    TrendUp, 
    CalendarCheck, 
    Receipt, 
    User, 
    ArrowLeft,
    HandCoins
} from '@phosphor-icons/react'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { Booking, Profile } from '@/types/database'
import Image from 'next/image'

interface RevenueBooking extends Booking {
    talent: Profile
    client: Profile
}

interface RevenueClientProps {
    initialBookings: RevenueBooking[]
}

export function RevenueClient({ initialBookings }: RevenueClientProps) {
    const [bookings] = useState(initialBookings)
    const [searchTerm, setSearchTerm] = useState('')

    const stats = useMemo(() => {
        const totalRevenue = bookings.reduce((sum, b) => sum + (b.platform_fee || 0), 0)
        const totalBookingValue = bookings.reduce((sum, b) => sum + b.total_price, 0)
        const completedCount = bookings.filter(b => b.status === 'completed').length
        
        return {
            totalRevenue,
            totalBookingValue,
            completedCount,
            averageCommission: bookings.length > 0 ? (totalRevenue / totalBookingValue) * 100 : 0
        }
    }, [bookings])

    const filteredBookings = useMemo(() => {
        return bookings.filter(b => 
            b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.talent?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.client?.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [bookings, searchTerm])

    const COIN_TO_NAIRA_RATE = 10

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/admin" className="text-white/40 hover:text-white transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">Platform Revenue</h1>
                    </div>
                    <p className="text-white/60 text-sm sm:text-base">Track booking commissions and platform earnings</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center mb-4">
                        <TrendUp size={24} weight="duotone" />
                    </div>
                    <p className="text-white/60 text-sm mb-1">Total Platform Revenue</p>
                    <p className="text-3xl font-bold text-white">{stats.totalRevenue.toLocaleString()} coins</p>
                    <p className="text-green-400 text-sm mt-1">₦{(stats.totalRevenue * COIN_TO_NAIRA_RATE).toLocaleString()}</p>
                </div>

                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                        <HandCoins size={24} weight="duotone" />
                    </div>
                    <p className="text-white/60 text-sm mb-1">Total Booking Value</p>
                    <p className="text-3xl font-bold text-white">{stats.totalBookingValue.toLocaleString()} coins</p>
                    <p className="text-blue-400 text-sm mt-1">₦{(stats.totalBookingValue * COIN_TO_NAIRA_RATE).toLocaleString()}</p>
                </div>

                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
                        <CalendarCheck size={24} weight="duotone" />
                    </div>
                    <p className="text-white/60 text-sm mb-1">Completed Bookings</p>
                    <p className="text-3xl font-bold text-white">{stats.completedCount}</p>
                    <p className="text-white/40 text-sm mt-1">From {bookings.length} total bookings</p>
                </div>

                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                        <Receipt size={24} weight="duotone" />
                    </div>
                    <p className="text-white/60 text-sm mb-1">Avg. Commission %</p>
                    <p className="text-3xl font-bold text-white">{stats.averageCommission.toFixed(1)}%</p>
                    <p className="text-white/40 text-sm mt-1">Standard 20% rate</p>
                </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-white">Booking Breakdown</h2>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by ID or name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#df2531] transition-all"
                        />
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5">
                                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider">Booking / Talent</th>
                                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider">Client</th>
                                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider">Total Price</th>
                                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider">Platform Fee (20%)</th>
                                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider">Net to Talent</th>
                                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredBookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                                                {booking.talent?.avatar_url ? (
                                                    <Image
                                                        src={booking.talent.avatar_url}
                                                        alt=""
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                                        <User size={20} className="text-white/20" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white group-hover:text-[#df2531] transition-colors line-clamp-1">
                                                    {booking.talent?.display_name || 'Unknown Talent'}
                                                </p>
                                                <p className="text-xs text-white/40">ID: {booking.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                <User size={12} className="text-blue-400" />
                                            </div>
                                            <span className="text-sm text-white/60">{booking.client?.display_name || 'Unknown Client'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-medium text-white">{booking.total_price.toLocaleString()} coins</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-medium text-green-400">
                                            +{(booking.platform_fee || Math.round(booking.total_price * 0.2)).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-medium text-white/60">
                                            {(booking.net_amount || Math.round(booking.total_price * 0.8)).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            booking.status === 'completed' 
                                                ? 'bg-green-500/10 text-green-400' 
                                                : 'bg-amber-500/10 text-amber-400'
                                        }`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile List View */}
                <div className="md:hidden divide-y divide-white/5">
                    {filteredBookings.map((booking) => (
                        <div key={booking.id} className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                                        {booking.talent?.avatar_url ? (
                                            <Image
                                                src={booking.talent.avatar_url}
                                                alt=""
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                                <User size={20} className="text-white/20" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">
                                            {booking.talent?.display_name || 'Unknown Talent'}
                                        </p>
                                        <p className="text-xs text-white/40">Booking: #{booking.id.slice(0, 8)}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    booking.status === 'completed' 
                                        ? 'bg-green-500/10 text-green-400' 
                                        : 'bg-amber-500/10 text-amber-400'
                                }`}>
                                    {booking.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Client</p>
                                    <div className="flex items-center gap-2">
                                        <User size={14} className="text-blue-400" />
                                        <span className="text-sm text-white/60 line-clamp-1">{booking.client?.display_name || 'Unknown'}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Total Price</p>
                                    <p className="text-sm font-medium text-white">{booking.total_price.toLocaleString()} coins</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Platform Fee</p>
                                    <p className="text-sm font-medium text-green-400">
                                        +{(booking.platform_fee || Math.round(booking.total_price * 0.2)).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Net to Talent</p>
                                    <p className="text-sm font-medium text-white/60">
                                        {(booking.net_amount || Math.round(booking.total_price * 0.8)).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredBookings.length === 0 && (
                    <div className="px-6 py-12 text-center text-white/40 italic">
                        No revenue records found matching your search.
                    </div>
                )}
            </div>
        </div>
    )
}
