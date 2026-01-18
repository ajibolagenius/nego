'use client'

import { useEffect, useState } from 'react'
import { X, Download, DeviceMobile } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [showPrompt, setShowPrompt] = useState(false)
    const [isInstalled, setIsInstalled] = useState(false)

    useEffect(() => {
        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true) {
            setIsInstalled(true)
            return
        }

        // Check if prompt was previously dismissed
        const dismissed = localStorage.getItem('pwa-install-dismissed')
        if (dismissed) {
            const dismissedTime = parseInt(dismissed, 10)
            const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
            // Show again after 7 days
            if (daysSinceDismissed < 7) {
                return
            }
        }

        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e as BeforeInstallPromptEvent)
            setShowPrompt(true)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        }
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return

        // Show the install prompt
        deferredPrompt.prompt()

        // Wait for user response
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            console.log('[PWA] User accepted the install prompt')
            setShowPrompt(false)
            setIsInstalled(true)
        } else {
            console.log('[PWA] User dismissed the install prompt')
            // Store dismissal timestamp
            localStorage.setItem('pwa-install-dismissed', Date.now().toString())
            setShowPrompt(false)
        }

        setDeferredPrompt(null)
    }

    const handleDismiss = () => {
        localStorage.setItem('pwa-install-dismissed', Date.now().toString())
        setShowPrompt(false)
    }

    if (isInstalled || !showPrompt || !deferredPrompt) {
        return null
    }

    return (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-fade-in-up">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-full bg-[#df2531]/10 flex items-center justify-center shrink-0">
                        <DeviceMobile size={24} weight="duotone" className="text-[#df2531]" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-lg mb-1">Install Nego App</h3>
                        <p className="text-white/60 text-sm mb-4">
                            Install our app for a better experience with offline access and faster loading.
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={handleInstall}
                                className="bg-[#df2531] hover:bg-[#c41f2a] text-white font-medium px-6 py-2.5 rounded-full text-sm transition-all duration-300 hover:scale-105 active:scale-95"
                            >
                                <span className="flex items-center gap-2">
                                    <Download size={16} weight="bold" />
                                    <span>Install</span>
                                </span>
                            </Button>
                            <button
                                onClick={handleDismiss}
                                className="text-white/40 hover:text-white/60 text-sm transition-colors"
                                aria-label="Dismiss install prompt"
                            >
                                Maybe later
                            </button>
                        </div>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
                        className="text-white/40 hover:text-white transition-colors shrink-0"
                        aria-label="Close install prompt"
                    >
                        <X size={20} weight="bold" />
                    </button>
                </div>
            </div>
        </div>
    )
}
