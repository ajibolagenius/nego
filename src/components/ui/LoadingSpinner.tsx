'use client'

import { SpinnerGap } from '@phosphor-icons/react'

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg'
    text?: string
    fullScreen?: boolean
}

const sizeConfig = {
    sm: 20,
    md: 32,
    lg: 48,
}

export function LoadingSpinner({ size = 'md', text, fullScreen = false }: LoadingSpinnerProps) {
    const spinner = (
        <div className={`flex flex-col items-center justify-center gap-3 ${fullScreen ? 'min-h-screen' : 'py-12'}`}>
            <SpinnerGap
                size={sizeConfig[size]}
                className="text-[#df2531] animate-spin"
                aria-hidden="true"
            />
            {text && (
                <p className="text-white/60 text-sm">{text}</p>
            )}
            <span className="sr-only">Loading...</span>
        </div>
    )

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                {spinner}
            </div>
        )
    }

    return spinner
}
