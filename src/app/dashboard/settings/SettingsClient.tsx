'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, Bell, Lock, Envelope, Globe, SignOut, Trash, Warning,
    CaretRight, ShieldCheck, Eye, EyeSlash, User, SpinnerGap, CheckCircle, X, Check, Circle
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

interface PasswordStrength {
    minLength: boolean
    hasUppercase: boolean
    hasLowercase: boolean
    hasNumber: boolean
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
    const [deleteError, setDeleteError] = useState('')

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [passwordError, setPasswordError] = useState('')
    const [passwordSuccess, setPasswordSuccess] = useState(false)

    // Success/Error messages
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    // Loading states for individual settings
    const [savingNotifications, setSavingNotifications] = useState<string | null>(null)
    const [savingPrivacy, setSavingPrivacy] = useState<string | null>(null)
    const [togglingStatus, setTogglingStatus] = useState(false)
    const [isOnline, setIsOnline] = useState(profile?.status === 'online')

    const userRole = profile?.role === 'talent' ? 'talent' : 'client'

    // Sync status from profile
    useEffect(() => {
        if (profile?.status) {
            setIsOnline(profile.status === 'online')
        }
    }, [profile?.status])

    // Calculate password strength
    const getPasswordStrength = useCallback((password: string): PasswordStrength => {
        return {
            minLength: password.length >= 8,
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasNumber: /[0-9]/.test(password),
        }
    }, [])

    const passwordStrength = getPasswordStrength(newPassword)
    const isPasswordValid = passwordStrength.minLength && passwordStrength.hasUppercase &&
        passwordStrength.hasLowercase && passwordStrength.hasNumber

    // Auto-dismiss messages
    const showSuccess = useCallback((message: string) => {
        setSuccessMessage(message)
        setTimeout(() => setSuccessMessage(null), 4000)
    }, [])

    const showError = useCallback((message: string) => {
        setErrorMessage(message)
        setTimeout(() => setErrorMessage(null), 5000)
    }, [])

