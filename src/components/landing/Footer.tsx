'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Globe, InstagramLogo, TwitterLogo, ArrowUp, MapPin, Phone, Envelope } from '@phosphor-icons/react'

const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About us', href: '#about' },
    { name: 'Collection', href: '#talent' },
    { name: 'Private Content', href: '#premium' },
]

const legalLinks = [
    { name: 'Terms & Conditions', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Cookie Policy', href: '/cookies' },
]

const socials = [
    { icon: Globe, href: 'https://negoempire.live', label: 'Visit our website' },
    { icon: TwitterLogo, href: 'https://twitter.com/nego', label: 'Follow us on Twitter' },
    { icon: InstagramLogo, href: 'https://instagram.com/nego', label: 'Follow us on Instagram' },
]

export function Footer() {
    const [isVisible, setIsVisible] = useState(false)
    const footerRef = useRef<HTMLElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry?.isIntersecting) setIsVisible(true) },
            { threshold: 0.1 }
        )
        if (footerRef.current) observer.observe(footerRef.current)
        return () => observer.disconnect()
    }, [])

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <footer ref={footerRef} className="relative bg-black border-t border-white/5 overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0">
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#df2531]/5 rounded-full blur-[150px] transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`} />
            </div>

            {/* Main Footer */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-8 md:gap-10">

                    {/* Logo & Description Block */}
                    <div className={`col-span-2 md:col-span-4 lg:col-span-4 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <Link href="/" className="inline-block mb-6 group">
                            <span className="text-3xl logo-font transition-transform duration-300 inline-block group-hover:scale-105">
                                <span className="text-white">NEGO</span>
                                <span className="text-[#df2531]">.</span>
                            </span>
                        </Link>
                        <p className="text-white/50 text-sm leading-relaxed mb-6 max-w-xs">
                            The premier managed marketplace connecting discerning clients with verified, elite talent.
                            Experience excellence with complete discretion and security.
                        </p>

                        {/* Social Links */}
                        <div className="flex items-center gap-3">
                            {socials.map((social, index) => (
                                <a
                                    key={index}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={social.label}
                                    className={`w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-[#df2531] hover:border-[#df2531]/50 hover:bg-[#df2531]/10 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                                        }`}
                                    style={{ transitionDelay: `${0.2 + index * 0.1}s` }}
                                >
                                    <social.icon size={18} weight="duotone" aria-hidden="true" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <div className={`col-span-1 md:col-span-2 lg:col-span-2 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '0.2s' }}>
                        <h4 className="text-white font-semibold mb-4 text-sm">Navigation</h4>
                        <nav className="flex flex-col gap-3">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    className="text-white/40 hover:text-white text-sm transition-all duration-300 hover:translate-x-1"
                                >
                                    {link.name}
                                </a>
                            ))}
                        </nav>
                    </div>

                    {/* Legal Links */}
                    <div className={`col-span-1 md:col-span-2 lg:col-span-2 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '0.3s' }}>
                        <h4 className="text-white font-semibold mb-4 text-sm">Legal</h4>
                        <nav className="flex flex-col gap-3">
                            {legalLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="text-white/40 hover:text-white text-sm transition-all duration-300 hover:translate-x-1"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Contact Block */}
                    <div className={`col-span-2 md:col-span-4 lg:col-span-4 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '0.4s' }}>
                        <h4 className="text-white font-semibold mb-4 text-sm">Get in Touch</h4>
                        <div className="space-y-3">
                            <a
                                href="mailto:negoentertainment@gmail.com"
                                className="flex items-center gap-3 text-white/50 hover:text-[#df2531] transition-colors duration-300 group focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black rounded-lg px-2 py-1"
                                aria-label="Send us an email at negoentertainment@gmail.com"
                            >
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#df2531]/10 transition-colors duration-300" aria-hidden="true">
                                    <Envelope size={14} weight="duotone" />
                                </div>
                                <span className="text-sm">negoentertainment@gmail.com</span>
                            </a>
                            <a
                                href="tel:+2341234567890"
                                className="flex items-center gap-3 text-white/50 hover:text-[#df2531] transition-colors duration-300 group focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black rounded-lg px-2 py-1"
                                aria-label="Call us at +234 123 456 7890"
                            >
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#df2531]/10 transition-colors duration-300" aria-hidden="true">
                                    <Phone size={14} weight="duotone" />
                                </div>
                                <span className="text-sm">+234 (xxx) xxx-xxxx</span>
                            </a>
                            <div className="flex items-center gap-3 text-white/50">
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center" aria-hidden="true">
                                    <MapPin size={14} weight="duotone" />
                                </div>
                                <span className="text-sm">Nigeria 🇳🇬</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="relative border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        {/* Copyright */}
                        <p className={`text-[#df2531] text-sm transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                            ©{new Date().getFullYear()} Nego. All Rights Reserved.
                        </p>

                        {/* Back to top button */}
                        <button
                            onClick={scrollToTop}
                            aria-label="Scroll to top of page"
                            className={`group flex items-center gap-2 text-white/50 hover:text-[#df2531] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black rounded-lg px-2 py-1 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <span className="text-sm">Back to top</span>
                            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#df2531] group-hover:bg-[#df2531]/10 transition-all duration-300" aria-hidden="true">
                                <ArrowUp size={14} weight="bold" className="transition-transform duration-300 group-hover:-translate-y-0.5" />
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    )
}
