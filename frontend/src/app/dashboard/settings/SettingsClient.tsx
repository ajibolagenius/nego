'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, Bell, Moon, Sun, Globe, ShieldCheck, Lock,
  Trash, SignOut, CaretRight, Eye, EyeSlash,
  Envelope, Phone, Warning
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

interface SettingsClientProps {
  user: SupabaseUser
  profile: Profile | null
}

export function SettingsClient({ user, profile }: SettingsClientProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [notifications, setNotifications] = useState({
    bookings: true,
    messages: true,
    promotions: false,
  })
  const [privacy, setPrivacy] = useState({
    showOnlineStatus: true,
    showLocation: true,
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const userRole = profile?.role === 'talent' ? 'talent' : 'client'

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== 'delete my account') {
      alert('Please type "delete my account" to confirm')
      return
    }
    
    setIsDeleting(true)
    try {
      // In production, you'd call a server action or API to handle account deletion
      // For now, just sign out
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Failed to delete account')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
    <div className="min-h-screen bg-black pt-16 lg:pt-0 pb-20 lg:pb-0">
      {/* Header */}
      <header className="sticky top-16 lg:top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Settings</h1>
              <p className="text-white/50 text-sm">Manage your preferences</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Account Section */}
        <div>
          <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">Account</h2>
          <div className="space-y-2">
            <Link 
              href="/dashboard/profile"
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#df2531]/10 flex items-center justify-center">
                  <Envelope size={20} className="text-[#df2531]" />
                </div>
                <div>
                  <p className="text-white font-medium">Email</p>
                  <p className="text-white/40 text-sm">{user.email}</p>
                </div>
              </div>
              <CaretRight size={20} className="text-white/40" />
            </Link>
            
            <button className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Lock size={20} className="text-white/60" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Change Password</p>
                  <p className="text-white/40 text-sm">Update your password</p>
                </div>
              </div>
              <CaretRight size={20} className="text-white/40" />
            </button>
          </div>
        </div>

        {/* Notifications Section */}
        <div>
          <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">Notifications</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#df2531]/10 flex items-center justify-center">
                  <Bell size={20} className="text-[#df2531]" />
                </div>
                <div>
                  <p className="text-white font-medium">Booking Updates</p>
                  <p className="text-white/40 text-sm">Get notified about booking status</p>
                </div>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, bookings: !prev.bookings }))}
                className={`w-12 h-7 rounded-full transition-colors ${notifications.bookings ? 'bg-[#df2531]' : 'bg-white/20'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifications.bookings ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Envelope size={20} className="text-white/60" />
                </div>
                <div>
                  <p className="text-white font-medium">Messages</p>
                  <p className="text-white/40 text-sm">New message notifications</p>
                </div>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, messages: !prev.messages }))}
                className={`w-12 h-7 rounded-full transition-colors ${notifications.messages ? 'bg-[#df2531]' : 'bg-white/20'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifications.messages ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Globe size={20} className="text-white/60" />
                </div>
                <div>
                  <p className="text-white font-medium">Promotions</p>
                  <p className="text-white/40 text-sm">Offers and news updates</p>
                </div>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, promotions: !prev.promotions }))}
                className={`w-12 h-7 rounded-full transition-colors ${notifications.promotions ? 'bg-[#df2531]' : 'bg-white/20'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifications.promotions ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div>
          <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">Privacy</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  {privacy.showOnlineStatus ? <Eye size={20} className="text-white/60" /> : <EyeSlash size={20} className="text-white/60" />}
                </div>
                <div>
                  <p className="text-white font-medium">Online Status</p>
                  <p className="text-white/40 text-sm">Show when you&apos;re online</p>
                </div>
              </div>
              <button
                onClick={() => setPrivacy(prev => ({ ...prev, showOnlineStatus: !prev.showOnlineStatus }))}
                className={`w-12 h-7 rounded-full transition-colors ${privacy.showOnlineStatus ? 'bg-[#df2531]' : 'bg-white/20'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${privacy.showOnlineStatus ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <ShieldCheck size={20} className="text-white/60" />
                </div>
                <div>
                  <p className="text-white font-medium">Show Location</p>
                  <p className="text-white/40 text-sm">Display your city on profile</p>
                </div>
              </div>
              <button
                onClick={() => setPrivacy(prev => ({ ...prev, showLocation: !prev.showLocation }))}
                className={`w-12 h-7 rounded-full transition-colors ${privacy.showLocation ? 'bg-[#df2531]' : 'bg-white/20'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${privacy.showLocation ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Legal Section */}
        <div>
          <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">Legal</h2>
          <div className="space-y-2">
            <Link 
              href="/terms"
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <p className="text-white font-medium">Terms & Conditions</p>
              <CaretRight size={20} className="text-white/40" />
            </Link>
            <Link 
              href="/privacy"
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <p className="text-white font-medium">Privacy Policy</p>
              <CaretRight size={20} className="text-white/40" />
            </Link>
            <Link 
              href="/cookies"
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <p className="text-white font-medium">Cookie Policy</p>
              <CaretRight size={20} className="text-white/40" />
            </Link>
          </div>
        </div>

        {/* Danger Zone */}
        <div>
          <h2 className="text-sm font-bold text-red-400/70 uppercase tracking-wider mb-4">Danger Zone</h2>
          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <SignOut size={20} className="text-white/60" />
              </div>
              <p className="text-white font-medium">Sign Out</p>
            </button>
            
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-red-500/20 hover:bg-red-500/10 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <Trash size={20} className="text-red-400" />
              </div>
              <div className="text-left">
                <p className="text-red-400 font-medium">Delete Account</p>
                <p className="text-red-400/50 text-sm">Permanently delete your account</p>
              </div>
            </button>
          </div>
        </div>

        {/* Version */}
        <p className="text-center text-white/30 text-sm">
          Nego v1.0.0
        </p>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0a0a0f] rounded-2xl w-full max-w-md border border-white/10 overflow-hidden">
            <div className="p-6">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Warning size={32} weight="duotone" className="text-red-400" />
              </div>
              
              <h2 className="text-xl font-bold text-white text-center mb-2">Delete Account?</h2>
              <p className="text-white/50 text-center mb-6">
                This action cannot be undone. All your data, bookings, and coins will be permanently deleted.
              </p>
              
              <div className="mb-4">
                <label className="block text-white/50 text-sm mb-2">
                  Type <span className="text-red-400 font-mono">delete my account</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500/50"
                  placeholder="delete my account"
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteConfirmText('')
                  }}
                  variant="ghost"
                  className="flex-1 text-white/50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmText.toLowerCase() !== 'delete my account'}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    <MobileBottomNav userRole={userRole} />
    </>
  )
}
