'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Webcam from 'react-webcam'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, Camera, User, Phone, MapPin, ShieldCheck,
  CheckCircle, XCircle, Hourglass, Warning, 
  Sparkle, Lock, Info, VideoCamera, ArrowCounterClockwise
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { MobileBottomNav } from '@/components/MobileBottomNav'
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

const videoConstraints = {
  width: 480,
  height: 480,
  facingMode: 'user',
}

export function VerifyClient({ user, profile, booking, verification }: VerifyClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const webcamRef = useRef<Webcam>(null)
  
  const [step, setStep] = useState<'intro' | 'selfie' | 'details' | 'complete'>('intro')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null)
  const [fullName, setFullName] = useState(profile?.full_name || profile?.display_name || '')
  const [phone, setPhone] = useState('')
  const [gpsCoords, setGpsCoords] = useState<string | null>(null)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isCameraReady, setIsCameraReady] = useState(false)

  // Capture photo from webcam
  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot()
      if (imageSrc) {
        setSelfiePreview(imageSrc)
        
        // Convert base64 to blob for upload
        fetch(imageSrc)
          .then(res => res.blob())
          .then(blob => setSelfieBlob(blob))
      }
    }
  }, [])

  // Retake photo
  const retakePhoto = () => {
    setSelfiePreview(null)
    setSelfieBlob(null)
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
      () => {
        setGpsError('Unable to retrieve your location')
      }
    )
  }

  const handleSubmit = async () => {
    if (!booking || !selfieBlob || !fullName || !phone) {
      setError('Please complete all required fields')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Upload selfie to Supabase Storage
      const fileName = `${user.id}/${booking.id}_${Date.now()}.jpg`
      
      const { error: uploadError } = await supabase.storage
        .from('verifications')
        .upload(fileName, selfieBlob, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg'
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error('Failed to upload selfie image')
      }

      // Get the public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('verifications')
        .getPublicUrl(fileName)

      const selfieUrl = urlData.publicUrl

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

      // Update booking status to pending_verification
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'pending_verification' })
        .eq('id', booking.id)

      if (bookingError) throw bookingError

      setStep('complete')
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/dashboard/bookings/${booking.id}`)
        router.refresh()
      }, 3000)

    } catch (err: unknown) {
      console.error('Verification error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit verification'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // If no booking provided, show general verification info
  if (!booking) {
    return (
      <div className="min-h-screen bg-black pt-16 lg:pt-0 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
            <Warning size={40} weight="duotone" className="text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">No Active Booking</h2>
          <p className="text-white/50 mb-8">You need an active booking to complete verification.</p>
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

  // If verification is already approved
  if (verification?.status === 'approved') {
    return (
      <div className="min-h-screen bg-black pt-16 lg:pt-0 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} weight="duotone" className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Already Verified</h2>
          <p className="text-white/50 mb-8">Your identity has been verified for this booking.</p>
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
    <>
    <div className="min-h-screen bg-black pt-16 lg:pt-0 pb-20 lg:pb-0">
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
                  <VideoCamera size={20} className="text-[#df2531]" />
                </div>
                <div>
                  <p className="text-white font-medium">Live Selfie Capture</p>
                  <p className="text-white/50 text-sm">Take a live photo using your camera to verify your identity</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-full bg-[#df2531]/10 flex items-center justify-center flex-shrink-0">
                  <Phone size={20} className="text-[#df2531]" />
                </div>
                <div>
                  <p className="text-white font-medium">Contact Information</p>
                  <p className="text-white/50 text-sm">Provide your phone number for the talent to reach you</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-full bg-[#df2531]/10 flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} className="text-[#df2531]" />
                </div>
                <div>
                  <p className="text-white font-medium">Location (Optional)</p>
                  <p className="text-white/50 text-sm">Share your location for added security</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
              <Lock size={20} className="text-white/40 flex-shrink-0 mt-0.5" />
              <p className="text-white/50 text-sm">
                Your information is encrypted and only shared with the talent for this booking.
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
              <h2 className="text-xl font-bold text-white mb-2">Take a Live Selfie</h2>
              <p className="text-white/50">Position your face in the frame and capture</p>
            </div>

            {/* Webcam or Preview */}
            <div className="relative aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden border-2 border-white/20 bg-black">
              {selfiePreview ? (
                // Show captured photo
                <img 
                  src={selfiePreview} 
                  alt="Selfie preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                // Show webcam
                <>
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={videoConstraints}
                    onUserMedia={() => setIsCameraReady(true)}
                    onUserMediaError={(err) => {
                      console.error('Camera error:', err)
                      setCameraError('Unable to access camera. Please allow camera permissions.')
                    }}
                    className="w-full h-full object-cover"
                    mirrored={true}
                  />
                  
                  {/* Face guide overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-white/30 rounded-full" />
                  </div>
                  
                  {/* Camera loading state */}
                  {!isCameraReady && !cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
                      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mb-4" />
                      <p className="text-white/50 text-sm">Starting camera...</p>
                    </div>
                  )}
                </>
              )}
              
              {/* Camera error */}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black p-4">
                  <Warning size={48} className="text-amber-400 mb-4" />
                  <p className="text-white/70 text-sm text-center">{cameraError}</p>
                </div>
              )}
            </div>

            {/* Capture / Retake buttons */}
            <div className="flex justify-center">
              {selfiePreview ? (
                <button
                  onClick={retakePhoto}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <ArrowCounterClockwise size={20} />
                  Retake Photo
                </button>
              ) : (
                <button
                  onClick={capturePhoto}
                  disabled={!isCameraReady || !!cameraError}
                  className="w-16 h-16 rounded-full bg-[#df2531] hover:bg-[#c41f2a] disabled:bg-white/20 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  <Camera size={28} weight="fill" className="text-white" />
                </button>
              )}
            </div>

            {/* Navigation */}
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
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#df2531]/50"
                />
              </div>

              <div>
                <label className="block text-white/50 text-sm mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 xxx xxx xxxx"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#df2531]/50"
                />
              </div>

              <div>
                <label className="block text-white/50 text-sm mb-2">Location (Optional)</label>
                {gpsCoords ? (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <CheckCircle size={20} className="text-green-400" />
                    <span className="text-green-400 text-sm">Location captured</span>
                  </div>
                ) : (
                  <button
                    onClick={handleGetLocation}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-colors"
                  >
                    <MapPin size={20} />
                    Share Current Location
                  </button>
                )}
                {gpsError && (
                  <p className="text-red-400 text-sm mt-2">{gpsError}</p>
                )}
              </div>
            </div>

            {/* Selfie Preview */}
            {selfiePreview && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10">
                  <img src={selfiePreview} alt="Your selfie" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Selfie Captured</p>
                  <p className="text-white/40 text-sm">Ready for verification</p>
                </div>
                <CheckCircle size={24} className="text-green-400" />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <XCircle size={20} className="text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
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
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  'Submit Verification'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} weight="duotone" className="text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Verification Submitted!</h2>
            <p className="text-white/50 mb-2">Your verification is being reviewed.</p>
            <p className="text-white/30 text-sm">Redirecting to your booking...</p>
          </div>
        )}
      </div>
    </div>
  )
}
