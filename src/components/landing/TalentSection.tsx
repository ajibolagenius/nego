'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Heart, Eye, ArrowRight, SpinnerGap, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { getTalentUrl } from '@/lib/talent-url'
import type { Profile } from '@/types/database'

interface TalentCardProps {
    talent: Profile
    index: number
    isVisible: boolean
}

function TalentCard({ talent, index, isVisible }: TalentCardProps) {
    const [isHovered, setIsHovered] = useState(false)
    const [liked, setLiked] = useState(false)

    return (
        <Link
            href={getTalentUrl(talent)}
            className={`group relative bg-white/5 rounded-xl md:rounded-2xl overflow-hidden border border-white/5 hover:border-[#df2531]/30 transition-all duration-500 cursor-pointer flex-shrink-0 w-[160px] sm:w-[200px] md:w-[240px] ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
                }`}
            style={{ transitionDelay: `${index * 100}ms` }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="aspect-[3/4] overflow-hidden relative">
                <Image
                    src={talent.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80'}
                    alt={`${talent.display_name || 'Talent'} profile - ${talent.location || 'Location not specified'}`}
                    fill
                    sizes="(max-width: 640px) 160px, (max-width: 768px) 200px, 240px"
                    className="object-cover transition-all duration-700 group-hover:scale-110"
                />

                {/* Overlay gradient */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-70'}`} />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-[#df2531]/0 group-hover:bg-[#df2531]/10 transition-colors duration-500" />

                {/* Top Actions */}
                <div className={`absolute top-3 right-3 flex gap-2 transition-all duration-500 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLiked(!liked); }}
                        aria-label={liked ? `Remove ${talent.display_name || 'talent'} from favorites` : `Add ${talent.display_name || 'talent'} to favorites`}
                        aria-pressed={liked}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full backdrop-blur-sm flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black ${liked ? 'bg-[#df2531] text-white' : 'bg-black/50 text-white hover:bg-[#df2531]'
                            }`}
                    >
                        <Heart size={14} weight={liked ? "fill" : "duotone"} aria-hidden="true" />
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        aria-label={`View ${talent.display_name || 'talent'} profile`}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                    >
                        <Eye size={14} weight="duotone" aria-hidden="true" />
                    </button>
                </div>

                {/* Bottom Content */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 transition-all duration-500">
                    <p className="text-white font-medium text-sm sm:text-base truncate mb-1">
                        {talent.display_name || 'Talent'}
                    </p>
                    <div className={`flex items-center gap-1.5 transition-all duration-300 ${isHovered ? 'text-[#df2531]' : 'text-white/80'}`}>
                        <MapPin size={12} weight="duotone" />
                        <span className="text-xs sm:text-sm">{talent.location || 'Lagos'}</span>
                    </div>

                    {/* Status indicator */}
                    {talent.status === 'online' && (
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-green-400 text-xs">Online</span>
                        </div>
                    )}

                    {/* Hover CTA */}
                    <div className={`flex items-center gap-2 mt-2 transition-all duration-500 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                        <span className="text-white text-xs">View Profile</span>
                        <ArrowRight size={12} weight="bold" className="text-[#df2531]" />
                    </div>
                </div>

                {/* Corner accent */}
                <div className={`absolute top-0 left-0 w-20 h-20 transition-all duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#df2531]/20 to-transparent" />
                </div>
            </div>
        </Link>
    )
}

// Mock data for landing page (before auth)
const mockTalents: Profile[] = [
    { id: '1', role: 'talent', username: null, full_name: null, display_name: 'Adaeze', avatar_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80', location: 'Lagos', bio: null, is_verified: true, status: 'online', starting_price: 120000, admin_notes: null, created_at: '', updated_at: '' },
    { id: '2', role: 'talent', username: null, full_name: null, display_name: 'Chidinma', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80', location: 'Abuja', bio: null, is_verified: true, status: 'online', starting_price: 180000, admin_notes: null, created_at: '', updated_at: '' },
    { id: '3', role: 'talent', username: null, full_name: null, display_name: 'Folake', avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80', location: 'Port Harcourt', bio: null, is_verified: true, status: 'offline', starting_price: 150000, admin_notes: null, created_at: '', updated_at: '' },
    { id: '4', role: 'talent', username: null, full_name: null, display_name: 'Grace', avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80', location: 'Lagos', bio: null, is_verified: true, status: 'online', starting_price: 100000, admin_notes: null, created_at: '', updated_at: '' },
    { id: '5', role: 'talent', username: null, full_name: null, display_name: 'Halima', avatar_url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&q=80', location: 'Kano', bio: null, is_verified: true, status: 'offline', starting_price: 130000, admin_notes: null, created_at: '', updated_at: '' },
    { id: '6', role: 'talent', username: null, full_name: null, display_name: 'Ify', avatar_url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80', location: 'Enugu', bio: null, is_verified: true, status: 'online', starting_price: 160000, admin_notes: null, created_at: '', updated_at: '' },
    { id: '7', role: 'talent', username: null, full_name: null, display_name: 'Jessica', avatar_url: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&q=80', location: 'Lagos', bio: null, is_verified: true, status: 'booked', starting_price: 140000, admin_notes: null, created_at: '', updated_at: '' },
    { id: '8', role: 'talent', username: null, full_name: null, display_name: 'Kemi', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80', location: 'Ibadan', bio: null, is_verified: true, status: 'online', starting_price: 110000, admin_notes: null, created_at: '', updated_at: '' },
]

export function TalentSection() {
    const [isVisible, setIsVisible] = useState(false)
    const [talents, setTalents] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [isPaused, setIsPaused] = useState(false)
    const sectionRef = useRef<HTMLElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const scrollPositionRef = useRef(0)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
            { threshold: 0.1 }
        )
        if (sectionRef.current) observer.observe(sectionRef.current)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        const fetchTalents = async () => {
            try {
                const supabase = createClient()
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('role', 'talent')
                    .limit(8)

                if (error) throw error
                // Duplicate talents for seamless infinite scroll
                const fetchedTalents = data && data.length > 0 ? data : mockTalents
                setTalents([...fetchedTalents, ...fetchedTalents])
            } catch (error) {
                console.error('Failed to fetch talents:', error)
                setTalents([...mockTalents, ...mockTalents])
            } finally {
                setLoading(false)
            }
        }
        fetchTalents()
    }, [])

    // Auto-scroll animation
    useEffect(() => {
        if (loading || !scrollContainerRef.current || talents.length === 0) return

        const container = scrollContainerRef.current
        const scrollSpeed = 0.5 // pixels per frame
        let animationFrameId: number

        const animate = () => {
            if (!isPaused && container) {
                scrollPositionRef.current += scrollSpeed

                // Reset scroll position when reaching halfway (since we duplicated the content)
                const halfWidth = container.scrollWidth / 2
                if (scrollPositionRef.current >= halfWidth) {
                    scrollPositionRef.current = 0
                }

                container.scrollLeft = scrollPositionRef.current
            }
            animationFrameId = requestAnimationFrame(animate)
        }

        animationFrameId = requestAnimationFrame(animate)

        return () => {
            cancelAnimationFrame(animationFrameId)
        }
    }, [loading, isPaused, talents.length])

    // Manual scroll handlers
    const scroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return
        const scrollAmount = 260
        const newPosition = scrollPositionRef.current + (direction === 'left' ? -scrollAmount : scrollAmount)
        scrollPositionRef.current = Math.max(0, newPosition)
        scrollContainerRef.current.scrollTo({
            left: scrollPositionRef.current,
            behavior: 'smooth'
        })
    }

    return (
        <section ref={sectionRef} id="talent" className="relative py-16 md:py-24 lg:py-32 bg-black overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0">
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#df2531]/5 rounded-full blur-[200px] transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}>
                    <div>
                        <p className="text-[#df2531] tracking-[0.2em] uppercase text-xs font-medium mb-2">Our Collection</p>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white">
                            POPULAR TALENT
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Navigation Arrows */}
                        <div className="hidden sm:flex items-center gap-2">
                            <button
                                onClick={() => scroll('left')}
                                aria-label="Scroll talent carousel left"
                                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white hover:border-white/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black"
                            >
                                <CaretLeft size={20} weight="bold" aria-hidden="true" />
                            </button>
                            <button
                                onClick={() => scroll('right')}
                                aria-label="Scroll talent carousel right"
                                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white hover:border-white/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black"
                            >
                                <CaretRight size={20} weight="bold" aria-hidden="true" />
                            </button>
                        </div>
                        <Link href="/dashboard/browse" aria-label="View all talents in our collection">
                            <Button className="group bg-[#df2531] hover:bg-[#c41f2a] text-white font-medium px-6 py-2.5 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black">
                                <span className="flex items-center gap-2">
                                    See All
                                    <ArrowRight size={16} weight="bold" className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                                </span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Carousel Container */}
                <div
                    className={`relative transition-all duration-700 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                        }`}
                    style={{ transitionDelay: '0.2s' }}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    {/* Gradient Edges */}
                    <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <SpinnerGap size={40} weight="bold" className="text-[#df2531] animate-spin" />
                        </div>
                    ) : (
                        <div
                            ref={scrollContainerRef}
                            className="flex gap-3 md:gap-4 lg:gap-5 overflow-x-hidden py-4 scroll-smooth"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {talents.map((talent, index) => (
                                <TalentCard
                                    key={`${talent.id}-${index}`}
                                    talent={talent}
                                    index={index % (talents.length / 2)}
                                    isVisible={isVisible}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Mobile Navigation Dots */}
                <div className="flex sm:hidden items-center justify-center gap-2 mt-6">
                    <button
                        onClick={() => scroll('left')}
                        aria-label="Scroll talent carousel left"
                        className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black"
                    >
                        <CaretLeft size={18} weight="bold" aria-hidden="true" />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        aria-label="Scroll talent carousel right"
                        className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black"
                    >
                        <CaretRight size={18} weight="bold" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </section>
    )
}
