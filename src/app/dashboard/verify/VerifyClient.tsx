'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Webcam from 'react-webcam'
import { createClient } from '@/lib/supabase/client'
import {
    ArrowLeft, Camera, User, Phone, MapPin, ShieldCheck,
    CheckCircle, XCircle, Hourglass, Warning,
    Sparkle, Lock, Info, VideoCamera, ArrowCounterClockwise, Check, X, SpinnerGap
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Profile, Booking, Verification } from '@/types/database'

// Use complete Profile type for talent
interface BookingWithTalent extends Omit<Booking, 'talent'> {
    talent: Profile | null
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

// Image compression helper
const compressImage = (file: File | Blob, maxWidth: number = 800, quality: number = 0.85): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (e) => {
            const img = document.createElement('img')

            img.onload = () => {
                const canvas = document.createElement('canvas')
                let width = img.width
                let height = img.height

                // Resize if needed
                if (width > maxWidth) {
                    height = (height * maxWidth) / width
                    width = maxWidth
                }

                canvas.width = width
                canvas.height = height

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'))
                    return
                }

                ctx.drawImage(img, 0, 0, width, height)

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image'))
                            return
                        }
                        resolve(blob)
                    },
                    'image/jpeg',
                    quality
                )
            }
            img.onerror = () => reject(new Error('Failed to load image'))

            const dataUrl = e.target?.result as string
            img.src = dataUrl
        }
        reader.onerror = () => reject(new Error('Failed to read file'))

        if (file instanceof File) {
            reader.readAsDataURL(file)
        } else {
            // Convert Blob to File-like object
            const fileObj = new File([file], 'selfie.jpg', { type: 'image/jpeg' })
            reader.readAsDataURL(fileObj)
        }
    })
}

// Phone number validation (Nigerian formats)
const validatePhoneNumber = (phone: string): { valid: boolean; error?: string } => {
    if (!phone.trim()) {
        return { valid: false, error: 'Phone number is required' }
    }

    // Remove spaces and dashes
    const cleaned = phone.replace(/[\s-]/g, '')

    // Nigerian phone formats: 080XXXXXXXX, +234XXXXXXXXXX, 234XXXXXXXXXX
    const patterns = [
        /^0[789]\d{9}$/, // 080XXXXXXXX format
        /^\+234[789]\d{9}$/, // +234XXXXXXXXXX format
        /^234[789]\d{9}$/, // 234XXXXXXXXXX format
    ]

    const isValid = patterns.some(pattern => pattern.test(cleaned))

    if (!isValid) {
        return {
            valid: false,
            error: 'Please enter a valid Nigerian phone number (e.g., 08012345678, +2348012345678, or 2348012345678)'
        }
    }

    return { valid: true }
}

