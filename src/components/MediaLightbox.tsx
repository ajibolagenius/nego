'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { X } from '@phosphor-icons/react'
import type { Media } from '@/types/database'

interface MediaLightboxProps {
    media: Media | null
    onClose: () => void
    onNext?: () => void
    onPrevious?: () => void
    hasNext?: boolean
    hasPrevious?: boolean
}

export function MediaLightbox({
    media,
    onClose,
    onNext,
    onPrevious,
    hasNext = false,
    hasPrevious = false
}: MediaLightboxProps) {
    const isVideo = (url: string) => {
        return url.match(/\.(mp4|webm|ogg|mov)$/i) !== null
    }

    // Handle Escape key to close
    useEffect(() => {
        if (!media) return

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        // Handle arrow keys for navigation
        const handleArrowKeys = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' && hasPrevious && onPrevious) {
                onPrevious()
            } else if (e.key === 'ArrowRight' && hasNext && onNext) {
                onNext()
            }
        }

        document.addEventListener('keydown', handleEscape)
        document.addEventListener('keydown', handleArrowKeys)

        // Lock body scroll
        document.body.style.overflow = 'hidden'

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.removeEventListener('keydown', handleArrowKeys)
            document.body.style.overflow = ''
        }
    }, [media, onClose, onNext, onPrevious, hasNext, hasPrevious])

    if (!media) return null

    return (
        <div
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lightbox-title"
        >
            {/* Close button */}
            <button
                className="absolute top-4 right-4 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 z-[10000] transition-all duration-200"
                onClick={onClose}
                aria-label="Close lightbox"
            >
                <X size={32} weight="duotone" aria-hidden="true" />
            </button>

            {/* Navigation buttons */}
            {hasPrevious && onPrevious && (
                <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full text-white/70 hover:text-white hover:bg-white/10 z-[10000] transition-all duration-200"
                    onClick={(e) => {
                        e.stopPropagation()
                        onPrevious()
                    }}
                    aria-label="Previous media"
                >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            )}

            {hasNext && onNext && (
                <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full text-white/70 hover:text-white hover:bg-white/10 z-[10000] transition-all duration-200"
                    onClick={(e) => {
                        e.stopPropagation()
                        onNext()
                    }}
                    aria-label="Next media"
                >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            )}

            {/* Media content */}
            <div
                className="relative max-w-7xl max-h-[90vh] w-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                {isVideo(media.url) ? (
                    <video
                        src={media.url}
                        className="w-full h-auto max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        controls
                        autoPlay
                        playsInline
                        aria-label="Video media"
                    />
                ) : (
                    <Image
                        src={media.url}
                        alt="Gallery full view"
                        width={1920}
                        height={1080}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
                        className="w-full h-auto max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        priority
                    />
                )}
            </div>

            {/* Keyboard hint (optional, can be removed) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs text-center pointer-events-none">
                <p>Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">ESC</kbd> to close</p>
                {(hasNext || hasPrevious) && (
                    <p className="mt-1">
                        Use <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">←</kbd> <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">→</kbd> to navigate
                    </p>
                )}
            </div>
        </div>
    )
}
