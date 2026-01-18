/**
 * PWA Utilities Hook
 *
 * Provides utilities for PWA functionality:
 * - Check if app is installed
 * - Check online/offline status
 * - Service worker update detection
 * - Install prompt handling
 */

import { useState, useEffect, useCallback } from 'react'

interface UsePWAReturn {
    isInstalled: boolean
    isOnline: boolean
    updateAvailable: boolean
    installPrompt: BeforeInstallPromptEvent | null
    canInstall: boolean
    checkForUpdates: () => Promise<void>
    promptInstall: () => Promise<boolean>
}

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePWA(): UsePWAReturn {
    const [isInstalled, setIsInstalled] = useState(false)
    const [isOnline, setIsOnline] = useState(true)
    const [updateAvailable, setUpdateAvailable] = useState(false)
    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)

    // Check if app is installed
    useEffect(() => {
        const checkInstalled = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true ||
                document.referrer.includes('android-app://')

            setIsInstalled(isStandalone)
        }

        checkInstalled()
    }, [])

    // Monitor online/offline status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        setIsOnline(navigator.onLine)
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    // Listen for install prompt
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault()
            setInstallPrompt(e as BeforeInstallPromptEvent)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
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

    // Prompt user to install
    const promptInstall = useCallback(async (): Promise<boolean> => {
        if (!installPrompt) {
            return false
        }

        try {
            installPrompt.prompt()
            const { outcome } = await installPrompt.userChoice

            if (outcome === 'accepted') {
                setIsInstalled(true)
                setInstallPrompt(null)
                return true
            }

            return false
        } catch (error) {
            console.error('[usePWA] Error prompting install:', error)
            return false
        }
    }, [installPrompt])

    return {
        isInstalled,
        isOnline,
        updateAvailable,
        installPrompt,
        canInstall: !!installPrompt && !isInstalled,
        checkForUpdates,
        promptInstall,
    }
}
