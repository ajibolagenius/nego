'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    ArrowLeft, User, PencilSimple, Plus, Trash, Image as ImageIcon,
    CurrencyDollar, CalendarCheck, Clock, Eye, EyeSlash, Star,
    CaretRight, Coin, CheckCircle, XCircle, Hourglass, X,
    Camera, MapPin, Sparkle, Receipt, ChartLine, Icon, Bank, Money, Gift,
    Warning, SpinnerGap, ForkKnife, Airplane, Lock, Calendar, Moon, Heart
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { MediaManager } from '@/components/MediaManager'
import { ProfileImageUpload } from '@/components/ProfileImageUpload'
import { useWallet } from '@/hooks/useWallet'
import { getTalentUrl } from '@/lib/talent-url'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Profile, Wallet, ServiceType, Booking } from '@/types/database'

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

interface TalentMenu {
    id: string
    talent_id: string
    service_type_id: string
    price: number
    is_active: boolean
    created_at: string
    service_type: ServiceType
}

interface TalentMedia {
    id: string
    talent_id: string
    url: string
    type: 'image' | 'video'
    is_premium: boolean
    unlock_price: number
    created_at: string
}

interface BookingWithClient extends Omit<Booking, 'client'> {
    client: {
        display_name: string
        avatar_url: string | null
    } | null
}

interface Transaction {
    id: string
    user_id: string
    amount: number
    coins: number
    type: string
    status: string
    description: string
    created_at: string
}

interface GiftReceived {
    id: string
    sender_id: string
    recipient_id: string
    amount: number
    message: string | null
    created_at: string
    sender: {
        display_name: string
        avatar_url: string | null
    } | null
}

interface TalentDashboardClientProps {
    user: SupabaseUser
    profile: Profile | null
    menu: TalentMenu[]
    allServices: ServiceType[]
    media: TalentMedia[]
    bookings: BookingWithClient[]
    wallet: Wallet | null
    transactions?: Transaction[]
    giftsReceived?: GiftReceived[]
}

const statusColors: Record<string, { bg: string; text: string; icon: Icon; needsAction?: boolean }> = {
    payment_pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: Hourglass },
    verification_pending: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: Hourglass, needsAction: true },
    confirmed: { bg: 'bg-green-500/10', text: 'text-green-400', icon: CheckCircle },
    completed: { bg: 'bg-white/5', text: 'text-white/60', icon: CheckCircle },
    cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', icon: XCircle },
}

