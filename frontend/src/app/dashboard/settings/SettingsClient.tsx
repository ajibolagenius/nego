'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Bell, Lock, Envelope, Globe, SignOut, Trash, Warning, 
  CaretRight, ShieldCheck, Eye, EyeSlash, User, SpinnerGap, CheckCircle, Moon, Sun
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { PushNotificationManager } from '@/components/PushNotificationManager'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

interface SettingsClientProps {
  user: SupabaseUser
  profile: Profile | null
}

export function SettingsClient({ user, profile }: SettingsClientProps) {
  const router = useRouter()
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
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const userRole = profile?.role === 'talent' ? 'talent' : 'client'

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') return
    
    setIsDeleting(true)
    try {
      const supabase = createClient()
      
      // Delete user's data (cascade should handle related records)
      await supabase.from('profiles').delete().eq('id', user.id)
      
      // Sign out
      await supabase.auth.signOut()
      
      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePasswordChange = async () => {
    setPasswordError('')
    
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setPasswordLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error
      
      setPasswordSuccess(true)
      setTimeout(() => {
        setShowPasswordModal(false)
        setPasswordSuccess(false)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }, 2000)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password'
      setPasswordError(errorMessage)
    } finally {
      setPasswordLoading(false)
    }
  }

  // Toggle component
  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-12 h-7 rounded-full transition-colors ${enabled ? 'bg-[#df2531]' : 'bg-white/20'}`}
    >
      <div 
        className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
          enabled ? 'left-6' : 'left-1'
        }`} 
      />
    </button>
  )

  return (
    <>
      <div className="min-h-screen bg-black pt-16 lg:pt-0 pb-24 lg:pb-0">
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
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#df2531]/10 flex items-center justify-center">
                    <Envelope size={20} className="text-[#df2531]" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Email</p>
                    <p className="text-white/40 text-sm">{user.email}</p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
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
                <Toggle 
                  enabled={notifications.bookings} 
                  onChange={() => setNotifications(prev => ({ ...prev, bookings: !prev.bookings }))} 
                />
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
                <Toggle 
                  enabled={notifications.messages} 
                  onChange={() => setNotifications(prev => ({ ...prev, messages: !prev.messages }))} 
                />
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
                <Toggle 
                  enabled={notifications.promotions} 
                  onChange={() => setNotifications(prev => ({ ...prev, promotions: !prev.promotions }))} 
                />
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
                    <p className="text-white/40 text-sm">Show when you're online</p>
                  </div>
                </div>
                <Toggle 
                  enabled={privacy.showOnlineStatus} 
                  onChange={() => setPrivacy(prev => ({ ...prev, showOnlineStatus: !prev.showOnlineStatus }))} 
                />
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
                <Toggle 
                  enabled={privacy.showLocation} 
                  onChange={() => setPrivacy(prev => ({ ...prev, showLocation: !prev.showLocation }))} 
                />
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
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0a0a0f] rounded-2xl w-full max-w-md border border-white/10 overflow-hidden">
            <div className="p-6">
              {passwordSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} weight="fill" className="text-green-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Password Updated!</h2>
                  <p className="text-white/50">Your password has been changed successfully.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-[#df2531]/10 flex items-center justify-center">
                      <Lock size={24} weight="duotone" className="text-[#df2531]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Change Password</h2>
                      <p className="text-white/50 text-sm">Enter your new password</p>
                    </div>
                  </div>
                  
                  {passwordError && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      {passwordError}
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-white/60 text-sm mb-2 block">New Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                        >
                          {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-white/60 text-sm mb-2 block">Confirm New Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50"
                      />
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-red-400 text-xs mt-2">Passwords do not match</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={() => {
                        setShowPasswordModal(false)
                        setPasswordError('')
                        setNewPassword('')
                        setConfirmPassword('')
                      }}
                      variant="ghost"
                      className="flex-1 text-white/60 hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePasswordChange}
                      disabled={passwordLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                      className="flex-1 bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold disabled:opacity-50"
                    >
                      {passwordLoading ? (
                        <SpinnerGap size={20} className="animate-spin" />
                      ) : (
                        'Update Password'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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
                <label className="text-white/60 text-sm mb-2 block">
                  Type <span className="text-red-400 font-mono">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full bg-white/5 border border-red-500/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50"
                  placeholder="DELETE"
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteConfirmation('')
                  }}
                  variant="ghost"
                  className="flex-1 text-white/60 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-50"
                >
                  {isDeleting ? (
                    <SpinnerGap size={20} className="animate-spin" />
                  ) : (
                    'Delete Forever'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav userRole={userRole} />
    </>
  )
}
