'use client'

import { useEffect, useState } from 'react'
import { WifiHigh, WifiSlash } from '@phosphor-icons/react'
import { usePWA } from '@/hooks/usePWA'

export function NetworkStatus() {
    const { isOnline } = usePWA()
    const [show, setShow] = useState(false)

    useEffect(() => {
        if (!isOnline) {
            setShow(true)
        } else {
            // Hide after a brief delay when back online
            const timer = setTimeout(() => setShow(false), 2000)
            return () => clearTimeout(timer)
        }
    }, [isOnline])

    if (!show) {
        return null
    }

    return (
        <div className={`fixed top-16 left-0 right-0 z-50 transition-all duration-300 ${show ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
            <div className={`mx-4 mt-2 p-3 rounded-xl backdrop-blur-xl border flex items-center gap-3 ${isOnline
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                {isOnline ? (
                    <>
                        <WifiHigh size={20} weight="bold" />
                        <span className="text-sm font-medium">Connection restored</span>
                    </>
                ) : (
                    <>
                        <WifiSlash size={20} weight="bold" />
                        <span className="text-sm font-medium">You're offline. Some features may be limited.</span>
                    </>
                )}
            </div>
        </div>
    )
}
