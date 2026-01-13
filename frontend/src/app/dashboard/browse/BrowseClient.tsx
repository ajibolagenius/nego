'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  MagnifyingGlass, MapPin, Funnel, X, CaretDown, 
  Heart, Star, Circle, ArrowLeft
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import type { Profile, ServiceType, TalentMenu } from '@/types/database'

interface TalentWithMenu extends Profile {
  talent_menus: (TalentMenu & { service_type: ServiceType })[]
}

interface BrowseClientProps {
  talents: TalentWithMenu[]
  serviceTypes: ServiceType[]
}

// Nigerian cities for filter
const locations = ['All Locations', 'Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Enugu']

export function BrowseClient({ talents, serviceTypes }: BrowseClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('All Locations')
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'price_low' | 'price_high'>('recent')

  const filteredTalents = useMemo(() => {
    let result = [...talents]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(t => 
        t.display_name?.toLowerCase().includes(query) ||
        t.location?.toLowerCase().includes(query) ||
        t.bio?.toLowerCase().includes(query)
      )
    }

    // Location filter
    if (selectedLocation !== 'All Locations') {
      result = result.filter(t => t.location === selectedLocation)
    }

    // Service filter
    if (selectedService) {
      result = result.filter(t => 
        t.talent_menus?.some(m => m.service_type?.id === selectedService && m.is_active)
      )
    }

    // Sort
    if (sortBy === 'price_low') {
      result.sort((a, b) => (a.starting_price || 0) - (b.starting_price || 0))
    } else if (sortBy === 'price_high') {
      result.sort((a, b) => (b.starting_price || 0) - (a.starting_price || 0))
    }

    return result
  }, [talents, searchQuery, selectedLocation, selectedService, sortBy])

  const formatPrice = (price: number) => {
    return `${new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)} coins`
  }

  return (
    <div className="min-h-screen bg-black pt-16 lg:pt-0">
      {/* Header */}
      <header className="sticky top-16 lg:top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">Browse Talent</h1>
              <p className="text-white/50 text-sm">{filteredTalents.length} available</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white focus:outline-none focus:border-[#df2531]/50 transition-colors cursor-pointer min-w-[160px]"
            >
              {locations.map(loc => (
                <option key={loc} value={loc} className="bg-black">{loc}</option>
              ))}
            </select>
            <CaretDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" size={16} />
          </div>

          {/* Filter Button */}
          <Button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
              showFilters || selectedService
                ? 'bg-[#df2531] border-[#df2531] text-white'
                : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
            }`}
          >
            <Funnel size={18} />
            Filters
            {selectedService && (
              <span className="w-2 h-2 bg-white rounded-full" />
            )}
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Filter by Service</h3>
              {selectedService && (
                <button
                  onClick={() => setSelectedService(null)}
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
                  onClick={() => setSelectedService(
                    selectedService === service.id ? null : service.id
                  )}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    selectedService === service.id
                      ? 'bg-[#df2531] text-white'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  {service.name}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <h3 className="text-white font-semibold mb-3">Sort by</h3>
              <div className="flex gap-2">
                {[
                  { value: 'recent', label: 'Most Recent' },
                  { value: 'price_low', label: 'Price: Low to High' },
                  { value: 'price_high', label: 'Price: High to Low' },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value as typeof sortBy)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      sortBy === option.value
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
        {filteredTalents.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/50 text-lg mb-4">No talents found</p>
            <p className="text-white/30 text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredTalents.map((talent) => (
              <TalentCard key={talent.id} talent={talent} formatPrice={formatPrice} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TalentCard({ talent, formatPrice }: { talent: TalentWithMenu; formatPrice: (p: number) => string }) {
  const [liked, setLiked] = useState(false)

  const minPrice = talent.talent_menus?.length > 0
    ? Math.min(...talent.talent_menus.filter(m => m.is_active).map(m => m.price))
    : talent.starting_price || 0

  return (
    <Link
      href={`/talent/${talent.id}`}
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
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
            talent.status === 'online' 
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
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLiked(!liked) }}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${
            liked ? 'bg-[#df2531] text-white' : 'bg-black/30 text-white hover:bg-[#df2531]'
          }`}
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
          <div className="flex items-center gap-1.5 text-white/80 text-sm mb-1">
            <MapPin size={14} weight="fill" />
            <span>{talent.location || 'Lagos'}</span>
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
}
