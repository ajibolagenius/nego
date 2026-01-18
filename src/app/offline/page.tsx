'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { WifiSlash, ArrowClockwise, House, CloudArrowUp } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
    const [isOnline, setIsOnline] = useState(false)
    const [isChecking, setIsChecking] = useState(false)

    useEffect(() => {
        // Check online status
        const checkOnline = () => {
            setIsOnline(navigator.onLine)
        }

        checkOnline()
        window.addEventListener('online', checkOnline)
        window.addEventListener('offline', checkOnline)

        return () => {
            window.removeEventListener('online', checkOnline)
            window.removeEventListener('offline', checkOnline)
        }
    }, [])

    const handleRetry = () => {
        setIsChecking(true)
        // Try to reload the page
        setTimeout(() => {
            window.location.reload()
        }, 500)
    }

    // Auto-redirect when back online
    useEffect(() => {
        if (isOnline) {
            const timer = setTimeout(() => {
                window.location.href = '/dashboard'
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [isOnline])

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#df2531]/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#df2531]/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-md mx-auto text-center">
                {/* Icon */}
                <div className="mb-8 flex justify-center">
                    <div className="w-24 h-24 rounded-full bg-[#df2531]/10 flex items-center justify-center">
                        <WifiSlash size={48} weight="duotone" className="text-[#df2531]" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                    You're <span className="text-[#df2531]">Offline</span>
                </h1>

                {/* Description */}
                <p className="text-white/60 text-lg mb-8 leading-relaxed">
                    {isOnline
                        ? 'Connection restored! Redirecting...'
                        : 'It looks like you\'ve lost your internet connection. Please check your network settings and try again.'
                    }
                </p>

                {/* Status indicator */}
                <div className="mb-8 flex items-center justify-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                    <span className="text-white/40 text-sm">
                        {isOnline ? 'Online' : 'Offline'}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                        onClick={handleRetry}
                        disabled={isChecking || isOnline}
                        className="bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold px-8 py-6 rounded-full text-base transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                        <span className="flex items-center gap-3">
                            <ArrowClockwise size={20} weight="bold" className={isChecking ? 'animate-spin' : ''} />
                            <span>{isChecking ? 'Checking...' : 'Retry Connection'}</span>
                        </span>
                    </Button>

                    <Link href="/dashboard">
                        <Button
                            variant="outline"
                            className="bg-white/5 hover:bg-white/10 text-white font-medium px-8 py-6 rounded-full text-base border-2 border-white/20 hover:border-white/40 transition-all duration-300"
                        >
                            <span className="flex items-center gap-3">
                                <House size={20} weight="bold" />
                                <span>Go to Dashboard</span>
                            </span>
                        </Button>
                    </Link>
                </div>

                {/* Helpful info */}
                <div className="mt-12 pt-8 border-t border-white/10">
                    <p className="text-white/40 text-sm mb-4">While offline, you can still:</p>
                    <ul className="text-white/50 text-sm space-y-2 text-left max-w-xs mx-auto">
                        <li className="flex items-start gap-2">
                            <CloudArrowUp size={16} className="text-[#df2531] mt-0.5 shrink-0" />
                            <span>View cached pages and content</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CloudArrowUp size={16} className="text-[#df2531] mt-0.5 shrink-0" />
                            <span>Access previously loaded data</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CloudArrowUp size={16} className="text-[#df2531] mt-0.5 shrink-0" />
                            <span>Browse your saved favorites</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
