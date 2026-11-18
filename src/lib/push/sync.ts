'use client'

import { getBrowserAuthState } from '@/lib/supabase/client-session'
import { urlBase64ToUint8Array } from './vapid'

/**
 * Client-side reconciliation between the browser's push subscription and the
 * server's record of it.
 *
 * Throttled per (userId, endpoint) in localStorage and deduplicated in memory
 * so navigating across pages or loading multiple push-aware components does
 * not hammer /api/push/status or /api/push/subscribe.
 */

export interface PushSyncResult {
    ok: boolean
    /** Machine-readable outcome, for logging and for the Settings UI. */
    reason:
    | 'synced'
    | 'already-registered'
    | 'unsupported'
    | 'permission-default'
    | 'permission-denied'
    | 'unauthenticated'
    | 'not-configured'
    | 'error'
    endpoint?: string
}

const PUSH_SYNC_CACHE_KEY = 'nego_push_sync_v1'
const PUSH_SYNC_TTL_MS = 12 * 60 * 60 * 1000 // 12 hours

interface CachedPushSync {
    userId: string
    endpoint: string
    verifiedAt: number
}

let inFlightSync: Promise<PushSyncResult> | null = null

function readPushSyncCache(): CachedPushSync | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = window.localStorage.getItem(PUSH_SYNC_CACHE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw) as Partial<CachedPushSync>
        if (!parsed.userId || !parsed.endpoint || typeof parsed.verifiedAt !== 'number') {
            return null
        }
        return parsed as CachedPushSync
    } catch {
        return null
    }
}

export function markPushSyncVerified(userId: string, endpoint: string): void {
    if (typeof window === 'undefined') return
    try {
        const payload: CachedPushSync = {
            userId,
            endpoint,
            verifiedAt: Date.now(),
        }
        window.localStorage.setItem(PUSH_SYNC_CACHE_KEY, JSON.stringify(payload))
    } catch {
        // Ignore storage errors in private browsing / quota-restricted contexts
    }
}

export function clearPushSyncCache(): void {
    if (typeof window === 'undefined') return
    try {
        window.localStorage.removeItem(PUSH_SYNC_CACHE_KEY)
    } catch {
        // Ignore
    }
}

function isSupported(): boolean {
    return (
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
    )
}

/**
 * Repair the server's push subscription for the current user, without ever
 * prompting.
 *
 * Safe to call on page load: no-ops unless permission is granted AND a local
 * session exists, and skips network checks for 12 hours once a (user, endpoint)
 * pair has been verified unless `{ force: true }` is passed.
 */
export async function syncPushSubscription(options?: { force?: boolean }): Promise<PushSyncResult> {
    if (!isSupported()) {
        return { ok: false, reason: 'unsupported' }
    }

    if (Notification.permission !== 'granted') {
        return {
            ok: false,
            reason: Notification.permission === 'denied' ? 'permission-denied' : 'permission-default',
        }
    }

    if (inFlightSync && !options?.force) {
        return inFlightSync
    }

    const run = (async (): Promise<PushSyncResult> => {
        try {
            // Skip server calls completely for anonymous visitors on public pages.
            const { user } = await getBrowserAuthState()
            if (!user) {
                return { ok: false, reason: 'unauthenticated' }
            }

            const registration = await navigator.serviceWorker.ready
            let subscription = await registration.pushManager.getSubscription()

            if (!options?.force && subscription) {
                const cached = readPushSyncCache()
                if (
                    cached &&
                    cached.userId === user.id &&
                    cached.endpoint === subscription.endpoint &&
                    Date.now() - cached.verifiedAt < PUSH_SYNC_TTL_MS
                ) {
                    return { ok: true, reason: 'already-registered', endpoint: subscription.endpoint }
                }
            }

            if (!subscription) {
                const keyResponse = await fetch('/api/push/vapid-key', { cache: 'no-store' })
                if (!keyResponse.ok) {
                    return { ok: false, reason: 'not-configured' }
                }
                const { publicKey } = await keyResponse.json()
                if (!publicKey) {
                    return { ok: false, reason: 'not-configured' }
                }

                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
                })
            }

            const statusResponse = await fetch(
                `/api/push/status?endpoint=${encodeURIComponent(subscription.endpoint)}`,
                { cache: 'no-store' }
            )

            if (statusResponse.status === 401) {
                return { ok: false, reason: 'unauthenticated' }
            }

            if (statusResponse.ok) {
                const status = await statusResponse.json()
                if (status.registered && status.pushEnabled) {
                    markPushSyncVerified(user.id, subscription.endpoint)
                    return { ok: true, reason: 'already-registered', endpoint: subscription.endpoint }
                }
            }

            const saveResponse = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-store',
                body: JSON.stringify({ subscription: subscription.toJSON(), source: 'client-reconcile' }),
            })

            if (saveResponse.status === 401) {
                return { ok: false, reason: 'unauthenticated' }
            }

            if (!saveResponse.ok) {
                return { ok: false, reason: 'error' }
            }

            markPushSyncVerified(user.id, subscription.endpoint)
            return { ok: true, reason: 'synced', endpoint: subscription.endpoint }
        } catch (error) {
            console.warn('[PushSync] Reconcile failed:', error)
            return { ok: false, reason: 'error' }
        }
    })()

    if (!options?.force) {
        inFlightSync = run.finally(() => {
            inFlightSync = null
        })
        return inFlightSync
    }

    return run
}

/**
 * Ask the active service worker to reconcile too. Kept for explicit manual repair.
 */
export function requestServiceWorkerPushSync(): void {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker.ready
        .then((registration) => {
            registration.active?.postMessage({ type: 'SYNC_PUSH_SUBSCRIPTION' })
        })
        .catch(() => {
            // Best-effort
        })
}
