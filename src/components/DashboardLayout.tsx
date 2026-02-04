'use client'

import {
    House, User, Wallet, CalendarCheck, Heart, Gear, SignOut,
    MagnifyingGlass, Coin, Plus, Briefcase, ChatCircle, SpinnerGap,
    Gift, Bell, Warning
} from '@phosphor-icons/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { NotificationBell } from '@/components/NotificationBell'
import { useWallet } from '@/hooks/useWallet'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Wallet as WalletType } from '@/types/database'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface DashboardLayoutProps {
    user: SupabaseUser
    profile: Profile | null
    wallet: WalletType | null
    children: React.ReactNode
    showSearch?: boolean
    title?: string
    subtitle?: string
}

// Navigation items for clients
const clientNavItems = [
    { icon: House, label: 'Home', href: '/dashboard' },
    { icon: MagnifyingGlass, label: 'Browse', href: '/dashboard/browse' },
    { icon: CalendarCheck, label: 'Bookings', href: '/dashboard/bookings' },
    { icon: ChatCircle, label: 'Messages', href: '/dashboard/messages' },
    { icon: Heart, label: 'Favorites', href: '/dashboard/favorites' },
    { icon: Warning, label: 'Disputes', href: '/dashboard/disputes' },
    { icon: Gift, label: 'Gift History', href: '/dashboard/gifts' },
    { icon: Wallet, label: 'Wallet', href: '/dashboard/wallet' },
    { icon: Bell, label: 'Notifications', href: '/dashboard/notifications' },
    { icon: User, label: 'Profile', href: '/dashboard/profile' },
    { icon: Gear, label: 'Settings', href: '/dashboard/settings' },
]

// Navigation items for talents
const talentNavItems = [
    { icon: House, label: 'Home', href: '/dashboard' },
    { icon: Briefcase, label: 'Talent Dashboard', href: '/dashboard/talent' },
    { icon: CalendarCheck, label: 'Bookings', href: '/dashboard/bookings' },
    { icon: ChatCircle, label: 'Messages', href: '/dashboard/messages' },
    { icon: Warning, label: 'Disputes', href: '/dashboard/disputes' },
    { icon: Gift, label: 'Gift History', href: '/dashboard/gifts' },
    { icon: Wallet, label: 'Wallet', href: '/dashboard/wallet' },
    { icon: Bell, label: 'Notifications', href: '/dashboard/notifications' },
    { icon: User, label: 'Profile', href: '/dashboard/profile' },
    { icon: Gear, label: 'Settings', href: '/dashboard/settings' },
]

export function DashboardLayout({
    user,
    profile,
    wallet: initialWallet,
    children,
    showSearch = true,
    title,
    subtitle
}: DashboardLayoutProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [loading, setLoading] = useState(false)

    // Real-time wallet synchronization
    const { wallet } = useWallet({ userId: user.id, initialWallet })

    const isTalent = profile?.role === 'talent'
    const navItems = isTalent ? talentNavItems : clientNavItems
    const userRole = isTalent ? 'talent' : 'client'

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return pathname === '/dashboard'
        }
        return pathname?.startsWith(href)
    }

    const handleLogout = async () => {
        setLoading(true)
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    return (
        <>
            <div className="min-h-screen bg-black flex pt-16 lg:pt-0 pb-20 lg:pb-0">
                {/* Sidebar - Desktop Only */}
                <aside className="hidden lg:flex flex-col w-64 bg-white/5 border-r border-white/10 fixed left-0 top-0 bottom-0">
                    {/* Logo */}
                    <div className="p-6 border-b border-white/10">
                        <Link href="/" className="flex items-center">
                            <span className="text-2xl logo-font">
                                <span className="text-white">NEGO</span>
                                <span className="text-[#df2531]">.</span>
                            </span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 overflow-y-auto">
                        <ul className="space-y-2">
                            {navItems.map((item) => {
                                const active = isActive(item.href)
                                return (
                                    <li key={item.label}>
                                        <Link
                                            href={item.href}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${active
                                                    ? 'bg-[#df2531] text-white'
                                                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                                                }`}
                                        >
                                            <item.icon size={20} weight={active ? 'fill' : 'regular'} />
                                            <span className="text-sm font-medium">{item.label}</span>
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </nav>

                    {/* Logout */}
                    <div className="p-4 border-t border-white/10">
                        <button
                            onClick={handleLogout}
                            disabled={loading}
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all duration-300"
                        >
                            {loading ? (
                                <SpinnerGap size={20} className="animate-spin" />
                            ) : (
                                <SignOut size={20} />
                            )}
                            <span className="text-sm font-medium">Logout</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 lg:ml-64 overflow-auto">
                    {/* Header */}
                    <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
                        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
                            {/* Title or Search */}
                            {title ? (
                                <div>
                                    <h1 className="text-lg sm:text-xl font-bold text-white">{title}</h1>
                                    {subtitle && <p className="text-white/50 text-sm">{subtitle}</p>}
                                </div>
                            ) : showSearch ? (
                                <div className="relative max-w-md flex-1">
                                    <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search talents, locations..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50 transition-colors text-sm"
                                    />
                                </div>
                            ) : (
                                <div />
                            )}

                            {/* Right side */}
                            <div className="flex items-center gap-2 sm:gap-4 ml-4">
                                {/* Notifications */}
                                <NotificationBell userId={user.id} />

                                {/* Wallet balance - Hidden on very small screens */}
                                <Link
                                    href="/dashboard/wallet"
                                    className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-[#df2531]/10 border border-[#df2531]/20 hover:bg-[#df2531]/20 transition-all"
                                >
                                    <Coin size={18} weight="duotone" className="text-[#df2531]" />
                                    <div className="flex flex-col items-end">
                                        <span className="text-white font-medium text-sm">{wallet?.balance || 0}</span>
                                        <span className="text-white/50 text-[10px]">₦{((wallet?.balance || 0) * 10).toLocaleString()}</span>
                                    </div>
                                    <Plus size={14} weight="bold" className="text-[#df2531]" />
                                </Link>

                                {/* Profile */}
                                <Link href="/dashboard/profile" className="flex items-center">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#df2531] flex items-center justify-center text-white font-bold text-sm">
                                        {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </header>

                    {/* Page Content */}
                    <div className="p-4 sm:p-6">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav userRole={userRole} />
        </>
    )
}
