'use client'

import { useEffect, useRef } from 'react'
import { requestServiceWorkerPushSync, syncPushSubscription } from '@/lib/push/sync'

/**
 * Component to register service worker on app load
 * This should be included in the root layout
 */
export function ServiceWorkerRegistration() {
    const registrationRef = useRef<ServiceWorkerRegistration | null>(null)

    useEffect(() => {
        if (typeof window === 'undefined') return

        // Check if service workers are supported
        if (!('serviceWorker' in navigator)) {
            console.log('[ServiceWorker] Service workers are not supported')
            return
        }

        // Register service worker
        const registerServiceWorker = async () => {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/',
                    updateViaCache: 'none', // Always check for updates
                })

                registrationRef.current = registration
                console.log('[ServiceWorker] Registered successfully:', registration.scope)

                // Repair a push subscription the server can no longer send to.
                // Runs on every load because a subscription can be invalidated
                // while the app is closed, and nothing else would notice: the
                // browser keeps reporting an active subscription, so the user
                // sees "Notifications Enabled" and receives nothing. No-ops
                // unless permission is already granted.
                syncPushSubscription()
                    .then((result) => {
                        if (result.reason !== 'already-registered' && result.reason !== 'permission-default') {
                            console.log('[ServiceWorker] Push reconcile:', result.reason)
                        }
                    })
                    .catch(() => { /* best-effort */ })

                requestServiceWorkerPushSync()

                // Handle service worker updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed') {
                                if (navigator.serviceWorker.controller) {
                                    // New service worker available - will be activated on next page load
                                    console.log('[ServiceWorker] New service worker available, will activate on next page load')
                                    // Dispatch custom event for update prompt
                                    window.dispatchEvent(new CustomEvent('sw-update-available'))
                                } else {
                                    // First time installation
                                    console.log('[ServiceWorker] Service worker installed for the first time')
                                }
                            }
                        })
                    }
                })

                // Check for a new worker straight away, not only after the first
                // hour has elapsed. Without this, an install that already has an
                // old service worker keeps running it for up to an hour after a
                // deploy — which for a notification fix means users stay broken
                // long after it shipped.
                const checkForUpdate = async () => {
                    try {
                        await registration.update()
                    } catch (error) {
                        console.error('[ServiceWorker] Error checking for updates:', error)
                    }
                }

                checkForUpdate()

                // Every 30 minutes while the tab is open...
                setInterval(checkForUpdate, 30 * 60 * 1000)

                // ...and whenever the user comes back to the app, which is what
                // actually catches installed PWAs that are rarely reloaded.
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible') {
                        checkForUpdate()
                    }
                })

                // Handle service worker controller change (update activated)
                let refreshing = false
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    if (!refreshing) {
                        refreshing = true
                        console.log('[ServiceWorker] New service worker activated')
                        // Only auto-reload if user hasn't dismissed the update prompt
                        const updateDismissed = sessionStorage.getItem('sw-update-dismissed')
                        if (!updateDismissed) {
                            window.location.reload()
                        }
                    }
                })

                // Listen for messages from service worker
                navigator.serviceWorker.addEventListener('message', (event) => {
                    console.log('[ServiceWorker] Message from service worker:', event.data)
                    if (event.data && event.data.type === 'SW_UPDATED') {
                        window.dispatchEvent(new CustomEvent('sw-update-available'))
                    }
                })
            } catch (error) {
                console.error('[ServiceWorker] Registration failed:', error)
            }
        }

        // Register on page load
        if (document.readyState === 'complete') {
            registerServiceWorker()
        } else {
            window.addEventListener('load', registerServiceWorker)
        }
    }, [])

    return null
}
