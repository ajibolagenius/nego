'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { 
  House, User, Wallet, CalendarCheck, Heart, Gear, SignOut, 
  MagnifyingGlass, Coin, ArrowRight, SpinnerGap, MapPin,
  Plus, CaretRight, Briefcase, ChatCircle
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from '@/components/NotificationBell'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { OnboardingModal, useOnboarding } from '@/components/OnboardingModal'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Profile, Wallet as WalletType } from '@/types/database'
import { getTalentUrl } from '@/lib/talent-url'

interface FeaturedTalent {
  id: string
  display_name: string
  avatar_url: string | null
  location: string
  status: 'online' | 'offline'
  starting_price: number
}

interface DashboardClientProps {
  user: SupabaseUser
  profile: Profile | null
  wallet: WalletType | null
  featuredTalents?: FeaturedTalent[]
}

// Navigation items for clients
const clientNavItems = [
  { icon: House, label: 'Home', href: '/dashboard', active: true },
  { icon: MagnifyingGlass, label: 'Browse', href: '/dashboard/browse' },
  { icon: CalendarCheck, label: 'Bookings', href: '/dashboard/bookings' },
  { icon: ChatCircle, label: 'Messages', href: '/dashboard/messages' },
  { icon: Heart, label: 'Favorites', href: '/dashboard/favorites' },
  { icon: Wallet, label: 'Wallet', href: '/dashboard/wallet' },
  { icon: User, label: 'Profile', href: '/dashboard/profile' },
  { icon: Gear, label: 'Settings', href: '/dashboard/settings' },
]

// Navigation items for talents
const talentNavItems = [
  { icon: House, label: 'Home', href: '/dashboard', active: true },
  { icon: Briefcase, label: 'Talent Dashboard', href: '/dashboard/talent' },
  { icon: CalendarCheck, label: 'Bookings', href: '/dashboard/bookings' },
  { icon: ChatCircle, label: 'Messages', href: '/dashboard/messages' },
  { icon: Wallet, label: 'Wallet', href: '/dashboard/wallet' },
  { icon: User, label: 'Profile', href: '/dashboard/profile' },
  { icon: Gear, label: 'Settings', href: '/dashboard/settings' },
]

export function DashboardClient({ user, profile, wallet, featuredTalents = [] }: DashboardClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
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

  return (
    <>
    <div className="min-h-screen bg-black flex pt-16 lg:pt-0 pb-20 lg:pb-0">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white/5 border-r border-white/10">
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
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    item.active
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
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Search */}
            <div className="relative max-w-md flex-1">
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="text"
                placeholder="Search talents, locations..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50 transition-colors text-sm"
              />
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4 ml-6">
              {/* Notifications */}
              <NotificationBell userId={user.id} />

              {/* Wallet balance */}
              <Link 
                href="/dashboard/wallet"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#df2531]/10 border border-[#df2531]/20 hover:bg-[#df2531]/20 transition-all"
              >
                <Coin size={18} weight="duotone" className="text-[#df2531]" />
                <span className="text-white font-medium text-sm">{wallet?.balance || 0} coins</span>
                <Plus size={14} weight="bold" className="text-[#df2531]" />
              </Link>

              {/* Profile */}
              <Link href="/dashboard/profile" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#df2531] flex items-center justify-center text-white font-bold">
                  {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 👋
            </h1>
            <p className="text-white/50">Discover elite talent and book unforgettable experiences.</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <Coin size={24} weight="duotone" className="text-[#df2531]" />
                <span className="text-green-400 text-xs">+15%</span>
              </div>
              <p className="text-white/50 text-xs mb-1">Coin Balance</p>
              <p className="text-white text-xl font-bold">{wallet?.balance || 0}</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <CalendarCheck size={24} weight="duotone" className="text-[#df2531]" />
              </div>
              <p className="text-white/50 text-xs mb-1">Active Bookings</p>
              <p className="text-white text-xl font-bold">0</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <Heart size={24} weight="duotone" className="text-[#df2531]" />
              </div>
              <p className="text-white/50 text-xs mb-1">Favorites</p>
              <p className="text-white text-xl font-bold">0</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <User size={24} weight="duotone" className="text-[#df2531]" />
              </div>
              <p className="text-white/50 text-xs mb-1">Profile Status</p>
              <p className="text-white text-xl font-bold">{profile?.is_verified ? 'Verified' : 'Pending'}</p>
            </div>
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
                    <Image
                      src={talent.avatar_url || 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80'}
                      alt={talent.display_name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    
                    {/* Status */}
                    <div className="absolute top-3 right-3">
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        talent.status === 'online' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-white/10 text-white/60'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          talent.status === 'online' ? 'bg-green-400' : 'bg-white/40'
                        }`} />
                        {talent.status === 'online' ? 'Online' : 'Offline'}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center gap-1.5 text-white/80 text-xs mb-1">
                        <MapPin size={12} weight="fill" />
                        <span>{talent.location}</span>
                      </div>
                      <p className="text-white/60 text-xs">From {formatPrice(talent.starting_price)}</p>
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
