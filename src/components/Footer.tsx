'use client'

import Link from 'next/link'
import {
  InstagramLogo, TwitterLogo, TiktokLogo,
  MapPin, Envelope
} from '@phosphor-icons/react'

interface FooterProps {
  variant?: 'full' | 'simple' | 'minimal'
}

export function Footer({ variant = 'simple' }: FooterProps) {
  const currentYear = new Date().getFullYear()

  if (variant === 'minimal') {
    return (
      <footer className="bg-black border-t border-white/5 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-white/40 text-sm">
            © {currentYear} Nego. All rights reserved.
          </p>
        </div>
      </footer>
    )
  }

  if (variant === 'simple') {
    return (
      <footer className="bg-black border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="text-xl logo-font">
              <span className="text-white">NEGO</span>
              <span className="text-[#df2531]">.</span>
            </Link>

            {/* Links */}
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <Link href="/terms" className="text-white/50 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-white/50 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/cookies" className="text-white/50 hover:text-white transition-colors">
                Cookie Policy
              </Link>
            </nav>

            {/* Copyright */}
            <p className="text-white/40 text-sm">
              © {currentYear} Nego
            </p>
          </div>
        </div>
      </footer>
    )
  }

  // Full footer
  return (
    <footer className="bg-black border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block text-2xl logo-font mb-4">
              <span className="text-white">NEGO</span>
              <span className="text-[#df2531]">.</span>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              The premier managed marketplace connecting discerning clients with verified, elite talent. Excellence with discretion.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-[#df2531]/20 transition-all">
                <InstagramLogo size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-[#df2531]/20 transition-all">
                <TwitterLogo size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-[#df2531]/20 transition-all">
                <TiktokLogo size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <nav className="flex flex-col gap-3">
              <Link href="/dashboard/browse" className="text-white/50 hover:text-white transition-colors text-sm">
                Browse Talent
              </Link>
              <Link href="/register?role=talent" className="text-white/50 hover:text-white transition-colors text-sm">
                Become a Talent
              </Link>
              <Link href="/dashboard/wallet" className="text-white/50 hover:text-white transition-colors text-sm">
                Buy Tokens
              </Link>
              <Link href="/login" className="text-white/50 hover:text-white transition-colors text-sm">
                Login
              </Link>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <nav className="flex flex-col gap-3">
              <Link href="/terms" className="text-white/50 hover:text-white transition-colors text-sm">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-white/50 hover:text-white transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link href="/cookies" className="text-white/50 hover:text-white transition-colors text-sm">
                Cookie Policy
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <div className="flex flex-col gap-3">
              <a href="mailto:support@nego.app" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm">
                <Envelope size={16} />
                support@nego.app
              </a>
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <MapPin size={16} />
                Lagos, Nigeria
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            © {currentYear} Nego. All rights reserved.
          </p>
          <p className="text-white/30 text-xs">
            Excellence with discretion.
          </p>
        </div>
      </div>
    </footer>
  )
}
