'use client'

import { useEffect, useRef } from 'react'

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

                // Check for updates periodically (every hour)
                setInterval(async () => {
                    try {
                        await registration.update()
                    } catch (error) {
                        console.error('[ServiceWorker] Error checking for updates:', error)
                    }
                }, 60 * 60 * 1000) // 1 hour

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
