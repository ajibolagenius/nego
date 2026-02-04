'use client'

import { ArrowLeft, Heart, MapPin, Star, SpinnerGap, HeartBreak, MagnifyingGlass, X, Circle } from '@phosphor-icons/react'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { AvatarPlaceholder } from '@/components/AvatarPlaceholder'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { useFavorites } from '@/hooks/useFavorites'
import { createClient } from '@/lib/supabase/client'
import { getTalentUrl } from '@/lib/talent-url'
import type { Profile, TalentMenu, ServiceType } from '@/types/database'

interface TalentWithMenus extends Profile {
    talent_menus?: (TalentMenu & { service_type?: ServiceType })[]
}

interface FavoritesClientProps {
    userId: string
    userRole: 'client' | 'talent'
}

// Helper function to get minimum price from talent menus (consistent with browse page)
const getMinPrice = (talent: TalentWithMenus): number => {
    if (talent.talent_menus && talent.talent_menus.length > 0) {
        const activePrices = talent.talent_menus
            .filter(m => m.is_active)
            .map(m => m.price)
        if (activePrices.length > 0) {
            return Math.min(...activePrices)
        }
    }
    return talent.starting_price || 0
}

export function FavoritesClient({ userId, userRole }: FavoritesClientProps) {
    const { favorites, isLoaded, removeFavorite } = useFavorites(userId)
    const [favoriteTalents, setFavoriteTalents] = useState<TalentWithMenus[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [removingId, setRemovingId] = useState<string | null>(null)

    // Fetch talent profiles with menus for favorited IDs
    useEffect(() => {
        const fetchFavorites = async () => {
            if (!isLoaded) return

            if (favorites.length === 0) {
                setFavoriteTalents([])
                setLoading(false)
                setError(null)
                return
            }

            setLoading(true)
            setError(null)
            try {
                const supabase = createClient()
                const { data, error: fetchError } = await supabase
                    .from('profiles')
                    .select(`
            *,
            talent_menus (
              id,
              price,
              is_active,
              service_type:service_types (
                id,
                name,
                icon
              )
            )
          `)
                    .in('id', favorites)
                    .eq('role', 'talent')

                if (fetchError) throw fetchError

                // Sort by the order they were added (most recent first)
                const orderedData = favorites
                    .map(id => data?.find(t => t.id === id))
                    .filter(Boolean) as TalentWithMenus[]

                setFavoriteTalents(orderedData)
            } catch (err) {
                console.error('Error fetching favorites:', err)
                setError('Failed to load favorites. Please try again.')
            } finally {
                setLoading(false)
            }
        }

        fetchFavorites()
    }, [favorites, isLoaded])

    // Filter talents based on search query (name, location, or specialty)
    const filteredTalents = useMemo(() => {
        if (!searchQuery.trim()) {
            return favoriteTalents
        }

        const query = searchQuery.toLowerCase()
        return favoriteTalents.filter(talent => {
            // Search by name
            if (talent.display_name?.toLowerCase().includes(query)) {
                return true
            }

            // Search by location
            if (talent.location?.toLowerCase().includes(query)) {
                return true
            }

            // Search by specialty (service types)
            if (talent.talent_menus?.some(menu =>
                menu.service_type?.name?.toLowerCase().includes(query)
            )) {
                return true
            }

            return false
        })
    }, [favoriteTalents, searchQuery])

    const formatPrice = (price: number) => {
        return `${new Intl.NumberFormat('en-NG', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price)} coins`
    }

    const handleRemove = async (e: React.MouseEvent, talentId: string) => {
        e.preventDefault()
        e.stopPropagation()

        // Optimistic update - remove from UI immediately
        setFavoriteTalents(prev => prev.filter(t => t.id !== talentId))
        setRemovingId(talentId)

        try {
            await removeFavorite(talentId)
        } catch (err) {
            console.error('Error removing favorite:', err)
            // Revert optimistic update on error
            const supabase = createClient()
            const { data } = await supabase
                .from('profiles')
                .select(`
          *,
          talent_menus (
            id,
            price,
            is_active,
            service_type:service_types (
              id,
              name,
              icon
            )
          )
        `)
                .eq('id', talentId)
                .eq('role', 'talent')
                .single()

            if (data) {
                setFavoriteTalents(prev => {
                    const updated = [...prev, data]
                    // Maintain order
                    return favorites
                        .map(id => updated.find(t => t.id === id))
                        .filter(Boolean) as TalentWithMenus[]
                })
            }
            setError('Failed to remove favorite. Please try again.')
        } finally {
            setRemovingId(null)
        }
    }

    const clearSearch = () => {
        setSearchQuery('')
    }

    return (
        <>
            <div className="min-h-screen bg-black pt-16 lg:pt-0 pb-20 lg:pb-0">
                {/* Header */}
                <header className="fixed lg:sticky top-[64px] lg:top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 border-t-0">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-4 mb-4">
                            <Link
                                href="/dashboard"
                                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                                aria-label="Back to dashboard"
                            >
                                <ArrowLeft size={20} aria-hidden="true" />
                            </Link>
                            <div className="flex-1">
                                <h1 className="text-xl font-bold text-white">Saved Favorites</h1>
                                <p className="text-white/50 text-sm">
                                    {favoriteTalents.length === 1
                                        ? '1 saved talent'
                                        : `${favoriteTalents.length} saved talents`}
                                </p>
                            </div>
                        </div>

                        {/* Search Bar */}
                        {favoriteTalents.length > 0 && (
                            <div className="relative">
                                <MagnifyingGlass
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                                    size={18}
                                    aria-hidden="true"
                                />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name, location, or specialty..."
                                    autoComplete="off"
                                    aria-label="Search favorites by name, location, or specialty"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={clearSearch}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                        aria-label="Clear search"
                                        title="Clear search"
                                    >
                                        <X size={18} aria-hidden="true" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </header>

                {/* Content */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pt-[128px] lg:pt-6">
                    {loading || !isLoaded ? (
                        <div className="flex items-center justify-center py-20" role="status" aria-live="polite">
                            <SpinnerGap size={32} className="text-[#df2531] animate-spin" aria-hidden="true" />
                            <span className="sr-only">Loading favorites</span>
                        </div>
                    ) : error ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                                <HeartBreak size={40} weight="duotone" className="text-red-400" aria-hidden="true" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Error Loading Favorites</h2>
                            <p className="text-white/50 mb-6">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#df2531] text-white font-medium hover:bg-[#c41f2a] transition-colors"
                                aria-label="Retry loading favorites"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : favoriteTalents.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                                <HeartBreak size={40} weight="duotone" className="text-white/30" aria-hidden="true" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">No favorites yet</h2>
                            <p className="text-white/50 mb-6">
                                Start browsing talents and tap the heart icon to save your favorites
                            </p>
                            <Link
                                href="/dashboard/browse"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#df2531] text-white font-medium hover:bg-[#c41f2a] transition-colors"
                                aria-label="Browse talent to add favorites"
                            >
                                <MagnifyingGlass size={18} aria-hidden="true" />
                                Browse Talent
                            </Link>
                        </div>
                    ) : filteredTalents.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                                <MagnifyingGlass size={40} weight="duotone" className="text-white/30" aria-hidden="true" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">No results found</h2>
                            <p className="text-white/50 mb-6">
                                No favorites match your search. Try a different term or clear your search.
                            </p>
                            <button
                                onClick={clearSearch}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                                aria-label="Clear search to show all favorites"
                            >
                                <X size={18} aria-hidden="true" />
                                Clear Search
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                            {filteredTalents.map((talent) => {
                                const minPrice = getMinPrice(talent)
                                const isRemoving = removingId === talent.id

                                return (
                                    <Link
                                        key={talent.id}
                                        href={getTalentUrl(talent)}
                                        className="group bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-[#df2531]/30 transition-all duration-300"
                                        aria-label={`View ${talent.display_name || 'Talent'} profile`}
                                    >
                                        <div className="aspect-[3/4] relative overflow-hidden">
                                            {talent.avatar_url ? (
                                                <Image
                                                    src={talent.avatar_url}
                                                    alt={talent.display_name || 'Talent'}
                                                    fill
                                                    sizes="(max-width: 768px) 50vw, 33vw"
                                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
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
                                                    } aria-hidden="true" />
                                                    {talent.status === 'online' ? 'Online' : talent.status === 'booked' ? 'Booked' : 'Offline'}
                                                </span>
                                            </div>

                                            {/* Remove Button */}
                                            <button
                                                onClick={(e) => handleRemove(e, talent.id)}
                                                disabled={isRemoving}
                                                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[#df2531] text-white flex items-center justify-center transition-all hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Remove from favorites"
                                                aria-label={`Remove ${talent.display_name || 'talent'} from favorites`}
                                            >
                                                {isRemoving ? (
                                                    <>
                                                        <SpinnerGap size={16} className="animate-spin" aria-hidden="true" />
                                                        <span className="sr-only">Removing...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Heart size={16} weight="fill" aria-hidden="true" />
                                                        <span className="sr-only">Remove from favorites</span>
                                                    </>
                                                )}
                                            </button>

                                            {/* Verified Badge */}
                                            {talent.is_verified && (
                                                <div className="absolute top-3 left-1/2 -translate-x-1/2">
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#df2531]/90 text-white text-xs">
                                                        <Star size={10} weight="fill" aria-hidden="true" />
                                                        Verified
                                                    </span>
                                                </div>
                                            )}

                                            {/* Bottom Info */}
                                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                                <h3 className="text-white font-medium text-lg truncate">
                                                    {talent.display_name || 'Talent'}
                                                </h3>
                                                <div className="flex items-center gap-1.5 text-white/80 text-sm mb-1">
                                                    <MapPin size={14} weight="fill" aria-hidden="true" />
                                                    <span>{talent.location || 'Location not specified'}</span>
                                                </div>
                                                {minPrice > 0 && (
                                                    <p className="text-white font-semibold">
                                                        From {formatPrice(minPrice)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
            <MobileBottomNav userRole={userRole} />
        </>
    )
}
