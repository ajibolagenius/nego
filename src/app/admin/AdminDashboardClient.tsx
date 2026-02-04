'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { UserCheck, Money, Users, CalendarCheck, Warning } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'

interface AdminDashboardClientProps {
    initialPendingVerifications: number
    initialTotalUsers: number
    initialTotalBookings: number
    initialPendingPayouts: number
    initialPendingDisputes: number
}

export function AdminDashboardClient({
    initialPendingVerifications,
    initialTotalUsers,
    initialTotalBookings,
    initialPendingPayouts,
    initialPendingDisputes,
}: AdminDashboardClientProps) {
    const supabase = createClient()
    const dashboardChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

    const [pendingVerifications, setPendingVerifications] = useState(initialPendingVerifications)
    const [totalUsers, setTotalUsers] = useState(initialTotalUsers)
    const [totalBookings, setTotalBookings] = useState(initialTotalBookings)
    const [pendingPayouts, setPendingPayouts] = useState(initialPendingPayouts)
    const [pendingDisputes, setPendingDisputes] = useState(initialPendingDisputes)

    // Real-time subscription for all dashboard stats
    useEffect(() => {
        // Cleanup existing channel
        if (dashboardChannelRef.current) {
            supabase.removeChannel(dashboardChannelRef.current)
        }

        const dashboardChannel = supabase
            .channel('admin-dashboard', {
                config: {
                    broadcast: { self: false }
                }
            })
            // Verifications subscription
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'verifications',
                },
                async () => {
                    // Refetch pending verifications count
                    const { count } = await supabase
                        .from('verifications')
                        .select('*', { count: 'exact', head: true })
                        .eq('status', 'pending')
                    if (count !== null) {
                        setPendingVerifications(count)
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'profiles',
                },
                async () => {
                    // Refetch total users count
                    const { count } = await supabase
                        .from('profiles')
                        .select('*', { count: 'exact', head: true })
                    if (count !== null) {
                        setTotalUsers(count)
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                },
                async () => {
                    // Refetch total bookings count
                    const { count } = await supabase
                        .from('bookings')
                        .select('*', { count: 'exact', head: true })
                    if (count !== null) {
                        setTotalBookings(count)
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'transactions',
                    filter: 'type=eq.payout',
                },
                async () => {
                    // Refetch pending payouts count
                    const { count } = await supabase
                        .from('transactions')
                        .select('*', { count: 'exact', head: true })
                        .eq('type', 'payout')
                        .eq('status', 'pending')
                    if (count !== null) {
                        setPendingPayouts(count)
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'disputes',
                },
                async () => {
                    // Refetch pending disputes count
                    const { count } = await supabase
                        .from('disputes')
                        .select('*', { count: 'exact', head: true })
                        .eq('status', 'open')
                    if (count !== null) {
                        setPendingDisputes(count)
                    }
                }
            )
            .subscribe((status) => {
                console.log('[Admin Dashboard] Channel subscription status:', status)
            })

        dashboardChannelRef.current = dashboardChannel

        return () => {
            if (dashboardChannelRef.current) {
                supabase.removeChannel(dashboardChannelRef.current)
                dashboardChannelRef.current = null
            }
        }
    }, [supabase])

    const stats = [
        {
            label: 'Pending Verifications',
            value: pendingVerifications,
            icon: UserCheck,
            href: '/admin/verifications',
            color: 'bg-amber-500/10 text-amber-400',
            urgent: pendingVerifications > 0,
        },
        {
            label: 'Pending Payouts',
            value: pendingPayouts,
            icon: Money,
            href: '/admin/payouts',
            color: 'bg-green-500/10 text-green-400',
            urgent: pendingPayouts > 0,
        },
        {
            label: 'Open Disputes',
            value: pendingDisputes,
            icon: Warning,
            href: '/admin/disputes',
            color: 'bg-red-500/10 text-red-400',
            urgent: pendingDisputes > 0,
        },
        {
            label: 'Total Users',
            value: totalUsers,
            icon: Users,
            href: '#',
            color: 'bg-blue-500/10 text-blue-400',
            urgent: false,
        },
        {
            label: 'Total Bookings',
            value: totalBookings,
            icon: CalendarCheck,
            href: '#',
            color: 'bg-purple-500/10 text-purple-400',
            urgent: false,
        },
    ]

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Admin Dashboard</h1>
                <p className="text-white/60 text-sm sm:text-base">Monitor platform activity, review verifications, and process talent payouts</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <Link
                            key={stat.label}
                            href={stat.href}
                            className={`relative p-4 sm:p-6 rounded-2xl bg-white/5 border transition-all duration-300 hover:bg-white/10 ${stat.urgent ? 'border-amber-500/50' : 'border-white/10'
                                }`}
                        >
                            {stat.urgent && (
                                <span className="absolute top-2 right-2 sm:top-3 sm:right-3 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500 animate-pulse" />
                            )}
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.color} flex items-center justify-center mb-3 sm:mb-4`}>
                                <Icon size={20} weight="duotone" className="sm:w-6 sm:h-6" />
                            </div>
                            <p className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</p>
                            <p className="text-white/60 text-xs sm:text-sm">{stat.label}</p>
                        </Link>
                    )
                })}
            </div>

            {/* Quick Actions */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                    <Link
                        href="/admin/verifications"
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-[#df2531] text-white text-sm font-medium hover:bg-[#c41f2a] transition-colors focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black"
                        aria-label="Review pending verifications"
                    >
                        <UserCheck size={18} weight="bold" />
                        Review Pending
                    </Link>
                    <Link
                        href="/admin/payouts"
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black"
                        aria-label="Process withdrawal requests"
                    >
                        <Money size={18} weight="bold" />
                        Process Withdrawals
                    </Link>
                    <Link
                        href="/admin/disputes"
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black ${pendingDisputes > 0 ? 'bg-amber-500/80 hover:bg-amber-600' : 'bg-white/10 hover:bg-white/20'
                            }`}
                        aria-label="Resolve disputes"
                    >
                        <Warning size={18} weight="bold" />
                        Resolve Disputes
                    </Link>
                    <Link
                        href="/admin/talents"
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black"
                        aria-label="Manage talents"
                    >
                        <Users size={18} weight="bold" />
                        Manage Talents
                    </Link>
                    <Link
                        href="/admin/deposits"
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black"
                        aria-label="View deposits"
                    >
                        <Money size={18} weight="bold" />
                        View Deposits
                    </Link>
                    <Link
                        href="/admin/analytics"
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black"
                        aria-label="View platform analytics and reports"
                    >
                        <CalendarCheck size={18} weight="bold" />
                        View Reports
                    </Link>
                </div>
            </div>
        </div>
    )
}
