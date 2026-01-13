'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, User, PencilSimple, Camera, MapPin, Envelope,
  Calendar, Coin, CalendarCheck, ShieldCheck, CheckCircle,
  CaretRight, SignOut
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { ProfileImageUpload } from '@/components/ProfileImageUpload'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Profile, Wallet } from '@/types/database'

interface ProfileClientProps {
  user: SupabaseUser
  profile: Profile | null
  wallet: Wallet | null
  bookingCount: number
}

export function ProfileClient({ user, profile, wallet, bookingCount }: ProfileClientProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [location, setLocation] = useState(profile?.location || '')
  const [bio, setBio] = useState(profile?.bio || '')

  const userRole = profile?.role === 'talent' ? 'talent' : 'client'

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
      alert('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <>
    <div className="min-h-screen bg-black pt-16 lg:pt-0 pb-20 lg:pb-0">
      {/* Header */}
      <header className="sticky top-16 lg:top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
                <ArrowLeft size={24} />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Profile</h1>
                <p className="text-white/50 text-sm">Manage your account</p>
              </div>
            </div>
            
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                <PencilSimple size={18} />
                <span className="text-sm">Edit</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Avatar & Name Section */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="w-28 h-28 rounded-full bg-white/10 overflow-hidden border-4 border-[#df2531]/30">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User size={48} weight="duotone" className="text-white/40" />
                </div>
              )}
            </div>
            <button className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#df2531] flex items-center justify-center text-white hover:bg-[#c41f2a] transition-colors border-4 border-black">
              <Camera size={18} />
            </button>
          </div>
          
          {isEditing ? (
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="text-2xl font-bold text-white bg-transparent border-b-2 border-[#df2531] text-center outline-none mb-2"
              placeholder="Your Name"
            />
          ) : (
            <h2 className="text-2xl font-bold text-white mb-1">{displayName || 'Your Name'}</h2>
          )}
          
          <div className="flex items-center gap-2 text-white/50">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              profile?.role === 'talent' 
                ? 'bg-purple-500/20 text-purple-400' 
                : 'bg-blue-500/20 text-blue-400'
            }`}>
              {profile?.role === 'talent' ? 'Talent' : 'Client'}
            </span>
            {profile?.is_verified && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                <ShieldCheck size={12} weight="fill" />
                Verified
              </span>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <Coin size={24} weight="duotone" className="text-[#df2531] mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{wallet?.balance || 0}</p>
            <p className="text-white/40 text-xs">Coins</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <CalendarCheck size={24} weight="duotone" className="text-[#df2531] mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{bookingCount}</p>
            <p className="text-white/40 text-xs">Bookings</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <Calendar size={24} weight="duotone" className="text-[#df2531] mx-auto mb-2" />
            <p className="text-lg font-bold text-white">{formatDate(profile?.created_at || new Date().toISOString())}</p>
            <p className="text-white/40 text-xs">Member Since</p>
          </div>
        </div>

        {/* Profile Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Profile Information</h3>
          
          <div className="space-y-3">
            {/* Email */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-full bg-[#df2531]/10 flex items-center justify-center">
                <Envelope size={20} className="text-[#df2531]" />
              </div>
              <div className="flex-1">
                <p className="text-white/40 text-xs">Email</p>
                <p className="text-white">{user.email}</p>
              </div>
              <CheckCircle size={20} weight="fill" className="text-green-400" />
            </div>

            {/* Location */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-full bg-[#df2531]/10 flex items-center justify-center">
                <MapPin size={20} className="text-[#df2531]" />
              </div>
              <div className="flex-1">
                <p className="text-white/40 text-xs">Location</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-transparent text-white outline-none border-b border-white/20 focus:border-[#df2531]"
                    placeholder="Your location"
                  />
                ) : (
                  <p className="text-white">{location || 'Not set'}</p>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <User size={16} className="text-[#df2531]" />
                <p className="text-white/40 text-xs">Bio</p>
              </div>
              {isEditing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full h-24 bg-transparent text-white outline-none border border-white/20 rounded-lg p-2 focus:border-[#df2531] resize-none"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-white/70">{bio || 'No bio yet'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Edit Actions */}
        {isEditing && (
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold py-3 rounded-xl"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              onClick={() => {
                setIsEditing(false)
                setDisplayName(profile?.display_name || '')
                setLocation(profile?.location || '')
                setBio(profile?.bio || '')
              }}
              variant="ghost"
              className="px-6 text-white/50 hover:text-white"
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Quick Links */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white">Quick Links</h3>
          
          <Link href="/dashboard/wallet" className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#df2531]/10 flex items-center justify-center">
              <Coin size={20} className="text-[#df2531]" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">Wallet</p>
              <p className="text-white/40 text-sm">Manage your coins</p>
            </div>
            <CaretRight size={20} className="text-white/40" />
          </Link>
          
          <Link href="/dashboard/settings" className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <PencilSimple size={20} className="text-white/60" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">Settings</p>
              <p className="text-white/40 text-sm">Account preferences</p>
            </div>
            <CaretRight size={20} className="text-white/40" />
          </Link>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <SignOut size={20} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
    <MobileBottomNav userRole={userRole} />
    </>
  )
}