// Full name validation
const validateFullName = (name: string): { valid: boolean; error?: string } => {
    if (!name.trim()) {
        return { valid: false, error: 'Full name is required' }
    }

    const trimmed = name.trim()

    // Check length
    if (trimmed.length < 2) {
        return { valid: false, error: 'Full name must be at least 2 characters' }
    }

    if (trimmed.length > 100) {
        return { valid: false, error: 'Full name must be 100 characters or less' }
    }

    // Check for at least first and last name (minimum 2 parts)
    const parts = trimmed.split(/\s+/).filter(part => part.length > 0)
    if (parts.length < 2) {
        return { valid: false, error: 'Please enter your first and last name' }
    }

    return { valid: true }
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
    const [gpsLoading, setGpsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [cameraError, setCameraError] = useState<string | null>(null)
    const [isCameraReady, setIsCameraReady] = useState(false)
    const [compressingImage, setCompressingImage] = useState(false)

    // Camera permission states
    const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt' | 'checking' | 'unsupported'>('checking')
    const [isRequestingPermission, setIsRequestingPermission] = useState(false)

    // Validation states
    const [fullNameError, setFullNameError] = useState<string | null>(null)
    const [fullNameValid, setFullNameValid] = useState(false)
    const [phoneError, setPhoneError] = useState<string | null>(null)
    const [phoneValid, setPhoneValid] = useState(false)

    // Validate full name in real-time
    const validateFullNameInput = useCallback((value: string) => {
        const result = validateFullName(value)
        setFullNameValid(result.valid)
        setFullNameError(result.error || null)
    }, [])

    // Validate phone number in real-time
    const validatePhoneInput = useCallback((value: string) => {
        const result = validatePhoneNumber(value)
        setPhoneValid(result.valid)
        setPhoneError(result.error || null)
    }, [])

    // Update validation on input change
    useEffect(() => {
        if (fullName) {
            validateFullNameInput(fullName)
        } else {
            setFullNameValid(false)
            setFullNameError(null)
        }
    }, [fullName, validateFullNameInput])

    useEffect(() => {
        if (phone) {
            validatePhoneInput(phone)
        } else {
            setPhoneValid(false)
            setPhoneError(null)
        }
    }, [phone, validatePhoneInput])

    // Check camera permission
    const checkCameraPermission = useCallback(async () => {
        if (!navigator.permissions) {
            // Fallback for browsers without Permissions API
            setCameraPermission('prompt')
            return
        }

        try {
            setCameraPermission('checking')
            const result = await navigator.permissions.query({ name: 'camera' as PermissionName })

            if (result.state === 'granted') {
                setCameraPermission('granted')
            } else if (result.state === 'denied') {
                setCameraPermission('denied')
            } else {
                setCameraPermission('prompt')
            }

            // Listen for permission changes
            result.onchange = () => {
                if (result.state === 'granted') {
                    setCameraPermission('granted')
                    setCameraError(null)
                } else if (result.state === 'denied') {
                    setCameraPermission('denied')
                } else {
                    setCameraPermission('prompt')
                }
            }
        } catch (err) {
            console.error('[Verify] Error checking camera permission:', err)
            // Fallback to prompt state if Permissions API fails
            setCameraPermission('prompt')
        }
    }, [])

    // Request camera access explicitly
    const requestCameraAccess = useCallback(async () => {
        setIsRequestingPermission(true)
        setCameraError(null)

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 480 },
                    height: { ideal: 480 }
                }
            })

            // Permission granted, stop the test stream
            stream.getTracks().forEach(track => track.stop())
            setCameraPermission('granted')
            setCameraError(null)

            // Trigger webcam to start
            if (webcamRef.current) {
                // Force webcam to reinitialize
                setIsCameraReady(false)
                setTimeout(() => {
                    setIsCameraReady(true)
                }, 100)
            }
        } catch (err: unknown) {
            const error = err as DOMException
            console.error('[Verify] Camera access error:', error)

            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                setCameraPermission('denied')
                setCameraError('Camera permission denied. Please enable camera access in your browser settings and refresh the page.')
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                setCameraPermission('unsupported')
                setCameraError('No camera found. Please connect a camera and try again.')
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                setCameraError('Camera is already in use by another application. Please close other apps using the camera.')
            } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
                // Retry with simpler constraints
                try {
                    const simpleStream = await navigator.mediaDevices.getUserMedia({ video: true })
                    simpleStream.getTracks().forEach(track => track.stop())
                    setCameraPermission('granted')
                    setCameraError(null)
                } catch (retryErr) {
                    setCameraError('Unable to access camera. Please check your camera permissions and try again.')
                }
            } else {
                setCameraError('Unable to access camera. Please check your camera permissions and try again.')
            }
        } finally {
            setIsRequestingPermission(false)
        }
    }, [])

    // Check permission when entering selfie step
    useEffect(() => {
        if (step === 'selfie') {
            checkCameraPermission()
        }
    }, [step, checkCameraPermission])

    // Capture and compress photo from webcam
    const capturePhoto = useCallback(async () => {
        if (!webcamRef.current) return

        const imageSrc = webcamRef.current.getScreenshot()
        if (!imageSrc) return

        setSelfiePreview(imageSrc)
        setCompressingImage(true)

        try {
            // Convert base64 to blob
            const response = await fetch(imageSrc)
            const blob = await response.blob()

            // Compress image
            const compressedBlob = await compressImage(blob, 800, 0.85)
            setSelfieBlob(compressedBlob)
        } catch (err) {
            console.error('[Verify] Error compressing image:', err)
            // Fallback to original blob if compression fails
            const response = await fetch(imageSrc)
            const blob = await response.blob()
            setSelfieBlob(blob)
        } finally {
            setCompressingImage(false)
        }
    }, [])

    // Retake photo
    const retakePhoto = () => {
        setSelfiePreview(null)
        setSelfieBlob(null)
    }

    // Get GPS location with improved error handling and accuracy
    const handleGetLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setGpsError('Geolocation is not supported by your browser. Please use a modern browser with location services.')
            return
        }

        setGpsLoading(true)
        setGpsError(null)

        // First attempt with high accuracy (GPS preferred)
        const highAccuracyOptions: PositionOptions = {
            enableHighAccuracy: true,
            timeout: 15000, // Increased timeout for better accuracy
            maximumAge: 0 // Always get fresh location
        }

        // Fallback options with lower accuracy requirements
        const fallbackOptions: PositionOptions = {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000 // Accept location up to 1 minute old
        }

        const attemptGetLocation = (options: PositionOptions, isRetry: boolean = false) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude, accuracy } = position.coords

                    // Format coordinates with better precision
                    // Store as "latitude,longitude" format
                    const coords = `${latitude.toFixed(6)},${longitude.toFixed(6)}`

                    // Log accuracy for debugging (accuracy is in meters)
                    if (process.env.NODE_ENV === 'development') {
                        console.log('[Verify] Location captured:', {
                            coords,
                            accuracy: `${accuracy?.toFixed(0) || 'unknown'} meters`,
                            isRetry
                        })
                    }

                    setGpsCoords(coords)
                    setGpsError(null)
                    setGpsLoading(false)
                },
                (error: GeolocationPositionError | Error | unknown) => {
                    // If high accuracy failed and we haven't retried, try with fallback
                    if (!isRetry && options.enableHighAccuracy) {
                        console.log('[Verify] High accuracy location failed, trying fallback...')
                        attemptGetLocation(fallbackOptions, true)
                        return
                    }

                    setGpsLoading(false)
                    let errorMessage = 'Unable to retrieve your location. '

                    // Handle GeolocationPositionError with proper type checking
                    if (error && typeof error === 'object' && 'code' in error) {
                        const geolocationError = error as GeolocationPositionError
                        const errorCode = geolocationError.code

                        // GeolocationPositionError codes:
                        // 1 = PERMISSION_DENIED
                        // 2 = POSITION_UNAVAILABLE
                        // 3 = TIMEOUT
                        switch (errorCode) {
                            case 1: // PERMISSION_DENIED
                                errorMessage = 'Location permission denied. Please enable location access in your browser settings and try again.'
                                break
                            case 2: // POSITION_UNAVAILABLE
                                errorMessage = 'Location information is unavailable. Please check your device location settings and try again.'
                                break
                            case 3: // TIMEOUT
                                errorMessage = 'Location request timed out. Please ensure location services are enabled and try again.'
                                break
                            default:
                                errorMessage = geolocationError.message || 'Unable to retrieve your location. Please check your device settings and try again.'
                        }
                    } else if (error && typeof error === 'object' && 'message' in error) {
                        // Handle generic Error objects
                        const genericError = error as Error
                        errorMessage = genericError.message || 'Unable to retrieve your location. Please check your device settings and try again.'
                    } else {
                        // Fallback for unexpected error format
                        errorMessage = 'Unable to retrieve your location. Please check your device settings and try again.'
                    }

                    setGpsError(errorMessage)

                    // Log error with proper error information
                    // Handle GeolocationPositionError which may have non-enumerable properties
                    try {
                        // Initialize errorInfo with userMessage first to ensure it's never empty
                        const errorInfo: Record<string, unknown> = {
                            userMessage: errorMessage || 'Unable to retrieve location'
                        }

                        if (error && typeof error === 'object') {
                            const geolocationError = error as GeolocationPositionError

                            // Try multiple methods to access code property
                            let errorCode: number | undefined
                            try {
                                errorCode = geolocationError.code
                            } catch {
                                // Try accessing via property descriptor
                                try {
                                    const descriptor = Object.getOwnPropertyDescriptor(geolocationError, 'code')
                                    if (descriptor && typeof descriptor.value === 'number') {
                                        errorCode = descriptor.value
                                    }
                                } catch {
                                    // Property not accessible
                                }
                            }

                            if (typeof errorCode === 'number') {
                                errorInfo.code = errorCode
                                // Map code to readable name
                                const codeNames: Record<number, string> = {
                                    1: 'PERMISSION_DENIED',
                                    2: 'POSITION_UNAVAILABLE',
                                    3: 'TIMEOUT'
                                }
                                errorInfo.codeName = codeNames[errorCode] || 'UNKNOWN'
                            }

                            // Try to access message property
                            let errorMsg: string | undefined
                            try {
                                errorMsg = geolocationError.message
                            } catch {
                                try {
                                    const descriptor = Object.getOwnPropertyDescriptor(geolocationError, 'message')
                                    if (descriptor && typeof descriptor.value === 'string') {
                                        errorMsg = descriptor.value
                                    }
                                } catch {
                                    // Property not accessible
                                }
                            }

                            if (errorMsg) {
                                errorInfo.message = errorMsg
                            }

                            // Add error type for debugging
                            errorInfo.errorType = geolocationError.constructor?.name || 'GeolocationPositionError'
                        } else {
                            errorInfo.errorType = typeof error
                        }

                        // Always log structured error info - never log raw error object
                        // errorInfo always has at least userMessage property
                        console.error('[Verify] Location error:', errorInfo)
                    } catch (logError) {
                        // If error logging itself fails, just log the user-facing message
                        // Never log the raw error object
                        console.warn('[Verify] Location error occurred. User message:', errorMessage || 'Unknown error')
                    }
                },
                options
            )
        }

        // Start with high accuracy attempt
        attemptGetLocation(highAccuracyOptions)
    }, [])

    // Remove location
    const handleRemoveLocation = () => {
        setGpsCoords(null)
        setGpsError(null)
    }

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault()
        }

        if (!booking || !selfieBlob || !fullName || !phone) {
            setError('Please complete all required fields')
            return
        }

        // Validate before submit
        const nameValidation = validateFullName(fullName)
        const phoneValidation = validatePhoneNumber(phone)

        if (!nameValidation.valid || !phoneValidation.valid) {
            setError('Please fix the errors in the form before submitting')
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
                console.error('[Verify] Upload error:', uploadError)
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
                    full_name: fullName.trim(),
                    phone: phone.trim(),
                    gps_coords: gpsCoords,
                    status: 'pending'
                })

            if (verifyError) throw verifyError

            // Update booking status to verification_pending
            const { error: bookingError } = await supabase
                .from('bookings')
                .update({ status: 'verification_pending' })
                .eq('id', booking.id)

            if (bookingError) throw bookingError

            setStep('complete')

            // Redirect after a short delay
            setTimeout(() => {
                router.push(`/dashboard/bookings/${booking.id}`)
                router.refresh()
            }, 3000)

        } catch (err: unknown) {
            console.error('[Verify] Verification error:', err)
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
                <div className="text-center animate-fade-in-up">
                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Warning size={40} weight="duotone" className="text-amber-400" aria-hidden="true" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">No Active Booking</h2>
                    <p className="text-white/50 mb-8 max-w-md mx-auto">
                        You need an active booking to complete verification. Book a talent first to get started.
                    </p>
                    <Link
                        href="/dashboard/browse"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#df2531] text-white font-medium hover:bg-[#c41f2a] transition-colors"
                        aria-label="Browse talent to create a booking"
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
                <div className="text-center animate-fade-in-up">
                    <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} weight="duotone" className="text-green-400" aria-hidden="true" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Already Verified</h2>
                    <p className="text-white/50 mb-8 max-w-md mx-auto">
                        Your identity has been verified for this booking. You can proceed with your booking.
                    </p>
                    <Link
                        href={`/dashboard/bookings/${booking.id}`}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#df2531] text-white font-medium hover:bg-[#c41f2a] transition-colors"
                        aria-label="View booking details"
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
                <div className="text-center animate-fade-in-up">
                    <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
                        <Hourglass size={40} weight="duotone" className="text-amber-400 animate-pulse" aria-hidden="true" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Verification Pending</h2>
                    <p className="text-white/50 mb-8 max-w-md mx-auto">
                        Your verification is being reviewed. We&apos;ll notify you once it&apos;s approved. This usually takes a few minutes.
                    </p>
                    <Link
                        href={`/dashboard/bookings/${booking.id}`}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                        aria-label="View booking details"
                    >
                        View Booking
                    </Link>
                </div>
            </div>
        )
    }

    const stepLabels = {
        intro: 'Get Started',
        selfie: 'Take Selfie',
        details: 'Your Details',
        complete: 'Complete'
    }

    const currentStepIndex = ['intro', 'selfie', 'details', 'complete'].indexOf(step)

    return (
        <>
            <div className="min-h-screen bg-black pt-16 lg:pt-0 pb-20 lg:pb-0">
                {/* Header */}
                <header className="fixed lg:sticky top-[64px] lg:top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 border-t-0">
                    <div className="max-w-2xl mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Link
                                    href={`/dashboard/bookings/${booking.id}`}
                                    className="text-white/60 hover:text-white transition-colors"
                                    aria-label="Back to booking"
                                >
                                    <ArrowLeft size={24} aria-hidden="true" />
                                </Link>
                                <div>
                                    <h1 className="text-xl font-bold text-white">Verify Identity</h1>
                                    <p className="text-white/50 text-sm">
                                        {stepLabels[step]} • Step {currentStepIndex + 1} of 4
                                    </p>
                                </div>
                            </div>

                            {/* Progress */}
                            <div className="flex gap-1" role="progressbar" aria-valuenow={currentStepIndex + 1} aria-valuemin={1} aria-valuemax={4}>
                                {['intro', 'selfie', 'details', 'complete'].map((s, i) => (
                                    <div
                                        key={s}
                                        className={`w-8 h-1 rounded-full transition-colors ${currentStepIndex >= i
                                            ? 'bg-[#df2531]'
                                            : 'bg-white/10'
                                            }`}
                                        aria-hidden="true"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="max-w-2xl mx-auto px-4 py-6 pt-[128px] lg:pt-6">
                    {/* Booking Info */}
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#df2531]/30 transition-all duration-300 mb-6 animate-fade-in-up">
                        <div className="w-14 h-14 rounded-xl bg-white/10 overflow-hidden shrink-0 relative">
                            {booking.talent?.avatar_url ? (
                                <Image
                                    src={booking.talent.avatar_url}
                                    alt={booking.talent.display_name || 'Talent'}
                                    fill
                                    sizes="56px"
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <User size={24} weight="duotone" className="text-white/40" aria-hidden="true" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-white font-medium truncate">{booking.talent?.display_name || 'Talent'}</p>
                                {booking.talent?.is_verified && (
                                    <ShieldCheck size={16} weight="duotone" className="text-[#df2531]" aria-label="Verified talent" />
                                )}
                            </div>
                            <p className="text-white/40 text-sm">Booking #{booking.id.slice(0, 8)}</p>
                            {booking.talent?.location && (
                                <p className="text-white/30 text-xs mt-1 flex items-center gap-1">
                                    <MapPin size={12} weight="duotone" aria-hidden="true" />
                                    {booking.talent.location}
                                </p>
                            )}
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-white font-bold">{booking.total_price} coins</p>
                        </div>
                    </div>

                    {/* Step Content */}
                    {step === 'intro' && (
                        <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            <div className="text-center py-8">
                                <div className="w-20 h-20 rounded-full bg-[#df2531]/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <ShieldCheck size={40} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-4">Identity Verification</h2>
                                <p className="text-white/60 max-w-md mx-auto mb-2">
                                    This process takes less than 2 minutes and helps protect both you and the talent.
                                </p>
                                <p className="text-white/40 text-sm max-w-md mx-auto">
                                    To ensure safety for everyone, we require a quick identity verification before your booking is confirmed.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#df2531]/30 transition-all duration-300 group">
                                    <div className="w-10 h-10 rounded-full bg-[#df2531]/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                        <VideoCamera size={20} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium mb-1">Live Selfie Capture</p>
                                        <p className="text-white/50 text-sm">Take a live photo using your camera. Make sure your face is clearly visible.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#df2531]/30 transition-all duration-300 group">
                                    <div className="w-10 h-10 rounded-full bg-[#df2531]/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                        <Phone size={20} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium mb-1">Contact Information</p>
                                        <p className="text-white/50 text-sm">Provide your phone number so the talent can reach you to coordinate your booking details.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#df2531]/30 transition-all duration-300 group">
                                    <div className="w-10 h-10 rounded-full bg-[#df2531]/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                        <MapPin size={20} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium mb-1">Location (Optional)</p>
                                        <p className="text-white/50 text-sm">Sharing your location helps ensure a safe meeting.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                                <Lock size={20} className="text-white/40 shrink-0 mt-0.5" aria-hidden="true" />
                                <div>
                                    <p className="text-white/70 text-sm font-medium mb-1">Your Privacy Matters</p>
                                    <p className="text-white/50 text-xs leading-relaxed">
                                        Your information is encrypted and only shared with the talent for this booking.
                                        <strong className="text-white/70"> It&apos;s automatically deleted after 30 days.</strong>
                                    </p>
                                </div>
                            </div>

                            <Button
                                onClick={() => setStep('selfie')}
                                className="w-full bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold py-4 rounded-xl transition-colors"
                                aria-label="Start verification process"
                            >
                                Start Verification
                            </Button>

                            {/* Return to Bookings option */}
                            <div className="text-center pt-4">
                                <p className="text-white/40 text-sm mb-2">Not ready to verify now?</p>
                                <Link
                                    href="/dashboard/bookings"
                                    className="text-[#df2531] hover:text-[#c41f2a] text-sm font-medium transition-colors"
                                    aria-label="Return to bookings"
                                >
                                    Return to My Bookings →
                                </Link>
                            </div>
                        </div>
                    )}

                    {step === 'selfie' && (
                        <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-white mb-2">Take a Live Selfie</h2>
                                <p className="text-white/50 text-sm">Position your face in the frame and capture. Make sure your face is clearly visible.</p>
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
                                        {cameraPermission === 'granted' || cameraPermission === 'prompt' ? (
                                            <Webcam
                                                ref={webcamRef}
                                                audio={false}
                                                screenshotFormat="image/jpeg"
                                                videoConstraints={videoConstraints}
                                                onUserMedia={() => {
                                                    setIsCameraReady(true)
                                                    setCameraError(null)
                                                    setCameraPermission('granted')
                                                }}
                                                onUserMediaError={(err) => {
                                                    console.error('[Verify] Camera error:', err)
                                                    setIsCameraReady(false)

                                                    // Handle both Error objects and string errors
                                                    const error = err instanceof Error ? err : (typeof err === 'string' ? new Error(err) : new Error(String(err)))

                                                    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                                                        setCameraPermission('denied')
                                                        setCameraError('Camera permission denied. Click "Request Camera Access" below to enable it.')
                                                    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                                                        setCameraPermission('unsupported')
                                                        setCameraError('No camera found. Please connect a camera and try again.')
                                                    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                                                        setCameraError('Camera is already in use by another application. Please close other apps using the camera.')
                                                    } else {
                                                        setCameraError('Unable to access camera. Please check your camera permissions and try again.')
                                                    }
                                                }}
                                                className="w-full h-full object-cover"
                                                mirrored={true}
                                            />
                                        ) : null}

                                        {/* Face guide overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-48 h-48 border-2 border-white/30 rounded-full" aria-hidden="true" />
                                        </div>

                                        {/* Camera loading state */}
                                        {(!isCameraReady && !cameraError && cameraPermission !== 'denied' && cameraPermission !== 'unsupported') && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black" role="status" aria-live="polite">
                                                <SpinnerGap size={32} className="text-white/30 animate-spin mb-4" aria-hidden="true" />
                                                <p className="text-white/50 text-sm">Starting camera...</p>
                                                <p className="text-white/30 text-xs mt-2">Please allow camera access when prompted</p>
                                                <span className="sr-only">Loading camera</span>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Camera error or permission denied */}
                                {(cameraError || cameraPermission === 'denied' || cameraPermission === 'unsupported') && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black p-4" role="alert">
                                        <Warning size={48} weight="duotone" className="text-amber-400 mb-4" aria-hidden="true" />
                                        <p className="text-white/70 text-sm text-center mb-4">{cameraError || 'Camera access is required to take a selfie'}</p>

                                        {cameraPermission === 'denied' && (
                                            <div className="space-y-3 w-full max-w-xs">
                                                <button
                                                    onClick={requestCameraAccess}
                                                    disabled={isRequestingPermission}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#df2531] hover:bg-[#c41f2a] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    aria-label="Request camera access"
                                                >
                                                    {isRequestingPermission ? (
                                                        <>
                                                            <SpinnerGap size={20} className="animate-spin" aria-hidden="true" />
                                                            <span className="sr-only">Requesting camera access...</span>
                                                            Requesting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <VideoCamera size={20} weight="duotone" aria-hidden="true" />
                                                            Request Camera Access
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => window.location.reload()}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
                                                    aria-label="Refresh page"
                                                >
                                                    <ArrowCounterClockwise size={20} aria-hidden="true" />
                                                    Refresh Page
                                                </button>
                                                <p className="text-white/50 text-xs text-center mt-2">
                                                    If the prompt doesn&apos;t appear, enable camera access in your browser settings
                                                </p>
                                            </div>
                                        )}

                                        {cameraPermission === 'prompt' && !cameraError && (
                                            <button
                                                onClick={requestCameraAccess}
                                                disabled={isRequestingPermission}
                                                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#df2531] hover:bg-[#c41f2a] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                aria-label="Request camera access"
                                            >
                                                {isRequestingPermission ? (
                                                    <>
                                                        <SpinnerGap size={20} className="animate-spin" aria-hidden="true" />
                                                        <span className="sr-only">Requesting camera access...</span>
                                                        Requesting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <VideoCamera size={20} weight="duotone" aria-hidden="true" />
                                                        Request Camera Access
                                                    </>
                                                )}
                                            </button>
                                        )}

                                        {cameraPermission === 'unsupported' && (
                                            <p className="text-white/50 text-xs text-center mt-2">
                                                Please connect a camera device and refresh the page
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Image compression indicator */}
                                {compressingImage && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm" role="status" aria-live="polite">
                                        <div className="text-center">
                                            <SpinnerGap size={32} className="text-white animate-spin mx-auto mb-2" aria-hidden="true" />
                                            <p className="text-white/70 text-sm">Processing image...</p>
                                            <span className="sr-only">Compressing image</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Capture / Retake buttons */}
                            {!(cameraPermission === 'denied' || cameraPermission === 'unsupported' || cameraError) && (
                                <div className="flex justify-center">
                                    {selfiePreview ? (
                                        <button
                                            onClick={retakePhoto}
                                            className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                                            aria-label="Retake photo"
                                        >
                                            <ArrowCounterClockwise size={20} aria-hidden="true" />
                                            Retake Photo
                                        </button>
                                    ) : (
                                        <button
                                            onClick={capturePhoto}
                                            disabled={!isCameraReady || !!cameraError || compressingImage || isRequestingPermission || cameraPermission === 'checking'}
                                            className="w-16 h-16 rounded-full bg-[#df2531] hover:bg-[#c41f2a] disabled:bg-white/20 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                                            aria-label="Capture photo"
                                        >
                                            <Camera size={28} weight="fill" className="text-white" aria-hidden="true" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Navigation */}
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => setStep('intro')}
                                    variant="ghost"
                                    className="flex-1 text-white/50 hover:text-white"
                                    aria-label="Go back to previous step"
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={() => setStep('details')}
                                    disabled={!selfiePreview || compressingImage}
                                    className="flex-1 bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold disabled:opacity-50"
                                    aria-label="Continue to details step"
                                >
                                    Continue
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'details' && (
                        <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-white mb-2">Confirm Your Details</h2>
                                <p className="text-white/50 text-sm">This information will be shared with the talent for coordination</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Full Name */}
                                <div>
                                    <label htmlFor="full-name" className="block text-white/60 text-sm mb-2">
                                        Full Name <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="full-name"
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Enter your first and last name"
                                            autoComplete="name"
                                            required
                                            aria-label="Full name"
                                            aria-invalid={fullNameError ? 'true' : 'false'}
                                            aria-describedby={fullNameError ? 'full-name-error' : 'full-name-help'}
                                            className={`w-full px-4 py-3 rounded-xl bg-white/5 border transition-colors text-white placeholder:text-white/30 focus:outline-none ${fullNameError
                                                ? 'border-red-500/50 focus:border-red-500'
                                                : fullNameValid
                                                    ? 'border-green-500/50 focus:border-green-500'
                                                    : 'border-white/10 focus:border-[#df2531]/50'
                                                }`}
                                        />
                                        {fullNameValid && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Check size={20} className="text-green-400" aria-hidden="true" />
                                            </div>
                                        )}
                                    </div>
                                    {fullNameError && (
                                        <p id="full-name-error" className="text-red-400 text-xs mt-1 flex items-center gap-1" role="alert">
                                            <X size={14} aria-hidden="true" />
                                            {fullNameError}
                                        </p>
                                    )}
                                    {!fullNameError && fullName && (
                                        <p id="full-name-help" className="text-green-400 text-xs mt-1 flex items-center gap-1">
                                            <Check size={14} aria-hidden="true" />
                                            Full name looks good
                                        </p>
                                    )}
                                </div>

                                {/* Phone Number */}
                                <div>
                                    <label htmlFor="phone-number" className="block text-white/60 text-sm mb-2">
                                        Phone Number <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="phone-number"
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="08012345678 or +2348012345678"
                                            autoComplete="tel"
                                            required
                                            aria-label="Phone number"
                                            aria-invalid={phoneError ? 'true' : 'false'}
                                            aria-describedby={phoneError ? 'phone-error' : phoneValid ? 'phone-help' : undefined}
                                            className={`w-full px-4 py-3 rounded-xl bg-white/5 border transition-colors text-white placeholder:text-white/30 focus:outline-none ${phoneError
                                                ? 'border-red-500/50 focus:border-red-500'
                                                : phoneValid
                                                    ? 'border-green-500/50 focus:border-green-500'
                                                    : 'border-white/10 focus:border-[#df2531]/50'
                                                }`}
                                        />
                                        {phoneValid && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Check size={20} className="text-green-400" aria-hidden="true" />
                                            </div>
                                        )}
                                    </div>
                                    {phoneError && (
                                        <p id="phone-error" className="text-red-400 text-xs mt-1 flex items-center gap-1" role="alert">
                                            <X size={14} aria-hidden="true" />
                                            {phoneError}
                                        </p>
                                    )}
                                    {!phoneError && phoneValid && (
                                        <p id="phone-help" className="text-green-400 text-xs mt-1 flex items-center gap-1">
                                            <Check size={14} aria-hidden="true" />
                                            Valid Nigerian phone number
                                        </p>
                                    )}
                                    {!phone && (
                                        <p className="text-white/40 text-xs mt-1">
                                            Format: 08012345678, +2348012345678, or 2348012345678
                                        </p>
                                    )}
                                </div>

                                {/* Location */}
                                <div>
                                    <label htmlFor="location" className="block text-white/60 text-sm mb-2">
                                        Location <span className="text-white/40 text-xs">(Optional)</span>
                                    </label>
                                    {gpsCoords ? (
                                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
                                            <CheckCircle size={20} className="text-green-400 shrink-0" aria-hidden="true" />
                                            <div className="flex-1 min-w-0">
                                                <span className="text-green-400 text-sm block">Location captured successfully</span>
                                                <span className="text-green-400/60 text-xs block truncate" title={gpsCoords}>
                                                    Coordinates: {gpsCoords}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRemoveLocation}
                                                className="text-green-400/60 hover:text-green-400 transition-colors shrink-0"
                                                aria-label="Remove location"
                                            >
                                                <X size={18} aria-hidden="true" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleGetLocation}
                                            disabled={gpsLoading}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:border-[#df2531]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label="Share current location"
                                        >
                                            {gpsLoading ? (
                                                <>
                                                    <SpinnerGap size={20} className="animate-spin" aria-hidden="true" />
                                                    <span className="sr-only">Getting location...</span>
                                                    Getting location...
                                                </>
                                            ) : (
                                                <>
                                                    <MapPin size={20} weight="duotone" aria-hidden="true" />
                                                    Share Current Location
                                                </>
                                            )}
                                        </button>
                                    )}
                                    {gpsError && (
                                        <p className="text-red-400 text-xs mt-2 flex items-start gap-1" role="alert">
                                            <Warning size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
                                            <span>{gpsError}</span>
                                        </p>
                                    )}
                                    {!gpsCoords && !gpsError && (
                                        <p className="text-white/40 text-xs mt-2">
                                            Sharing your location helps ensure a safe meeting
                                        </p>
                                    )}
                                </div>

                                {/* Selfie Preview */}
                                {selfiePreview && (
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#df2531]/30 transition-all duration-300">
                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10 shrink-0">
                                            <img src={selfiePreview} alt="Your selfie" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium">Selfie Captured</p>
                                            <p className="text-white/40 text-sm">Ready for verification</p>
                                        </div>
                                        <CheckCircle size={24} className="text-green-400 shrink-0" aria-hidden="true" />
                                    </div>
                                )}

                                {error && (
                                    <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl" role="alert">
                                        <XCircle size={20} className="text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
                                        <p className="text-red-400 text-sm">{error}</p>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        onClick={() => setStep('selfie')}
                                        variant="ghost"
                                        className="flex-1 text-white/50 hover:text-white"
                                        aria-label="Go back to selfie step"
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={!fullNameValid || !phoneValid || !selfieBlob || isSubmitting}
                                        className="flex-1 bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold disabled:opacity-50"
                                        aria-label="Submit verification"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <SpinnerGap size={20} className="animate-spin mr-2" aria-hidden="true" />
                                                <span className="sr-only">Submitting verification...</span>
                                                Submitting...
                                            </>
                                        ) : (
                                            'Submit Verification'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {step === 'complete' && (
                        <div className="text-center py-12 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6 animate-pulse">
                                <CheckCircle size={40} weight="duotone" className="text-green-400" aria-hidden="true" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4">Verification Submitted!</h2>
                            <p className="text-white/50 mb-2">Your verification is being reviewed.</p>
                            <p className="text-white/30 text-sm">Redirecting to your booking...</p>
                        </div>
                    )}
                </div>
            </div>
            <MobileBottomNav />
        </>
    )
}