    // Save notification setting
    const saveNotificationSetting = useCallback(async (key: keyof typeof notifications, value: boolean) => {
        setSavingNotifications(key)
        const previousValue = notifications[key]

        // Optimistic update
        setNotifications(prev => ({ ...prev, [key]: value }))

        try {
            // TODO: Save to database
            // const supabase = createClient()
            // await supabase.from('user_settings').update({ [key]: value }).eq('user_id', user.id)

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500))

            showSuccess(`${key === 'bookings' ? 'Booking' : key === 'messages' ? 'Message' : 'Promotion'} notifications ${value ? 'enabled' : 'disabled'}`)
        } catch (error) {
            // Revert on error
            setNotifications(prev => ({ ...prev, [key]: previousValue }))
            showError(`Failed to update ${key} notification setting`)
        } finally {
            setSavingNotifications(null)
        }
    }, [notifications, user.id, showSuccess, showError])

    // Save privacy setting
    const savePrivacySetting = useCallback(async (key: keyof typeof privacy, value: boolean) => {
        setSavingPrivacy(key)
        const previousValue = privacy[key]

        // Optimistic update
        setPrivacy(prev => ({ ...prev, [key]: value }))

        try {
            // TODO: Save to database
            // const supabase = createClient()
            // await supabase.from('user_settings').update({ [key]: value }).eq('user_id', user.id)

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500))

            showSuccess(`${key === 'showOnlineStatus' ? 'Online status' : 'Location'} visibility ${value ? 'enabled' : 'disabled'}`)
        } catch (error) {
            // Revert on error
            setPrivacy(prev => ({ ...prev, [key]: previousValue }))
            showError(`Failed to update ${key} privacy setting`)
        } finally {
            setSavingPrivacy(null)
        }
    }, [privacy, user.id, showSuccess, showError])

    // Toggle online/offline status (for talents)
    const handleToggleStatus = useCallback(async () => {
        if (userRole !== 'talent') return

        setTogglingStatus(true)
        const previousStatus = isOnline

        // Optimistic update
        setIsOnline(!isOnline)

        try {
            const supabase = createClient()
            const newStatus = !isOnline ? 'online' : 'offline'
            const { error } = await supabase
                .from('profiles')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)

            if (error) throw error

            showSuccess(`Status changed to ${newStatus}`)
            router.refresh()
        } catch (error) {
            // Revert on error
            setIsOnline(previousStatus)
            showError('Failed to update status. Please try again.')
        } finally {
            setTogglingStatus(false)
        }
    }, [isOnline, userRole, user.id, showSuccess, showError, router])

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== 'DELETE') return

        setIsDeleting(true)
        setDeleteError('')
        try {
            const supabase = createClient()

            // Delete user's data (cascade should handle related records)
            const { error } = await supabase.from('profiles').delete().eq('id', user.id)

            if (error) throw error

            // Sign out
            await supabase.auth.signOut()

            router.push('/')
        } catch (error) {
            console.error('[Settings] Error deleting account:', error)
            setDeleteError('Failed to delete account. Please try again or contact support.')
        } finally {
            setIsDeleting(false)
        }
    }

    const handlePasswordChange = async () => {
        setPasswordError('')

        if (!isPasswordValid) {
            setPasswordError('Password must be at least 8 characters with uppercase, lowercase, and a number')
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
                showSuccess('Password updated successfully!')
            }, 2000)
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to change password'
            setPasswordError(errorMessage)
        } finally {
            setPasswordLoading(false)
        }
    }

    // Toggle component with accessibility
    const Toggle = ({
        enabled,
        onChange,
        disabled = false,
        ariaLabel
    }: {
        enabled: boolean
        onChange: () => void
        disabled?: boolean
        ariaLabel?: string
    }) => (
        <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={ariaLabel}
            onClick={onChange}
            disabled={disabled}
            className={`relative w-12 h-7 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#df2531]/50 focus:ring-offset-2 focus:ring-offset-black ${enabled ? 'bg-[#df2531]' : 'bg-white/20'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <div
                className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${enabled ? 'left-6' : 'left-1'
                    }`}
            />
        </button>
    )

    return (
        <>
            <div className="min-h-screen bg-black pt-16 lg:pt-0 pb-24 lg:pb-0">
                {/* Header */}
                <header className="fixed lg:sticky top-[64px] lg:top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 border-t-0">
                    <div className="max-w-2xl mx-auto px-4 py-4">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/dashboard"
                                className="text-white/60 hover:text-white transition-colors"
                                aria-label="Back to dashboard"
                            >
                                <ArrowLeft size={24} aria-hidden="true" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-white">Settings</h1>
                                <p className="text-white/50 text-sm">Manage your account preferences and privacy</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="max-w-2xl mx-auto px-4 py-6 pt-[128px] lg:pt-6 space-y-6">
                    {/* Success/Error Messages */}
                    {successMessage && (
                        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-between animate-fade-in-up" role="alert">
                            <div className="flex items-center gap-3">
                                <CheckCircle size={20} className="text-green-400" aria-hidden="true" />
                                <p className="text-green-400 text-sm font-medium">{successMessage}</p>
                            </div>
                            <button
                                onClick={() => setSuccessMessage(null)}
                                className="text-green-400/60 hover:text-green-400 transition-colors"
                                aria-label="Dismiss success message"
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between animate-fade-in-up" role="alert">
                            <div className="flex items-center gap-3">
                                <Warning size={20} className="text-red-400" aria-hidden="true" />
                                <p className="text-red-400 text-sm">{errorMessage}</p>
                            </div>
                            <button
                                onClick={() => setErrorMessage(null)}
                                className="text-red-400/60 hover:text-red-400 transition-colors"
                                aria-label="Dismiss error message"
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>
                    )}

                    {/* Account Section */}
                    <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">Account</h2>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#df2531]/30 transition-all duration-300">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[#df2531]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <Envelope size={20} weight="duotone" className="text-[#df2531]" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Email</p>
                                        <p className="text-white/40 text-sm">{user.email}</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="group w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#df2531]/30 hover:bg-white/10 transition-all duration-300"
                                aria-label="Change password"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <Lock size={20} weight="duotone" className="text-white/60" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-white font-medium">Change Password</p>
                                        <p className="text-white/40 text-sm">Update your account password</p>
                                    </div>
                                </div>
                                <CaretRight size={20} className="text-white/40 group-hover:translate-x-1 transition-transform duration-300" />
                            </button>
                        </div>
                    </div>

                    {/* Push Notifications Section */}
                    <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">Push Notifications</h2>
                        <PushNotificationManager userId={user.id} />
                    </div>

                    {/* Email Notifications Section */}
                    <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">Email Notifications</h2>
                        <p className="text-white/40 text-sm mb-4">Choose which email notifications you want to receive</p>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#df2531]/30 transition-all duration-300">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[#df2531]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <Bell size={20} weight="duotone" className="text-[#df2531]" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Booking Updates</p>
                                        <p className="text-white/40 text-sm">Get notified about booking status changes and confirmations</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {savingNotifications === 'bookings' && (
                                        <SpinnerGap size={16} className="animate-spin text-white/40" aria-hidden="true" />
                                    )}
                                    <Toggle
                                        enabled={notifications.bookings}
                                        onChange={() => saveNotificationSetting('bookings', !notifications.bookings)}
                                        disabled={savingNotifications === 'bookings'}
                                        ariaLabel="Toggle booking email notifications"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#df2531]/30 transition-all duration-300">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <Envelope size={20} weight="duotone" className="text-white/60" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Messages</p>
                                        <p className="text-white/40 text-sm">New message notifications</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {savingNotifications === 'messages' && (
                                        <SpinnerGap size={16} className="animate-spin text-white/40" aria-hidden="true" />
                                    )}
                                    <Toggle
                                        enabled={notifications.messages}
                                        onChange={() => saveNotificationSetting('messages', !notifications.messages)}
                                        disabled={savingNotifications === 'messages'}
                                        ariaLabel="Toggle message email notifications"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#df2531]/30 transition-all duration-300">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <Globe size={20} weight="duotone" className="text-white/60" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Promotions</p>
                                        <p className="text-white/40 text-sm">Offers and news updates</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {savingNotifications === 'promotions' && (
                                        <SpinnerGap size={16} className="animate-spin text-white/40" aria-hidden="true" />
                                    )}
                                    <Toggle
                                        enabled={notifications.promotions}
                                        onChange={() => saveNotificationSetting('promotions', !notifications.promotions)}
                                        disabled={savingNotifications === 'promotions'}
                                        ariaLabel="Toggle promotion email notifications"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Account Status (for talents) */}
                    {userRole === 'talent' && (
                        <div className="animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
                            <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">Account Status</h2>
                            <p className="text-white/40 text-sm mb-4">Control your availability status</p>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#df2531]/30 transition-all duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                            isOnline ? 'bg-green-500/20' : 'bg-white/10'
                                        }`}>
                                            <Circle size={20} weight="fill" className={isOnline ? 'text-green-400 animate-pulse' : 'text-white/60'} aria-hidden="true" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">Online/Offline Status</p>
                                            <p className="text-white/40 text-sm">
                                                {isOnline ? 'You are currently online' : 'You are currently offline'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {togglingStatus && (
                                            <SpinnerGap size={16} className="animate-spin text-white/40" aria-hidden="true" />
                                        )}
                                        <button
                                            onClick={handleToggleStatus}
                                            disabled={togglingStatus}
                                            className={`relative w-14 h-7 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 ${
                                                isOnline ? 'bg-green-500' : 'bg-white/20'
                                            }`}
                                            aria-label={isOnline ? 'Switch to offline' : 'Switch to online'}
                                            aria-pressed={isOnline}
                                        >
                                            <span
                                                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform shadow-lg ${
                                                    isOnline ? 'translate-x-7' : 'translate-x-0'
                                                }`}
                                                aria-hidden="true"
                                            />
                                        </button>
                                        <span className={`text-sm font-medium min-w-[60px] ${isOnline ? 'text-green-400' : 'text-white/60'}`}>
                                            {togglingStatus ? 'Updating...' : isOnline ? 'Online' : 'Offline'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Privacy Section */}
                    <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                        <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">Privacy</h2>
                        <p className="text-white/40 text-sm mb-4">Control what information is visible to others</p>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#df2531]/30 transition-all duration-300">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        {privacy.showOnlineStatus ? (
                                            <Eye size={20} weight="duotone" className="text-white/60" />
                                        ) : (
                                            <EyeSlash size={20} weight="duotone" className="text-white/60" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Show Online Status</p>
                                        <p className="text-white/40 text-sm">Let others see when you&apos;re active on the platform</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {savingPrivacy === 'showOnlineStatus' && (
                                        <SpinnerGap size={16} className="animate-spin text-white/40" aria-hidden="true" />
                                    )}
                                    <Toggle
                                        enabled={privacy.showOnlineStatus}
                                        onChange={() => savePrivacySetting('showOnlineStatus', !privacy.showOnlineStatus)}
                                        disabled={savingPrivacy === 'showOnlineStatus'}
                                        ariaLabel="Toggle online status visibility"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#df2531]/30 transition-all duration-300">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <ShieldCheck size={20} weight="duotone" className="text-white/60" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Show Location</p>
                                        <p className="text-white/40 text-sm">Display your city or location on your public profile</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {savingPrivacy === 'showLocation' && (
                                        <SpinnerGap size={16} className="animate-spin text-white/40" aria-hidden="true" />
                                    )}
                                    <Toggle
                                        enabled={privacy.showLocation}
                                        onChange={() => savePrivacySetting('showLocation', !privacy.showLocation)}
                                        disabled={savingPrivacy === 'showLocation'}
                                        ariaLabel="Toggle location visibility"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Legal Section */}
                    <div className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                        <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">Legal</h2>
                        <div className="space-y-2">
                            <Link
                                href="/terms"
                                className="group flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#df2531]/30 hover:bg-white/10 transition-all duration-300"
                            >
                                <p className="text-white font-medium">Terms & Conditions</p>
                                <CaretRight size={20} className="text-white/40 group-hover:translate-x-1 transition-transform duration-300" />
                            </Link>
                            <Link
                                href="/privacy"
                                className="group flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#df2531]/30 hover:bg-white/10 transition-all duration-300"
                            >
                                <p className="text-white font-medium">Privacy Policy</p>
                                <CaretRight size={20} className="text-white/40 group-hover:translate-x-1 transition-transform duration-300" />
                            </Link>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                        <h2 className="text-sm font-bold text-red-400/70 uppercase tracking-wider mb-4">Danger Zone</h2>
                        <div className="space-y-3">
                            <button
                                onClick={handleLogout}
                                className="group w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 hover:border-[#df2531]/30 hover:bg-white/5 transition-all duration-300"
                                aria-label="Sign out of your account"
                            >
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <SignOut size={20} weight="duotone" className="text-white/60" />
                                </div>
                                <div className="text-left flex-1">
                                    <p className="text-white font-medium">Sign Out</p>
                                    <p className="text-white/40 text-sm">Sign out of your account on this device</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="group w-full flex items-center gap-4 p-4 rounded-xl border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10 transition-all duration-300"
                                aria-label="Delete account"
                            >
                                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Trash size={20} weight="duotone" className="text-red-400" />
                                </div>
                                <div className="text-left flex-1">
                                    <p className="text-red-400 font-medium">Delete Account</p>
                                    <p className="text-red-400/50 text-sm">Permanently delete your account and all data</p>
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
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => !passwordLoading && setShowPasswordModal(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="password-modal-title"
                >
                    <div
                        className="bg-[#0a0a0f] rounded-2xl w-full max-w-md border border-white/10 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            {passwordSuccess ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle size={32} weight="fill" className="text-green-400" aria-hidden="true" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-2">Password Updated!</h2>
                                    <p className="text-white/50">Your password has been changed successfully.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-full bg-[#df2531]/10 flex items-center justify-center">
                                            <Lock size={24} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <h2 id="password-modal-title" className="text-xl font-bold text-white">Change Password</h2>
                                            <p className="text-white/50 text-sm">Enter your new password</p>
                                        </div>
                                    </div>

                                    {passwordError && (
                                        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm" role="alert">
                                            {passwordError}
                                        </div>
                                    )}

                                    <form onSubmit={(e) => {
                                        e.preventDefault()
                                        handlePasswordChange()
                                    }}>
                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="new-password" className="text-white/60 text-sm mb-2 block">
                                                    New Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        id="new-password"
                                                        type={showNewPassword ? 'text' : 'password'}
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        placeholder="Enter new password"
                                                        autoComplete="new-password"
                                                        aria-label="New password"
                                                        aria-describedby="password-strength"
                                                        required
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50 transition-colors"
                                                    />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                                                >
                                                    {showNewPassword ? <EyeSlash size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                                                </button>
                                            </div>

                                            {/* Password Strength Indicator */}
                                            {newPassword && (
                                                <div id="password-strength" className="mt-2 space-y-1.5">
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <Check
                                                            size={14}
                                                            weight={passwordStrength.minLength ? 'fill' : 'regular'}
                                                            className={passwordStrength.minLength ? 'text-green-400' : 'text-white/30'}
                                                            aria-hidden="true"
                                                        />
                                                        <span className={passwordStrength.minLength ? 'text-green-400' : 'text-white/40'}>
                                                            At least 8 characters
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <Check
                                                            size={14}
                                                            weight={passwordStrength.hasUppercase ? 'fill' : 'regular'}
                                                            className={passwordStrength.hasUppercase ? 'text-green-400' : 'text-white/30'}
                                                            aria-hidden="true"
                                                        />
                                                        <span className={passwordStrength.hasUppercase ? 'text-green-400' : 'text-white/40'}>
                                                            One uppercase letter
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <Check
                                                            size={14}
                                                            weight={passwordStrength.hasLowercase ? 'fill' : 'regular'}
                                                            className={passwordStrength.hasLowercase ? 'text-green-400' : 'text-white/30'}
                                                            aria-hidden="true"
                                                        />
                                                        <span className={passwordStrength.hasLowercase ? 'text-green-400' : 'text-white/40'}>
                                                            One lowercase letter
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <Check
                                                            size={14}
                                                            weight={passwordStrength.hasNumber ? 'fill' : 'regular'}
                                                            className={passwordStrength.hasNumber ? 'text-green-400' : 'text-white/30'}
                                                            aria-hidden="true"
                                                        />
                                                        <span className={passwordStrength.hasNumber ? 'text-green-400' : 'text-white/40'}>
                                                            One number
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                            <div>
                                                <label htmlFor="confirm-password" className="text-white/60 text-sm mb-2 block">
                                                    Confirm New Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        id="confirm-password"
                                                        type={showConfirmPassword ? 'text' : 'password'}
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        placeholder="Confirm new password"
                                                        autoComplete="new-password"
                                                        aria-label="Confirm new password"
                                                        aria-describedby="password-match"
                                                        required
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50 transition-colors"
                                                    />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                                >
                                                    {showConfirmPassword ? <EyeSlash size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                                                </button>
                                            </div>
                                            {confirmPassword && (
                                                <div id="password-match" className="mt-2 flex items-center gap-2">
                                                    {newPassword === confirmPassword ? (
                                                        <>
                                                            <Check size={14} weight="fill" className="text-green-400" aria-hidden="true" />
                                                            <span className="text-green-400 text-xs">Passwords match</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <X size={14} className="text-red-400" aria-hidden="true" />
                                                            <span className="text-red-400 text-xs">Passwords do not match</span>
                                                        </>
                                                    )}
                                                </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-3 mt-6">
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    setShowPasswordModal(false)
                                                    setPasswordError('')
                                                    setNewPassword('')
                                                    setConfirmPassword('')
                                                }}
                                                variant="ghost"
                                                className="flex-1 text-white/60 hover:text-white"
                                                disabled={passwordLoading}
                                                aria-label="Cancel password change"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={passwordLoading || !isPasswordValid || newPassword !== confirmPassword}
                                                className="flex-1 bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold disabled:opacity-50"
                                                aria-label="Update password"
                                            >
                                                {passwordLoading ? (
                                                    <>
                                                        <SpinnerGap size={20} className="animate-spin mr-2" aria-hidden="true" />
                                                        <span className="sr-only">Updating password...</span>
                                                        Updating...
                                                    </>
                                                ) : (
                                                    'Update Password'
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => !isDeleting && setShowDeleteModal(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-modal-title"
                >
                    <div
                        className="bg-[#0a0a0f] rounded-2xl w-full max-w-md border border-white/10 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                                <Warning size={32} weight="duotone" className="text-red-400" aria-hidden="true" />
                            </div>

                            <h2 id="delete-modal-title" className="text-xl font-bold text-white text-center mb-2">Delete Account?</h2>
                            <p className="text-white/50 text-center mb-6">
                                This action cannot be undone. All your data will be permanently deleted.
                            </p>

                            {/* What will be deleted */}
                            <div className="mb-6 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                                <p className="text-white/70 text-sm font-medium mb-3">The following will be permanently deleted:</p>
                                <ul className="space-y-2 text-white/50 text-sm">
                                    <li className="flex items-start gap-2">
                                        <Trash size={14} className="text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
                                        <span>Your profile and account information</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Trash size={14} className="text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
                                        <span>All bookings (as client and talent)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Trash size={14} className="text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
                                        <span>All messages and conversations</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Trash size={14} className="text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
                                        <span>Your wallet balance and transaction history</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Trash size={14} className="text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
                                        <span>All favorites and saved items</span>
                                    </li>
                                </ul>
                            </div>

                            {deleteError && (
                                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm" role="alert">
                                    {deleteError}
                                </div>
                            )}

                            <div className="mb-4">
                                <label htmlFor="delete-confirmation" className="text-white/60 text-sm mb-2 block">
                                    Type <span className="text-red-400 font-mono">DELETE</span> to confirm
                                </label>
                                <input
                                    id="delete-confirmation"
                                    type="text"
                                    value={deleteConfirmation}
                                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                                    className="w-full bg-white/5 border border-red-500/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                                    placeholder="DELETE"
                                    aria-label="Type DELETE to confirm account deletion"
                                    disabled={isDeleting}
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => {
                                        setShowDeleteModal(false)
                                        setDeleteConfirmation('')
                                        setDeleteError('')
                                    }}
                                    variant="ghost"
                                    className="flex-1 text-white/60 hover:text-white"
                                    disabled={isDeleting}
                                    aria-label="Cancel account deletion"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleDeleteAccount}
                                    disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-50"
                                    aria-label="Permanently delete account"
                                >
                                    {isDeleting ? (
                                        <>
                                            <SpinnerGap size={20} className="animate-spin mr-2" aria-hidden="true" />
                                            <span className="sr-only">Deleting account...</span>
                                            Deleting...
                                        </>
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
