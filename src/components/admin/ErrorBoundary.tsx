'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { Warning, ArrowClockwise, House } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0a]">
          <div className="max-w-2xl w-full p-6 sm:p-8 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Warning size={24} className="text-red-400" weight="duotone" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Something went wrong</h1>
                <p className="text-white/60 text-sm">An unexpected error occurred</p>
              </div>
            </div>

            {this.state.error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                <p className="text-red-400 font-medium text-sm mb-2">Error Details:</p>
                <p className="text-white/80 text-sm font-mono break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-3">
                    <summary className="text-white/60 text-xs cursor-pointer hover:text-white/80">
                      Stack Trace
                    </summary>
                    <pre className="mt-2 text-xs text-white/60 overflow-auto max-h-48 p-2 rounded bg-black/20">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={this.handleReset}
                className="flex-1 bg-[#df2531] hover:bg-[#df2531]/90 text-white"
              >
                <ArrowClockwise size={18} className="mr-2" />
                Try Again
              </Button>
              <Button
                onClick={() => window.location.href = '/admin'}
                variant="outline"
                className="flex-1 border-white/10 text-white hover:bg-white/5"
              >
                <House size={18} className="mr-2" />
                Go to Dashboard
              </Button>
            </div>

            <p className="mt-4 text-white/40 text-xs text-center">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
