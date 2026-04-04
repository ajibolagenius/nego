'use client'

import {
    MagnifyingGlass, MapPin, Funnel, CaretDown,
    Heart, Star, Circle, ArrowLeft
} from '@phosphor-icons/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { AvatarPlaceholder } from '@/components/AvatarPlaceholder'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useFavorites } from '@/hooks/useFavorites'
import { NIGERIAN_LOCATIONS } from '@/lib/nigerian-locations'
import { getTalentUrl } from '@/lib/talent-url'
import supabaseLoader from '@/lib/supabase/loader'
import type { Profile, ServiceType, TalentMenu } from '@/types/database'

interface TalentWithMenu extends Profile {
    talent_menus: (TalentMenu & { service_type: ServiceType })[]
}

interface BrowseClientProps {
    talents: TalentWithMenu[]
    serviceTypes: ServiceType[]
    userId: string
    totalCount: number
    currentPage: number
}

// All locations including "All Locations" option
const locations = ['All Locations', ...NIGERIAN_LOCATIONS]

export function BrowseClient({ talents: initialTalents, serviceTypes, userId, totalCount, currentPage }: BrowseClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Internal state for UI responsiveness
    const [talents, setTalents] = useState<TalentWithMenu[]>(initialTalents)
    const [isPending, setIsPending] = useState(false)
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
    const [selectedLocation, setSelectedLocation] = useState(searchParams.get('location') || 'All Locations')
    const [selectedService, setSelectedService] = useState<string | null>(searchParams.get('service'))
    const [selectedAvailability, setSelectedAvailability] = useState(searchParams.get('status') || 'all')
    const [selectedGender, setSelectedGender] = useState(searchParams.get('gender') || 'all')
    const [showFilters, setShowFilters] = useState(false)
    const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'recent')
    const loaderRef = useRef<HTMLDivElement>(null)

    // Update accumulated talents when props change
    useEffect(() => {
        if (currentPage === 1) {
            setTalents(initialTalents)
        } else {
            // Append new page results, but filter out duplicates just in case
            setTalents(prev => {
                const existingIds = new Set(prev.map(t => t.id))
                const uniqueNew = initialTalents.filter(t => !existingIds.has(t.id))
                return [...prev, ...uniqueNew]
            })
        }
        setIsPending(false)
    }, [initialTalents, currentPage])

    // Utility to update URL with new filters
    const updateFilters = (updates: Record<string, string | null | undefined>) => {
        const params = new URLSearchParams(searchParams.toString())
        
        // Reset to page 1 on filter change
        params.set('page', '1')

        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === undefined || value === 'all' || value === 'All Locations') {
                params.delete(key)
            } else {
                params.set(key, value)
            }
        })

        setIsPending(true)
        router.push(`/dashboard/browse?${params.toString()}`, { scroll: false })
    }

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== (searchParams.get('q') || '')) {
                updateFilters({ q: searchQuery })
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting && talents.length < totalCount && !isPending) {
                const params = new URLSearchParams(searchParams.toString())
                const nextPage = currentPage + 1
                params.set('page', nextPage.toString())
                router.push(`/dashboard/browse?${params.toString()}`, { scroll: false })
                setIsPending(true)
            }
        }, { threshold: 0.1 })

        if (loaderRef.current) {
            observer.observe(loaderRef.current)
        }

        return () => observer.disconnect()
    }, [talents.length, totalCount, isPending, currentPage, searchParams, router])

    const formatPrice = (price: number) => {
        return `${new Intl.NumberFormat('en-NG', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price)} coins`
    }

    return (
        <>
            <div className="min-h-screen bg-black pt-16 lg:pt-0 pb-20 lg:pb-0">
                {/* Header */}
                <header className="fixed lg:sticky top-[64px] lg:top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 border-t-0">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
                                <ArrowLeft size={24} />
                            </Link>
                            <div className="flex-1">
                                <h1 className="text-xl font-bold text-white">Browse Talent</h1>
                                <p className="text-white/50 text-sm">{totalCount} available</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-[128px] lg:pt-6">
                    {/* Search & Filters */}
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        {/* Search */}
                        <div className="relative flex-1">
                            <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, location..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50 transition-colors"
                            />
                        </div>

                        {/* Location Dropdown */}
                        <div className="relative">
                            <select
                                value={selectedLocation}
                                onChange={(e) => {
                                    const val = e.target.value
                                    setSelectedLocation(val)
                                    updateFilters({ location: val })
                                }}
                                className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white focus:outline-none focus:border-[#df2531]/50 transition-colors cursor-pointer min-w-[160px]"
                            >
                                {locations.map(loc => (
                                    <option key={loc} value={loc} className="bg-black">{loc}</option>
                                ))}
                            </select>
                            <CaretDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" size={16} />
                        </div>

                        {/* Gender Dropdown */}
                        <div className="relative">
                            <select
                                value={selectedGender}
                                onChange={(e) => {
                                    const val = e.target.value
                                    setSelectedGender(val)
                                    updateFilters({ gender: val })
                                }}
                                className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white focus:outline-none focus:border-[#df2531]/50 transition-colors cursor-pointer min-w-[120px]"
                            >
                                <option value="all" className="bg-black">All Genders</option>
                                <option value="male" className="bg-black">Male</option>
                                <option value="female" className="bg-black">Female</option>
                                <option value="other" className="bg-black">Other</option>
                            </select>
                            <CaretDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" size={16} />
                        </div>

                        {/* Filter Button */}
                        <Button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${showFilters || selectedService || selectedAvailability !== 'all'
                                ? 'bg-[#df2531] border-[#df2531] text-white'
                                : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                                }`}
                        >
                            <Funnel size={18} />
                            Filters
                            {(selectedService || selectedAvailability !== 'all' || selectedGender !== 'all') && (
                                <span className="w-2 h-2 bg-white rounded-full" />
                            )}
                        </Button>
                    </div>

                    {/* Expanded Filters */}
                    {showFilters && (
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-8 animate-fade-in-up">
                            {/* Availability Filter */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-white font-semibold">Availability</h3>
                                    {selectedAvailability !== 'all' && (
                                        <button
                                            onClick={() => {
                                                setSelectedAvailability('all')
                                                updateFilters({ status: 'all' })
                                            }}
                                            className="text-[#df2531] text-sm hover:underline"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { value: 'all', label: 'All' },
                                        { value: 'online', label: 'Online' },
                                        { value: 'offline', label: 'Offline' },
                                        { value: 'booked', label: 'Booked' },
                                    ].map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                const val = option.value
                                                setSelectedAvailability(val)
                                                updateFilters({ status: val })
                                            }}
                                            className={`px-4 py-2 rounded-full text-sm transition-all flex items-center gap-1.5 ${selectedAvailability === option.value
                                                ? 'bg-[#df2531] text-white'
                                                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                                                }`}
                                        >
                                            {option.value !== 'all' && (
                                                <Circle size={6} weight="fill" className={
                                                    option.value === 'online' ? 'text-green-400' :
                                                        option.value === 'booked' ? 'text-amber-400' : 'text-white/40'
                                                } />
                                            )}
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>


                            {/* Service Filter */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-white font-semibold">Filter by Service</h3>
                                    {selectedService && (
                                        <button
                                            onClick={() => {
                                                setSelectedService(null)
                                                updateFilters({ service: null })
                                            }}
                                            className="text-[#df2531] text-sm hover:underline"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {serviceTypes.map(service => (
                                        <button
                                            key={service.id}
                                            onClick={() => {
                                                const val = selectedService === service.id ? null : service.id
                                                setSelectedService(val)
                                                updateFilters({ service: val })
                                            }}
                                            className={`px-4 py-2 rounded-full text-sm transition-all ${selectedService === service.id
                                                ? 'bg-[#df2531] text-white'
                                                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                                                }`}
                                        >
                                            {service.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sort */}
                            <div className="mt-6 pt-4 border-t border-white/10">
                                <h3 className="text-white font-semibold mb-3">Sort by</h3>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { value: 'random', label: 'Random Mix' },
                                        { value: 'recent', label: 'Most Recent' },
                                        { value: 'price_low', label: 'Price: Low to High' },
                                        { value: 'price_high', label: 'Price: High to Low' },
                                    ].map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                const val = option.value
                                                setSortBy(val)
                                                updateFilters({ sort: val })
                                            }}
                                            className={`px-4 py-2 rounded-full text-sm transition-all ${sortBy === option.value
                                                ? 'bg-white/10 text-white border border-white/20'
                                                : 'text-white/50 hover:text-white'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Results Grid */}
                    {talents.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-white/50 text-lg mb-4">No talents found</p>
                            <p className="text-white/30 text-sm">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                {talents.map((talent, index) => (
                                    <TalentCard key={talent.id} talent={talent} formatPrice={formatPrice} userId={userId} index={index} />
                                ))}
                            </div>

                            {/* Infinite Scroll Loader */}
                            {talents.length < totalCount && (
                                <div ref={loaderRef} className="py-12 flex justify-center">
                                    <LoadingSpinner size="sm" />
                                </div>
                            )}

                            {talents.length >= totalCount && talents.length > 0 && (
                                <div className="py-12 text-center">
                                    <p className="text-white/20 text-sm">You&apos;ve reached the end of the list</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            <MobileBottomNav />
        </>
    )
}

function TalentCard({ talent, formatPrice, userId, index }: { talent: TalentWithMenu; formatPrice: (p: number) => string; userId: string; index: number }) {
    const { isFavorite, toggleFavorite } = useFavorites(userId)
    const liked = isFavorite(talent.id)

    const minPrice = talent.talent_menus?.length > 0
        ? Math.min(...talent.talent_menus.filter(m => m.is_active).map(m => m.price))
        : talent.starting_price || 0

    return (
        <Link
            href={getTalentUrl(talent)}
            className="group bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-[#df2531]/30 transition-all duration-300"
        >
            <div className="aspect-[3/4] relative overflow-hidden">
                {talent.avatar_url ? (
                    <Image
                        loader={supabaseLoader}
                        src={talent.avatar_url}
                        alt={talent.display_name || 'Talent'}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        priority={index < 4}
                    />
                ) : (
                    <AvatarPlaceholder size="md" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${talent.status === 'online'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : talent.status === 'booked'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-white/10 text-white/60 border border-white/10'
                        }`}>
                        <Circle size={6} weight="fill" className={
                            talent.status === 'online' ? 'text-green-400' :
                                talent.status === 'booked' ? 'text-amber-400' : 'text-white/40'
                        } />
                        {talent.status === 'online' ? 'Online' : talent.status === 'booked' ? 'Booked' : 'Offline'}
                    </span>
                </div>

                {/* Like Button */}
                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(talent.id) }}
                    className={`absolute top-3 right-3 w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${liked ? 'bg-[#df2531] text-white' : 'bg-black/30 text-white hover:bg-[#df2531]'
                        }`}
                    data-testid={`favorite-btn-${talent.id}`}
                >
                    <Heart size={16} weight={liked ? 'fill' : 'regular'} />
                </button>

                {/* Verified Badge */}
                {talent.is_verified && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#df2531]/90 text-white text-xs">
                            <Star size={10} weight="fill" />
                            Verified
                        </span>
                    </div>
                )}

                {/* Bottom Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-medium text-sm mb-1 truncate">
                        {talent.display_name || 'Talent'}
                    </h3>
                    <div className="flex items-center gap-1.5 text-white/80 text-xs mb-1">
                        <MapPin size={12} weight="fill" aria-hidden="true" />
                        <span>{talent.location || 'Location not specified'}</span>
                    </div>
                    {minPrice > 0 && (
                        <p className="text-white font-semibold text-sm">
                            From {formatPrice(minPrice)}
                        </p>
                    )}
                </div>
            </div>
        </Link>
    )
}
