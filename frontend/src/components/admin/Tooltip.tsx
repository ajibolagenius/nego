'use client'

import { useState, useRef, useEffect } from 'react'

interface TooltipProps {
    content: string
    children: React.ReactNode
    position?: 'top' | 'bottom' | 'left' | 'right'
    delay?: number
}

export function Tooltip({ content, children, position = 'top', delay = 200 }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
    const triggerRef = useRef<HTMLDivElement>(null)
    const tooltipRef = useRef<HTMLDivElement>(null)
    const timeoutRef = useRef<NodeJS.Timeout>()

    const showTooltip = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
            if (triggerRef.current && tooltipRef.current) {
                const triggerRect = triggerRef.current.getBoundingClientRect()
                const tooltipRect = tooltipRef.current.getBoundingClientRect()

                let top = 0
                let left = 0

                switch (position) {
                    case 'top':
                        top = triggerRect.top - tooltipRect.height - 8
                        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2)
                        break
                    case 'bottom':
                        top = triggerRect.bottom + 8
                        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2)
                        break
                    case 'left':
                        top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2)
                        left = triggerRect.left - tooltipRect.width - 8
                        break
                    case 'right':
                        top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2)
                        left = triggerRect.right + 8
                        break
                }

                // Keep tooltip within viewport
                const padding = 8
                if (top < padding) top = padding
                if (left < padding) left = padding
                if (top + tooltipRect.height > window.innerHeight - padding) {
                    top = window.innerHeight - tooltipRect.height - padding
                }
                if (left + tooltipRect.width > window.innerWidth - padding) {
                    left = window.innerWidth - tooltipRect.width - padding
                }

                setTooltipPosition({ top, left })
                setIsVisible(true)
            }
        }, delay)
    }

    const hideTooltip = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        setIsVisible(false)
    }

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={showTooltip}
                onMouseLeave={hideTooltip}
                onFocus={showTooltip}
                onBlur={hideTooltip}
                className="inline-block"
            >
                {children}
            </div>
            {isVisible && (
                <div
                    ref={tooltipRef}
                    className="fixed z-[100] px-3 py-2 bg-black/95 backdrop-blur-sm border border-white/20 rounded-lg text-xs text-white pointer-events-none shadow-lg"
                    style={{
                        top: `${tooltipPosition.top}px`,
                        left: `${tooltipPosition.left}px`,
                    }}
                    role="tooltip"
                >
                    {content}
                    <div
                        className={`absolute w-2 h-2 bg-black/95 border border-white/20 rotate-45 ${position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-0 border-r-0' :
                                position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2 border-b-0 border-l-0' :
                                    position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2 border-l-0 border-b-0' :
                                        'left-[-4px] top-1/2 -translate-y-1/2 border-r-0 border-t-0'
                            }`}
                    />
                </div>
            )}
        </>
    )
}
