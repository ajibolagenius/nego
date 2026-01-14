'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Heart, MapPin, Star, SpinnerGap, HeartBreak, MagnifyingGlass } from '@phosphor-icons/react'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { useFavorites } from '@/hooks/useFavorites'
import { createClient } from '@/lib/supabase/client'
import { getTalentUrl } from '@/lib/talent-url'
import type { Profile } from '@/types/database'

interface FavoritesClientProps {
  userId: string
  userRole: 'client' | 'talent'
}

export function FavoritesClient({ userId, userRole }: FavoritesClientProps) {
  const { favorites, isLoaded, removeFavorite } = useFavorites(userId)
  const [favoriteTalents, setFavoriteTalents] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch talent profiles for favorited IDs
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isLoaded) return
      
      if (favorites.length === 0) {
        setFavoriteTalents([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .in('id', favorites)
          .eq('role', 'talent')

        if (error) throw error
        
        // Sort by the order they were added (most recent first)
        const orderedData = favorites
          .map(id => data?.find(t => t.id === id))
          .filter(Boolean) as Profile[]
        
        setFavoriteTalents(orderedData)
      } catch (error) {
        console.error('Error fetching favorites:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [favorites, isLoaded])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const handleRemove = (e: React.MouseEvent, talentId: string) => {
    e.preventDefault()
    e.stopPropagation()
    removeFavorite(talentId)
  }

  return (
    <>
      <div className="min-h-screen bg-black pt-16 lg:pt-0 pb-20 lg:pb-0">
        {/* Header */}
        <header className="sticky top-16 lg:top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center gap-4 px-4 sm:px-6 py-4">
            <Link 
              href="/dashboard"
              className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Favorites</h1>
              <p className="text-white/50 text-sm">{favoriteTalents.length} saved talent{favoriteTalents.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          {loading || !isLoaded ? (
            <div className="flex items-center justify-center py-20">
              <SpinnerGap size={32} className="text-[#df2531] animate-spin" />
            </div>
          ) : favoriteTalents.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                <HeartBreak size={40} weight="duotone" className="text-white/30" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">No favorites yet</h2>
              <p className="text-white/50 mb-6">
                Start browsing and tap the heart icon to save talents you like
              </p>
              <Link
                href="/dashboard/browse"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#df2531] text-white font-medium hover:bg-[#c41f2a] transition-colors"
              >
                <MagnifyingGlass size={18} />
                Browse Talent
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {favoriteTalents.map((talent) => (
                <Link
                  key={talent.id}
                  href={getTalentUrl(talent)}
                  className="group bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-[#df2531]/30 transition-all duration-300"
                >
                  <div className="aspect-[3/4] relative overflow-hidden">
                    <Image
                      src={talent.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80'}
                      alt={talent.display_name || 'Talent'}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    
                    {/* Remove Button */}
                    <button
                      onClick={(e) => handleRemove(e, talent.id)}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[#df2531] text-white flex items-center justify-center transition-all hover:bg-red-600"
                      title="Remove from favorites"
                    >
                      <Heart size={16} weight="fill" />
                    </button>
                    
                    {/* Bottom Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-medium text-lg truncate">
                        {talent.display_name || 'Talent'}
                      </h3>
                      <div className="flex items-center gap-2 text-white/70 text-sm">
                        <MapPin size={14} weight="fill" />
                        <span>{talent.location || 'Lagos'}</span>
                      </div>
                      {talent.starting_price && (
                        <p className="text-[#df2531] font-medium mt-1">
                          From {formatPrice(talent.starting_price)}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <MobileBottomNav userRole={userRole} />
    </>
  )
}
