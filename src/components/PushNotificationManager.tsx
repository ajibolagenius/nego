'use client'

import { Bell, BellRinging, BellSlash, Check, X, SpinnerGap } from '@phosphor-icons/react'
import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { urlBase64ToUint8Array } from '@/lib/push/vapid'
import { createClient } from '@/lib/supabase/client'

interface PushNotificationManagerProps {
    userId: string
}

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

export function PushNotificationManager({ userId }: PushNotificationManagerProps) {
    const [permission, setPermission] = useState<PermissionState>('default')
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showPrompt, setShowPrompt] = useState(false)

    useEffect(() => {
        // Check if push notifications are supported
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            setPermission('unsupported')
            return
        }

        setPermission(Notification.permission as PermissionState)

        // Check if already subscribed
        checkSubscription()
    }, [])

    // Handle Escape key to close modal and body scroll lock
    useEffect(() => {
        if (!showPrompt) return

        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden'

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !loading) {
                setShowPrompt(false)
            }
        }

        document.addEventListener('keydown', handleEscape)

        return () => {
            document.body.style.overflow = ''
            document.removeEventListener('keydown', handleEscape)
        }
    }, [showPrompt, loading])

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready
            const subscription = await registration.pushManager.getSubscription()
            setIsSubscribed(!!subscription)
        } catch (error) {
            console.error('[PushNotificationManager] Error checking subscription:', error)
            // Non-critical error, continue without subscription
        }
    }

    const registerServiceWorker = async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js')
            console.log('[PushNotificationManager] Service Worker registered:', registration)
            return registration
        } catch (error) {
            console.error('[PushNotificationManager] Service Worker registration failed:', error)
            // Continue even if service worker fails - browser notifications will still work
            throw new Error('Service Worker registration failed. Browser notifications may still work.')
        }
    }

    const subscribeToNotifications = async () => {
        setLoading(true)
        try {
            // Request permission
            const result = await Notification.requestPermission()
            setPermission(result as PermissionState)

            if (result !== 'granted') {
                throw new Error('Notification permission was denied. Please enable notifications in your browser settings.')
            }

            // Register service worker (required for push notifications)
            const registration = await registerServiceWorker()
            // Wait for service worker to be ready
            if (registration.installing) {
                await new Promise<void>((resolve) => {
                    registration.installing!.addEventListener('statechange', () => {
                        if (registration.installing!.state === 'installed') {
                            resolve()
                        }
                    })
                })
            } else if (registration.waiting) {
                // Already installed, activate it
                await registration.update()
            }

            // Get VAPID public key from server
            const vapidKeyResponse = await fetch('/api/push/vapid-key')
            if (!vapidKeyResponse.ok) {
                // VAPID keys are optional - push notifications won't work without them
                if (vapidKeyResponse.status === 503) {
                    // Service unavailable - VAPID not configured (non-critical)
                    console.info('[PushNotificationManager] Push notifications are not configured. VAPID keys are optional.')
                    throw new Error('Push notifications are not configured. This is an optional feature.')
                }
                throw new Error('Failed to get VAPID key. Push notifications may not be configured.')
            }

            const { publicKey: vapidPublicKey } = await vapidKeyResponse.json()

            if (!vapidPublicKey) {
                throw new Error('VAPID public key not available')
            }

            // Subscribe to push notifications
            const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey as BufferSource,
            })

            // Save subscription to server
            const saveResponse = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription }),
            })

            if (!saveResponse.ok) {
                throw new Error('Failed to save push subscription')
            }

            setIsSubscribed(true)
            setShowPrompt(false)

            // Store preference in database (non-blocking)
            try {
                const supabase = createClient()
                const { error } = await supabase
                    .from('profiles')
                    .update({ push_notifications_enabled: true })
                    .eq('id', userId)

                if (error) {
                    console.warn('[PushNotificationManager] Failed to update database preference:', error)
                    // Continue - notification permission is still granted
                }
            } catch (dbError) {
                console.warn('[PushNotificationManager] Database update failed:', dbError)
                // Continue - notification permission is still granted
            }

            // Show test notification
            try {
                new Notification('Notifications Enabled! 🔔', {
                    body: 'You will now receive notifications from Nego',
                    icon: '/icon-192.png',
                    tag: 'nego-notification-enabled'
                })
            } catch (notifError) {
                console.warn('[PushNotificationManager] Failed to show test notification:', notifError)
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to enable notifications'

            // Handle different error types appropriately
            if (errorMessage.includes('not configured') || errorMessage.includes('optional')) {
                // VAPID keys not configured - this is expected if push notifications aren't set up
                console.info('[PushNotificationManager] Push notifications are not configured. This is an optional feature.')
                setPermission('unsupported')
            } else if (errorMessage.includes('denied')) {
                // Permission denied is handled by the UI state
                console.warn('[PushNotificationManager] Notification permission denied')
                setPermission('denied')
            } else {
                // Other errors - log for debugging
                console.error('[PushNotificationManager] Subscription error:', error)
            }
        } finally {
            setLoading(false)
        }
    }

    const unsubscribe = async () => {
        setLoading(true)
        try {
            let endpoint: string | null = null

            try {
                const registration = await navigator.serviceWorker.ready
                const subscription = await registration.pushManager.getSubscription()

                if (subscription) {
                    endpoint = subscription.endpoint
                    await subscription.unsubscribe()
                }
            } catch (swError) {
                console.warn('[PushNotificationManager] Service Worker unsubscribe failed:', swError)
            }

            // Remove subscription from server
            if (endpoint) {
                try {
                    await fetch('/api/push/unsubscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ endpoint }),
                    })
                } catch (error) {
                    console.warn('[PushNotificationManager] Failed to remove subscription from server:', error)
                }
            }

            setIsSubscribed(false)

            // Update database (non-blocking)
            try {
                const supabase = createClient()
                const { error } = await supabase
                    .from('profiles')
                    .update({ push_notifications_enabled: false })
                    .eq('id', userId)

                if (error) {
                    console.warn('[PushNotificationManager] Failed to update database preference:', error)
                }
            } catch (dbError) {
                console.warn('[PushNotificationManager] Database update failed:', dbError)
            }

        } catch (error) {
            console.error('[PushNotificationManager] Unsubscribe error:', error)
        } finally {
            setLoading(false)
        }
    }

    // Send a local notification (for testing and immediate feedback)
    // Local notification function removed as unused

    if (permission === 'unsupported') {
        return null // Don't show anything if not supported
    }

    if (permission === 'denied') {
        return (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20" role="alert">
                <div className="flex items-center gap-3">
                    <BellSlash size={20} className="text-red-400" aria-hidden="true" />
                    <div>
                        <p className="text-red-400 text-sm font-medium">Notifications Blocked</p>
                        <p className="text-red-400/70 text-xs">
                            Notifications are blocked in your browser. To enable them, go to your browser settings and allow notifications for this site.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    if (isSubscribed) {
        return (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BellRinging size={20} weight="fill" className="text-green-400" />
                        <div>
                            <p className="text-green-400 text-sm font-medium">Notifications Enabled</p>
                            <p className="text-green-400/70 text-xs">
                                You&apos;ll receive updates about gifts, bookings & more
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={unsubscribe}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-lg bg-white/10 text-white/60 text-xs hover:bg-white/20 transition-colors"
                    >
                        {loading ? 'Disabling...' : 'Disable'}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* Enable Prompt */}
            <button
                onClick={() => setShowPrompt(true)}
                className="w-full p-4 rounded-xl bg-[#df2531]/10 border border-[#df2531]/20 hover:bg-[#df2531]/20 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Bell size={20} className="text-[#df2531]" />
                    <div className="text-left flex-1">
                        <p className="text-white text-sm font-medium">Enable Push Notifications</p>
                        <p className="text-white/50 text-xs">
                            Get notified about gifts, bookings, and messages
                        </p>
                    </div>
                </div>
            </button>

            {/* Confirmation Modal */}
            {showPrompt && typeof window !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => !loading && setShowPrompt(false)}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape' && !loading) setShowPrompt(false)
                    }}
                    tabIndex={-1}
                >
                    <div
                        className="bg-[#0a0a0f] rounded-2xl w-full max-w-sm border border-white/10 p-6 relative"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="push-notification-modal-title"
                        aria-describedby="push-notification-modal-description"
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setShowPrompt(false)}
                            disabled={loading}
                            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors disabled:opacity-50"
                            aria-label="Close notification prompt"
                        >
                            <X size={20} aria-hidden="true" />
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-[#df2531]/20 flex items-center justify-center mx-auto mb-4">
                                <BellRinging size={32} weight="fill" className="text-[#df2531]" aria-hidden="true" />
                            </div>
                            <h3 id="push-notification-modal-title" className="text-xl font-bold text-white mb-2">Stay Updated</h3>
                            <p id="push-notification-modal-description" className="text-white/60 text-sm">
                                Enable browser notifications to get instant updates about gifts, booking requests, messages, and other important activities on Nego.
                            </p>
                        </div>

                        <div className="space-y-2 mb-6" role="list">
                            <div className="flex items-center gap-2 text-white/50 text-sm" role="listitem">
                                <Check size={16} className="text-green-400 shrink-0" aria-hidden="true" />
                                <span>New gift received</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/50 text-sm" role="listitem">
                                <Check size={16} className="text-green-400 shrink-0" aria-hidden="true" />
                                <span>Booking requests & updates</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/50 text-sm" role="listitem">
                                <Check size={16} className="text-green-400 shrink-0" aria-hidden="true" />
                                <span>New messages</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowPrompt(false)}
                                disabled={loading}
                                className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors disabled:opacity-50"
                                aria-label="Not now, close prompt"
                            >
                                Not Now
                            </button>
                            <button
                                type="button"
                                onClick={subscribeToNotifications}
                                disabled={loading}
                                className="flex-1 py-3 rounded-xl bg-[#df2531] text-white font-medium hover:bg-[#c41f2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                aria-label="Enable push notifications"
                            >
                                {loading ? (
                                    <>
                                        <SpinnerGap size={18} className="animate-spin" aria-hidden="true" />
                                        <span className="sr-only">Enabling notifications...</span>
                                        Enabling...
                                    </>
                                ) : (
                                    'Enable'
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}

// Hook to trigger notifications from anywhere in the app
export function usePushNotification() {
    const sendNotification = useCallback((title: string, body: string, options?: NotificationOptions) => {
        if (typeof window === 'undefined') return
        if (!('Notification' in window)) return
        if (Notification.permission !== 'granted') return

        new Notification(title, {
            body,
            icon: '/icon-192.png',
            ...options
        })
    }, [])

    return { sendNotification }
}
