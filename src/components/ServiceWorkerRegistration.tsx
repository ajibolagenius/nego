'use client'

import { useEffect } from 'react'

/**
 * Component to register service worker on app load
 * This should be included in the root layout
 */
export function ServiceWorkerRegistration() {
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
                })

                console.log('[ServiceWorker] Registered successfully:', registration.scope)

                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New service worker available
                                console.log('[ServiceWorker] New service worker available')
                            }
                        })
                    }
                })

                // Handle service worker updates
                let refreshing = false
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    if (!refreshing) {
                        refreshing = true
                        console.log('[ServiceWorker] New service worker activated, reloading...')
                        window.location.reload()
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
