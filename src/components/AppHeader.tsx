'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  List, X, Coin, CaretDown, User, SignOut, House, Heart, 
  CalendarCheck, Wallet, Gear, ChatCircle, MagnifyingGlass,
  Briefcase, ShieldCheck
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from '@/components/NotificationBell'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface AppHeaderProps {
  initialUser?: SupabaseUser | null
  userRole?: 'client' | 'talent' | 'admin'
}

export function AppHeader({ initialUser, userRole }: AppHeaderProps) {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeLink, setActiveLink] = useState('home')
  const [user, setUser] = useState<SupabaseUser | null>(initialUser || null)
  const [isLoading, setIsLoading] = useState(!initialUser)
  const [role, setRole] = useState<string | null>(userRole || null)

  // Check auth state
  useEffect(() => {
    const supabase = createClient()
    
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user && !role) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        setRole(profile?.role || 'client')
      }
      
      setIsLoading(false)
    }

    if (!initialUser) {
      checkUser()
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [initialUser, role])

  // Scroll handler for landing page
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
      
      if (pathname === '/') {
        const sections = ['home', 'about', 'talent', 'premium']
        for (const section of sections) {
          const element = document.getElementById(section)
          if (element) {
            const rect = element.getBoundingClientRect()
            if (rect.top <= 100 && rect.bottom >= 100) {
              setActiveLink(section)
              break
            }
          }
        }
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [pathname])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = '/'
  }

  const isLandingPage = pathname === '/'
  const isAuthPage = pathname === '/login' || pathname === '/register'
  const isDashboardPage = pathname?.startsWith('/dashboard')
  const isAdminPage = pathname?.startsWith('/admin')

  // Navigation links for landing page
  const landingNavLinks = [
    { name: 'Home', href: '#home', id: 'home' },
    { name: 'About us', href: '#about', id: 'about' },
    { name: 'Collection', href: '#talent', id: 'talent' },
    { name: 'Private Content', href: '#premium', id: 'premium' },
  ]

  // Navigation links for authenticated clients
  const clientNavLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: House },
    { name: 'Browse', href: '/dashboard/browse', icon: MagnifyingGlass },
    { name: 'Bookings', href: '/dashboard/bookings', icon: CalendarCheck },
    { name: 'Messages', href: '/dashboard/messages', icon: ChatCircle },
    { name: 'Favorites', href: '/dashboard/favorites', icon: Heart },
    { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
  ]

  // Navigation links for talents
  const talentNavLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: House },
    { name: 'Talent Hub', href: '/dashboard/talent', icon: Briefcase },
    { name: 'Bookings', href: '/dashboard/bookings', icon: CalendarCheck },
    { name: 'Messages', href: '/dashboard/messages', icon: ChatCircle },
    { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
  ]

  const authNavLinks = role === 'talent' ? talentNavLinks : clientNavLinks

  // Hide header completely on admin pages
  if (isAdminPage) {
    return null
  }

  // Hide header on dashboard pages on large screens (dashboard has its own sidebar)
  const hideOnLargeScreens = isDashboardPage ? 'lg:hidden' : ''

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${hideOnLargeScreens} ${
      isScrolled || !isLandingPage ? 'bg-black/90 backdrop-blur-xl border-b border-white/5 py-2' : 'bg-transparent py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center group"
            onClick={() => setActiveLink('home')}
          >
            <span className="text-xl md:text-2xl logo-font transition-all duration-300 group-hover:scale-105">
              <span className="text-white">NEGO</span>
              <span className="text-[#df2531] transition-all duration-300 group-hover:animate-pulse">.</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {isLandingPage && !user ? (
              // Landing page nav for non-authenticated users
              landingNavLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setActiveLink(link.id)}
                  className="relative px-4 py-2 group"
                >
                  <span className={`transition-colors duration-300 text-sm font-medium ${
                    activeLink === link.id ? 'text-white' : 'text-white/50 group-hover:text-white'
                  }`}>
                    {link.name}
                  </span>
                  <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-[#df2531] transition-all duration-300 ${
                    activeLink === link.id ? 'w-6' : 'w-0 group-hover:w-4'
                  }`} />
                </a>
              ))
            ) : user ? (
              // Nav for authenticated users
              authNavLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`relative px-4 py-2 group flex items-center gap-2 ${
                    pathname === link.href ? 'text-white' : 'text-white/50 hover:text-white'
                  }`}
                >
                  <link.icon size={16} weight={pathname === link.href ? 'fill' : 'regular'} />
                  <span className="text-sm font-medium">{link.name}</span>
                </Link>
              ))
            ) : null}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isLoading ? (
              <div className="w-20 h-8 bg-white/10 rounded-full animate-pulse" />
            ) : user ? (
              // Authenticated user buttons
              <>
                {/* Notification Bell */}
                <NotificationBell userId={user.id} />
                
                <Link href="/dashboard/wallet">
                  <Button 
                    className="relative bg-[#df2531]/10 hover:bg-[#df2531]/20 text-white font-medium px-4 py-2 rounded-full flex items-center gap-2 border border-[#df2531]/30 transition-all duration-300 text-sm"
                  >
                    <Coin size={18} weight="duotone" className="text-[#df2531]" />
                    <span>Buy Tokens</span>
                  </Button>
                </Link>
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-all">
                    <div className="w-8 h-8 rounded-full bg-[#df2531] flex items-center justify-center text-white text-sm font-bold">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <CaretDown size={14} className="text-white/60" />
                  </button>
                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-2 w-48 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                    <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                      <User size={18} />
                      <span className="text-sm">Profile</span>
                    </Link>
                    <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                      <Gear size={18} />
                      <span className="text-sm">Settings</span>
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-red-400 hover:bg-white/5 transition-colors w-full"
                    >
                      <SignOut size={18} />
                      <span className="text-sm">Logout</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              // Non-authenticated user buttons
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-white/70 hover:text-white text-sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="ghost" className="text-white/70 hover:text-white text-sm">
                    Register
                  </Button>
                </Link>
                <Link href="/dashboard/wallet">
                  <Button 
                    className="relative bg-white/10 hover:bg-[#df2531] text-white font-medium px-4 lg:px-5 py-2 lg:py-2.5 rounded-full flex items-center gap-2 border border-white/10 hover:border-[#df2531] transition-all duration-500 text-sm group overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-[#df2531] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                    <Coin size={18} weight="duotone" className="relative z-10 text-[#df2531] group-hover:text-white transition-colors duration-300" />
                    <span className="relative z-10">Buy Tokens</span>
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-white transition-transform duration-300 hover:scale-110"
          >
            <div className={`transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : 'rotate-0'}`}>
              {isMenuOpen ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/5 transition-all duration-500 ${
          isMenuOpen ? 'opacity-100 translate-y-0 max-h-[85vh] overflow-y-auto' : 'opacity-0 -translate-y-4 max-h-0 overflow-hidden'
        }`}>
          <nav className="flex flex-col py-4">
            {isLandingPage && !user ? (
              // Landing page mobile nav
              <>
                {landingNavLinks.map((link, index) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => { setIsMenuOpen(false); setActiveLink(link.id); }}
                    className={`text-white/70 hover:text-white hover:bg-white/5 px-6 py-3 transition-all duration-300 transform ${
                      isMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                    }`}
                    style={{ transitionDelay: `${index * 75}ms` }}
                  >
                    {link.name}
                  </a>
                ))}
              </>
            ) : user ? (
              // Authenticated mobile nav - Full navigation
              <>
                {authNavLinks.map((link, index) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-6 py-3 transition-all duration-300 ${
                      pathname === link.href ? 'text-white bg-[#df2531]/10 border-l-2 border-[#df2531]' : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    <link.icon size={20} weight={pathname === link.href ? 'fill' : 'regular'} />
                    {link.name}
                  </Link>
                ))}
                
                {/* Divider */}
                <div className="my-3 mx-6 border-t border-white/10" />
                
                {/* Profile & Settings */}
                <Link
                  href="/dashboard/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                    pathname === '/dashboard/profile' ? 'text-white bg-[#df2531]/10 border-l-2 border-[#df2531]' : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <User size={20} weight={pathname === '/dashboard/profile' ? 'fill' : 'regular'} />
                  Profile
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                    pathname === '/dashboard/settings' ? 'text-white bg-[#df2531]/10 border-l-2 border-[#df2531]' : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Gear size={20} weight={pathname === '/dashboard/settings' ? 'fill' : 'regular'} />
                  Settings
                </Link>
              </>
            ) : null}

            {/* Auth links for mobile */}
            <div className="px-6 py-4 mt-2 border-t border-white/10 space-y-3">
              {user ? (
                <>
                  <Link 
                    href="/dashboard/wallet" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 text-[#df2531] font-medium"
                  >
                    <Coin size={20} weight="duotone" />
                    Buy Tokens
                  </Link>
                  <button 
                    onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                    className="flex items-center gap-2 text-white/70 hover:text-red-400 transition-colors"
                  >
                    <SignOut size={20} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-white/70 hover:text-white py-2"
                  >
                    Login
                  </Link>
                  <Link 
                    href="/register" 
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-[#df2531] font-medium py-2"
                  >
                    Register
                  </Link>
                  <Link 
                    href="/dashboard/wallet" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 text-white/70 hover:text-white py-2"
                  >
                    <Coin size={18} weight="duotone" className="text-[#df2531]" />
                    Buy Tokens
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
