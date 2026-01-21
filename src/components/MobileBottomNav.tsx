'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  House, MagnifyingGlass, CalendarCheck, ChatCircle, User,
  Briefcase, Wallet, Heart, Gear, Gift, Bell, List, X, Warning
} from '@phosphor-icons/react'

interface MobileBottomNavProps {
  userRole?: 'client' | 'talent' | 'admin'
}

export function MobileBottomNav({ userRole = 'client' }: MobileBottomNavProps) {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Primary navigation items (shown in bottom bar)
  const clientPrimaryNav = [
    { icon: House, label: 'Home', href: '/dashboard' },
    { icon: MagnifyingGlass, label: 'Browse', href: '/dashboard/browse' },
    { icon: CalendarCheck, label: 'Bookings', href: '/dashboard/bookings' },
    { icon: ChatCircle, label: 'Messages', href: '/dashboard/messages' },
  ]

  const talentPrimaryNav = [
    { icon: House, label: 'Home', href: '/dashboard' },
    { icon: Briefcase, label: 'Dashboard', href: '/dashboard/talent' },
    { icon: CalendarCheck, label: 'Bookings', href: '/dashboard/bookings' },
    { icon: ChatCircle, label: 'Messages', href: '/dashboard/messages' },
  ]

  // All navigation items (shown in hamburger menu)
  const clientAllNav = [
    { icon: House, label: 'Home', href: '/dashboard' },
    { icon: MagnifyingGlass, label: 'Browse Talents', href: '/dashboard/browse' },
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

  const talentAllNav = [
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

  const primaryNav = userRole === 'talent' ? talentPrimaryNav : clientPrimaryNav
  const allNav = userRole === 'talent' ? talentAllNav : clientAllNav

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname?.startsWith(href)
  }

  return (
    <>
      {/* Hamburger Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        >
          <div 
            className="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-white/20 rounded-full" />
            </div>
            
            {/* Close button */}
            <div className="flex justify-between items-center px-6 py-2 border-b border-white/10">
              <span className="text-lg font-semibold text-white">Menu</span>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-white/60"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Menu Items */}
            <nav className="p-4 space-y-1">
              {allNav.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                      active 
                        ? 'bg-[#df2531] text-white' 
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                    data-testid={`mobile-menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <item.icon size={24} weight={active ? 'fill' : 'regular'} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
            
            {/* Safe area padding */}
            <div className="h-8" />
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-t border-white/10 lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around py-2 px-2">
          {primaryNav.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 min-w-[60px] ${
                  active 
                    ? 'text-[#df2531] bg-[#df2531]/10' 
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
                data-testid={`mobile-nav-${item.label.toLowerCase()}`}
              >
                <item.icon 
                  size={22} 
                  weight={active ? 'fill' : 'regular'} 
                />
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
              </Link>
            )
          })}
          
          {/* More/Menu Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 min-w-[60px] ${
              isMenuOpen 
                ? 'text-[#df2531] bg-[#df2531]/10' 
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
            data-testid="mobile-nav-more"
          >
            <List size={22} weight="regular" />
            <span className="text-[10px] font-medium mt-1">More</span>
          </button>
        </div>
      </nav>
    </>
  )
}
