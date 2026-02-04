'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, MapPin, Star, Heart, Share, Circle,
    Calendar, Clock, SpinnerGap, X, ShieldCheck,
    ForkKnife, CalendarCheck, Airplane, Lock, Camera, Warning, ChatCircle, Crown, Eye,
    ShareNetwork, Copy, CheckCircle, Moon, Sparkle
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { ReviewCard, ReviewSummary } from '@/components/Reviews'
import { GiftCoins } from '@/components/GiftCoins'
import { GiftLeaderboard } from '@/components/GiftLeaderboard'
import { MediaLightbox } from '@/components/MediaLightbox'
import { ServicesList } from '@/components/talent/ServicesList'
import { BookingModal } from '@/components/talent/BookingModal'
import { AvatarPlaceholder } from '@/components/AvatarPlaceholder'
import { useFavorites } from '@/hooks/useFavorites'
import { useWallet } from '@/hooks/useWallet'
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
    userId: string // Empty string if not authenticated
}

const serviceIcons: Record<string, Icon> = {
    'utensils': ForkKnife,
    'calendar': CalendarCheck,
    'plane': Airplane,
    'lock': Lock,
    'camera': Camera,
    'clock': Clock,
    'moon': Moon,
    'heart': Heart,
    'sparkle': Sparkle,
}

// Gallery Section with Free/Premium Tabs and Unlock functionality
interface GallerySectionProps {
    media: Media[]
    userId: string // Empty string if not authenticated
    userBalance: number
    talentName: string
    onUnlock: (mediaId: string, unlockPrice: number) => Promise<boolean>
    onOpenLightbox: (media: Media) => void
    onLoginRequired: () => void
}

