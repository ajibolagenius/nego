'use client'

interface SkeletonLoaderProps {
  variant?: 'card' | 'list' | 'table' | 'text'
  count?: number
  className?: string
}

export function SkeletonLoader({ variant = 'card', count = 1, className = '' }: SkeletonLoaderProps) {
  if (variant === 'card') {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`animate-pulse rounded-2xl bg-white/5 border border-white/10 p-4 sm:p-6 ${className}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
              </div>
              <div className="h-8 bg-white/10 rounded-xl w-20" />
            </div>
          </div>
        ))}
      </>
    )
  }

  if (variant === 'list') {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`animate-pulse flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 ${className}`}
          >
            <div className="w-14 h-14 rounded-xl bg-white/10 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 rounded w-1/3" />
              <div className="h-3 bg-white/10 rounded w-1/4" />
            </div>
            <div className="h-6 bg-white/10 rounded-full w-20" />
          </div>
        ))}
      </>
    )
  }

  if (variant === 'text') {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`space-y-2 ${className}`}>
            <div className="h-4 bg-white/10 rounded w-full animate-pulse" />
            <div className="h-4 bg-white/10 rounded w-5/6 animate-pulse" />
          </div>
        ))}
      </>
    )
  }

  return null
}
