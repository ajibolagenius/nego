'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, MapPin, Star, Heart, Share, Circle,
  Check, Calendar, Clock, SpinnerGap, X, ShieldCheck,
  ForkKnife, CalendarCheck, Airplane, Lock, Camera, Coin
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { Profile, ServiceType, TalentMenu, Media, Wallet } from '@/types/database'
import type { Icon } from '@phosphor-icons/react'

interface TalentWithDetails extends Profile {
  talent_menus: (TalentMenu & { service_type: ServiceType })[]
  media: Media[]
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

export function TalentProfileClient({ talent, currentUser, wallet, userId }: TalentProfileClientProps) {
  const router = useRouter()
  const [liked, setLiked] = useState(false)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [bookingNotes, setBookingNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const activeServices = talent.talent_menus?.filter(m => m.is_active) || []
  
  const totalPrice = activeServices
    .filter(s => selectedServices.includes(s.id))
    .reduce((sum, s) => sum + s.price, 0)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price)
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

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          client_id: userId,
          talent_id: talent.id,
          total_price: totalPrice,
          services_snapshot: servicesSnapshot,
          status: 'payment_pending',
          scheduled_at: scheduledAt.toISOString(),
          notes: bookingNotes || null
        })
        .select()
        .single()

      if (bookingError) throw bookingError

      // Redirect to booking confirmation/payment
      router.push(`/dashboard/bookings/${booking.id}`)
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
                    4.9 (128 reviews)
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

        {/* Gallery */}
        {talent.media && talent.media.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Gallery</h2>
            <div className="grid grid-cols-3 gap-3">
              {talent.media.slice(0, 6).map((item) => (
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
          </div>
        )}

        {/* Booking Summary - Fixed Bottom */}
        {selectedServices.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 p-4 z-50">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div>
                <p className="text-white/50 text-sm">{selectedServices.length} service(s) selected</p>
                <p className="text-white text-xl font-bold">{formatPrice(totalPrice)}</p>
              </div>
              <Button
                onClick={() => setShowBookingModal(true)}
                className="bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold px-8 py-3 rounded-xl"
              >
                Book Now
              </Button>
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
              <div className="flex items-center justify-between p-4 bg-[#df2531]/10 rounded-xl border border-[#df2531]/20">
                <div className="flex items-center gap-3">
                  <Coin size={24} weight="duotone" className="text-[#df2531]" />
                  <div>
                    <p className="text-white/50 text-xs">Your Balance</p>
                    <p className="text-white font-bold">{wallet?.balance || 0} coins</p>
                  </div>
                </div>
                <Link href="/dashboard/wallet" className="text-[#df2531] text-sm hover:underline">
                  Top up
                </Link>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/10">
              <Button
                onClick={handleBooking}
                disabled={loading}
                className="w-full bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold py-4 rounded-xl disabled:opacity-50"
              >
                {loading ? (
                  <SpinnerGap size={20} className="animate-spin" />
                ) : (
                  `Confirm & Pay ${formatPrice(totalPrice)}`
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
