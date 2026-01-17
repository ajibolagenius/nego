/**
 * Simple in-memory cache for analytics data
 * In production, consider using Redis or a more robust caching solution
 */

interface CacheEntry<T> {
    data: T
    timestamp: number
    ttl: number // Time to live in milliseconds
}

class SimpleCache {
    private cache: Map<string, CacheEntry<unknown>> = new Map()

    /**
     * Get cached data if it exists and hasn't expired
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key)
        
        if (!entry) {
            return null
        }

        const now = Date.now()
        if (now - entry.timestamp > entry.ttl) {
            // Entry expired
            this.cache.delete(key)
            return null
        }

        return entry.data as T
    }

    /**
     * Set cache entry with TTL
     */
    set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttlMs,
        })
    }

    /**
     * Delete cache entry
     */
    delete(key: string): void {
        this.cache.delete(key)
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear()
    }

    /**
     * Clear expired entries
     */
    cleanup(): void {
        const now = Date.now()
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key)
            }
        }
    }
}

// Singleton instance
export const cache = new SimpleCache()

// Cleanup expired entries every 5 minutes
if (typeof window === 'undefined') {
    // Server-side only
    setInterval(() => {
        cache.cleanup()
    }, 5 * 60 * 1000)
}

/**
 * Cache keys for analytics data
 */
export const CACHE_KEYS = {
    ANALYTICS_STATS: 'analytics:stats',
    ANALYTICS_USER_GROWTH: 'analytics:user-growth',
    ANALYTICS_BOOKING_TRENDS: 'analytics:booking-trends',
    ANALYTICS_REVENUE: 'analytics:revenue',
} as const
