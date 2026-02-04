'use client'

import { Warning, ArrowClockwise, House } from '@phosphor-icons/react'
import Link from 'next/link'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface ErrorProps {
    error: Error & { digest?: string }
    reset: () => void
}

/**
 * App-level error boundary for catching unhandled errors in routes.
 * This file handles errors for the entire app when placed in src/app/error.tsx
 */
export default function Error({ error, reset }: ErrorProps) {
    useEffect(() => {
        // Log error to console (in production, send to error tracking service)
        console.error('[App Error]', error)
    }, [error])

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center">
                {/* Icon */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <Warning size={40} className="text-yellow-500" weight="duotone" />
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-white mb-3">
                    Something went wrong
                </h1>

                {/* Description */}
                <p className="text-white/60 mb-6">
                    We encountered an unexpected error. Please try again or return to the homepage.
                </p>

                {/* Error digest for debugging (only shown in development) */}
                {process.env.NODE_ENV === 'development' && error.digest && (
                    <p className="text-xs text-white/40 mb-6 font-mono bg-white/5 p-2 rounded">
                        Error ID: {error.digest}
                    </p>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        onClick={reset}
                        className="gap-2"
                    >
                        <ArrowClockwise size={18} />
                        Try Again
                    </Button>
                    <Button asChild variant="outline" className="gap-2">
                        <Link href="/">
                            <House size={18} />
                            Go Home
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
