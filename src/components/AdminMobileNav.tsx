'use client'

import { House, UserCheck, Money, ChartLine, Users } from '@phosphor-icons/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AdminMobileNav() {
    const pathname = usePathname()

    const navItems = [
        { icon: House, label: 'Dashboard', href: '/admin' },
        { icon: UserCheck, label: 'Verify', href: '/admin/verifications' },
        { icon: Users, label: 'Talents', href: '/admin/talents' },
        { icon: Money, label: 'Payouts', href: '/admin/payouts' },
        { icon: ChartLine, label: 'Analytics', href: '/admin/analytics' },
    ]

    const isActive = (href: string) => {
        if (href === '/admin') {
            return pathname === '/admin'
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
                            className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 min-w-[60px] ${active
                                    ? 'text-[#df2531] bg-[#df2531]/10'
                                    : 'text-white/50 hover:text-white hover:bg-white/5'
                                }`}
                            data-testid={`admin-mobile-nav-${item.label.toLowerCase()}`}
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
