'use client'

import { House, ArrowLeft, MagnifyingGlass, Sparkle } from '@phosphor-icons/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        setIsVisible(true)
    }, [])

    return (
        <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
            {/* Animated background effects */}
            <div className="absolute inset-0">
                <div className={`absolute top-1/4 left-1/4 w-96 h-96 bg-[#df2531]/10 rounded-full blur-[150px] transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
                <div className={`absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#df2531]/5 rounded-full blur-[120px] transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-[#df2531]/30 rounded-full animate-float"
                        style={{
                            left: `${10 + i * 12}%`,
                            top: `${15 + (i % 4) * 20}%`,
                            animationDelay: `${i * 0.5}s`,
                            animationDuration: `${3 + i}s`
                        }}
                    />
                ))}
            </div>

            {/* Main Content */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                {/* 404 Number */}
                <div className={`mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '0.2s' }}>
                    <h1 className="text-[clamp(8rem,20vw,16rem)] font-black text-white leading-none tracking-tight">
                        <span className="text-[#df2531]">4</span>
                        <span className="text-white/20">0</span>
                        <span className="text-[#df2531]">4</span>
                    </h1>
                </div>

                {/* Error Message */}
                <div className={`mb-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '0.4s' }}>
                    <p className="text-[#df2531] tracking-[0.3em] uppercase text-xs md:text-sm font-semibold mb-4">
                        Page Not Found
                    </p>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4">
                        This Page Doesn't <span className="text-[#df2531]">Exist</span>
                    </h2>
                    <p className="text-white/60 text-base md:text-lg max-w-md mx-auto leading-relaxed">
                        The page you're looking for may have been moved, deleted, or doesn't exist.
                    </p>
                </div>

                {/* Decorative Element */}
                <div className={`flex items-center justify-center gap-2 mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '0.6s' }}>
                    <div className="h-px w-12 bg-gradient-to-r from-transparent via-[#df2531] to-transparent" />
                    <Sparkle size={20} weight="duotone" className="text-[#df2531]" />
                    <div className="h-px w-12 bg-gradient-to-r from-transparent via-[#df2531] to-transparent" />
                </div>

                {/* Action Buttons */}
                <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '0.8s' }}>
                    <Link href="/" aria-label="Go back to home page">
                        <Button
                            className="group relative bg-[#df2531] hover:bg-[#df2531]/90 text-white font-bold px-8 py-6 rounded-full text-base border-2 border-[#df2531] overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black"
                        >
                            <span className="relative flex items-center gap-3">
                                <House size={20} weight="fill" className="group-hover:scale-110 transition-transform duration-300" />
                                <span>Go Home</span>
                            </span>
                        </Button>
                    </Link>

                    <Link href="/dashboard" aria-label="Go to dashboard">
                        <Button
                            variant="outline"
                            className="group bg-white/5 hover:bg-white/10 text-white font-medium px-8 py-6 rounded-full text-base border-2 border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black"
                        >
                            <span className="flex items-center gap-3">
                                <ArrowLeft size={20} weight="bold" className="group-hover:-translate-x-1 transition-transform duration-300" />
                                <span>Back to Dashboard</span>
                            </span>
                        </Button>
                    </Link>

                    <Link href="/dashboard/browse" aria-label="Browse talents">
                        <Button
                            variant="ghost"
                            className="group text-white/70 hover:text-white font-medium px-6 py-6 rounded-full text-base transition-all duration-300 hover:bg-white/5"
                        >
                            <span className="flex items-center gap-2">
                                <MagnifyingGlass size={18} weight="bold" />
                                <span>Browse Talent</span>
                            </span>
                        </Button>
                    </Link>
                </div>

                {/* Helpful Links */}
                <div className={`mt-12 pt-8 border-t border-white/10 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '1s' }}>
                    <p className="text-white/40 text-sm mb-4">Or try one of these:</p>
                    <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                        <Link href="/dashboard" className="text-white/60 hover:text-[#df2531] transition-colors duration-300">
                            Dashboard
                        </Link>
                        <span className="text-white/20">•</span>
                        <Link href="/dashboard/browse" className="text-white/60 hover:text-[#df2531] transition-colors duration-300">
                            Browse
                        </Link>
                        <span className="text-white/20">•</span>
                        <Link href="/dashboard/messages" className="text-white/60 hover:text-[#df2531] transition-colors duration-300">
                            Messages
                        </Link>
                        <span className="text-white/20">•</span>
                        <Link href="/dashboard/wallet" className="text-white/60 hover:text-[#df2531] transition-colors duration-300">
                            Wallet
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
