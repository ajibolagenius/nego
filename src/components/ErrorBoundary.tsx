'use client'

import { Warning, ArrowClockwise } from '@phosphor-icons/react'
import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
    children: ReactNode
    /** Optional fallback component to render on error */
    fallback?: ReactNode
    /** Component name for error logging */
    componentName?: string
    /** Callback when error occurs */
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

/**
 * Reusable Error Boundary component for catching and handling React errors.
 * Prevents entire app from crashing when a component fails.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary componentName="GallerySection">
 *   <GallerySection {...props} />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console in development
        console.error(`[ErrorBoundary${this.props.componentName ? `: ${this.props.componentName}` : ''}]`, error, errorInfo)

        // Call optional error callback
        this.props.onError?.(error, errorInfo)
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (this.state.hasError) {
            // Custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback
            }

            // Default error UI
            return (
                <div className="flex flex-col items-center justify-center min-h-[200px] p-6 rounded-lg bg-white/5 border border-white/10">
                    <Warning size={48} className="text-yellow-500 mb-4" weight="duotone" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                        Something went wrong
                    </h3>
                    <p className="text-white/60 text-sm text-center mb-4 max-w-md">
                        {this.props.componentName
                            ? `There was an error loading ${this.props.componentName}.`
                            : 'There was an error loading this section.'
                        }
                    </p>
                    <Button
                        onClick={this.handleRetry}
                        variant="outline"
                        className="gap-2"
                    >
                        <ArrowClockwise size={18} />
                        Try Again
                    </Button>
                </div>
            )
        }

        return this.props.children
    }
}

/**
 * Compact error fallback for smaller sections
 */
export function CompactErrorFallback({
    message = 'Failed to load',
    onRetry
}: {
    message?: string
    onRetry?: () => void
}) {
    return (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <Warning size={20} className="text-yellow-500 flex-shrink-0" />
            <span className="text-sm text-white/80">{message}</span>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="ml-auto text-sm text-primary hover:underline"
                >
                    Retry
                </button>
            )}
        </div>
    )
}
