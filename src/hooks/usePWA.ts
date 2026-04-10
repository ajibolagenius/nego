/**
 * PWA Utilities Hook
 *
 * Provides utilities for PWA functionality:
 * - Check if app is installed
 * - Check online/offline status
 * - Service worker update detection
 */

import { useState, useEffect, useCallback } from 'react'

interface UsePWAReturn {
    isInstalled: boolean
    isOnline: boolean
    updateAvailable: boolean
    checkForUpdates: () => Promise<void>
}

export function usePWA(): UsePWAReturn {
    const [isInstalled, setIsInstalled] = useState(false)
    const [isOnline, setIsOnline] = useState(true)
    const [updateAvailable, setUpdateAvailable] = useState(false)

    // Check if app is installed
    useEffect(() => {
        const checkInstalled = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
                document.referrer.includes('android-app://')

            const timer = setTimeout(() => setIsInstalled(isStandalone), 0)
            return () => clearTimeout(timer)
        }

        return checkInstalled()
    }, [])

    // Monitor online/offline status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        const timer = setTimeout(() => setIsOnline(navigator.onLine), 0)
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            clearTimeout(timer)
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    // Listen for service worker updates
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                setUpdateAvailable(true)
            })

            // Check for updates periodically
            const checkUpdates = async () => {
                try {
                    const registration = await navigator.serviceWorker.getRegistration()
                    if (registration) {
                        await registration.update()
                    }
                } catch (error) {
                    console.error('[usePWA] Error checking for updates:', error)
                }
            }

            // Check immediately and then every 5 minutes
            checkUpdates()
            const interval = setInterval(checkUpdates, 5 * 60 * 1000)

            return () => clearInterval(interval)
        }
    }, [])

    // Check for updates manually
    const checkForUpdates = useCallback(async () => {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.getRegistration()
                if (registration) {
                    await registration.update()
                }
            } catch (error) {
                console.error('[usePWA] Error checking for updates:', error)
            }
        }
    }, [])

    return {
        isInstalled,
        isOnline,
        updateAvailable,
        checkForUpdates,
    }
}