export function TalentDashboardClient({
    user,
    profile,
    menu,
    allServices,
    media,
    bookings,
    wallet: initialWallet,
    transactions = [],
    giftsReceived = []
}: TalentDashboardClientProps) {
    const router = useRouter()
    const supabase = createClient()

    // Real-time wallet synchronization
    const { wallet } = useWallet({ userId: user.id, initialWallet })

    // Real-time data state
    const [bookingsState, setBookingsState] = useState<BookingWithClient[]>(bookings)
    const [transactionsState, setTransactionsState] = useState<Transaction[]>(transactions)
    const [giftsReceivedState, setGiftsReceivedState] = useState<GiftReceived[]>(giftsReceived)

    // Channel refs for cleanup
    const bookingsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
    const transactionsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
    const giftsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

    const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'media' | 'bookings' | 'earnings' | 'withdrawals'>('overview')
    const [isAddingService, setIsAddingService] = useState(false)
    const [newServiceId, setNewServiceId] = useState('')
    const [newServicePrice, setNewServicePrice] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [editingBio, setEditingBio] = useState(false)
    const [bioText, setBioText] = useState(profile?.bio || '')
    const [editingProfile, setEditingProfile] = useState(false)
    const [displayName, setDisplayName] = useState(profile?.display_name || '')
    const [username, setUsername] = useState(profile?.username || '')
    const [location, setLocation] = useState(profile?.location || '')
    const [isOnline, setIsOnline] = useState(profile?.status === 'online')
    const [togglingStatus, setTogglingStatus] = useState(false)
    const [showAvatarUpload, setShowAvatarUpload] = useState(false)
    const [priceError, setPriceError] = useState('')
    const [profileError, setProfileError] = useState<string | null>(null)
    const [profileSuccess, setProfileSuccess] = useState(false)
    const [usernameError, setUsernameError] = useState('')
    const [checkingUsername, setCheckingUsername] = useState(false)

    // Withdrawal state
    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
    const [withdrawalAmount, setWithdrawalAmount] = useState('')
    const [bankName, setBankName] = useState('')
    const [accountNumber, setAccountNumber] = useState('')
    const [accountName, setAccountName] = useState('')
    const [isWithdrawing, setIsWithdrawing] = useState(false)

    // Minimum service price in coins (₦100,000 = 10,000 coins at 1 coin = ₦10 rate)
    const MIN_SERVICE_PRICE = 10000

    const formatPrice = (price: number) => {
        return `${new Intl.NumberFormat('en-NG', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price)} coins`
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const validatePrice = (price: string) => {
        const numPrice = parseInt(price)
        if (isNaN(numPrice) || numPrice < MIN_SERVICE_PRICE) {
            const nairaEquivalent = MIN_SERVICE_PRICE * 10
            setPriceError(`Minimum price is ${MIN_SERVICE_PRICE.toLocaleString()} coins (₦${nairaEquivalent.toLocaleString()})`)
            return false
        }
        setPriceError('')
        return true
    }

    const handleAddService = async () => {
        if (!newServiceId || !newServicePrice) return

        // Validate minimum price
        if (!validatePrice(newServicePrice)) {
            return
        }

        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('talent_menus')
                .insert({
                    talent_id: user.id,
                    service_type_id: newServiceId,
                    price: parseInt(newServicePrice),
                    is_active: true,
                })

            if (error) throw error

            setIsAddingService(false)
            setNewServiceId('')
            setNewServicePrice('')
            setPriceError('')
            router.refresh()
        } catch (error) {
            console.error('Error adding service:', error)
            alert('Failed to add service')
        } finally {
            setIsSaving(false)
        }
    }

    // Handle withdrawal request
    const handleWithdrawal = async () => {
        const amount = parseInt(withdrawalAmount)

        if (!amount || amount <= 0) {
            alert('Please enter a valid amount')
            return
        }

        if (amount > (wallet?.balance || 0)) {
            alert('Insufficient balance')
            return
        }

        if (!bankName || !accountNumber || !accountName) {
            alert('Please fill in all bank details')
            return
        }

        setIsWithdrawing(true)
        try {
            const { error } = await supabase
                .from('withdrawal_requests')
                .insert({
                    talent_id: user.id,
                    amount,
                    bank_name: bankName,
                    account_number: accountNumber,
                    account_name: accountName,
                })

            if (error) throw error

            // Reset form
            setShowWithdrawalModal(false)
            setWithdrawalAmount('')
            setBankName('')
            setAccountNumber('')
            setAccountName('')

            alert('Withdrawal request submitted! It will be processed within 24-48 hours.')
            router.refresh()
        } catch (error) {
            console.error('Error submitting withdrawal:', error)
            alert('Failed to submit withdrawal request')
        } finally {
            setIsWithdrawing(false)
        }
    }

    const handleDeleteService = async (serviceId: string) => {
        if (!confirm('Are you sure you want to remove this service?')) return

        try {
            const { error } = await supabase
                .from('talent_menus')
                .delete()
                .eq('id', serviceId)

            if (error) throw error
            router.refresh()
        } catch (error) {
            console.error('Error deleting service:', error)
            alert('Failed to remove service')
        }
    }

    const handleToggleAvailability = async (serviceId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('talent_menus')
                .update({ is_active: !currentStatus })
                .eq('id', serviceId)

            if (error) throw error
            router.refresh()
        } catch (error) {
            console.error('Error updating availability:', error)
        }
    }

    const handleSaveBio = async () => {
        setIsSaving(true)
        setProfileError(null)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ bio: bioText.trim(), updated_at: new Date().toISOString() })
                .eq('id', user.id)

            if (error) throw error
            setEditingBio(false)
            setProfileSuccess(true)
            router.refresh()
            setTimeout(() => setProfileSuccess(false), 3000)
        } catch (error) {
            console.error('Error updating bio:', error)
            setProfileError('Failed to update bio. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }

    // Validate username
    const validateUsername = async (value: string): Promise<boolean> => {
        const trimmed = value.trim().toLowerCase()

        if (!trimmed) {
            setUsernameError('Username is required')
            return false
        }

        if (trimmed.length < 3) {
            setUsernameError('Username must be at least 3 characters')
            return false
        }
        if (trimmed.length > 30) {
            setUsernameError('Username must be 30 characters or less')
            return false
        }
        if (!/^[a-z0-9_-]+$/.test(trimmed)) {
            setUsernameError('Username can only contain lowercase letters, numbers, hyphens, and underscores')
            return false
        }

        // Check if username is available (only if changed)
        if (trimmed === (profile?.username || '').toLowerCase()) {
            setUsernameError('')
            return true
        }

        setCheckingUsername(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', trimmed)
                .single()

            if (error && error.code !== 'PGRST116') {
                throw error
            }

            if (data) {
                setUsernameError('This username is already taken')
                return false
            }

            setUsernameError('')
            return true
        } catch (err) {
            console.error('[TalentDashboard] Error checking username:', err)
            setUsernameError('Failed to check username availability')
            return false
        } finally {
            setCheckingUsername(false)
        }
    }

    const handleSaveProfile = async () => {
        setIsSaving(true)
        setProfileError(null)
        setProfileSuccess(false)

        // Validation
        if (!displayName.trim()) {
            setProfileError('Display name is required')
            setIsSaving(false)
            return
        }
        if (displayName.length > 50) {
            setProfileError('Display name must be 50 characters or less')
            setIsSaving(false)
            return
        }
        if (location.length > 100) {
            setProfileError('Location must be 100 characters or less')
            setIsSaving(false)
            return
        }

        // Validate username
        const usernameValid = await validateUsername(username)
        if (!usernameValid) {
            setProfileError(usernameError || 'Please fix the username error')
            setIsSaving(false)
            return
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    display_name: displayName.trim(),
                    username: username.trim().toLowerCase() || null,
                    location: location.trim(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)

            if (error) throw error
            setEditingProfile(false)
            setProfileSuccess(true)
            router.refresh()
            setTimeout(() => setProfileSuccess(false), 3000)
        } catch (error) {
            console.error('Error updating profile:', error)
            setProfileError('Failed to update profile. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleToggleStatus = async () => {
        setTogglingStatus(true)
        try {
            const newStatus = isOnline ? 'offline' : 'online'
            const { error } = await supabase
                .from('profiles')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)

            if (error) throw error
            setIsOnline(!isOnline)
            router.refresh()
        } catch (error) {
            console.error('Error updating status:', error)
            setProfileError('Failed to update status. Please try again.')
        } finally {
            setTogglingStatus(false)
        }
    }

    const handleCancelProfile = () => {
        setDisplayName(profile?.display_name || '')
        setUsername(profile?.username || '')
        setLocation(profile?.location || '')
        setProfileError(null)
        setProfileSuccess(false)
        setUsernameError('')
        setEditingProfile(false)
    }

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        // Only allow lowercase, numbers, hyphens, and underscores
        const sanitized = value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
        setUsername(sanitized)
        if (sanitized.length >= 3) {
            validateUsername(sanitized)
        } else if (sanitized.length > 0) {
            setUsernameError('')
        }
    }

    const handleAvatarUploadComplete = (url: string) => {
        setShowAvatarUpload(false)
        router.refresh()
    }

    // Available services that aren't already in menu
    const availableServices = allServices.filter(
        s => !menu.some(m => m.service_type_id === s.id)
    )

    // Real-time subscriptions for earnings data
    useEffect(() => {
        // Cleanup existing channels
        if (bookingsChannelRef.current) {
            supabase.removeChannel(bookingsChannelRef.current)
        }
        if (transactionsChannelRef.current) {
            supabase.removeChannel(transactionsChannelRef.current)
        }
        if (giftsChannelRef.current) {
            supabase.removeChannel(giftsChannelRef.current)
        }

        // Bookings subscription - for completed bookings earnings
        const bookingsChannel = supabase
            .channel(`talent-bookings:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                    filter: `talent_id=eq.${user.id}`,
                },
                async () => {
                    // Refetch bookings when they change (status updates, new bookings, etc.)
                    const { data: updatedBookings } = await supabase
                        .from('bookings')
                        .select(`
                            *,
                            client:profiles!bookings_client_id_fkey(display_name, avatar_url)
                        `)
                        .eq('talent_id', user.id)
                        .order('created_at', { ascending: false })
                        .limit(10)

                    if (updatedBookings) {
                        setBookingsState(updatedBookings as BookingWithClient[])
                    }
                }
            )
            .subscribe()

        // Transactions subscription - for earnings breakdown
        const transactionsChannel = supabase
            .channel(`talent-transactions:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'transactions',
                    filter: `user_id=eq.${user.id}`,
                },
                async (payload) => {
                    // Refetch all transactions (earnings and payouts) when any transaction changes
                    // Use OR filter to include transactions where either amount > 0 OR coins > 0 (or negative for payouts)
                    const { data: updatedTransactions } = await supabase
                        .from('transactions')
                        .select('*')
                        .eq('user_id', user.id)
                        .in('type', ['gift', 'premium_unlock', 'booking', 'payout'])
                        .or('amount.gt.0,coins.gt.0,amount.lt.0,coins.lt.0')
                        .order('created_at', { ascending: false })

                    if (updatedTransactions) {
                        setTransactionsState(updatedTransactions as Transaction[])
                    }
                }
            )
            .subscribe()

        // Gifts subscription - for gifts received
        const giftsChannel = supabase
            .channel(`talent-gifts:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'gifts',
                    filter: `recipient_id=eq.${user.id}`,
                },
                async (payload) => {
                    const newGift = payload.new
                    // Fetch sender info
                    const { data: sender } = await supabase
                        .from('profiles')
                        .select('display_name, avatar_url')
                        .eq('id', newGift.sender_id)
                        .single()

                    setGiftsReceivedState(prev => [{
                        ...newGift,
                        sender: sender ? {
                            display_name: sender.display_name,
                            avatar_url: sender.avatar_url
                        } : null
                    } as GiftReceived, ...prev])
                }
            )
            .subscribe()

        bookingsChannelRef.current = bookingsChannel
        transactionsChannelRef.current = transactionsChannel
        giftsChannelRef.current = giftsChannel

        return () => {
            if (bookingsChannelRef.current) {
                supabase.removeChannel(bookingsChannelRef.current)
                bookingsChannelRef.current = null
            }
            if (transactionsChannelRef.current) {
                supabase.removeChannel(transactionsChannelRef.current)
                transactionsChannelRef.current = null
            }
            if (giftsChannelRef.current) {
                supabase.removeChannel(giftsChannelRef.current)
                giftsChannelRef.current = null
            }
        }
    }, [user.id, supabase])

    // Stats - using real-time state
    const pendingBookings = bookingsState.filter(b => b.status === 'payment_pending' || b.status === 'verification_pending').length
    const completedBookings = bookingsState.filter(b => b.status === 'completed').length

    // Calculate earnings breakdown - using real-time state from transactions
    // Note: For bookings, we use 'coins' field because 'amount' is 0
    // For gifts and unlocks, both 'amount' and 'coins' have the same value
    // Only count positive amounts (earnings, not expenses)
    const giftEarnings = transactionsState
        .filter(t => t.type === 'gift' && t.status === 'completed' && (t.coins || t.amount || 0) > 0)
        .reduce((sum, t) => sum + (t.coins || t.amount || 0), 0)

    const unlockEarnings = transactionsState
        .filter(t => t.type === 'premium_unlock' && t.status === 'completed' && (t.coins || t.amount || 0) > 0)
        .reduce((sum, t) => sum + (t.coins || t.amount || 0), 0)

    const bookingEarnings = transactionsState
        .filter(t => t.type === 'booking' && t.status === 'completed' && (t.coins || t.amount || 0) > 0)
        .reduce((sum, t) => sum + (t.coins || t.amount || 0), 0)

    // Total earnings is the sum of all earnings from transactions
    const totalEarnings = giftEarnings + unlockEarnings + bookingEarnings

    const tabs = [
        { id: 'overview', label: 'Overview', icon: ChartLine },
        { id: 'services', label: 'Services', icon: CurrencyDollar },
        { id: 'media', label: 'Gallery', icon: ImageIcon },
        { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
        { id: 'earnings', label: 'Earnings', icon: Money },
        { id: 'withdrawals', label: 'Withdrawals', icon: Bank },
    ]

    return (
        <>
            <div className="min-h-screen bg-black pt-16 lg:pt-0 pb-20 lg:pb-0">
                {/* Header */}
                <header className="fixed lg:sticky top-[64px] lg:top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 border-t-0">
                    <div className="max-w-5xl mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
                                    <ArrowLeft size={24} />
                                </Link>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">Talent Dashboard</h1>
                                    <p className="text-white/60 text-sm">Manage your profile, services, and bookings</p>
                                </div>
                            </div>

                            <Link
                                href={getTalentUrl({ id: user.id, username: profile?.username, display_name: profile?.display_name })}
                                className="flex items-center gap-2 text-[#df2531] hover:text-[#df2531]/80 transition-colors text-sm"
                            >
                                <Eye size={18} />
                                <span className="hidden sm:inline">View Public Profile</span>
                            </Link>
                        </div>
                    </div>
                </header>

                <div className="max-w-5xl mx-auto px-4 py-6 pt-[128px] lg:pt-6">
                    {/* Profile Header */}
                    <div className="flex flex-col md:flex-row gap-6 mb-8">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-2xl bg-white/10 overflow-hidden relative">
                                {profile?.avatar_url ? (
                                    <Image
                                        src={profile.avatar_url}
                                        alt={profile.display_name || 'Profile avatar'}
                                        fill
                                        sizes="96px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <User size={40} weight="duotone" className="text-white/40" aria-hidden="true" />
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setShowAvatarUpload(true)}
                                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#df2531] flex items-center justify-center text-white hover:bg-[#df2531]/80 transition-colors"
                                aria-label="Upload profile picture"
                            >
                                <Camera size={16} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="flex-1">
                            {/* Success/Error Messages */}
                            {profileSuccess && (
                                <div className="mb-4 p-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-sm">
                                    Profile updated successfully!
                                </div>
                            )}
                            {profileError && (
                                <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                                    {profileError}
                                </div>
                            )}

                            {editingProfile ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-white/70 text-sm mb-2">Display Name *</label>
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            maxLength={50}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#df2531]"
                                            placeholder="Your display name"
                                        />
                                        <p className="text-white/40 text-xs mt-1">{displayName.length}/50 characters</p>
                                    </div>
                                    <div>
                                        <label className="block text-white/70 text-sm mb-2">
                                            Username * <span className="text-red-400" aria-label="required">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm" aria-hidden="true">@</span>
                                            <input
                                                type="text"
                                                value={username}
                                                onChange={handleUsernameChange}
                                                maxLength={30}
                                                className="w-full pl-8 pr-10 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm lowercase focus:outline-none focus:border-[#df2531]"
                                                placeholder="your-username"
                                                aria-invalid={usernameError ? 'true' : 'false'}
                                                aria-describedby={usernameError ? 'username-error' : 'username-help'}
                                            />
                                            {checkingUsername && (
                                                <SpinnerGap size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-white/40" aria-hidden="true" />
                                            )}
                                            {!checkingUsername && !usernameError && username && username.length >= 3 && (
                                                <CheckCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400" aria-hidden="true" />
                                            )}
                                        </div>
                                        {usernameError && (
                                            <p id="username-error" className="text-red-400 text-xs mt-1" role="alert">
                                                {usernameError}
                                            </p>
                                        )}
                                        <p id="username-help" className="text-white/40 text-xs mt-1">
                                            {username.length}/30 characters. Your profile URL: /t/{username || 'username'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-white/70 text-sm mb-2">Location</label>
                                        <input
                                            type="text"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            maxLength={100}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#df2531]"
                                            placeholder="Your location (e.g., Lagos, Nigeria)"
                                        />
                                        <p className="text-white/40 text-xs mt-1">{location.length}/100 characters</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleSaveProfile}
                                            disabled={isSaving}
                                            className="btn-primary text-sm py-2"
                                        >
                                            {isSaving ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                        <Button
                                            onClick={handleCancelProfile}
                                            variant="ghost"
                                            className="text-white/50"
                                            disabled={isSaving}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-2xl font-bold text-white">{profile?.display_name || 'Your Name'}</h2>
                                        {profile?.is_verified && (
                                            <div className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                                                Verified
                                            </div>
                                        )}
                                        <button
                                            onClick={() => setEditingProfile(true)}
                                            className="text-white/40 hover:text-white transition-colors"
                                            aria-label="Edit profile"
                                        >
                                            <PencilSimple size={18} />
                                        </button>
                                    </div>

                                    {profile?.username && (
                                        <p className="flex items-center gap-1 text-white/60 text-sm mb-2">
                                            <span className="text-white/40" aria-hidden="true">@</span>
                                            {profile.username}
                                        </p>
                                    )}

                                    {profile?.location && (
                                        <p className="flex items-center gap-2 text-white/50 text-sm mb-3">
                                            <MapPin size={14} weight="duotone" aria-hidden="true" />
                                            {profile.location}
                                        </p>
                                    )}

                                    {/* Online/Offline Status Toggle */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-white/70 text-sm">Status:</span>
                                        <button
                                            onClick={handleToggleStatus}
                                            disabled={togglingStatus}
                                            className={`relative w-14 h-7 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 ${isOnline ? 'bg-green-500' : 'bg-white/20'
                                                }`}
                                            aria-label={isOnline ? 'Switch to offline' : 'Switch to online'}
                                            aria-pressed={isOnline}
                                        >
                                            <span
                                                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform shadow-lg ${isOnline ? 'translate-x-7' : 'translate-x-0'
                                                    }`}
                                                aria-hidden="true"
                                            />
                                        </button>
                                        <span className={`text-sm font-medium ${isOnline ? 'text-green-400' : 'text-white/60'}`}>
                                            {togglingStatus ? 'Updating...' : isOnline ? 'Online' : 'Offline'}
                                        </span>
                                    </div>
                                </>
                            )}

                            {editingBio ? (
                                <div className="space-y-2">
                                    <textarea
                                        value={bioText}
                                        onChange={(e) => setBioText(e.target.value)}
                                        className="w-full h-24 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm resize-none focus:outline-none focus:border-[#df2531]"
                                        placeholder="Tell clients about yourself..."
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleSaveBio}
                                            disabled={isSaving}
                                            className="btn-primary text-sm py-2"
                                        >
                                            {isSaving ? 'Saving...' : 'Save'}
                                        </Button>
                                        <Button
                                            onClick={() => { setEditingBio(false); setBioText(profile?.bio || '') }}
                                            variant="ghost"
                                            className="text-white/50"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-2">
                                    <p className="text-white/70 text-sm flex-1">
                                        {profile?.bio || 'No bio yet. Click edit to add one.'}
                                    </p>
                                    <button
                                        onClick={() => setEditingBio(true)}
                                        className="text-white/40 hover:text-white transition-colors"
                                    >
                                        <PencilSimple size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Avatar Upload Modal */}
                    {showAvatarUpload && (
                        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                            <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-6 max-w-md w-full">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-white">Upload Profile Picture</h3>
                                    <button
                                        onClick={() => setShowAvatarUpload(false)}
                                        className="text-white/40 hover:text-white transition-colors"
                                        aria-label="Close"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                                <ProfileImageUpload
                                    userId={user.id}
                                    currentImageUrl={profile?.avatar_url || null}
                                    displayName={profile?.display_name || 'Profile'}
                                    onUploadComplete={handleAvatarUploadComplete}
                                />
                            </div>
                        </div>
                    )}

                    {/* Stats Cards - Enhanced */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#df2531]/20 to-transparent border border-[#df2531]/30 hover:border-[#df2531]/50 transition-colors">
                            <div className="flex items-center gap-2 text-white/60 text-xs mb-2.5 uppercase tracking-wide">
                                <Coin size={18} weight="duotone" aria-hidden="true" />
                                <span>Available Balance</span>
                            </div>
                            <p className="text-3xl font-bold text-white mb-1">{(wallet?.balance || 0).toLocaleString()}</p>
                            <p className="text-white/50 text-xs">coins (≈ ₦{((wallet?.balance || 0) * 10).toLocaleString()})</p>
                        </div>

                        <div className="p-5 rounded-2xl bg-gradient-to-br from-green-500/20 to-transparent border border-green-500/30 hover:border-green-500/50 transition-colors">
                            <div className="flex items-center gap-2 text-white/60 text-xs mb-2.5 uppercase tracking-wide">
                                <Receipt size={18} weight="duotone" aria-hidden="true" />
                                <span>Total Earnings</span>
                            </div>
                            <p className="text-3xl font-bold text-green-400 mb-1">{totalEarnings.toLocaleString()}</p>
                            <p className="text-white/50 text-xs">coins earned</p>
                        </div>

                        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-transparent border border-amber-500/30 hover:border-amber-500/50 transition-colors">
                            <div className="flex items-center gap-2 text-white/60 text-xs mb-2.5 uppercase tracking-wide">
                                <Hourglass size={18} weight="duotone" aria-hidden="true" />
                                <span>Pending Actions</span>
                            </div>
                            <p className="text-3xl font-bold text-amber-400 mb-1">{pendingBookings}</p>
                            <p className="text-white/50 text-xs">bookings awaiting response</p>
                        </div>

                        <div className="p-5 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/20 hover:border-white/30 transition-colors">
                            <div className="flex items-center gap-2 text-white/60 text-xs mb-2.5 uppercase tracking-wide">
                                <CheckCircle size={18} weight="duotone" aria-hidden="true" />
                                <span>Completed</span>
                            </div>
                            <p className="text-3xl font-bold text-white mb-1">{completedBookings}</p>
                            <p className="text-white/50 text-xs">successful bookings</p>
                        </div>
                    </div>

                    {/* Tabs - Enhanced */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide" role="tablist" aria-label="Dashboard sections">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                    role="tab"
                                    aria-selected={isActive}
                                    aria-controls={`tabpanel-${tab.id}`}
                                    id={`tab-${tab.id}`}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black ${isActive
                                        ? 'bg-[#df2531] text-white shadow-lg shadow-[#df2531]/30'
                                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                                        }`}
                                >
                                    <Icon size={18} weight={isActive ? "duotone" : "regular"} aria-hidden="true" />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6" role="tabpanel" id="tabpanel-overview" aria-labelledby="tab-overview">
                            {/* Quick Stats - Enhanced */}
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-xl font-bold text-white">Quick Overview</h3>
                                    <Link
                                        href={getTalentUrl({ id: user.id, username: profile?.username, display_name: profile?.display_name })}
                                        className="text-[#df2531] hover:text-[#c41f2a] text-sm font-medium flex items-center gap-1.5 transition-colors"
                                        aria-label="View your public profile"
                                    >
                                        <Eye size={16} weight="duotone" aria-hidden="true" />
                                        View Profile
                                    </Link>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                        <p className="text-white/60 text-xs mb-1.5 uppercase tracking-wide">Services Listed</p>
                                        <p className="text-3xl font-bold text-white">{menu.length}</p>
                                        <p className="text-white/40 text-xs mt-1">active services</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                        <p className="text-white/60 text-xs mb-1.5 uppercase tracking-wide">Gallery Items</p>
                                        <p className="text-3xl font-bold text-white">{media.length}</p>
                                        <p className="text-white/40 text-xs mt-1">photos & videos</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                        <p className="text-white/60 text-xs mb-1.5 uppercase tracking-wide">Starting Price</p>
                                        <p className="text-2xl font-bold text-white">
                                            {menu.length > 0
                                                ? `${Math.min(...menu.map(m => m.price)).toLocaleString()} coins`
                                                : 'Not set'
                                            }
                                        </p>
                                        <p className="text-white/40 text-xs mt-1">lowest service price</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                        <p className="text-white/60 text-xs mb-1.5 uppercase tracking-wide">Verification</p>
                                        <p className={`text-xl font-bold capitalize flex items-center gap-2 ${profile?.is_verified ? 'text-green-400' : 'text-amber-400'
                                            }`}>
                                            {profile?.is_verified ? (
                                                <>
                                                    <CheckCircle size={20} weight="duotone" aria-hidden="true" />
                                                    Verified
                                                </>
                                            ) : (
                                                <>
                                                    <Hourglass size={20} weight="duotone" aria-hidden="true" />
                                                    Pending
                                                </>
                                            )}
                                        </p>
                                        <p className="text-white/40 text-xs mt-1">profile status</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tips Section - Enhanced */}
                            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#df2531]/20 to-transparent border border-[#df2531]/30">
                                <div className="flex items-center gap-3 mb-4">
                                    <Sparkle size={28} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Tips to Get More Bookings</h3>
                                        <p className="text-white/50 text-sm">Follow these best practices to maximize your bookings</p>
                                    </div>
                                </div>
                                <ul className="space-y-3 text-white/80 text-sm">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle size={18} weight="duotone" className="text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                        <span>Add at least 5 high-quality photos to your gallery to showcase your work and attract clients</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle size={18} weight="duotone" className="text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                        <span>List all your services with competitive pricing to give clients clear options</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle size={18} weight="duotone" className="text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                        <span>Complete your profile verification to build trust and increase visibility</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle size={18} weight="duotone" className="text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                        <span>Respond quickly to booking requests to improve your response rate and client satisfaction</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeTab === 'services' && (
                        <div className="space-y-4" role="tabpanel" id="tabpanel-services" aria-labelledby="tab-services">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-1">Your Services</h3>
                                    <p className="text-white/50 text-sm">Manage your service offerings and pricing</p>
                                </div>
                                {!isAddingService && availableServices.length > 0 && (
                                    <button
                                        onClick={() => setIsAddingService(true)}
                                        aria-label="Add a new service"
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#df2531] text-white text-sm font-semibold hover:bg-[#df2531]/80 transition-colors shadow-lg shadow-[#df2531]/20 hover:shadow-[#df2531]/30 focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black"
                                    >
                                        <Plus size={18} weight="duotone" aria-hidden="true" />
                                        Add Service
                                    </button>
                                )}
                            </div>

                            {/* Add Service Form - Enhanced */}
                            {isAddingService && (
                                <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-5 animate-fade-in-up">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-lg font-bold text-white mb-1">Add New Service</h4>
                                            <p className="text-white/50 text-sm">Select a service type and set your pricing</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setIsAddingService(false)
                                                setNewServiceId('')
                                                setNewServicePrice('')
                                                setPriceError('')
                                            }}
                                            aria-label="Cancel adding service"
                                            className="text-white/40 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                                        >
                                            <X size={20} weight="duotone" aria-hidden="true" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label htmlFor="service-type" className="block text-white/70 text-sm mb-2 font-medium">
                                                Service Type <span className="text-red-400" aria-label="required">*</span>
                                            </label>
                                            <select
                                                id="service-type"
                                                value={newServiceId}
                                                onChange={(e) => setNewServiceId(e.target.value)}
                                                aria-label="Select service type"
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#df2531] focus:ring-2 focus:ring-[#df2531]/50 transition-colors"
                                            >
                                                <option value="" className="bg-black">Select a service type</option>
                                                {availableServices.map((service) => (
                                                    <option key={service.id} value={service.id} className="bg-black">
                                                        {service.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {availableServices.length === 0 && (
                                                <p className="text-white/40 text-xs mt-2">All available services have been added</p>
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor="service-price" className="block text-white/70 text-sm mb-2 font-medium">
                                                Price (in coins) <span className="text-red-400" aria-label="required">*</span>
                                            </label>
                                            <input
                                                id="service-price"
                                                type="number"
                                                value={newServicePrice}
                                                onChange={(e) => {
                                                    setNewServicePrice(e.target.value)
                                                    if (e.target.value) validatePrice(e.target.value)
                                                }}
                                                placeholder={`Minimum: ${MIN_SERVICE_PRICE.toLocaleString()}`}
                                                min={MIN_SERVICE_PRICE}
                                                aria-label="Service price in coins"
                                                aria-invalid={!!priceError}
                                                aria-describedby={priceError ? 'price-error' : 'price-help'}
                                                className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white focus:outline-none transition-colors ${priceError
                                                    ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/50'
                                                    : 'border-white/10 focus:border-[#df2531] focus:ring-2 focus:ring-[#df2531]/50'
                                                    }`}
                                            />
                                            {priceError && (
                                                <p id="price-error" className="text-red-400 text-xs mt-1.5 flex items-center gap-1" role="alert">
                                                    <Warning size={14} weight="duotone" aria-hidden="true" />
                                                    {priceError}
                                                </p>
                                            )}
                                            <p id="price-help" className="text-white/40 text-xs mt-1.5">
                                                Minimum: ₦{(MIN_SERVICE_PRICE * 10).toLocaleString()} ({MIN_SERVICE_PRICE.toLocaleString()} coins)
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            onClick={handleAddService}
                                            disabled={!newServiceId || !newServicePrice || isSaving || !!priceError}
                                            aria-label={isSaving ? 'Adding service...' : 'Add service'}
                                            className="flex-1 bg-[#df2531] hover:bg-[#c41f2a] text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#df2531]/20 hover:shadow-[#df2531]/30 transition-all"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <SpinnerGap size={18} className="animate-spin mr-2" aria-hidden="true" />
                                                    Adding Service...
                                                </>
                                            ) : (
                                                <>
                                                    <Plus size={18} weight="duotone" className="mr-2" aria-hidden="true" />
                                                    Add Service
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setIsAddingService(false)
                                                setNewServiceId('')
                                                setNewServicePrice('')
                                                setPriceError('')
                                            }}
                                            variant="ghost"
                                            className="text-white/60 hover:text-white border border-white/10"
                                            disabled={isSaving}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Services List - Enhanced */}
                            {menu.length === 0 ? (
                                <div className="text-center py-16 rounded-2xl bg-white/5 border border-white/10">
                                    <CurrencyDollar size={64} weight="duotone" className="text-white/20 mx-auto mb-5" aria-hidden="true" />
                                    <p className="text-white/60 font-medium mb-2 text-lg">No services listed yet</p>
                                    <p className="text-white/40 text-sm mb-6 max-w-md mx-auto leading-relaxed">
                                        Add services to start receiving bookings. Clients can browse and book your services based on your pricing.
                                    </p>
                                    {availableServices.length > 0 && (
                                        <Button
                                            onClick={() => setIsAddingService(true)}
                                            className="bg-[#df2531] hover:bg-[#c41f2a] text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-[#df2531]/20"
                                            aria-label="Add your first service"
                                        >
                                            <Plus size={20} weight="duotone" className="mr-2" aria-hidden="true" />
                                            Add Your First Service
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {menu.map((item) => {
                                        const IconComponent = serviceIcons[item.service_type?.icon || ''] || Calendar

                                        return (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-4 p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-[#df2531]/10 flex items-center justify-center border border-[#df2531]/20 group-hover:border-[#df2531]/40 transition-colors">
                                                    <IconComponent size={24} weight="duotone" className="text-white" aria-hidden="true" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-white font-semibold">{item.service_type?.name}</p>
                                                        {item.is_active ? (
                                                            <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium border border-green-500/30">
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/30">
                                                                Hidden
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-white/60 text-sm font-medium">{formatPrice(item.price)}</p>
                                                    {item.service_type?.description && (
                                                        <p className="text-white/40 text-xs mt-1 line-clamp-1">{item.service_type.description}</p>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => handleToggleAvailability(item.id, item.is_active)}
                                                    aria-label={item.is_active ? `Hide ${item.service_type?.name} service` : `Show ${item.service_type?.name} service`}
                                                    aria-pressed={item.is_active}
                                                    className={`p-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black ${item.is_active
                                                        ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 focus:ring-green-500'
                                                        : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 focus:ring-red-500'
                                                        }`}
                                                >
                                                    {item.is_active ? (
                                                        <Eye size={20} weight="duotone" aria-hidden="true" />
                                                    ) : (
                                                        <EyeSlash size={20} weight="duotone" aria-hidden="true" />
                                                    )}
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteService(item.id)}
                                                    aria-label={`Delete ${item.service_type?.name} service`}
                                                    className="p-3 rounded-lg bg-white/5 text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black"
                                                >
                                                    <Trash size={20} weight="duotone" aria-hidden="true" />
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'media' && (
                        <div role="tabpanel" id="tabpanel-media" aria-labelledby="tab-media">
                            <MediaManager
                                talentId={user.id}
                                media={media}
                                onRefresh={() => router.refresh()}
                            />
                        </div>
                    )}

                    {activeTab === 'bookings' && (
                        <div className="space-y-4" role="tabpanel" id="tabpanel-bookings" aria-labelledby="tab-bookings">
                            {/* Pending Action Alert - Enhanced */}
                            {bookingsState.filter(b => b.status === 'verification_pending').length > 0 && (
                                <div className="flex items-center gap-4 p-5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 animate-fade-in-up" role="alert">
                                    <Hourglass size={28} weight="duotone" className="shrink-0" aria-hidden="true" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-base mb-1">
                                            You have {bookingsState.filter(b => b.status === 'verification_pending').length} booking{bookingsState.filter(b => b.status === 'verification_pending').length > 1 ? 's' : ''} awaiting your response
                                        </p>
                                        <p className="text-sm text-blue-400/80 leading-relaxed">
                                            Review and accept or decline these bookings to proceed. Quick responses improve your rating.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-1">Recent Bookings</h3>
                                    <p className="text-white/50 text-sm">Manage your client bookings and appointments</p>
                                </div>
                                {bookingsState.length > 0 && (
                                    <span className="text-white/40 text-sm">
                                        {bookingsState.length} {bookingsState.length === 1 ? 'booking' : 'bookings'} total
                                    </span>
                                )}
                            </div>

                            {bookingsState.length === 0 ? (
                                <div className="text-center py-16 rounded-2xl bg-white/5 border border-white/10">
                                    <CalendarCheck size={64} weight="duotone" className="text-white/20 mx-auto mb-5" aria-hidden="true" />
                                    <p className="text-white/60 font-medium mb-2 text-lg">No bookings yet</p>
                                    <p className="text-white/40 text-sm mb-6 max-w-md mx-auto leading-relaxed">
                                        Bookings will appear here when clients book your services. Make sure your profile is complete and services are listed to attract bookings.
                                    </p>
                                    <Link
                                        href="/dashboard/browse"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#df2531] hover:bg-[#c41f2a] text-white text-sm font-semibold transition-colors shadow-lg shadow-[#df2531]/20"
                                        aria-label="Browse other talents"
                                    >
                                        <Eye size={18} weight="duotone" aria-hidden="true" />
                                        View Talent Profiles
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {bookingsState.map((booking) => {
                                        const status = statusColors[booking.status] || statusColors.payment_pending
                                        const StatusIcon = status.icon
                                        const needsAction = status.needsAction

                                        return (
                                            <Link
                                                key={booking.id}
                                                href={`/dashboard/bookings/${booking.id}`}
                                                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${needsAction
                                                    ? 'bg-blue-500/5 border-blue-500/30 hover:bg-blue-500/10'
                                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                                    }`}
                                            >
                                                <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden relative shrink-0">
                                                    {booking.client?.avatar_url ? (
                                                        <Image
                                                            src={booking.client.avatar_url}
                                                            alt={booking.client.display_name || 'Client'}
                                                            fill
                                                            sizes="48px"
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <User size={24} weight="duotone" className="text-white/40" aria-hidden="true" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-white font-medium">{booking.client?.display_name || 'Client'}</p>
                                                        {needsAction && (
                                                            <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold uppercase">
                                                                Action Required
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-white/40 text-sm truncate">
                                                        Booking #{booking.id.slice(0, 8)}
                                                    </p>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <p className="text-white font-bold text-lg">{formatPrice(booking.total_price)}</p>
                                                    <p className="text-white/50 text-xs mt-0.5">{formatDate(booking.created_at)}</p>
                                                </div>

                                                <div className={`px-3 py-1.5 rounded-full ${status.bg} ${status.text} text-xs font-semibold flex items-center gap-1.5 shrink-0 border ${status.text.includes('green') ? 'border-green-500/30' : status.text.includes('amber') ? 'border-amber-500/30' : status.text.includes('blue') ? 'border-blue-500/30' : 'border-white/10'}`}>
                                                    <StatusIcon size={14} weight="duotone" aria-hidden="true" />
                                                    <span className="capitalize">{booking.status.replace('_', ' ')}</span>
                                                </div>

                                                <CaretRight size={20} weight="duotone" className="text-white/40 shrink-0" aria-hidden="true" />
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Earnings Tab - Enhanced */}
                    {activeTab === 'earnings' && (
                        <div className="space-y-6" role="tabpanel" id="tabpanel-earnings" aria-labelledby="tab-earnings">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1">Earnings Overview</h3>
                                <p className="text-white/50 text-sm">Track your income from gifts, content unlocks, and bookings</p>
                            </div>

                            {/* Earnings Summary Cards - Enhanced */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-5 rounded-2xl bg-gradient-to-br from-green-500/20 to-transparent border border-green-500/30 hover:border-green-500/50 transition-colors">
                                    <p className="text-white/60 text-xs mb-2 uppercase tracking-wide">Total Earnings</p>
                                    <p className="text-3xl font-bold text-white mb-1">{totalEarnings.toLocaleString()}</p>
                                    <p className="text-green-400 text-xs font-medium">coins earned</p>
                                </div>
                                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-pink-500/30 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Gift size={18} weight="duotone" className="text-pink-400" aria-hidden="true" />
                                        <p className="text-white/60 text-xs uppercase tracking-wide">From Gifts</p>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{giftEarnings.toLocaleString()}</p>
                                    <p className="text-white/40 text-xs mt-1">coins</p>
                                </div>
                                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Eye size={18} weight="duotone" className="text-amber-400" aria-hidden="true" />
                                        <p className="text-white/60 text-xs uppercase tracking-wide">Content Unlocks</p>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{unlockEarnings.toLocaleString()}</p>
                                    <p className="text-white/40 text-xs mt-1">coins</p>
                                </div>
                                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CalendarCheck size={18} weight="duotone" className="text-blue-400" aria-hidden="true" />
                                        <p className="text-white/60 text-xs uppercase tracking-wide">Bookings</p>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{bookingEarnings.toLocaleString()}</p>
                                    <p className="text-white/40 text-xs mt-1">coins</p>
                                </div>
                            </div>

                            {/* Recent Gifts Received - Enhanced */}
                            <div>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Gift size={24} weight="duotone" className="text-pink-400" aria-hidden="true" />
                                    Recent Gifts Received
                                </h3>
                                {giftsReceivedState.length === 0 ? (
                                    <div className="p-12 rounded-2xl bg-white/5 border border-white/10 text-center">
                                        <Gift size={64} weight="duotone" className="text-white/20 mx-auto mb-5" aria-hidden="true" />
                                        <p className="text-white/60 font-medium mb-2 text-lg">No gifts received yet</p>
                                        <p className="text-white/40 text-sm max-w-md mx-auto leading-relaxed">
                                            When clients send you gifts, they&apos;ll appear here. Gifts are a great way for clients to show appreciation!
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {giftsReceivedState.map((gift) => (
                                            <div
                                                key={gift.id}
                                                className="flex items-center gap-4 p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-pink-500/30 transition-all group"
                                            >
                                                <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center border border-pink-500/30 group-hover:border-pink-500/50 transition-colors shrink-0">
                                                    <Gift size={24} weight="duotone" className="text-pink-400" aria-hidden="true" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-semibold mb-1">
                                                        {gift.sender?.display_name || 'Anonymous'}
                                                    </p>
                                                    {gift.message && (
                                                        <p className="text-white/60 text-sm line-clamp-2">&quot;{gift.message}&quot;</p>
                                                    )}
                                                    <p className="text-white/40 text-xs mt-1.5">{formatDate(gift.created_at)}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-white font-bold text-green-400 text-lg">+{gift.amount.toLocaleString()}</p>
                                                    <p className="text-white/50 text-xs mt-0.5">coins</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Recent Transactions - Enhanced */}
                            <div>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Receipt size={24} weight="duotone" className="text-white/60" aria-hidden="true" />
                                    Transaction History
                                </h3>
                                {transactionsState.length === 0 ? (
                                    <div className="p-12 rounded-2xl bg-white/5 border border-white/10 text-center">
                                        <Receipt size={64} weight="duotone" className="text-white/20 mx-auto mb-5" aria-hidden="true" />
                                        <p className="text-white/60 font-medium mb-2 text-lg">No transactions yet</p>
                                        <p className="text-white/40 text-sm max-w-md mx-auto leading-relaxed">
                                            Your transaction history will appear here as you receive payments from gifts, content unlocks, and bookings.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {transactionsState.slice(0, 10).map((tx) => (
                                            <div
                                                key={tx.id}
                                                className="flex items-center gap-4 p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                                            >
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-colors ${tx.type === 'gift'
                                                    ? 'bg-pink-500/20 border-pink-500/30 group-hover:border-pink-500/50'
                                                    : tx.type === 'premium_unlock'
                                                        ? 'bg-amber-500/20 border-amber-500/30 group-hover:border-amber-500/50'
                                                        : 'bg-blue-500/20 border-blue-500/30 group-hover:border-blue-500/50'
                                                    }`}>
                                                    {tx.type === 'gift' ? (
                                                        <Gift size={24} weight="duotone" className="text-pink-400" aria-hidden="true" />
                                                    ) : tx.type === 'premium_unlock' ? (
                                                        <Eye size={24} weight="duotone" className="text-amber-400" aria-hidden="true" />
                                                    ) : (
                                                        <CalendarCheck size={24} weight="duotone" className="text-blue-400" aria-hidden="true" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-semibold capitalize mb-1">
                                                        {tx.type.replace('_', ' ')}
                                                    </p>
                                                    <p className="text-white/60 text-sm line-clamp-2">{tx.description}</p>
                                                    <p className="text-white/40 text-xs mt-1.5">{formatDate(tx.created_at)}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-white font-bold text-green-400 text-lg">+{tx.amount.toLocaleString()}</p>
                                                    <p className="text-white/50 text-xs mt-0.5">coins</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Withdrawals Tab - Enhanced */}
                    {activeTab === 'withdrawals' && (
                        <div className="space-y-6" role="tabpanel" id="tabpanel-withdrawals" aria-labelledby="tab-withdrawals">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1">Withdrawals</h3>
                                <p className="text-white/50 text-sm">Request withdrawals to your bank account</p>
                            </div>

                            {/* Balance Card - Enhanced */}
                            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#df2531]/20 to-transparent border border-[#df2531]/30 shadow-lg shadow-[#df2531]/10">
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <p className="text-white/60 text-xs mb-1.5 uppercase tracking-wide">Available Balance</p>
                                        <p className="text-4xl font-bold text-white mb-1">{(wallet?.balance || 0).toLocaleString()}</p>
                                        <p className="text-white/50 text-sm">coins ≈ ₦{(wallet?.balance || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="w-20 h-20 rounded-2xl bg-[#df2531]/20 flex items-center justify-center border border-[#df2531]/30">
                                        <Coin size={40} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                                    </div>
                                </div>

                                <Button
                                    onClick={() => setShowWithdrawalModal(true)}
                                    disabled={(wallet?.balance || 0) < 10000}
                                    aria-label={(wallet?.balance || 0) < 10000 ? 'Minimum withdrawal is 10,000 coins' : 'Request withdrawal'}
                                    className="w-full bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#df2531]/30 hover:shadow-[#df2531]/40 transition-all"
                                >
                                    <Bank size={22} weight="duotone" className="mr-2" aria-hidden="true" />
                                    Request Withdrawal
                                </Button>
                                {(wallet?.balance || 0) < 10000 && (
                                    <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                                        <Warning size={18} weight="duotone" className="text-amber-400 shrink-0" aria-hidden="true" />
                                        <p className="text-amber-400 text-sm">
                                            Minimum withdrawal: <span className="font-semibold">10,000 coins</span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Withdrawal Info - Enhanced */}
                            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                    <Bank size={20} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                                    Withdrawal Information
                                </h4>
                                <ul className="space-y-3 text-white/70 text-sm">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle size={18} weight="duotone" className="text-green-400 shrink-0 mt-0.5" aria-hidden="true" />
                                        <div>
                                            <span className="font-semibold">Minimum withdrawal:</span> 10,000 coins (₦10,000)
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle size={18} weight="duotone" className="text-green-400 shrink-0 mt-0.5" aria-hidden="true" />
                                        <div>
                                            <span className="font-semibold">Funds availability:</span> Earnings are available immediately after booking completion
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle size={18} weight="duotone" className="text-green-400 shrink-0 mt-0.5" aria-hidden="true" />
                                        <div>
                                            <span className="font-semibold">Processing time:</span> 24-48 hours after approval
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle size={18} weight="duotone" className="text-green-400 shrink-0 mt-0.5" aria-hidden="true" />
                                        <div>
                                            <span className="font-semibold">Supported banks:</span> All Nigerian banks and fintech platforms
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle size={18} weight="duotone" className="text-green-400 shrink-0 mt-0.5" aria-hidden="true" />
                                        <div>
                                            <span className="font-semibold">Fees:</span> No withdrawal fees - you receive the full amount
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            {/* Withdrawal History */}
                            <div>
                                <h4 className="text-xl font-bold text-white mb-4">Withdrawal History</h4>
                                {(() => {
                                    const payoutTransactions = transactionsState
                                        .filter(t => t.type === 'payout' && t.status === 'completed')
                                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

                                    if (payoutTransactions.length === 0) {
                                        return (
                                            <div className="text-center py-16 rounded-2xl bg-white/5 border border-white/10">
                                                <Money size={64} weight="duotone" className="text-white/20 mx-auto mb-5" aria-hidden="true" />
                                                <p className="text-white/60 font-medium mb-2 text-lg">No withdrawals yet</p>
                                                <p className="text-white/40 text-sm max-w-md mx-auto leading-relaxed">
                                                    Your withdrawal history will appear here once you make your first withdrawal request.
                                                    All withdrawals are processed securely within 24-48 hours.
                                                </p>
                                            </div>
                                        )
                                    }

                                    return (
                                        <div className="space-y-3">
                                            {payoutTransactions.map((transaction) => (
                                                <div
                                                    key={transaction.id}
                                                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                                                                <Bank size={20} weight="duotone" className="text-red-400" />
                                                            </div>
                                                            <div>
                                                                <p className="text-white font-medium">
                                                                    {transaction.description || 'Withdrawal Payout'}
                                                                </p>
                                                                <p className="text-white/50 text-sm">
                                                                    {new Date(transaction.created_at).toLocaleDateString('en-NG', {
                                                                        year: 'numeric',
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-red-400 font-bold text-lg">
                                                                -{Math.abs(transaction.coins || transaction.amount || 0).toLocaleString()}
                                                            </p>
                                                            <p className="text-white/50 text-xs">coins</p>
                                                        </div>
                                                    </div>
                                                    {transaction.status === 'completed' && (
                                                        <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
                                                            <CheckCircle size={16} weight="fill" className="text-green-400" />
                                                            <p className="text-green-400 text-sm font-medium">Completed</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )
                                })()}
                            </div>
                        </div>
                    )}
                </div>

                {/* Withdrawal Modal - Enhanced */}
                {showWithdrawalModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setShowWithdrawalModal(false)
                                setWithdrawalAmount('')
                                setBankName('')
                                setAccountNumber('')
                                setAccountName('')
                            }
                        }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="withdrawal-modal-title"
                    >
                        <div className="relative bg-[#1a1a1a] rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl animate-fade-in-up">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 id="withdrawal-modal-title" className="text-2xl font-bold text-white mb-1">Request Withdrawal</h3>
                                    <p className="text-white/50 text-sm">Enter your bank details to withdraw your earnings</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowWithdrawalModal(false)
                                        setWithdrawalAmount('')
                                        setBankName('')
                                        setAccountNumber('')
                                        setAccountName('')
                                    }}
                                    aria-label="Close withdrawal modal"
                                    className="text-white/40 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                                >
                                    <X size={24} weight="duotone" aria-hidden="true" />
                                </button>
                            </div>

                            <div className="space-y-5">
                                {/* Amount - Enhanced */}
                                <div>
                                    <label htmlFor="withdrawal-amount" className="block text-white/70 text-sm mb-2 font-medium">
                                        Withdrawal Amount (coins) <span className="text-red-400" aria-label="required">*</span>
                                    </label>
                                    <input
                                        id="withdrawal-amount"
                                        type="number"
                                        value={withdrawalAmount}
                                        onChange={(e) => {
                                            const value = e.target.value
                                            const numValue = parseInt(value)
                                            if (value === '' || (numValue >= 10000 && numValue <= (wallet?.balance || 0))) {
                                                setWithdrawalAmount(value)
                                            }
                                        }}
                                        placeholder="Enter amount (min: 10,000)"
                                        min={10000}
                                        max={wallet?.balance || 0}
                                        aria-label="Withdrawal amount in coins"
                                        aria-describedby="available-balance"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-lg font-semibold focus:outline-none focus:border-[#df2531] focus:ring-2 focus:ring-[#df2531]/50 transition-colors"
                                    />
                                    <p id="available-balance" className="text-white/50 text-xs mt-2 flex items-center gap-1.5">
                                        <Coin size={14} weight="duotone" aria-hidden="true" />
                                        Available: <span className="font-semibold text-white">{(wallet?.balance || 0).toLocaleString()} coins</span>
                                    </p>
                                    {withdrawalAmount && parseInt(withdrawalAmount) < 10000 && (
                                        <p className="text-amber-400 text-xs mt-1.5 flex items-center gap-1.5" role="alert">
                                            <Warning size={14} weight="duotone" aria-hidden="true" />
                                            Minimum withdrawal is 10,000 coins
                                        </p>
                                    )}
                                </div>

                                {/* Bank Name - Enhanced */}
                                <div>
                                    <label htmlFor="bank-name" className="block text-white/70 text-sm mb-2 font-medium">
                                        Bank Name <span className="text-red-400" aria-label="required">*</span>
                                    </label>
                                    <select
                                        id="bank-name"
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        aria-label="Select your bank"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#df2531] focus:ring-2 focus:ring-[#df2531]/50 transition-colors"
                                    >
                                        <option value="" className="bg-black">Select your bank</option>
                                        <option value="Access Bank" className="bg-black">Access Bank</option>
                                        <option value="First Bank" className="bg-black">First Bank of Nigeria</option>
                                        <option value="GTBank" className="bg-black">Guaranty Trust Bank (GTBank)</option>
                                        <option value="UBA" className="bg-black">United Bank for Africa (UBA)</option>
                                        <option value="Zenith Bank" className="bg-black">Zenith Bank</option>
                                        <option value="Kuda Bank" className="bg-black">Kuda Bank</option>
                                        <option value="Opay" className="bg-black">Opay</option>
                                        <option value="Palmpay" className="bg-black">Palmpay</option>
                                        <option value="Other" className="bg-black">Other Bank</option>
                                    </select>
                                </div>

                                {/* Account Number - Enhanced */}
                                <div>
                                    <label htmlFor="account-number" className="block text-white/70 text-sm mb-2 font-medium">
                                        Account Number <span className="text-red-400" aria-label="required">*</span>
                                    </label>
                                    <input
                                        id="account-number"
                                        type="text"
                                        value={accountNumber}
                                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        placeholder="Enter 10-digit account number"
                                        maxLength={10}
                                        aria-label="Bank account number"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#df2531] focus:ring-2 focus:ring-[#df2531]/50 transition-colors"
                                    />
                                    <p className="text-white/40 text-xs mt-1.5">10-digit NUBAN account number</p>
                                </div>

                                {/* Account Name - Enhanced */}
                                <div>
                                    <label htmlFor="account-name" className="block text-white/70 text-sm mb-2 font-medium">
                                        Account Name <span className="text-red-400" aria-label="required">*</span>
                                    </label>
                                    <input
                                        id="account-name"
                                        type="text"
                                        value={accountName}
                                        onChange={(e) => setAccountName(e.target.value)}
                                        placeholder="Name as it appears on your bank account"
                                        aria-label="Account holder name"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#df2531] focus:ring-2 focus:ring-[#df2531]/50 transition-colors"
                                    />
                                    <p className="text-white/40 text-xs mt-1.5">Must match the name on your bank account</p>
                                </div>

                                {/* Submit Button - Enhanced */}
                                <Button
                                    onClick={handleWithdrawal}
                                    disabled={isWithdrawing || !withdrawalAmount || !bankName || !accountNumber || !accountName || parseInt(withdrawalAmount) < 10000}
                                    aria-label={isWithdrawing ? 'Submitting withdrawal request...' : 'Submit withdrawal request'}
                                    className="w-full bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg shadow-[#df2531]/30 hover:shadow-[#df2531]/40 transition-all"
                                >
                                    {isWithdrawing ? (
                                        <>
                                            <SpinnerGap size={20} className="animate-spin mr-2" aria-hidden="true" />
                                            <span className="sr-only">Submitting withdrawal request...</span>
                                            Submitting Request...
                                        </>
                                    ) : (
                                        <>
                                            <Bank size={20} weight="duotone" className="mr-2" aria-hidden="true" />
                                            Submit Withdrawal Request
                                        </>
                                    )}
                                </Button>
                                <p className="text-white/40 text-xs text-center mt-4 leading-relaxed">
                                    Your withdrawal request will be reviewed and processed within 24-48 hours.
                                    You&apos;ll receive a notification once it&apos;s approved.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <MobileBottomNav userRole="talent" />
        </>
    )
}
