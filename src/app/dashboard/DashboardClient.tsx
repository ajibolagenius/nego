'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
    House, User, Wallet, CalendarCheck, Heart, Gear, SignOut,
    MagnifyingGlass, Coin, ArrowRight, SpinnerGap, MapPin,
    Plus, CaretRight, Briefcase, ChatCircle, Gift, Bell, CheckCircle, X, Warning, Envelope
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from '@/components/NotificationBell'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { OnboardingModal, useOnboarding } from '@/components/OnboardingModal'
import { AvatarPlaceholder } from '@/components/AvatarPlaceholder'
import { useWallet } from '@/hooks/useWallet'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Profile, Wallet as WalletType } from '@/types/database'
import { getTalentUrl } from '@/lib/talent-url'

// Use full Profile type with talent_menus for featured talents
interface TalentWithMenu extends Profile {
    talent_menus?: Array<{
        id: string
        price: number
        is_active: boolean
        service_type?: {
            id: string
            name: string
            icon: string | null
            description: string | null
        }
    }>
}

interface DashboardClientProps {
    user: SupabaseUser
    profile: Profile | null
    wallet: WalletType | null
    featuredTalents?: TalentWithMenu[]
    activeBookings?: number
    favoritesCount?: number
    showVerificationSuccess?: boolean
}