function GallerySection({ media, userId, userBalance, talentName, onUnlock, onOpenLightbox, onLoginRequired }: GallerySectionProps) {
    const [activeTab, setActiveTab] = useState<'free' | 'premium'>('free')
    const [unlocking, setUnlocking] = useState<string | null>(null)
    const [unlockedMedia, setUnlockedMedia] = useState<Set<string>>(new Set())
    const [isMobile, setIsMobile] = useState<boolean>(false)
    const [showAll, setShowAll] = useState<boolean>(false)

    const freeMedia = media.filter(m => !m.is_premium)
    const premiumMedia = media.filter(m => m.is_premium)
    const currentMedia = activeTab === 'free' ? freeMedia : premiumMedia

    // Fetch unlocked media from database on mount
    useEffect(() => {
        const fetchUnlockedMedia = async () => {
            try {
                const supabase = createClient()
                const { data, error } = await supabase
                    .from('user_unlocks')
                    .select('media_id')
                    .eq('user_id', userId)
                    .in('media_id', media.map(m => m.id))

                if (!error && data) {
                    setUnlockedMedia(new Set(data.map(u => u.media_id)))
                }
            } catch (err) {
                console.error('[GallerySection] Error fetching unlocked media:', err)
            }
        }

        if (userId && media.length > 0) {
            fetchUnlockedMedia()
        }
    }, [userId, media])

    // Track viewport size for responsive media limits
    useEffect(() => {
        if (typeof window === 'undefined') return

        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
        }

        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Reset "View More" state when switching between free/premium tabs
    useEffect(() => {
        setShowAll(false)
    }, [activeTab])

    // Don't render if no media at all
    if (media.length === 0) return null

    // Determine how many media items to show based on screen size
    const baseLimit = isMobile ? 6 : 9
    const effectiveLimit = showAll ? currentMedia.length : baseLimit
    const visibleMedia = currentMedia.slice(0, effectiveLimit)

    const handleUnlock = async (item: Media, e?: React.MouseEvent) => {
        e?.stopPropagation()
        if (userBalance < item.unlock_price) {
            alert(`Insufficient balance. You need ${item.unlock_price} coins to unlock this content.`)
            return
        }

        setUnlocking(item.id)
        try {
            const success = await onUnlock(item.id, item.unlock_price)
            if (success) {
                setUnlockedMedia(prev => new Set([...prev, item.id]))
                // Refresh page to show unlocked content
                window.location.reload()
            }
        } catch (err) {
            console.error('[GallerySection] Unlock failed:', err)
        } finally {
            setUnlocking(null)
        }
    }

    const { push: _push } = useRouter()


    const isUnlocked = (mediaId: string) => unlockedMedia.has(mediaId)

    const handleOpenLightbox = (item: Media) => {
        // Only open lightbox if not premium or if unlocked
        if (!item.is_premium || isUnlocked(item.id)) {
            onOpenLightbox(item)
        }
    }

    const isVideo = (url: string) => {
        return url.match(/\.(mp4|webm|ogg|mov)$/i) !== null
    }

    return (
        <div className="mb-8" data-testid="talent-gallery">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Media Gallery</h2>
                    <p className="text-white/50 text-sm">Browse photos and videos from {talentName || 'this talent'}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('free')}
                        data-testid="gallery-tab-free"
                        aria-label={`View ${freeMedia.length} free media items`}
                        aria-pressed={activeTab === 'free'}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'free'
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        <Eye size={16} weight="duotone" aria-hidden="true" />
                        Free <span className="ml-1">({freeMedia.length})</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('premium')}
                        data-testid="gallery-tab-premium"
                        aria-label={`View ${premiumMedia.length} premium media items`}
                        aria-pressed={activeTab === 'premium'}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'premium'
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20'
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        <Crown size={16} weight="fill" aria-hidden="true" />
                        Premium <span className="ml-1">({premiumMedia.length})</span>
                    </button>
                </div>
            </div>

            {currentMedia.length === 0 ? (
                <div className="text-center py-12 rounded-xl bg-white/5 border border-white/10">
                    {activeTab === 'premium' ? (
                        <div className="flex flex-col items-center gap-4 py-8 text-center px-4">
                            {!userId ? (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-2 border border-amber-500/20">
                                        <Lock size={32} weight="duotone" className="text-amber-400" aria-hidden="true" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg mb-1">Premium Content Locked</h3>
                                        <p className="text-white/60 text-sm mb-6 max-w-xs mx-auto">
                                            Log in or create an account to unlock exclusive photos and videos from {talentName}.
                                        </p>
                                        <button
                                            onClick={onLoginRequired}
                                            className="px-8 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-amber-500/20"
                                        >
                                            Log In to Unlock
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Crown size={48} weight="duotone" className="text-amber-500/50" aria-hidden="true" />
                                    <p className="text-white/60 font-medium">No premium content available</p>
                                    <p className="text-white/40 text-sm">Premium content will appear here when added</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <Camera size={48} weight="duotone" className="text-white/30" aria-hidden="true" />
                            <p className="text-white/60 font-medium">No free content available</p>
                            <p className="text-white/40 text-sm">Check the premium tab for exclusive content</p>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {visibleMedia.map((item) => {
                            const unlocked = isUnlocked(item.id)
                            const showBlur = item.is_premium && !unlocked
                            const canOpen = !item.is_premium || unlocked

                            return (
                                <div
                                    key={item.id}
                                    className={`aspect-square rounded-xl overflow-hidden relative group ${canOpen ? 'cursor-pointer' : ''}`}
                                    onClick={() => canOpen && handleOpenLightbox(item)}
                                >
                                    {isVideo(item.url) ? (
                                        <video
                                            src={item.url}
                                            className={`w-full h-full object-cover transition-all ${showBlur ? 'blur-xl scale-110' : ''}`}
                                            muted
                                            playsInline
                                        />
                                    ) : (
                                        <Image
                                            src={item.url}
                                            alt="Gallery"
                                            fill
                                            sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                            className={`object-cover transition-all ${showBlur ? 'blur-xl scale-110' : ''}`}
                                        />
                                    )}

                                    {/* Video indicator */}
                                    {isVideo(item.url) && !showBlur && (
                                        <div className="absolute bottom-2 right-2 bg-black/60 rounded-full p-1.5">
                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
                                    )}

                                    {/* Premium locked overlay */}
                                    {item.is_premium && !unlocked && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                                            <button
                                                onClick={(e) => handleUnlock(item, e)}
                                                disabled={unlocking === item.id}
                                                className="flex flex-col items-center gap-2.5 p-5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 hover:from-amber-500/30 hover:to-orange-500/30 transition-all disabled:opacity-50"
                                                aria-label={`Unlock premium content for ${item.unlock_price} coins`}
                                            >
                                                {unlocking === item.id ? (
                                                    <>
                                                        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                                                        <span className="text-white text-xs font-medium">Unlocking...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Lock size={28} weight="duotone" className="text-amber-400" aria-hidden="true" />
                                                        <div className="text-center">
                                                            <span className="text-white text-sm font-semibold block">
                                                                Unlock for {item.unlock_price} coins
                                                            </span>
                                                            {userBalance < item.unlock_price && (
                                                                <span className="text-red-400 text-xs mt-1 block">
                                                                    Need {item.unlock_price - userBalance} more coins
                                                                </span>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {/* Unlocked badge */}
                                    {unlocked && (
                                        <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-green-500/80 text-white text-[10px] font-medium flex items-center gap-1">
                                            <CheckCircle size={12} weight="bold" />
                                            Unlocked
                                        </div>
                                    )}

                                    {/* Hover overlay for clickable items */}
                                    {canOpen && (
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                </svg>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {currentMedia.length > baseLimit && (
                        <div className="mt-4 flex justify-center">
                            <button
                                type="button"
                                onClick={() => setShowAll(prev => !prev)}
                                className="px-4 py-2 rounded-full text-sm font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
                                aria-label={showAll ? 'View fewer media items' : 'View more media items'}
                            >
                                {showAll
                                    ? 'View Less'
                                    : `View More (${currentMedia.length - visibleMedia.length} more)`}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export function TalentProfileClient({ talent: initialTalent, currentUser, wallet: initialWallet, userId }: TalentProfileClientProps) {
    const router = useRouter()
    const supabase = createClient()
    const { isFavorite, toggleFavorite, isLoaded: favoritesLoaded } = useFavorites(userId)

    // Real-time wallet synchronization
    const { wallet } = useWallet({ userId, initialWallet, autoRefresh: true })

    // Real-time talent profile synchronization - updates when talent edits their profile
    const [talent, setTalent] = useState<TalentWithDetails>(initialTalent)
    const profileChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
    const mediaChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
    const servicesChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

    const [selectedServices, setSelectedServices] = useState<string[]>([])
    const [showBookingModal, setShowBookingModal] = useState(false)
    const [bookingDate, setBookingDate] = useState('')
    const [bookingTime, setBookingTime] = useState('')
    const [bookingNotes, setBookingNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showErrorBanner, setShowErrorBanner] = useState(false)
    const [showShareMenu, setShowShareMenu] = useState(false)
    const [copied, setCopied] = useState(false)
    const [startingChat, setStartingChat] = useState(false)

    // Date/time validation states (kept for future validation feature)
    const [_dateError, setDateError] = useState('')
    const [_timeError, setTimeError] = useState('')

    // Lightbox state - standalone for all media
    const [lightboxMedia, setLightboxMedia] = useState<Media | null>(null)
    const [lightboxIndex, setLightboxIndex] = useState<number>(-1)
    const [unlockedMediaIds, setUnlockedMediaIds] = useState<Set<string>>(new Set())

    // Real-time profile synchronization - updates when talent edits profile in dashboard
    useEffect(() => {
        const talentId = talent.id

        // Cleanup existing channels
        if (profileChannelRef.current) {
            supabase.removeChannel(profileChannelRef.current)
        }
        if (mediaChannelRef.current) {
            supabase.removeChannel(mediaChannelRef.current)
        }
        if (servicesChannelRef.current) {
            supabase.removeChannel(servicesChannelRef.current)
        }

        // Subscribe to profile updates (display_name, bio, location, avatar_url, etc.)
        const profileChannel = supabase
            .channel(`talent-profile:${talentId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${talentId}`,
                },
                async (payload) => {
                    console.log('[TalentProfile] Real-time profile UPDATE:', payload.new)
                    const updatedProfile = payload.new as Profile
                    // Refetch full profile data to ensure all fields are updated (including nested relations)
                    try {
                        const { data: fullProfile } = await supabase
                            .from('profiles')
                            .select(`
                                *,
                                talent_menus (
                                    id,
                                    talent_id,
                                    service_type_id,
                                    price,
                                    is_active,
                                    created_at,
                                    service_type:service_types (
                                        id,
                                        name,
                                        icon,
                                        description
                                    )
                                )
                            `)
                            .eq('id', talentId)
                            .single()

                        if (fullProfile) {
                            // Map talent_menus to proper structure
                            const menusData = (fullProfile.talent_menus || []).map((m: any) => {
                                const serviceType = Array.isArray(m.service_type) ? m.service_type[0] : m.service_type
                                return {
                                    id: m.id,
                                    talent_id: m.talent_id || talentId,
                                    service_type_id: m.service_type_id,
                                    price: m.price,
                                    is_active: m.is_active,
                                    created_at: m.created_at,
                                    service_type: serviceType
                                }
                            })

                            setTalent(prev => ({
                                ...prev,
                                ...fullProfile,
                                talent_menus: menusData,
                            }))
                        } else {
                            // Fallback to simple update if full fetch fails
                            setTalent(prev => ({
                                ...prev,
                                ...updatedProfile,
                            }))
                        }
                    } catch (err) {
                        console.error('[TalentProfile] Error refreshing profile:', err)
                        // Fallback to simple update
                        setTalent(prev => ({
                            ...prev,
                            ...updatedProfile,
                        }))
                    }
                }
            )
            .subscribe((status) => {
                console.log('[TalentProfile] Profile channel subscription status:', status)
            })

        // Subscribe to media updates (new media added/removed)
        const mediaChannel = supabase
            .channel(`talent-media:${talentId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'media',
                    filter: `talent_id=eq.${talentId}`,
                },
                async (payload) => {
                    console.log('[TalentProfile] Real-time media change:', payload.eventType)
                    // Refresh media list - use regular client (RLS will filter premium)
                    try {
                        const { data: mediaData } = await supabase
                            .from('media')
                            .select('id, talent_id, url, type, is_premium, unlock_price, created_at')
                            .eq('talent_id', talentId)
                            .order('created_at', { ascending: false })

                        if (mediaData) {
                            setTalent(prev => ({
                                ...prev,
                                media: mediaData,
                            }))
                        }
                    } catch (err) {
                        console.error('[TalentProfile] Error refreshing media:', err)
                    }
                }
            )
            .subscribe((status) => {
                console.log('[TalentProfile] Media channel subscription status:', status)
            })

        // Subscribe to talent_menus updates (services added/updated/removed)
        const servicesChannel = supabase
            .channel(`talent-services:${talentId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'talent_menus',
                    filter: `talent_id=eq.${talentId}`,
                },
                async (payload) => {
                    console.log('[TalentProfile] Real-time services change:', payload.eventType)
                    // Refresh services list
                    try {
                        const { data: menusData } = await supabase
                            .from('talent_menus')
                            .select(`
                                id,
                                price,
                                is_active,
                                service_type:service_types (
                                    id,
                                    name,
                                    icon,
                                    description
                                )
                            `)
                            .eq('talent_id', talentId)

                        if (menusData) {
                            setTalent(prev => ({
                                ...prev,
                                talent_menus: menusData.map((m: any) => {
                                    const serviceType = Array.isArray(m.service_type) ? m.service_type[0] : m.service_type
                                    return {
                                        id: m.id,
                                        talent_id: m.talent_id || talentId,
                                        service_type_id: m.service_type_id,
                                        price: m.price,
                                        is_active: m.is_active,
                                        service_type: serviceType as ServiceType,
                                    }
                                }) as (TalentMenu & { service_type: ServiceType })[],
                            }))
                        }
                    } catch (err) {
                        console.error('[TalentProfile] Error refreshing services:', err)
                    }
                }
            )
            .subscribe((status) => {
                console.log('[TalentProfile] Services channel subscription status:', status)
            })

        profileChannelRef.current = profileChannel
        mediaChannelRef.current = mediaChannel
        servicesChannelRef.current = servicesChannel

        return () => {
            console.log('[TalentProfile] Cleaning up real-time channels')
            if (profileChannelRef.current) {
                supabase.removeChannel(profileChannelRef.current)
                profileChannelRef.current = null
            }
            if (mediaChannelRef.current) {
                supabase.removeChannel(mediaChannelRef.current)
                mediaChannelRef.current = null
            }
            if (servicesChannelRef.current) {
                supabase.removeChannel(servicesChannelRef.current)
                servicesChannelRef.current = null
            }
        }
    }, [talent.id, supabase])

    // Fetch unlocked media on mount to support lightbox navigation
    useEffect(() => {
        const fetchUnlockedMedia = async () => {
            if (!userId || !talent.media || talent.media.length === 0) return

            try {
                const { data, error } = await supabase
                    .from('user_unlocks')
                    .select('media_id')
                    .eq('user_id', userId)
                    .in('media_id', talent.media.map(m => m.id))

                if (!error && data) {
                    setUnlockedMediaIds(new Set(data.map(u => u.media_id)))
                }
            } catch (err) {
                console.error('[TalentProfile] Error fetching unlocked media:', err)
            }
        }

        fetchUnlockedMedia()
    }, [userId, talent.media, supabase])

    const isLiked = favoritesLoaded && isFavorite(talent.id)
    const activeServices = talent.talent_menus?.filter(m => m.is_active) || []

    const totalPrice = activeServices
        .filter(s => selectedServices.includes(s.id))
        .reduce((sum, s) => sum + s.price, 0)

    const userBalance = wallet?.balance || 0
    const hasInsufficientBalance = totalPrice > userBalance && selectedServices.length > 0
    const [currentBalance, setCurrentBalance] = useState(userBalance)

    const formatPrice = (price: number) => {
        const nairaEquivalent = price * 10
        return `${new Intl.NumberFormat('en-NG', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price)} coins (₦${new Intl.NumberFormat('en-NG', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(nairaEquivalent)})`
    }

    // Validate booking date (must be future date)
    const validateBookingDate = (date: string): string | null => {
        if (!date) return null

        const selectedDate = new Date(date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        selectedDate.setHours(0, 0, 0, 0)

        if (selectedDate < today) {
            return 'Please select a future date'
        }
        return null
    }

    // Validate booking time (must be at least 1 hour ahead)
    const validateBookingTime = (date: string, time: string): string | null => {
        if (!date || !time) return null

        const now = new Date()
        const selectedDateTime = new Date(`${date}T${time}`)
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

        if (selectedDateTime <= oneHourFromNow) {
            return 'Please select a time at least 1 hour from now'
        }
        return null
    }

    const _handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setBookingDate(value)
        const error = validateBookingDate(value)
        setDateError(error || '')

        // Also validate time if both are set
        if (value && bookingTime) {
            const timeErr = validateBookingTime(value, bookingTime)
            setTimeError(timeErr || '')
        }
    }

    const _handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setBookingTime(value)

        // Validate time if date is also set
        if (bookingDate) {
            const error = validateBookingTime(bookingDate, value)
            setTimeError(error || '')
        } else {
            setTimeError('')
        }
    }

    // Start or open conversation with talent
    const handleStartChat = async () => {
        if (!userId) {
            handleLoginRedirect()
            return
        }


        setStartingChat(true)
        setError('')
        setShowErrorBanner(false)
        const supabase = createClient()

        try {
            // Check if conversation already exists
            const { data: existingConv, error: checkError } = await supabase
                .from('conversations')
                .select('id')
                .or(`and(participant_1.eq.${userId},participant_2.eq.${talent.id}),and(participant_1.eq.${talent.id},participant_2.eq.${userId})`)
                .single()

            if (checkError && checkError.code !== 'PGRST116') {
                // PGRST116 is "not found" which is expected if no conversation exists
                console.error('[TalentProfile] Error checking conversation:', checkError)
                throw new Error('Failed to check for existing conversation. Please try again.')
            }

            if (existingConv) {
                // Navigate to existing conversation
                router.push(`/dashboard/messages?conversation=${existingConv.id}`)
                return
            }

            // Create new conversation
            const { data: newConv, error: convError } = await supabase
                .from('conversations')
                .insert({
                    participant_1: userId,
                    participant_2: talent.id,
                    last_message_at: new Date().toISOString()
                })
                .select('id')
                .single()

            if (convError) {
                console.error('[TalentProfile] Failed to create conversation:', convError)
                throw new Error('Failed to start conversation. Please try again.')
            }

            // Navigate to new conversation
            router.push(`/dashboard/messages?conversation=${newConv.id}`)
        } catch (err) {
            console.error('[TalentProfile] Chat error:', err)
            const errorMessage = err instanceof Error ? err.message : 'Failed to start chat. Please try again.'
            setError(errorMessage)
            setShowErrorBanner(true)
        } finally {
            setStartingChat(false)
        }
    }

    const handleFavoriteToggle = () => {
        if (!userId) {
            router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
            return
        }
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

    const handleUnlockMedia = async (mediaId: string, unlockPrice: number): Promise<boolean> => {
        if (!userId) {
            router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
            return false
        }

        if (currentBalance < unlockPrice) {
            setError(`Insufficient balance. You need ${unlockPrice} coins to unlock this content.`)
            setShowErrorBanner(true)
            return false
        }

        try {
            // Use server-side API to handle unlock transaction (bypasses RLS)
            const response = await fetch('/api/media/unlock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    mediaId,
                    talentId: talent.id,
                    unlockPrice
                })
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
                const errorMessage = data.error || 'Failed to unlock content. Please try again.'
                throw new Error(errorMessage)
            }

            // Update local balance
            setCurrentBalance(data.newUserBalance)
            // Update unlocked media set for lightbox navigation
            setUnlockedMediaIds(prev => new Set([...prev, mediaId]))
            return true
        } catch (err) {
            console.error('[TalentProfile] Unlock error:', err)
            const errorMessage = err instanceof Error ? err.message : 'Failed to unlock content. Please try again.'
            setError(errorMessage)
            setShowErrorBanner(true)
            return false
        }
    }

    // Lightbox handlers - standalone for all media (free and premium)
    const getAllViewableMedia = (): Media[] => {
        // Get all media that can be viewed (free or unlocked premium)
        const allMedia = talent.media || []
        return allMedia.filter(m => !m.is_premium || unlockedMediaIds.has(m.id))
    }

    const handleOpenLightbox = (media: Media) => {
        const allMedia = getAllViewableMedia()
        const index = allMedia.findIndex(m => m.id === media.id)
        setLightboxIndex(index)
        setLightboxMedia(media)
    }

    const handleCloseLightbox = () => {
        setLightboxMedia(null)
        setLightboxIndex(-1)
    }

    const handleNextMedia = () => {
        const allMedia = getAllViewableMedia()
        if (lightboxIndex < allMedia.length - 1) {
            const nextIndex = lightboxIndex + 1
            setLightboxIndex(nextIndex)
            const nextMedia = allMedia[nextIndex]
            if (nextMedia) setLightboxMedia(nextMedia)
        }
    }

    const handlePreviousMedia = () => {
        if (lightboxIndex > 0) {
            const prevIndex = lightboxIndex - 1
            const allMedia = getAllViewableMedia()
            setLightboxIndex(prevIndex)
            const prevMedia = allMedia[prevIndex]
            if (prevMedia) setLightboxMedia(prevMedia)
        }
    }

    const handleLoginRedirect = () => {
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
    }

    const toggleService = (serviceId: string) => {
        setSelectedServices(prev =>
            prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        )
    }

    const handleBooking = async () => {
        if (!userId) {
            router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
            return
        }

        if (selectedServices.length === 0) {
            setError('Please select at least one service')
            setShowErrorBanner(true)
            return
        }

        if (!bookingDate || !bookingTime) {
            setError('Please select date and time')
            setShowErrorBanner(true)
            return
        }

        // Validate date and time
        const dateErr = validateBookingDate(bookingDate)
        const timeErr = validateBookingTime(bookingDate, bookingTime)

        if (dateErr || timeErr) {
            setError(dateErr || timeErr || 'Please fix the date/time errors')
            setShowErrorBanner(true)
            return
        }

        // Check balance before proceeding
        if (hasInsufficientBalance) {
            setError('Insufficient balance. Please top up your wallet.')
            setShowErrorBanner(true)
            return
        }

        setLoading(true)
        setError('')
        setShowErrorBanner(false)

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
            setShowErrorBanner(true)
            console.error('[TalentProfile] Booking error:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black pt-16">
            {/* Error Banner */}
            {showErrorBanner && error && (
                <div className="fixed top-16 left-0 right-0 z-50 bg-red-500/10 border-b border-red-500/20 px-4 py-3 animate-fade-in-up">
                    <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <Warning size={20} weight="duotone" className="text-red-400 shrink-0" aria-hidden="true" />
                            <p className="text-red-400 text-sm" role="alert">{error}</p>
                        </div>
                        <button
                            onClick={() => {
                                setShowErrorBanner(false)
                                setError('')
                            }}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            aria-label="Dismiss error"
                        >
                            <X size={20} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className={`sticky ${showErrorBanner ? 'top-28' : 'top-16'} z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 transition-all duration-300`}>
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => router.back()}
                            className="text-white/60 hover:text-white transition-colors"
                            aria-label="Go back"
                        >
                            <ArrowLeft size={24} weight="duotone" aria-hidden="true" />
                        </button>
                        <div className="flex items-center gap-3">
                            {/* Gift Coins Button - Visible to all (Login prompt for guests, functional for others) */}
                            {(!currentUser || currentUser.id !== talent.id) && (
                                <GiftCoins
                                    talentId={talent.id}
                                    talentName={talent.display_name || 'Talent'}
                                    senderId={userId}
                                    senderBalance={wallet?.balance || 0}
                                    onSuccess={() => router.refresh()}
                                    onAuthRequired={handleLoginRedirect}
                                />
                            )}
                            {/* Message Button - Visible to all (Login prompt for guests) */}
                            {(!currentUser || currentUser.id !== talent.id) && (
                                <button
                                    onClick={handleStartChat}
                                    disabled={startingChat}
                                    data-testid="message-button"
                                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-[#df2531] transition-all disabled:opacity-50"
                                    title="Send message"
                                >
                                    {startingChat ? (
                                        <SpinnerGap size={20} className="animate-spin" />
                                    ) : (
                                        <ChatCircle size={20} />
                                    )}
                                </button>
                            )}
                            <button
                                onClick={handleFavoriteToggle}
                                data-testid="favorite-button"
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isLiked ? 'bg-[#df2531] text-white' : 'bg-white/5 text-white/60 hover:text-white'
                                    }`}
                            >
                                <Heart size={20} weight={isLiked ? 'fill' : 'regular'} />
                            </button>
                            <div className="relative">
                                <button
                                    onClick={handleShare}
                                    data-testid="share-button"
                                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                                >
                                    <Share size={20} />
                                </button>

                                {/* Share Menu Dropdown */}
                                {showShareMenu && (
                                    <div className="absolute right-0 top-12 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                                        <button
                                            onClick={copyToClipboard}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/10 transition-colors text-left"
                                        >
                                            {copied ? (
                                                <>
                                                    <CheckCircle size={18} className="text-green-400" />
                                                    <span className="text-green-400">Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={18} />
                                                    <span>Copy Link</span>
                                                </>
                                            )}
                                        </button>
                                        <a
                                            href={`https://twitter.com/intent/tweet?text=Check out ${talent.display_name} on Nego!&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/10 transition-colors"
                                        >
                                            <ShareNetwork size={18} />
                                            <span>Share on X</span>
                                        </a>
                                        <button
                                            onClick={() => setShowShareMenu(false)}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-white/50 hover:bg-white/10 transition-colors text-left border-t border-white/10"
                                        >
                                            <X size={18} />
                                            <span>Close</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Profile Header - Redesigned */}
                <div className="flex flex-col md:flex-row gap-6 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    {/* Avatar Section */}
                    <div className="relative w-full md:w-72 aspect-[3/4] rounded-2xl overflow-hidden shrink-0 group">
                        {talent.avatar_url ? (
                            <Image
                                src={talent.avatar_url}
                                alt={talent.display_name || 'Talent profile picture'}
                                fill
                                sizes="(max-width: 768px) 100vw, 288px"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                priority
                            />
                        ) : (
                            <AvatarPlaceholder className="rounded-2xl" size="lg" />
                        )}
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Status Badge */}
                        <div className="absolute top-4 left-4">
                            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-md border ${talent.status === 'online'
                                ? 'bg-green-500/20 text-green-400 border-green-500/30 shadow-lg shadow-green-500/20'
                                : talent.status === 'booked'
                                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-lg shadow-amber-500/20'
                                    : 'bg-white/10 text-white/60 border-white/10'
                                }`}
                                role="status"
                                aria-label={`Talent is ${talent.status === 'online' ? 'online now' : talent.status === 'booked' ? 'currently booked' : 'offline'}`}
                            >
                                <Circle size={8} weight="fill" className={talent.status === 'online' ? 'animate-pulse' : ''} aria-hidden="true" />
                                {talent.status === 'online' ? 'Online Now' : talent.status === 'booked' ? 'Currently Booked' : 'Offline'}
                            </span>
                        </div>

                        {/* Verified Badge on Avatar */}
                        {talent.is_verified && (
                            <div className="absolute top-4 right-4">
                                <div className="w-10 h-10 rounded-full bg-[#df2531]/90 backdrop-blur-md border border-[#df2531]/50 flex items-center justify-center shadow-lg" aria-label="Verified talent">
                                    <ShieldCheck size={20} weight="fill" className="text-white" aria-hidden="true" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile Info Section - Enhanced */}
                    <div className="flex-1 space-y-4">
                        {/* Name and Verification */}
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <h1 className="text-3xl md:text-4xl font-bold text-white">
                                    {talent.display_name || 'Talent'}
                                </h1>
                                {talent.is_verified && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#df2531]/20 border border-[#df2531]/30" aria-label="Verified talent">
                                        <ShieldCheck size={16} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                                        <span className="text-[#df2531] text-xs font-medium">Verified</span>
                                    </div>
                                )}
                            </div>

                            {/* Metadata Row */}
                            <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm">
                                {talent.username && (
                                    <span className="flex items-center gap-1.5" aria-label={`Username: ${talent.username}`}>
                                        <span className="text-white/40" aria-hidden="true">@</span>
                                        <span className="font-medium">{talent.username}</span>
                                    </span>
                                )}
                                {talent.location && (
                                    <span className="flex items-center gap-1.5" aria-label={`Location: ${talent.location}`}>
                                        <MapPin size={16} weight="duotone" className="text-white/50" aria-hidden="true" />
                                        {talent.location}
                                    </span>
                                )}
                                {talent.review_count && talent.review_count > 0 && (
                                    <span className="flex items-center gap-1.5" aria-label={`Rating: ${(talent.average_rating || 0).toFixed(1)} out of 5 stars from ${talent.review_count} reviews`}>
                                        <Star size={16} weight="duotone" className="text-amber-400" aria-hidden="true" />
                                        <span className="font-semibold text-amber-400">{(talent.average_rating || 0).toFixed(1)}</span>
                                        <span className="text-white/50">({talent.review_count} {talent.review_count === 1 ? 'review' : 'reviews'})</span>
                                    </span>
                                )}
                            </div>

                            {/* Full Name (if different from display name) */}
                            {talent.full_name && talent.full_name !== talent.display_name && (
                                <p className="text-white/50 text-sm mt-2" aria-label={`Full name: ${talent.full_name}`}>
                                    {talent.full_name}
                                </p>
                            )}
                        </div>

                        {/* Bio Section - Enhanced */}
                        {talent.bio ? (
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <h2 className="text-white/50 text-xs font-medium mb-2 uppercase tracking-wide">About</h2>
                                <p className="text-white/80 leading-relaxed whitespace-pre-wrap">
                                    {talent.bio}
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10 border-dashed">
                                <p className="text-white/40 text-sm italic">No bio available yet</p>
                            </div>
                        )}

                        {/* Quick Stats - Enhanced */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10 hover:border-[#df2531]/30 transition-colors">
                                <p className="text-white/50 text-xs mb-1.5 uppercase tracking-wide">Starting From</p>
                                <p className="text-white font-bold text-lg">
                                    {activeServices.length > 0
                                        ? formatPrice(Math.min(...activeServices.map(s => s.price)))
                                        : formatPrice(talent.starting_price || 0)}
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10 hover:border-white/20 transition-colors">
                                <p className="text-white/50 text-xs mb-1.5 uppercase tracking-wide">Response Time</p>
                                <p className="text-white font-bold text-lg">~30 min</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10 hover:border-white/20 transition-colors">
                                <p className="text-white/50 text-xs mb-1.5 uppercase tracking-wide">Total Reviews</p>
                                <p className="text-white font-bold text-lg">{talent.review_count || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Services Menu - Enhanced */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">Services & Pricing</h2>
                            <p className="text-white/50 text-sm">Select the services you&apos;d like to book</p>
                        </div>
                        {activeServices.length > 0 && (
                            <span className="text-white/40 text-sm">
                                {activeServices.length} {activeServices.length === 1 ? 'service' : 'services'} available
                            </span>
                        )}
                    </div>

                    {activeServices.length === 0 ? (
                        <div className="bg-white/5 rounded-xl p-12 text-center border border-white/10">
                            <Calendar size={48} weight="duotone" className="text-white/20 mx-auto mb-4" aria-hidden="true" />
                            <p className="text-white/60 font-medium mb-2">No services available</p>
                            <p className="text-white/40 text-sm">This talent hasn&apos;t added any services yet. Check back later!</p>
                        </div>
                    ) : (
                        <ServicesList
                            services={activeServices}
                            selectedServices={selectedServices}
                            onToggleService={toggleService}
                            formatPrice={formatPrice}
                            serviceIcons={serviceIcons}
                        />
                    )}
                </div>

                {/* Gallery with Free/Premium Tabs */}
                <GallerySection
                    media={talent.media || []}
                    userId={userId}
                    userBalance={currentBalance}
                    talentName={talent.display_name || 'this talent'}
                    onUnlock={handleUnlockMedia}
                    onOpenLightbox={handleOpenLightbox}
                    onLoginRequired={handleLoginRedirect}
                />

                {/* Gift Leaderboard - Enhanced */}
                <div className="mb-8">
                    <div className="mb-4">
                        <h2 className="text-2xl font-bold text-white mb-1">Top Supporters</h2>
                        <p className="text-white/50 text-sm">See who&apos;s been showing {talent.display_name || 'this talent'} the most love</p>
                    </div>
                    <GiftLeaderboard talentId={talent.id} />
                </div>

                {/* Reviews Section - Enhanced */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                                <ChatCircle size={28} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                                Reviews & Ratings
                            </h2>
                            {talent.review_count && talent.review_count > 0 && (
                                <p className="text-white/50 text-sm">What clients are saying about {talent.display_name || 'this talent'}</p>
                            )}
                        </div>
                        {talent.review_count && talent.review_count > 0 && (
                            <div className="text-right">
                                <p className="text-white/40 text-xs mb-1">Total Reviews</p>
                                <p className="text-white font-bold text-lg">{talent.review_count}</p>
                            </div>
                        )}
                    </div>

                    {/* Review Summary */}
                    {talent.review_count && talent.review_count > 0 ? (
                        <>
                            <ReviewSummary
                                averageRating={talent.average_rating || 0}
                                totalReviews={talent.review_count || 0}
                                ratingDistribution={(() => {
                                    // Calculate rating distribution from reviews
                                    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
                                    if (talent.reviews && talent.reviews.length > 0) {
                                        talent.reviews.forEach((review) => {
                                            const rating = review.rating
                                            if (rating >= 1 && rating <= 5) {
                                                distribution[rating] = (distribution[rating] || 0) + 1
                                            }
                                        })
                                    }
                                    return distribution
                                })()}
                            />

                            {/* Review List */}
                            {talent.reviews && talent.reviews.length > 0 && (
                                <div className="mt-6 space-y-4">
                                    {talent.reviews.slice(0, 5).map((review) => (
                                        <ReviewCard
                                            key={review.id}
                                            review={review}
                                            currentUserId={userId}
                                            isTalentOwner={userId === talent.id}
                                        />
                                    ))}

                                    {talent.reviews.length > 5 && (
                                        <button
                                            className="w-full py-4 text-center text-[#df2531] hover:text-[#c41f2a] text-sm font-semibold transition-colors rounded-xl hover:bg-[#df2531]/10"
                                            aria-label={`View all ${talent.review_count} reviews`}
                                        >
                                            View all {talent.review_count} reviews
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12 rounded-2xl bg-white/5 border border-white/10">
                            <Star size={48} weight="duotone" className="text-white/20 mx-auto mb-4" aria-hidden="true" />
                            <p className="text-white/60 font-medium mb-2">No reviews yet</p>
                            <p className="text-white/40 text-sm">Be the first to share your experience!</p>
                        </div>
                    )}
                </div>

                {/* Booking Summary - Fixed Bottom - Enhanced */}
                {selectedServices.length > 0 && (
                    <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 p-4 z-50 shadow-2xl">
                        <div className="max-w-4xl mx-auto">
                            {/* Low Balance Warning */}
                            {hasInsufficientBalance && (
                                <div className="flex items-center gap-3 mb-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 animate-fade-in-up" role="alert">
                                    <Warning size={24} weight="duotone" className="text-amber-400 shrink-0" aria-hidden="true" />
                                    <div className="flex-1">
                                        <p className="text-amber-400 text-sm font-semibold mb-1">Insufficient Balance</p>
                                        <p className="text-amber-400/80 text-xs">You need <span className="font-bold">{totalPrice - userBalance}</span> more coins to complete this booking</p>
                                    </div>
                                    <Link
                                        href="/dashboard/wallet"
                                        className="px-4 py-2 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/30 transition-colors whitespace-nowrap"
                                        aria-label="Go to wallet to top up coins"
                                    >
                                        Top Up Now
                                    </Link>
                                </div>
                            )}

                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-white/60 text-xs mb-1.5 uppercase tracking-wide">
                                        {selectedServices.length} {selectedServices.length === 1 ? 'service' : 'services'} selected
                                    </p>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <div>
                                            <p className="text-white text-2xl font-bold">{totalPrice}</p>
                                            <p className="text-white/50 text-xs">coins total</p>
                                        </div>
                                        <span className="text-white/20 text-xl" aria-hidden="true">•</span>
                                        <div>
                                            <p className={`text-lg font-semibold ${hasInsufficientBalance ? 'text-amber-400' : 'text-green-400'}`}>
                                                {userBalance} coins
                                            </p>
                                            <p className="text-white/50 text-xs">your balance</p>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => {
                                        if (!userId) {
                                            router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
                                            return
                                        }
                                        setShowBookingModal(true)
                                    }}
                                    disabled={hasInsufficientBalance || !userId}
                                    aria-label={hasInsufficientBalance ? 'Insufficient balance to book' : `Book ${selectedServices.length} services for ${totalPrice} coins`}
                                    className={`font-bold px-8 py-4 rounded-xl text-base transition-all ${hasInsufficientBalance
                                        ? 'bg-white/10 text-white/50 cursor-not-allowed'
                                        : 'bg-[#df2531] hover:bg-[#c41f2a] text-white shadow-lg shadow-[#df2531]/20 hover:shadow-[#df2531]/30'
                                        }`}
                                >
                                    {hasInsufficientBalance ? (
                                        <>
                                            <Warning size={20} weight="duotone" className="mr-2" aria-hidden="true" />
                                            Insufficient Balance
                                        </>
                                    ) : (
                                        <>
                                            <CalendarCheck size={20} weight="duotone" className="mr-2" aria-hidden="true" />
                                            Book Now
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Booking Modal */}
            <BookingModal
                isOpen={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                services={activeServices}
                selectedServices={selectedServices}
                totalPrice={totalPrice}
                userBalance={userBalance}
                onSubmit={async (_date, _time) => {
                    await handleBooking()
                }}
                isLoading={loading}
                error={error}
                formatPrice={formatPrice}
                date={bookingDate}
                time={bookingTime}
                setDate={(d) => {
                    setBookingDate(d)
                    setDateError('')
                }}
                setTime={(t) => {
                    setBookingTime(t)
                    setTimeError('')
                }}
                notes={bookingNotes}
                setNotes={setBookingNotes}
            />

            {/* Standalone Media Lightbox - works for both free and premium media */}
            <MediaLightbox
                media={lightboxMedia}
                onClose={handleCloseLightbox}
                onNext={handleNextMedia}
                onPrevious={handlePreviousMedia}
                hasNext={lightboxIndex >= 0 && lightboxIndex < (getAllViewableMedia().length - 1)}
                hasPrevious={lightboxIndex > 0}
            />
        </div>
    )
}
