'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    ShieldCheck,
    UserCheck,
    Money,
    House,
    SignOut,
    ChartLine,
    List,
    X
} from '@phosphor-icons/react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { AdminMobileNav } from '@/components/AdminMobileNav'
import { Toaster } from '@/components/ui/sonner'

const navItems = [
    { href: '/admin', label: 'Dashboard', icon: House },
    { href: '/admin/verifications', label: 'Verifications', icon: UserCheck },
    { href: '/admin/payouts', label: 'Payouts', icon: Money },
    { href: '/admin/analytics', label: 'Analytics', icon: ChartLine },
]

interface AdminLayoutClientProps {
    user: SupabaseUser
    children: React.ReactNode
}

export function AdminLayoutClient({ user, children }: AdminLayoutClientProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const handleSignOut = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div className="min-h-screen bg-black">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/10">
                <div className="flex items-center justify-between px-4 py-3">
                    <Link href="/admin" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#df2531] flex items-center justify-center">
                            <ShieldCheck size={18} weight="bold" className="text-white" />
                        </div>
                        <span className="text-white font-bold">Admin</span>
                    </Link>

                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <List size={24} />}
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/10 py-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            const Icon = item.icon

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${isActive
                                            ? 'bg-[#df2531]/10 text-[#df2531]'
                                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            )
                        })}
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-3 text-white/60 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                            <SignOut size={20} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                )}
            </header>

            <div className="flex pt-14 lg:pt-0 pb-20 lg:pb-0">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:flex w-64 bg-[#0a0a0a] border-r border-white/10 flex-col fixed left-0 top-0 bottom-0">
                    {/* Logo */}
                    <div className="p-6 border-b border-white/10">
                        <Link href="/admin" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#df2531] flex items-center justify-center">
                                <ShieldCheck size={24} weight="bold" className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-white font-bold" style={{ fontFamily: 'Cinzel Decorative, serif' }}>
                                    NEGO
                                </h1>
                                <p className="text-white/40 text-xs">Admin Panel</p>
                            </div>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            const Icon = item.icon

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                            ? 'bg-[#df2531] text-white'
                                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/10">
                        <div className="flex items-center gap-3 px-4 py-3 text-white/60">
                            <div className="w-8 h-8 rounded-full bg-[#df2531]/20 flex items-center justify-center">
                                <span className="text-[#df2531] font-bold text-sm">
                                    {user.email?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">{user.email}</p>
                                <p className="text-white/40 text-xs">Administrator</p>
                            </div>
                        </div>

                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-xl text-white/60 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                            <SignOut size={20} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 lg:ml-64 overflow-auto min-h-screen">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <AdminMobileNav />

            {/* Toast Notifications */}
            <Toaster position="top-right" richColors />
        </div>
    )
}
