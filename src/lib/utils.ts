import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names with Tailwind merge support.
 * Handles conditional classes and resolves Tailwind conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as Nigerian Naira currency.
 * @example formatPrice(5000) => "₦5,000"
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Formats a number with thousands separators.
 * @example formatCoins(1500) => "1,500"
 */
export function formatCoins(coins: number): string {
  return new Intl.NumberFormat('en-NG').format(coins)
}

/**
 * Formats a date string to a localized date format.
 * @example formatDate('2024-01-15') => "Jan 15, 2024"
 */
export function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  })
}

/**
 * Formats a date as relative time (e.g., "2 hours ago", "3 days ago").
 * Falls back to formatted date for times older than 7 days.
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`
  }

  return formatDate(dateString)
}

/**
 * Formats large numbers in a compact format.
 * @example formatCompactNumber(1500) => "1.5K"
 */
export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat('en', { notation: 'compact' }).format(num)
}

/**
 * Truncates text to a specified length with ellipsis.
 * @example truncateText('Hello World', 5) => "Hello..."
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * Creates a debounced version of a function.
 * Useful for search inputs, resize handlers, etc.
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), wait)
  }
}

/**
 * Delays execution for a specified time.
 * Useful for testing loading states or animations.
 * @example await sleep(1000) // waits 1 second
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Checks if a value is a valid non-empty string.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
