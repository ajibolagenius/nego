'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, MapPin, Star, Heart, Share, Circle,
  Check, Calendar, Clock, SpinnerGap, X, ShieldCheck,
  ForkKnife, CalendarCheck, Airplane, Lock, Camera, Coin, Warning, ChatCircle, Crown, Eye,
  ShareNetwork, Copy, CheckCircle
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { ReviewCard, ReviewSummary } from '@/components/Reviews'
import { GiftCoins } from '@/components/GiftCoins'
import { useFavorites } from '@/hooks/useFavorites'
import type { Profile, ServiceType, TalentMenu, Media, Wallet, Review } from '@/types/database'
import type { Icon } from '@phosphor-icons/react'

interface TalentWithDetails extends Profile {
  talent_menus: (TalentMenu & { service_type: ServiceType })[]
  media: Media[]
  reviews?: (Review & { client?: Profile })[]
  average_rating?: number
  review_count?: number
}

interface TalentProfileClientProps {
  talent: TalentWithDetails
  currentUser: Profile | null
  wallet: Wallet | null
  userId: string
}

const serviceIcons: Record<string, Icon> = {
  'utensils': ForkKnife,
  'calendar': CalendarCheck,
  'plane': Airplane,
  'lock': Lock,
  'camera': Camera,
}

