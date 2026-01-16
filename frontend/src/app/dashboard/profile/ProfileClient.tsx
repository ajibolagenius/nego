'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    ArrowLeft, User, PencilSimple, MapPin, Envelope,
    Calendar, Coin, CalendarCheck, CheckCircle,
    CaretRight, Star, SpinnerGap, X, Warning
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { ProfileImageUpload } from '@/components/ProfileImageUpload'
import { useWallet } from '@/hooks/useWallet'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Profile, Wallet } from '@/types/database'

interface ProfileClientProps {
    user: SupabaseUser
    profile: Profile | null
    wallet: Wallet | null
    bookingCount: number
}

export function ProfileClient({ user, profile, wallet: initialWallet, bookingCount }: ProfileClientProps) {
    const router = useRouter()
    const supabase = createClient()

    // Real-time wallet synchronization
    const { wallet } = useWallet({ userId: user.id, initialWallet })

    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [displayName, setDisplayName] = useState(profile?.display_name || '')
    const [location, setLocation] = useState(profile?.location || '')
    const [bio, setBio] = useState(profile?.bio || '')
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // Store original values for cancel
    const originalDisplayName = profile?.display_name || ''
    const originalLocation = profile?.location || ''
    const originalBio = profile?.bio || ''

    // Character limits
    const DISPLAY_NAME_MAX = 50
    const LOCATION_MAX = 100
    const BIO_MAX = 500

    // Sync avatar URL when profile changes
    useEffect(() => {
        if (profile?.avatar_url) {
            setAvatarUrl(profile.avatar_url)
        }
    }, [profile?.avatar_url])

    const userRole = profile?.role === 'talent' ? 'talent' : 'client'

    const handleImageUpload = (url: string) => {
        setAvatarUrl(url)
        router.refresh()
    }

    // Validation
    const validateForm = (): string | null => {
        if (displayName.trim().length === 0) {
            return 'Display name is required'
        }
        if (displayName.length > DISPLAY_NAME_MAX) {
            return `Display name must be ${DISPLAY_NAME_MAX} characters or less`
        }
        if (location.length > LOCATION_MAX) {
            return `Location must be ${LOCATION_MAX} characters or less`
        }
        if (bio.length > BIO_MAX) {
            return `Bio must be ${BIO_MAX} characters or less`
        }
        return null
    }

    const handleSave = async () => {
        setError(null)
        setSuccess(false)

        // Validate
        const validationError = validateForm()
        if (validationError) {
            setError(validationError)
            return
        }

        setIsSaving(true)
        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    display_name: displayName.trim(),
                    location: location.trim(),
                    bio: bio.trim(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)

            if (updateError) throw updateError

            setSuccess(true)
            setIsEditing(false)
            router.refresh()

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000)
        } catch (err) {
            console.error('[ProfileClient] Error updating profile:', err)
            setError('Failed to save profile. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => {
        setDisplayName(originalDisplayName)
        setLocation(originalLocation)
        setBio(originalBio)
        setError(null)
        setSuccess(false)
        setIsEditing(false)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            month: 'long',
            year: 'numeric'
        })
    }

    return (
        <>
            <div className="min-h-screen bg-black pt-16 lg:pt-0 pb-24 lg:pb-0">
                {/* Header with gradient background */}
                <div className="relative">
                    <div className="absolute inset-0 h-48 bg-gradient-to-b from-[#df2531]/20 to-transparent" />

                    <header className="sticky top-16 lg:top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/10">
                        <div className="max-w-2xl mx-auto px-4 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
                                        <ArrowLeft size={24} />
                                    </Link>
                                    <h1 className="text-xl font-bold text-white">Profile</h1>
                                </div>
                                {!isEditing ? (
                                    <Button
                                        onClick={() => setIsEditing(true)}
                                        variant="outline"
                                        size="sm"
                                        className="border-white/20 text-white hover:bg-white/10"
                                        aria-label="Edit profile"
                                    >
                                        <PencilSimple size={16} className="mr-2" aria-hidden="true" />
                                        Edit Profile
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleCancel}
                                            variant="ghost"
                                            size="sm"
                                            className="text-white/60 hover:text-white"
                                            disabled={isSaving}
                                            aria-label="Cancel editing"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            size="sm"
                                            className="bg-[#df2531] hover:bg-[#c41f2a] text-white"
                                            aria-label="Save changes"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <SpinnerGap size={16} className="animate-spin mr-2" aria-hidden="true" />
                                                    <span className="sr-only">Saving...</span>
                                                    Saving...
                                                </>
                                            ) : (
                                                'Save Changes'
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>
                </div>

                <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                    {/* Success/Error Messages */}
                    {success && (
                        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-between" role="alert">
                            <div className="flex items-center gap-3">
                                <CheckCircle size={20} className="text-green-400" aria-hidden="true" />
                                <p className="text-green-400 text-sm font-medium">Profile updated successfully!</p>
                            </div>
                            <button
                                onClick={() => setSuccess(false)}
                                className="text-green-400/60 hover:text-green-400 transition-colors"
                                aria-label="Dismiss success message"
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between" role="alert">
                            <div className="flex items-center gap-3">
                                <Warning size={20} className="text-red-400" aria-hidden="true" />
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                            <button
                                onClick={() => setError(null)}
                                className="text-red-400/60 hover:text-red-400 transition-colors"
                                aria-label="Dismiss error message"
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>
                    )}

                    {/* Avatar & Name Section */}
                    <div className="flex flex-col items-center text-center -mt-8 relative z-10">
                        <div className="relative mb-4">
                            <ProfileImageUpload
                                userId={user.id}
                                currentImageUrl={avatarUrl}
                                displayName={displayName}
                                onUploadComplete={handleImageUpload}
                            />
                        </div>

                        {isEditing ? (
                            <div className="w-full max-w-[300px]">
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    maxLength={DISPLAY_NAME_MAX}
                                    className="text-2xl font-bold text-white bg-transparent border-b-2 border-[#df2531] text-center outline-none mb-1 w-full focus:border-[#df2531] transition-colors"
                                    placeholder="Enter your display name"
                                    aria-label="Display name"
                                    aria-describedby="display-name-counter"
                                />
                                <div className="flex justify-between items-center text-xs text-white/40">
                                    <span id="display-name-counter" className="sr-only">Character count</span>
                                    <span aria-live="polite">
                                        {displayName.length}/{DISPLAY_NAME_MAX}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <h2 className="text-2xl font-bold text-white mb-1">{displayName || 'Your Name'}</h2>
                        )}

                        {/* Role Badge */}
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${userRole === 'talent'
                                ? 'bg-[#df2531]/20 text-[#df2531] border border-[#df2531]/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                }`}>
                                {userRole === 'talent' ? 'Talent' : 'Client'}
                            </span>
                            {profile?.is_verified && (
                                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                                    <CheckCircle size={12} weight="fill" />
                                    Verified
                                </span>
                            )}
                        </div>

                        {/* Location (editable) */}
                        {isEditing ? (
                            <div className="w-full max-w-[300px] mt-2">
                                <div className="flex items-center gap-2 justify-center">
                                    <MapPin size={16} className="text-white/40" aria-hidden="true" />
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        maxLength={LOCATION_MAX}
                                        className="text-white/60 bg-transparent border-b border-white/20 text-center outline-none text-sm flex-1 focus:border-[#df2531] transition-colors"
                                        placeholder="Enter your location (e.g., Lagos, Nigeria)"
                                        aria-label="Location"
                                        aria-describedby="location-counter"
                                    />
                                </div>
                                <div className="flex justify-end items-center text-xs text-white/40 mt-1">
                                    <span id="location-counter" className="sr-only">Character count</span>
                                    <span aria-live="polite">
                                        {location.length}/{LOCATION_MAX}
                                    </span>
                                </div>
                            </div>
                        ) : location ? (
                            <div className="flex items-center gap-1 text-white/60 text-sm">
                                <MapPin size={14} weight="fill" aria-hidden="true" />
                                {location}
                            </div>
                        ) : (
                            <div className="text-white/40 text-sm">Location not specified</div>
                        )}
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 text-center">
                            <Coin size={24} weight="duotone" className="text-amber-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-white">{wallet?.balance || 0}</p>
                            <p className="text-white/40 text-xs">Coins</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 text-center">
                            <CalendarCheck size={24} weight="duotone" className="text-[#df2531] mx-auto mb-2" />
                            <p className="text-2xl font-bold text-white">{bookingCount}</p>
                            <p className="text-white/40 text-xs">Bookings</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 text-center">
                            <Calendar size={24} weight="duotone" className="text-blue-400 mx-auto mb-2" />
                            <p className="text-sm font-bold text-white">{profile?.created_at ? formatDate(profile.created_at) : 'N/A'}</p>
                            <p className="text-white/40 text-xs">Joined</p>
                        </div>
                    </div>

                    {/* Bio Section */}
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                        <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3">About</h3>
                        {isEditing ? (
                            <div>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    maxLength={BIO_MAX}
                                    rows={6}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50 text-sm resize-none transition-colors"
                                    placeholder="Tell us about yourself, your interests, or what makes you unique..."
                                    aria-label="Bio"
                                    aria-describedby="bio-counter"
                                />
                                <div className="flex justify-end items-center text-xs text-white/40 mt-2">
                                    <span id="bio-counter" className="sr-only">Character count</span>
                                    <span aria-live="polite">
                                        {bio.length}/{BIO_MAX}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-white/70 text-sm leading-relaxed">
                                {bio || 'No bio added yet. Click "Edit Profile" to add one!'}
                            </p>
                        )}
                    </div>

                    {/* Account Info */}
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                        <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">Account</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                    <Envelope size={18} className="text-white/60" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white/40 text-xs">Email</p>
                                    <p className="text-white text-sm truncate">{user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                    <User size={18} className="text-white/60" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white/40 text-xs">User ID</p>
                                    <p className="text-white text-sm font-mono truncate">{user.id.slice(0, 16)}...</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-2">
                        <Link
                            href="/dashboard/settings"
                            className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                            <p className="text-white font-medium">Settings</p>
                            <CaretRight size={20} className="text-white/40" />
                        </Link>

                        <Link
                            href="/dashboard/wallet"
                            className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                            <p className="text-white font-medium">Wallet & Transactions</p>
                            <CaretRight size={20} className="text-white/40" />
                        </Link>

                        {userRole === 'talent' && (
                            <Link
                                href="/dashboard/talent"
                                className="flex items-center justify-between p-4 rounded-xl bg-[#df2531]/10 border border-[#df2531]/20 hover:bg-[#df2531]/20 transition-colors"
                            >
                                <p className="text-[#df2531] font-medium">Talent Dashboard</p>
                                <CaretRight size={20} className="text-[#df2531]/60" />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
            <MobileBottomNav userRole={userRole} />
        </>
    )
}
