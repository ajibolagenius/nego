'use client'

import { useEffect, useRef } from 'react'
import { syncPushSubscription } from '@/lib/push/sync'

const UPDATE_CHECK_COOLDOWN_MS = 60 * 60 * 1000 // 1 hour

/**
 * Component to register service worker on app load
 * This should be included in the root layout
 */
export function ServiceWorkerRegistration() {
    const registrationRef = useRef<ServiceWorkerRegistration | null>(null)

    useEffect(() => {
        if (typeof window === 'undefined') return
        if (!('serviceWorker' in navigator)) return

        let updateInterval: ReturnType<typeof setInterval> | null = null
        let lastUpdateCheckAt = 0
        let disposed = false

        const checkForUpdate = async () => {
            const registration = registrationRef.current
            if (!registration) return
            const now = Date.now()
            if (now - lastUpdateCheckAt < UPDATE_CHECK_COOLDOWN_MS) return
            lastUpdateCheckAt = now

            try {
                await registration.update()
            } catch (error) {
                console.error('[ServiceWorker] Error checking for updates:', error)
            }
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                void checkForUpdate()
            }
        }

        let refreshing = false
        const handleControllerChange = () => {
            if (!refreshing) {
                refreshing = true
                console.log('[ServiceWorker] New service worker activated')
                const updateDismissed = sessionStorage.getItem('sw-update-dismissed')
                if (!updateDismissed) {
                    window.location.reload()
                }
            }
        }

        const handleSwMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'SW_UPDATED') {
                window.dispatchEvent(new CustomEvent('sw-update-available'))
            }
        }

        const registerServiceWorker = async () => {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/',
                    updateViaCache: 'none',
                })

                if (disposed) return
                registrationRef.current = registration
                console.log('[ServiceWorker] Registered successfully:', registration.scope)

                // Reconcile push subscription (throttled per user+endpoint for 12h,
                // and skipped entirely for unauthenticated visitors).
                syncPushSubscription()
                    .then((result) => {
                        if (
                            result.reason !== 'already-registered' &&
                            result.reason !== 'permission-default' &&
                            result.reason !== 'unauthenticated'
                        ) {
                            console.log('[ServiceWorker] Push reconcile:', result.reason)
                        }
                    })
                    .catch(() => { /* best-effort */ })

                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                window.dispatchEvent(new CustomEvent('sw-update-available'))
                            }
                        })
                    }
                })

                // Mark initial registration check timestamp so focus/interval checks
                // don't immediately re-fetch /sw.js.
                lastUpdateCheckAt = Date.now()
                updateInterval = setInterval(() => {
                    void checkForUpdate()
                }, UPDATE_CHECK_COOLDOWN_MS)

                document.addEventListener('visibilitychange', handleVisibilityChange)
                navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
                navigator.serviceWorker.addEventListener('message', handleSwMessage)
            } catch (error) {
                console.error('[ServiceWorker] Registration failed:', error)
            }
        }

        const handleLoad = () => {
            void registerServiceWorker()
        }

        if (document.readyState === 'complete') {
            void registerServiceWorker()
        } else {
            window.addEventListener('load', handleLoad)
        }

        return () => {
            disposed = true
            window.removeEventListener('load', handleLoad)
            if (updateInterval) clearInterval(updateInterval)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
            navigator.serviceWorker.removeEventListener('message', handleSwMessage)
        }
    }, [])

    return null
}
