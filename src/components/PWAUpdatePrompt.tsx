'use client'

import { ArrowClockwise, X } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { usePWA } from '@/hooks/usePWA'

export function PWAUpdatePrompt() {
    const { updateAvailable, checkForUpdates } = usePWA()
    const [showPrompt, setShowPrompt] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)

    useEffect(() => {
        if (updateAvailable) {
            setShowPrompt(true)
        }
    }, [updateAvailable])

    // Listen for service worker update events
    useEffect(() => {
        const handleUpdateAvailable = () => {
            setShowPrompt(true)
        }

        window.addEventListener('sw-update-available', handleUpdateAvailable)

        return () => {
            window.removeEventListener('sw-update-available', handleUpdateAvailable)
        }
    }, [])

    const handleUpdate = async () => {
        setIsUpdating(true)

        // Send message to service worker to skip waiting
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration()
            if (registration?.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' })
            }
        }

        // Reload the page to activate the new service worker
        window.location.reload()
    }

    const handleDismiss = () => {
        setShowPrompt(false)
        // Check again in 1 hour
        setTimeout(() => {
            checkForUpdates()
        }, 60 * 60 * 1000)
    }

    if (!showPrompt || !updateAvailable) {
        return null
    }

    return (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-fade-in-up">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-full bg-[#df2531]/10 flex items-center justify-center shrink-0">
                        <ArrowClockwise size={24} weight="duotone" className="text-[#df2531]" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-lg mb-1">Update Available</h3>
                        <p className="text-white/60 text-sm mb-4">
                            A new version of Nego is available. Update now to get the latest features and improvements.
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={handleUpdate}
                                disabled={isUpdating}
                                className="bg-[#df2531] hover:bg-[#c41f2a] text-white font-medium px-6 py-2.5 rounded-full text-sm transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50"
                            >
                                <span className="flex items-center gap-2">
                                    <ArrowClockwise size={16} weight="bold" className={isUpdating ? 'animate-spin' : ''} />
                                    <span>{isUpdating ? 'Updating...' : 'Update Now'}</span>
                                </span>
                            </Button>
                            <button
                                onClick={handleDismiss}
                                className="text-white/40 hover:text-white/60 text-sm transition-colors"
                            >
                                Later
                            </button>
                        </div>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
                        className="text-white/40 hover:text-white transition-colors shrink-0"
                        aria-label="Dismiss update prompt"
                    >
                        <X size={20} weight="bold" />
                    </button>
                </div>
            </div>
        </div>
    )
}
