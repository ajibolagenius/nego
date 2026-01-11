'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, Camera, User, Phone, MapPin, ShieldCheck,
  CheckCircle, XCircle, Hourglass, Warning, Image as ImageIcon,
  UploadSimple, Sparkle, Lock, Info
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Profile, Booking, Verification } from '@/types/database'

interface BookingWithTalent extends Omit<Booking, 'talent'> {
  talent: {
    display_name: string
    avatar_url: string | null
    location: string | null
  } | null
}

interface VerifyClientProps {
  user: SupabaseUser
  profile: Profile | null
  booking: BookingWithTalent | null
  verification: Verification | null
}

export function VerifyClient({ user, profile, booking, verification }: VerifyClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [step, setStep] = useState<'intro' | 'selfie' | 'details' | 'complete'>('intro')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [fullName, setFullName] = useState(profile?.full_name || profile?.display_name || '')
  const [phone, setPhone] = useState('')
  const [gpsCoords, setGpsCoords] = useState<string | null>(null)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSelfieSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelfieFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelfiePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude},${position.coords.longitude}`
        setGpsCoords(coords)
        setGpsError(null)
      },
      (error) => {
        setGpsError('Unable to retrieve your location')
      }
    )
  }

  const handleSubmit = async () => {
    if (!booking || !selfieFile || !fullName || !phone) {
      setError('Please complete all required fields')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // For now, store selfie as base64 data URL since storage bucket may not exist
      // In production, you'd create the storage bucket in Supabase dashboard
      const selfieUrl = selfiePreview || ''

      // Create verification record
      const { error: verifyError } = await supabase
        .from('verifications')
        .upsert({
          booking_id: booking.id,
          selfie_url: selfieUrl,
          full_name: fullName,
          phone: phone,
          gps_coords: gpsCoords,
          status: 'pending'
        })

      if (verifyError) throw verifyError

      // Update booking status to confirmed
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', booking.id)

      if (bookingError) throw bookingError

      setStep('complete')
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/dashboard/bookings/${booking.id}`)
        router.refresh()
      }, 3000)

    } catch (err: any) {
      console.error('Verification error:', err)
      setError(err.message || 'Failed to submit verification')
    } finally {
      setIsSubmitting(false)
    }
  }

  // If no booking provided, show general verification info
  if (!booking) {
    return (
      <div className="min-h-screen bg-black pt-16 lg:pt-0">
        <header className="sticky top-16 lg:top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
                <ArrowLeft size={24} />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Verification</h1>
                <p className="text-white/50 text-sm">Identity verification</p>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-[#df2531]/10 flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={40} weight="duotone" className="text-[#df2531]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">No Booking to Verify</h2>
          <p className="text-white/50 mb-8">
            Verification is required when you make a booking. Once you book a service, 
            you&apos;ll be asked to verify your identity.
          </p>
          <Link
            href="/dashboard/browse"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#df2531] text-white font-medium hover:bg-[#c41f2a] transition-colors"
          >
            Browse Talent
          </Link>
        </div>
      </div>
    )
  }

  // If verification already exists and is approved
  if (verification?.status === 'approved') {
    return (
      <div className="min-h-screen bg-black pt-16 lg:pt-0 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} weight="duotone" className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Already Verified</h2>
          <p className="text-white/50 mb-8">This booking has already been verified.</p>
          <Link
            href={`/dashboard/bookings/${booking.id}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#df2531] text-white font-medium hover:bg-[#c41f2a] transition-colors"
          >
            View Booking
          </Link>
        </div>
      </div>
    )
  }

  // If verification is pending review
  if (verification?.status === 'pending') {
    return (
      <div className="min-h-screen bg-black pt-16 lg:pt-0 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <Hourglass size={40} weight="duotone" className="text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Verification Pending</h2>
          <p className="text-white/50 mb-8">Your verification is being reviewed. We&apos;ll notify you once it&apos;s approved.</p>
          <Link
            href={`/dashboard/bookings/${booking.id}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
          >
            View Booking
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-16 lg:pt-0">
      {/* Header */}
      <header className="sticky top-16 lg:top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/dashboard/bookings/${booking.id}`} className="text-white/60 hover:text-white transition-colors">
                <ArrowLeft size={24} />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Verify Identity</h1>
                <p className="text-white/50 text-sm">Step {step === 'intro' ? '1' : step === 'selfie' ? '2' : step === 'details' ? '3' : '4'} of 4</p>
              </div>
            </div>
            
            {/* Progress */}
            <div className="flex gap-1">
              {['intro', 'selfie', 'details', 'complete'].map((s, i) => (
                <div
                  key={s}
                  className={`w-8 h-1 rounded-full transition-colors ${
                    ['intro', 'selfie', 'details', 'complete'].indexOf(step) >= i
                      ? 'bg-[#df2531]'
                      : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Booking Info */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
          <div className="w-14 h-14 rounded-xl bg-white/10 overflow-hidden">
            {booking.talent?.avatar_url ? (
              <img src={booking.talent.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User size={24} className="text-white/40" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-white font-medium">{booking.talent?.display_name}</p>
            <p className="text-white/40 text-sm">Booking #{booking.id.slice(0, 8)}</p>
          </div>
          <div className="text-right">
            <p className="text-white font-bold">{booking.total_price} coins</p>
          </div>
        </div>

        {/* Step Content */}
        {step === 'intro' && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-[#df2531]/10 flex items-center justify-center mx-auto mb-6">
                <ShieldCheck size={40} weight="duotone" className="text-[#df2531]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Identity Verification</h2>
              <p className="text-white/60 max-w-md mx-auto">
                To ensure safety for everyone, we require a quick identity verification before your booking is confirmed.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-full bg-[#df2531]/10 flex items-center justify-center flex-shrink-0">
                  <Camera size={20} className="text-[#df2531]" />
                </div>
                <div>
                  <p className="text-white font-medium">Take a Selfie</p>
                  <p className="text-white/50 text-sm">We&apos;ll need a clear photo of your face</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-full bg-[#df2531]/10 flex items-center justify-center flex-shrink-0">
                  <User size={20} className="text-[#df2531]" />
                </div>
                <div>
                  <p className="text-white font-medium">Confirm Your Details</p>
                  <p className="text-white/50 text-sm">Your name and phone number</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-full bg-[#df2531]/10 flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} className="text-[#df2531]" />
                </div>
                <div>
                  <p className="text-white font-medium">Share Location (Optional)</p>
                  <p className="text-white/50 text-sm">Helps verify your presence</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Lock size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-blue-400/80 text-sm">
                Your data is encrypted and only shared with the talent for safety purposes. 
                It&apos;s automatically deleted after 30 days.
              </p>
            </div>

            <Button
              onClick={() => setStep('selfie')}
              className="w-full bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold py-4 rounded-xl"
            >
              Start Verification
            </Button>
          </div>
        )}

        {step === 'selfie' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-2">Take a Selfie</h2>
              <p className="text-white/50">Make sure your face is clearly visible</p>
            </div>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`aspect-square max-w-sm mx-auto rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                selfiePreview 
                  ? 'border-[#df2531] bg-[#df2531]/5' 
                  : 'border-white/20 hover:border-white/40 bg-white/5'
              }`}
            >
              {selfiePreview ? (
                <img src={selfiePreview} alt="Selfie preview" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <>
                  <Camera size={48} weight="duotone" className="text-white/30 mb-4" />
                  <p className="text-white/50 text-sm">Tap to take or upload a photo</p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleSelfieSelect}
              className="hidden"
            />

            {selfiePreview && (
              <button
                onClick={() => {
                  setSelfiePreview(null)
                  setSelfieFile(null)
                }}
                className="w-full text-white/50 text-sm hover:text-white"
              >
                Take another photo
              </button>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => setStep('intro')}
                variant="ghost"
                className="flex-1 text-white/50"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep('details')}
                disabled={!selfiePreview}
                className="flex-1 bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold disabled:opacity-50"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-2">Confirm Your Details</h2>
              <p className="text-white/50">This information will be shared with the talent</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white/50 text-sm mb-2">Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#df2531]"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-white/50 text-sm mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#df2531]"
                  placeholder="+234 XXX XXX XXXX"
                />
              </div>

              <div>
                <label className="block text-white/50 text-sm mb-2">Location (Optional)</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={gpsCoords || ''}
                    readOnly
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/50"
                    placeholder="GPS coordinates"
                  />
                  <Button
                    onClick={handleGetLocation}
                    variant="ghost"
                    className="px-4 bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"
                  >
                    <MapPin size={20} />
                  </Button>
                </div>
                {gpsError && <p className="text-red-400 text-sm mt-1">{gpsError}</p>}
                {gpsCoords && <p className="text-green-400 text-sm mt-1">Location captured</p>}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <Warning size={18} />
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => setStep('selfie')}
                variant="ghost"
                className="flex-1 text-white/50"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!fullName || !phone || isSubmitting}
                className="flex-1 bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Verification'}
              </Button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} weight="duotone" className="text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Verification Complete!</h2>
            <p className="text-white/50 mb-2">Your booking has been confirmed.</p>
            <p className="text-white/40 text-sm">Redirecting to booking details...</p>
          </div>
        )}
      </div>
    </div>
  )
}
