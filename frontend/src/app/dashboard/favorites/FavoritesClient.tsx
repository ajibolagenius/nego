'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Heart, HeartBreak, MapPin, Circle, User,
  MagnifyingGlass, X
} from '@phosphor-icons/react'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

interface FavoritesClientProps {
  user: SupabaseUser
  profile: Profile | null
  talents: Profile[]
}

export function FavoritesClient({ user, profile, talents }: FavoritesClientProps) {
  const [favorites, setFavorites] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)

  const userRole = profile?.role === 'talent' ? 'talent' : 'client'

  // Load favorites from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`nego_favorites_${user.id}`)
    if (stored) {
      setFavorites(JSON.parse(stored))
    }
    setIsLoaded(true)
  }, [user.id])

  // Save favorites to localStorage
  const saveFavorites = (newFavorites: string[]) => {
    localStorage.setItem(`nego_favorites_${user.id}`, JSON.stringify(newFavorites))
    setFavorites(newFavorites)
  }

  const removeFavorite = (talentId: string) => {
    const newFavorites = favorites.filter(id => id !== talentId)
    saveFavorites(newFavorites)
  }

  // Filter talents to only show favorites
  const favoriteTalents = talents.filter(t => favorites.includes(t.id))
  
  // Filter by search
  const filteredTalents = favoriteTalents.filter(t => 
    t.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.location?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatPrice = (price: number | null) => {
    if (!price) return 'Contact for price'
    return `${new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)} coins`
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#df2531] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
    <div className="min-h-screen bg-black pt-16 lg:pt-0 pb-20 lg:pb-0">
      {/* Header */}
      <header className="sticky top-16 lg:top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
                <ArrowLeft size={24} />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Favorites</h1>
                <p className="text-white/50 text-sm">{favoriteTalents.length} saved talents</p>
              </div>
            </div>
          </div>
          
          {/* Search */}
          {favoriteTalents.length > 0 && (
            <div className="relative">
              <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search favorites..."
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#df2531]/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {favoriteTalents.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
              <Heart size={40} weight="duotone" className="text-white/20" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No favorites yet</h2>
            <p className="text-white/50 mb-6 max-w-md mx-auto">
              When you find talent you like, tap the heart icon to save them here for quick access.
            </p>
            <Link
              href="/dashboard/browse"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#df2531] text-white font-medium hover:bg-[#c41f2a] transition-colors"
            >
              Browse Talent
            </Link>
          </div>
        ) : filteredTalents.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-white/50">No results found for &quot;{searchQuery}&quot;</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTalents.map((talent) => (
              <div
                key={talent.id}
                className="relative group rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 transition-all"
              >
                {/* Remove Button */}
                <button
                  onClick={() => removeFavorite(talent.id)}
                  className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                  title="Remove from favorites"
                >
                  <HeartBreak size={20} weight="fill" />
                </button>

                {/* Image */}
                <Link href={`/talent/${talent.id}`}>
                  <div className="aspect-[3/4] relative overflow-hidden">
                    {talent.avatar_url ? (
                      <img
                        src={talent.avatar_url}
                        alt={talent.display_name || ''}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/10 flex items-center justify-center">
                        <User size={60} weight="duotone" className="text-white/20" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                        talent.status === 'online' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-white/10 text-white/60'
                      }`}>
                        <Circle size={8} weight="fill" className={talent.status === 'online' ? 'text-green-400' : 'text-white/40'} />
                        {talent.status === 'online' ? 'Online' : 'Offline'}
                      </div>
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  </div>

                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-bold text-white mb-1">{talent.display_name}</h3>
                    {talent.location && (
                      <p className="flex items-center gap-1 text-white/60 text-sm mb-2">
                        <MapPin size={14} />
                        {talent.location}
                      </p>
                    )}
                    <p className="text-[#df2531] font-bold">
                      From {formatPrice(talent.starting_price)}
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    <MobileBottomNav userRole={userRole} />
    </>
  )
}
