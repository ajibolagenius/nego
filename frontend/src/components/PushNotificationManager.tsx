'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, BellRinging, BellSlash, Check, X } from '@phosphor-icons/react'
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

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered:', registration)
      return registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      throw error
    }
  }

  const subscribeToNotifications = async () => {
    setLoading(true)
    try {
      // Request permission
      const result = await Notification.requestPermission()
      setPermission(result as PermissionState)
      
      if (result !== 'granted') {
        throw new Error('Permission denied')
      }

      // Register service worker
      const registration = await registerServiceWorker()
      await navigator.serviceWorker.ready

      // Subscribe to push (using VAPID - would need server setup)
      // For now, we'll use browser notifications
      setIsSubscribed(true)
      setShowPrompt(false)

      // Store preference in database
      const supabase = createClient()
      await supabase
        .from('profiles')
        .update({ push_notifications_enabled: true })
        .eq('id', userId)

      // Show test notification
      new Notification('Notifications Enabled! 🔔', {
        body: 'You will now receive notifications from Nego',
        icon: '/icon-192.png'
      })

    } catch (error) {
      console.error('Subscription error:', error)
    } finally {
      setLoading(false)
    }
  }

  const unsubscribe = async () => {
    setLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        await subscription.unsubscribe()
      }
      
      setIsSubscribed(false)

      // Update database
      const supabase = createClient()
      await supabase
        .from('profiles')
        .update({ push_notifications_enabled: false })
        .eq('id', userId)

    } catch (error) {
      console.error('Unsubscribe error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Send a local notification (for testing and immediate feedback)
  const sendLocalNotification = useCallback((title: string, body: string, data?: Record<string, unknown>) => {
    if (permission !== 'granted') return

    new Notification(title, {
      body,
      icon: '/icon-192.png',
      tag: 'nego-notification',
      data
    })
  }, [permission])

  if (permission === 'unsupported') {
    return null // Don't show anything if not supported
  }

  if (permission === 'denied') {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
        <div className="flex items-center gap-3">
          <BellSlash size={20} className="text-red-400" />
          <div>
            <p className="text-red-400 text-sm font-medium">Notifications Blocked</p>
            <p className="text-red-400/70 text-xs">
              Enable notifications in your browser settings
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
      {showPrompt && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowPrompt(false)}
        >
          <div 
            className="bg-[#0a0a0f] rounded-2xl w-full max-w-sm border border-white/10 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#df2531]/20 flex items-center justify-center mx-auto mb-4">
                <BellRinging size={32} weight="fill" className="text-[#df2531]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Stay Updated</h3>
              <p className="text-white/60 text-sm">
                Enable notifications to get instant updates about gifts, booking requests, and messages.
              </p>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <Check size={16} className="text-green-400" />
                <span>New gift received</span>
              </div>
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <Check size={16} className="text-green-400" />
                <span>Booking requests & updates</span>
              </div>
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <Check size={16} className="text-green-400" />
                <span>New messages</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPrompt(false)}
                className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
              >
                Not Now
              </button>
              <button
                onClick={subscribeToNotifications}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-[#df2531] text-white font-medium hover:bg-[#c41f2a] transition-colors disabled:opacity-50"
              >
                {loading ? 'Enabling...' : 'Enable'}
              </button>
            </div>
          </div>
        </div>
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