// Gallery Section with Free/Premium Tabs
function GallerySection({ media }: { media: Media[] }) {
  const [activeTab, setActiveTab] = useState<'free' | 'premium'>('free')
  
  const freeMedia = media.filter(m => !m.is_premium)
  const premiumMedia = media.filter(m => m.is_premium)
  const currentMedia = activeTab === 'free' ? freeMedia : premiumMedia
  
  // Don't render if no media at all
  if (media.length === 0) return null
  
  return (
    <div className="mb-8" data-testid="talent-gallery">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Gallery</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('free')}
            data-testid="gallery-tab-free"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'free'
                ? 'bg-green-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <Eye size={14} />
            Free ({freeMedia.length})
          </button>
          <button
            onClick={() => setActiveTab('premium')}
            data-testid="gallery-tab-premium"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'premium'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <Crown size={14} weight="fill" />
            Premium ({premiumMedia.length})
          </button>
        </div>
      </div>
      
      {currentMedia.length === 0 ? (
        <div className="text-center py-8 rounded-xl bg-white/5 border border-white/10">
          <p className="text-white/50 text-sm">
            {activeTab === 'premium' 
              ? 'No premium content available' 
              : 'No free content available'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {currentMedia.map((item) => (
            <div key={item.id} className="aspect-square rounded-xl overflow-hidden relative group">
              <Image
                src={item.url}
                alt="Gallery"
                fill
                className={`object-cover ${item.is_premium ? 'blur-lg' : ''}`}
              />
              {item.is_premium && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-center">
                    <Lock size={24} className="text-white mx-auto mb-1" />
                    <p className="text-white text-xs">{item.unlock_price} coins</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function TalentProfileClient({ talent, currentUser, wallet, userId }: TalentProfileClientProps) {
  const router = useRouter()
  const { isFavorite, toggleFavorite, isLoaded: favoritesLoaded } = useFavorites(userId)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [bookingNotes, setBookingNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  const isLiked = favoritesLoaded && isFavorite(talent.id)
  const activeServices = talent.talent_menus?.filter(m => m.is_active) || []
  
  const totalPrice = activeServices
    .filter(s => selectedServices.includes(s.id))
    .reduce((sum, s) => sum + s.price, 0)

  const userBalance = wallet?.balance || 0
  const hasInsufficientBalance = totalPrice > userBalance && selectedServices.length > 0

  const formatPrice = (price: number) => {
    return `${new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)} coins`
  }

  const handleFavoriteToggle = () => {
    toggleFavorite(talent.id)
  }

  const handleShare = async () => {
    const shareUrl = window.location.href
    const shareText = `Check out ${talent.display_name} on Nego!`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${talent.display_name} - Nego`,
          text: shareText,
          url: shareUrl,
        })
      } catch (err) {
        // User cancelled or share failed, show menu instead
        setShowShareMenu(true)
      }
    } else {
      setShowShareMenu(true)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        setShowShareMenu(false)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  const handleBooking = async () => {
    if (selectedServices.length === 0) {
      setError('Please select at least one service')
      return
    }

    if (!bookingDate || !bookingTime) {
      setError('Please select date and time')
      return
    }

    // Check balance before proceeding
    if (hasInsufficientBalance) {
      setError('Insufficient balance. Please top up your wallet.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      
      // Create services snapshot
      const servicesSnapshot = activeServices
        .filter(s => selectedServices.includes(s.id))
        .map(s => ({
          service_id: s.id,
          service_name: s.service_type?.name,
          price: s.price
        }))

      const scheduledAt = new Date(`${bookingDate}T${bookingTime}`)

      // Deduct coins from wallet first
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ 
          balance: userBalance - totalPrice,
          escrow_balance: (wallet?.escrow_balance || 0) + totalPrice
        })
        .eq('user_id', userId)

      if (walletError) throw walletError

      // Create booking with verification_pending status (payment done via coins)
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          client_id: userId,
          talent_id: talent.id,
          total_price: totalPrice,
          services_snapshot: servicesSnapshot,
          status: 'verification_pending',
          scheduled_at: scheduledAt.toISOString(),
          notes: bookingNotes || null
        })
        .select()
        .single()

      if (bookingError) {
        // Rollback wallet if booking fails
        await supabase
          .from('wallets')
          .update({ 
            balance: userBalance,
            escrow_balance: wallet?.escrow_balance || 0
          })
          .eq('user_id', userId)
        throw bookingError
      }

      // Create transaction record
      await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          amount: -totalPrice,
          type: 'booking',
          reference_id: booking.id,
          description: `Booking with ${talent.display_name}`
        })

      // Close modal and redirect to verification page
      setShowBookingModal(false)
      router.push(`/dashboard/verify?booking=${booking.id}`)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create booking'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black pt-16">
      {/* Header */}
      <header className="sticky top-16 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.back()}
              className="text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-3">
              {/* Gift Coins Button - Only show for logged in clients */}
              {currentUser && currentUser.role === 'client' && (
                <GiftCoins
                  talentId={talent.id}
                  talentName={talent.display_name || 'Talent'}
                  senderId={userId}
                  senderBalance={wallet?.balance || 0}
                  onSuccess={() => router.refresh()}
                />
              )}
              <button
                onClick={() => setLiked(!liked)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  liked ? 'bg-[#df2531] text-white' : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                <Heart size={20} weight={liked ? 'fill' : 'regular'} />
              </button>
              <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white transition-colors">
                <Share size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Avatar */}
          <div className="relative w-full md:w-72 aspect-[3/4] rounded-2xl overflow-hidden flex-shrink-0">
            <Image
              src={talent.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80'}
              alt={talent.display_name || 'Talent'}
              fill
              className="object-cover"
            />
            {/* Status */}
            <div className="absolute top-4 left-4">
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm ${
                talent.status === 'online' 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : talent.status === 'booked'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-white/10 text-white/60 border border-white/10'
              }`}>
                <Circle size={8} weight="fill" />
                {talent.status === 'online' ? 'Online Now' : talent.status === 'booked' ? 'Currently Booked' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    {talent.display_name || 'Anonymous'}
                  </h1>
                  {talent.is_verified && (
                    <ShieldCheck size={24} weight="fill" className="text-[#df2531]" />
                  )}
                </div>
                <div className="flex items-center gap-4 text-white/60">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={16} weight="fill" />
                    {talent.location || 'Lagos'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star size={16} weight="fill" className="text-amber-400" />
                    {(talent.average_rating || 0).toFixed(1)} ({talent.review_count || 0} reviews)
                  </span>
                </div>
              </div>
            </div>

            {/* Bio */}
            {talent.bio && (
              <p className="text-white/70 mb-6 leading-relaxed">
                {talent.bio}
              </p>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-white/50 text-xs mb-1">Starting From</p>
                <p className="text-white font-bold">{formatPrice(talent.starting_price || 0)}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-white/50 text-xs mb-1">Response</p>
                <p className="text-white font-bold">~30 min</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-white/50 text-xs mb-1">Completed</p>
                <p className="text-white font-bold">128 dates</p>
              </div>
            </div>
          </div>
        </div>

        {/* Services Menu */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Services & Pricing</h2>
          
          {activeServices.length === 0 ? (
            <div className="bg-white/5 rounded-xl p-8 text-center border border-white/10">
              <p className="text-white/50">No services available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeServices.map((service) => {
                const isSelected = selectedServices.includes(service.id)
                const IconComponent = serviceIcons[service.service_type?.icon || ''] || Calendar
                
                return (
                  <button
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-[#df2531]/10 border-[#df2531]/50'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-[#df2531]' : 'bg-white/10'
                      }`}>
                        <IconComponent size={20} className="text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-medium">{service.service_type?.name}</p>
                        <p className="text-white/50 text-sm">{service.service_type?.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-white font-bold">{formatPrice(service.price)}</span>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? 'bg-[#df2531] border-[#df2531]' : 'border-white/30'
                      }`}>
                        {isSelected && <Check size={14} weight="bold" className="text-white" />}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Gallery with Free/Premium Tabs */}
        <GallerySection media={talent.media || []} />

        {/* Reviews Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ChatCircle size={24} weight="duotone" className="text-[#df2531]" />
              Reviews
            </h2>
            {talent.review_count && talent.review_count > 0 && (
              <span className="text-white/50 text-sm">{talent.review_count} total</span>
            )}
          </div>

          {/* Review Summary */}
          {talent.review_count && talent.review_count > 0 ? (
            <>
              <ReviewSummary
                averageRating={talent.average_rating || 0}
                totalReviews={talent.review_count || 0}
              />

              {/* Review List */}
              {talent.reviews && talent.reviews.length > 0 && (
                <div className="mt-4 space-y-4">
                  {talent.reviews.slice(0, 5).map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      currentUserId={userId}
                      isTalentOwner={userId === talent.id}
                    />
                  ))}
                  
                  {talent.reviews.length > 5 && (
                    <button className="w-full py-3 text-center text-[#df2531] hover:text-[#c41f2a] text-sm font-medium transition-colors">
                      View all {talent.review_count} reviews
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 rounded-2xl bg-white/5 border border-white/10">
              <Star size={32} weight="duotone" className="text-white/20 mx-auto mb-2" />
              <p className="text-white/50">No reviews yet</p>
              <p className="text-white/30 text-sm">Be the first to leave a review!</p>
            </div>
          )}
        </div>

        {/* Booking Summary - Fixed Bottom */}
        {selectedServices.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 p-4 z-50">
            <div className="max-w-4xl mx-auto">
              {/* Low Balance Warning */}
              {hasInsufficientBalance && (
                <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Warning size={20} weight="duotone" className="text-amber-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-amber-400 text-sm font-medium">Insufficient Balance</p>
                    <p className="text-amber-400/70 text-xs">You need {totalPrice - userBalance} more coins to book</p>
                  </div>
                  <Link 
                    href="/dashboard/wallet" 
                    className="px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-colors"
                  >
                    Top Up
                  </Link>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/50 text-sm">{selectedServices.length} service(s) selected</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white text-xl font-bold">{totalPrice} coins</p>
                    <span className="text-white/40">•</span>
                    <p className={`text-sm ${hasInsufficientBalance ? 'text-amber-400' : 'text-green-400'}`}>
                      Balance: {userBalance} coins
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowBookingModal(true)}
                  disabled={hasInsufficientBalance}
                  className={`font-bold px-8 py-3 rounded-xl ${
                    hasInsufficientBalance 
                      ? 'bg-white/10 text-white/50 cursor-not-allowed' 
                      : 'bg-[#df2531] hover:bg-[#c41f2a] text-white'
                  }`}
                >
                  {hasInsufficientBalance ? 'Insufficient Balance' : 'Book Now'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0a0a0f] rounded-2xl w-full max-w-lg border border-white/10 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Confirm Booking</h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-white/60 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Selected Services Summary */}
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white/50 text-sm mb-3">Selected Services</p>
                {activeServices
                  .filter(s => selectedServices.includes(s.id))
                  .map(s => (
                    <div key={s.id} className="flex justify-between text-white py-1">
                      <span>{s.service_type?.name}</span>
                      <span>{formatPrice(s.price)}</span>
                    </div>
                  ))
                }
                <div className="border-t border-white/10 mt-3 pt-3 flex justify-between text-white font-bold">
                  <span>Total</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[#df2531]/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Time</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <input
                      type="time"
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[#df2531]/50"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-white/70 text-sm mb-2">Notes (optional)</label>
                <textarea
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Any special requests or information..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50 resize-none"
                />
              </div>

              {/* Wallet Balance */}
              <div className={`p-4 rounded-xl border ${
                hasInsufficientBalance 
                  ? 'bg-amber-500/10 border-amber-500/20' 
                  : 'bg-[#df2531]/10 border-[#df2531]/20'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Coin size={24} weight="duotone" className={hasInsufficientBalance ? 'text-amber-400' : 'text-[#df2531]'} />
                    <div>
                      <p className="text-white/50 text-xs">Your Balance</p>
                      <p className={`font-bold ${hasInsufficientBalance ? 'text-amber-400' : 'text-white'}`}>
                        {userBalance} coins
                      </p>
                    </div>
                  </div>
                  <Link href="/dashboard/wallet" className={`text-sm hover:underline ${
                    hasInsufficientBalance ? 'text-amber-400' : 'text-[#df2531]'
                  }`}>
                    Top up
                  </Link>
                </div>
                {hasInsufficientBalance && (
                  <div className="mt-3 pt-3 border-t border-amber-500/20 flex items-center gap-2">
                    <Warning size={16} className="text-amber-400" />
                    <p className="text-amber-400 text-sm">
                      You need <span className="font-bold">{totalPrice - userBalance}</span> more coins
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/10">
              <Button
                onClick={handleBooking}
                disabled={loading || hasInsufficientBalance}
                className={`w-full font-bold py-4 rounded-xl disabled:opacity-50 ${
                  hasInsufficientBalance 
                    ? 'bg-white/10 text-white/50 cursor-not-allowed' 
                    : 'bg-[#df2531] hover:bg-[#c41f2a] text-white'
                }`}
              >
                {loading ? (
                  <SpinnerGap size={20} className="animate-spin" />
                ) : hasInsufficientBalance ? (
                  'Insufficient Balance'
                ) : (
                  `Confirm & Pay ${totalPrice} coins`
                )}
              </Button>
              <p className="text-white/40 text-xs text-center mt-3">
                Payment will be held in escrow until service is completed
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
