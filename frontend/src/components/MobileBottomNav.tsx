'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  House, MagnifyingGlass, CalendarCheck, ChatCircle, User,
  Briefcase, Wallet, Heart, Gear
} from '@phosphor-icons/react'

interface MobileBottomNavProps {
  userRole?: 'client' | 'talent' | 'admin'
}

export function MobileBottomNav({ userRole = 'client' }: MobileBottomNavProps) {
  const pathname = usePathname()

  // Navigation items based on role
  const clientNavItems = [
    { icon: House, label: 'Home', href: '/dashboard' },
    { icon: MagnifyingGlass, label: 'Browse', href: '/dashboard/browse' },
    { icon: CalendarCheck, label: 'Bookings', href: '/dashboard/bookings' },
    { icon: ChatCircle, label: 'Messages', href: '/dashboard/messages' },
    { icon: User, label: 'Profile', href: '/dashboard/profile' },
  ]

  const talentNavItems = [
    { icon: House, label: 'Home', href: '/dashboard' },
    { icon: Briefcase, label: 'Dashboard', href: '/dashboard/talent' },
    { icon: CalendarCheck, label: 'Bookings', href: '/dashboard/bookings' },
    { icon: ChatCircle, label: 'Messages', href: '/dashboard/messages' },
    { icon: User, label: 'Profile', href: '/dashboard/profile' },
  ]

  const navItems = userRole === 'talent' ? talentNavItems : clientNavItems

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname?.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-t border-white/10 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => {
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
      </div>
    </nav>
  )
}
