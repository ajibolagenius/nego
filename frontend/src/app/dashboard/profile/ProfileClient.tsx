'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    ArrowLeft, User, PencilSimple, MapPin, Envelope,
    Calendar, Coin, CalendarCheck, CheckCircle,
    CaretRight, Star, SpinnerGap
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

    // Sync avatar URL when profile changes
    useEffect(() => {
        if (profile?.avatar_url) {
            setAvatarUrl(profile.avatar_url)
        }
    }, [profile?.avatar_url])

    const userRole = profile?.role === 'talent' ? 'talent' : 'client'

    const handleImageUpload = (url: string) => {
        setAvatarUrl(url)
        // Force a hard refresh to update all components
        window.location.reload()
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    display_name: displayName,
                    location: location,
                    bio: bio,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)

            if (error) throw error
            setIsEditing(false)
            router.refresh()
        } catch (error) {
            console.error('Error updating profile:', error)
        } finally {
            setIsSaving(false)
        }
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
                                    >
                                        <PencilSimple size={16} className="mr-2" />
                                        Edit
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => setIsEditing(false)}
                                            variant="ghost"
                                            size="sm"
                                            className="text-white/60 hover:text-white"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            size="sm"
                                            className="bg-[#df2531] hover:bg-[#c41f2a] text-white"
                                        >
                                            {isSaving ? <SpinnerGap size={16} className="animate-spin" /> : 'Save'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>
                </div>

                <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
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
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="text-2xl font-bold text-white bg-transparent border-b-2 border-[#df2531] text-center outline-none mb-2 max-w-[250px]"
                                placeholder="Your Name"
                            />
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
                            <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-white/40" />
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="text-white/60 bg-transparent border-b border-white/20 text-center outline-none text-sm"
                                    placeholder="Your Location"
                                />
                            </div>
                        ) : location && (
                            <div className="flex items-center gap-1 text-white/60 text-sm">
                                <MapPin size={14} weight="fill" />
                                {location}
                            </div>
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
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={4}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50 text-sm resize-none"
                                placeholder="Tell us about yourself..."
                            />
                        ) : (
                            <p className="text-white/70 text-sm leading-relaxed">
                                {bio || 'No bio added yet. Click edit to add one!'}
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