// Navigation items for clients
const clientNavItems = [
    { icon: House, label: 'Home', href: '/dashboard', active: true },
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
    { icon: House, label: 'Home', href: '/dashboard', active: true },
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

export function DashboardClient({ user, profile, wallet: initialWallet, featuredTalents = [], activeBookings = 0, favoritesCount = 0, showVerificationSuccess = false }: DashboardClientProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [showSuccessBanner, setShowSuccessBanner] = useState(showVerificationSuccess)
    const [showVerificationBanner, setShowVerificationBanner] = useState(false)
    const [sendingVerificationEmail, setSendingVerificationEmail] = useState(false)
    const [verificationEmailSent, setVerificationEmailSent] = useState(false)

    // Real-time wallet synchronization
    const { wallet } = useWallet({ userId: user.id, initialWallet })

    // Check if client needs verification (based on is_verified in profiles table, not Supabase email confirmation)
    // Show banner if is_verified is false, null, or undefined (treat null/undefined as unverified)
    const needsVerification = profile?.role === 'client' && profile?.is_verified !== true

    // Temporary flag: hide manual verification banner/UI for clients
    // The verification status is not currently tied to any critical activities,
    // so we disable the banner until the email flow is fully resolved.
    const showClientVerificationUI = false

    // Show verification banner if needed (currently disabled via showClientVerificationUI)
    useEffect(() => {
        if (showClientVerificationUI && needsVerification && !showSuccessBanner) {
            setShowVerificationBanner(true)
        }
    }, [needsVerification, showSuccessBanner, showClientVerificationUI])

    const handleSendVerificationEmail = async () => {
        setSendingVerificationEmail(true)
        console.log('[Dashboard] Sending verification email request...')
        try {
            const response = await fetch('/api/auth/send-verification-email', {
                method: 'POST',
            })

            console.log('[Dashboard] Response status:', response.status, response.statusText)

            let data
            try {
                data = await response.json()
                console.log('[Dashboard] Response data:', data)
            } catch (jsonError) {
                const text = await response.text()
                console.error('[Dashboard] Failed to parse JSON response:', text)
                alert('Failed to send verification email. Server returned invalid response.')
                setSendingVerificationEmail(false)
                return
            }

            if (response.ok) {
                console.log('[Dashboard] Verification email sent successfully')
                setVerificationEmailSent(true)
                setTimeout(() => {
                    setShowVerificationBanner(false)
                }, 5000)
            } else {
                console.error('[Dashboard] Failed to send verification email:', data.error, data)
                // Handle rate limiting specifically
                if (response.status === 429 && data.rateLimited) {
                    const retryAfter = data.retryAfter || 60
                    alert(`Please wait ${retryAfter} seconds before requesting another verification email. This is a security measure to prevent spam.`)
                } else {
                    alert(data.error || 'Failed to send verification email. Please try again.')
                }
            }
        } catch (error) {
            console.error('[Dashboard] Error sending verification email:', error)
            alert('Failed to send verification email. Please try again.')
        } finally {
            setSendingVerificationEmail(false)
        }
    }

    // Use featuredTalents from props, fallback to empty array
    const talents = featuredTalents.length > 0 ? featuredTalents : []

    const isTalent = profile?.role === 'talent'
    const navItems = isTalent ? talentNavItems : clientNavItems
    const userRole = isTalent ? 'talent' : 'client'

    // Onboarding modal
    const { showOnboarding, completeOnboarding } = useOnboarding(userRole, user.id)

    const handleLogout = async () => {
        setLoading(true)
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    const formatPrice = (price: number) => {
        return `${new Intl.NumberFormat('en-NG', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price)} coins`
    }

    // Helper to get minimum price from talent menus
    const getMinPrice = (talent: TalentWithMenu): number => {
        if (talent.talent_menus && talent.talent_menus.length > 0) {
            const activePrices = talent.talent_menus
                .filter(m => m.is_active)
                .map(m => m.price)
            if (activePrices.length > 0) {
                return Math.min(...activePrices)
            }
        }
        return talent.starting_price || 0
    }

    return (
        <>
            {/* Verification Success Banner */}
            {showSuccessBanner && profile?.role === 'client' && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-green-500/10 border-b border-green-500/20 backdrop-blur-xl">
                    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CheckCircle size={20} weight="duotone" className="text-green-400 shrink-0" />
                            <p className="text-green-400 text-sm font-medium">
                                Email verified successfully! Your account is now fully activated.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowSuccessBanner(false)}
                            className="text-green-400/60 hover:text-green-400 transition-colors"
                            aria-label="Dismiss notification"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Verification Pending Banner (temporarily disabled while email flow is being fixed) */}
            {showClientVerificationUI && showVerificationBanner && needsVerification && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/10 border-b border-amber-500/20 backdrop-blur-xl">
                    <div className="max-w-7xl mx-auto px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1">
                                <Warning size={20} weight="duotone" className="text-amber-400 shrink-0" />
                                <div className="flex-1">
                                    <p className="text-amber-400 text-sm font-medium">
                                        {verificationEmailSent
                                            ? 'Verification email sent! Please check your inbox.'
                                            : 'Account verification pending. Verify your email to unlock all features.'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {!verificationEmailSent && (
                                    <Button
                                        onClick={handleSendVerificationEmail}
                                        disabled={sendingVerificationEmail}
                                        size="sm"
                                        className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3 py-1.5 h-auto"
                                    >
                                        {sendingVerificationEmail ? (
                                            <>
                                                <SpinnerGap size={14} className="animate-spin mr-1.5" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Envelope size={14} className="mr-1.5" />
                                                Send Verification Email
                                            </>
                                        )}
                                    </Button>
                                )}
                                <button
                                    onClick={() => setShowVerificationBanner(false)}
                                    className="text-amber-400/60 hover:text-amber-400 transition-colors"
                                    aria-label="Dismiss notification"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className={`min-h-screen bg-black flex pt-16 lg:pt-0 pb-20 lg:pb-0 ${(showSuccessBanner || showVerificationBanner) && profile?.role === 'client' ? 'pt-16' : ''}`}>
                {/* Sidebar - Fixed on desktop */}
                <aside className="hidden lg:flex flex-col w-64 bg-white/5 border-r border-white/10 fixed left-0 top-0 h-screen z-30 overflow-y-auto">
                    {/* Logo */}
                    <div className="p-6 border-b border-white/10 shrink-0">
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
                            {navItems.map((item) => (
                                <li key={item.label}>
                                    <Link
                                        href={item.href}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${item.active
                                            ? 'bg-[#df2531] text-white'
                                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <item.icon size={20} weight={item.active ? 'fill' : 'regular'} />
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Logout */}
                    <div className="p-4 border-t border-white/10 shrink-0">
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

                {/* Main Content - Offset for fixed sidebar on desktop */}
                <main className="flex-1 overflow-auto lg:ml-64">
                    {/* Header - Fixed on mobile, sticky on desktop */}
                    <header className="fixed lg:sticky top-[64px] lg:top-0 left-0 right-0 lg:left-auto lg:right-auto z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 border-t-0">
                        <div className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4">
                            {/* Search */}
                            <div className="relative max-w-md flex-1">
                                <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} aria-hidden="true" />
                                <input
                                    type="text"
                                    placeholder="Search talents, locations..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50 transition-colors text-sm"
                                    aria-label="Search talents and locations"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const query = e.currentTarget.value
                                            if (query.trim()) {
                                                router.push(`/dashboard/browse?q=${encodeURIComponent(query)}`)
                                            }
                                        }
                                    }}
                                />
                            </div>

                            {/* Right side */}
                            <div className="flex items-center gap-2 lg:gap-4 ml-2 lg:ml-6">
                                {/* Notifications */}
                                <NotificationBell userId={user.id} />

                                {/* Wallet balance */}
                                <Link
                                    href="/dashboard/wallet"
                                    className="flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-4 py-2 rounded-xl bg-[#df2531]/10 border border-[#df2531]/20 hover:bg-[#df2531]/20 transition-all"
                                    aria-label="View wallet"
                                >
                                    <Coin size={16} weight="duotone" className="text-[#df2531] lg:w-[18px] lg:h-[18px]" aria-hidden="true" />
                                    <span className="text-white font-medium text-xs lg:text-sm hidden sm:inline">{wallet?.balance || 0} coins</span>
                                    <span className="text-white font-medium text-xs lg:text-sm sm:hidden">{wallet?.balance || 0}</span>
                                    <Plus size={12} weight="bold" className="text-[#df2531] lg:w-[14px] lg:h-[14px] hidden sm:inline" aria-hidden="true" />
                                </Link>

                                {/* Profile */}
                                <Link href="/dashboard/profile" className="flex items-center gap-2 lg:gap-3" aria-label="View profile">
                                    <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-[#df2531] flex items-center justify-center text-white font-bold text-sm lg:text-base">
                                        {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </header>

                    {/* Content - Offset for fixed header on mobile */}
                    <div className="p-4 lg:p-6 pt-24 lg:pt-6">
                        {/* Welcome */}
                        <div className="mb-8">
                            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 👋
                            </h1>
                            <p className="text-white/50">Discover elite talent and book unforgettable experiences.</p>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <Link href="/dashboard/wallet" className="bg-white/5 rounded-2xl p-5 border border-white/10 hover:border-[#df2531]/30 transition-all">
                                <div className="flex items-center justify-between mb-3">
                                    <Coin size={24} weight="duotone" className="text-[#df2531]" />
                                </div>
                                <p className="text-white/50 text-xs mb-1">Coin Balance</p>
                                <p className="text-white text-xl font-bold">{wallet?.balance?.toLocaleString() || 0}</p>
                                <p className="text-white/40 text-xs mt-0.5">≈ ₦{((wallet?.balance || 0) * 10).toLocaleString()}</p>
                            </Link>
                            <Link href="/dashboard/bookings" className="bg-white/5 rounded-2xl p-5 border border-white/10 hover:border-[#df2531]/30 transition-all">
                                <div className="flex items-center justify-between mb-3">
                                    <CalendarCheck size={24} weight="duotone" className="text-[#df2531]" />
                                </div>
                                <p className="text-white/50 text-xs mb-1">Active Bookings</p>
                                <p className="text-white text-xl font-bold">{activeBookings}</p>
                            </Link>
                            <Link href="/dashboard/favorites" className="bg-white/5 rounded-2xl p-5 border border-white/10 hover:border-[#df2531]/30 transition-all">
                                <div className="flex items-center justify-between mb-3">
                                    <Heart size={24} weight="duotone" className="text-[#df2531]" />
                                </div>
                                <p className="text-white/50 text-xs mb-1">Favorites</p>
                                <p className="text-white text-xl font-bold">{favoritesCount}</p>
                            </Link>
                            <Link href="/dashboard/profile" className="bg-white/5 rounded-2xl p-5 border border-white/10 hover:border-[#df2531]/30 transition-all">
                                <div className="flex items-center justify-between mb-3">
                                    <User size={24} weight="duotone" className="text-[#df2531]" />
                                </div>
                                <p className="text-white/50 text-xs mb-1">Profile Status</p>
                                <p className="text-white text-xl font-bold">{profile?.is_verified ? 'Verified' : 'Pending'}</p>
                            </Link>
                        </div>

                        {/* Featured Talents */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Featured Talent</h2>
                                    <p className="text-white/50 text-sm">Top picks for you</p>
                                </div>
                                <Link href="/dashboard/browse" className="flex items-center gap-2 text-[#df2531] text-sm hover:underline">
                                    View All <CaretRight size={14} />
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {talents.length > 0 ? talents.map((talent) => (
                                    <Link
                                        key={talent.id}
                                        href={getTalentUrl(talent)}
                                        className="group bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-[#df2531]/30 transition-all duration-300"
                                    >
                                        <div className="aspect-[3/4] relative overflow-hidden">
                                            {talent.avatar_url ? (
                                                <Image
                                                    src={talent.avatar_url}
                                                    alt={talent.display_name || 'Talent'}
                                                    fill
                                                    sizes="(max-width: 768px) 50vw, 25vw"
                                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            ) : (
                                                <AvatarPlaceholder size="md" />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

                                            {/* Status */}
                                            <div className="absolute top-3 right-3">
                                                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${talent.status === 'online'
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                    : talent.status === 'booked'
                                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                        : 'bg-white/10 text-white/60 border border-white/10'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${talent.status === 'online' ? 'bg-green-400' : talent.status === 'booked' ? 'bg-amber-400' : 'bg-white/40'
                                                        }`} />
                                                    {talent.status === 'online' ? 'Online' : talent.status === 'booked' ? 'Booked' : 'Offline'}
                                                </span>
                                            </div>

                                            {/* Verified Badge */}
                                            {talent.is_verified && (
                                                <div className="absolute top-3 left-3">
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#df2531]/90 text-white text-xs backdrop-blur-sm">
                                                        <span className="text-[10px]">✓</span>
                                                        Verified
                                                    </span>
                                                </div>
                                            )}

                                            {/* Info */}
                                            <div className="absolute bottom-3 left-3 right-3">
                                                <h3 className="text-white font-medium text-sm mb-1 truncate">
                                                    {talent.display_name || 'Talent'}
                                                </h3>
                                                <div className="flex items-center gap-1.5 text-white/80 text-xs mb-1">
                                                    <MapPin size={12} weight="fill" aria-hidden="true" />
                                                    <span>{talent.location || 'Location not specified'}</span>
                                                </div>
                                                {getMinPrice(talent) > 0 && (
                                                    <p className="text-white/60 text-xs">From {formatPrice(getMinPrice(talent))}</p>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                )) : (
                                    <div className="col-span-full text-center py-8 text-white/50">
                                        <p>No featured talents available</p>
                                        <Link href="/dashboard/browse" className="text-[#df2531] hover:underline mt-2 inline-block">
                                            Browse all talents
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* CTA Banner */}
                        <div className="bg-gradient-to-r from-[#df2531]/20 to-[#df2531]/5 rounded-2xl p-6 md:p-8 border border-[#df2531]/20">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Get Premium Access</h3>
                                    <p className="text-white/60 text-sm">Unlock exclusive content and priority bookings</p>
                                </div>
                                <Button className="bg-[#df2531] hover:bg-[#c41f2a] text-white px-6 py-3 rounded-xl flex items-center gap-2">
                                    Upgrade Now <ArrowRight size={16} />
                                </Button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav userRole={userRole} />

            {/* Onboarding Modal */}
            <OnboardingModal
                role={userRole}
                isOpen={showOnboarding}
                onClose={completeOnboarding}
                onComplete={completeOnboarding}
            />
        </>
    )
}
