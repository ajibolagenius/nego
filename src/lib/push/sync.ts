'use client'

import { urlBase64ToUint8Array } from './vapid'

/**
 * Client-side reconciliation between the browser's push subscription and the
 * server's record of it.
 *
 * Why this exists: the app used to save a subscription exactly once, when the
 * user pressed "Enable". Everything that can invalidate that subscription
 * afterwards — the browser rotating it, the server deleting the row after a 410
 * Gone, a failed save during onboarding — left the user with push permanently
 * dead and a UI still claiming it was on. Reconciling on every load turns that
 * permanent failure into a transient one.
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
 * Safe to call on every page load: it is a no-op unless the user has already
 * granted notification permission, and it only writes when the browser and the
 * server actually disagree.
 */
export async function syncPushSubscription(): Promise<PushSyncResult> {
    if (!isSupported()) {
        return { ok: false, reason: 'unsupported' }
    }

    // Only granted permission may proceed — this path must never trigger a
    // permission prompt the user did not ask for.
    if (Notification.permission !== 'granted') {
        return {
            ok: false,
            reason: Notification.permission === 'denied' ? 'permission-denied' : 'permission-default',
        }
    }

    try {
        const registration = await navigator.serviceWorker.ready
        let subscription = await registration.pushManager.getSubscription()

        // Permission is granted but the subscription is gone (rotated away, or
        // dropped when the SW was unregistered). Re-create it silently.
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

        // Ask the server whether it can actually send to this endpoint before
        // writing, so a healthy install costs one cheap GET instead of a write.
        const statusResponse = await fetch(
            `/api/push/status?endpoint=${encodeURIComponent(subscription.endpoint)}`,
            { cache: 'no-store' }
        )

        if (statusResponse.status === 401) {
            return { ok: false, reason: 'unauthenticated' }
        }

        if (statusResponse.ok) {
            const status = await statusResponse.json()
            // `pushEnabled` matters as much as `registered`: a stored
            // subscription with push_enabled=false still receives nothing,
            // and re-posting the subscription is what flips it back on.
            if (status.registered && status.pushEnabled) {
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

        return { ok: true, reason: 'synced', endpoint: subscription.endpoint }
    } catch (error) {
        console.warn('[PushSync] Reconcile failed:', error)
        return { ok: false, reason: 'error' }
    }
}

/**
 * Ask the active service worker to reconcile too.
 *
 * The SW can repair itself while no tab is open (on activation, or on
 * `pushsubscriptionchange`), but nudging it from the page covers browsers that
 * do not fire `pushsubscriptionchange` reliably — Chrome notably.
 */
export function requestServiceWorkerPushSync(): void {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker.ready
        .then((registration) => {
            registration.active?.postMessage({ type: 'SYNC_PUSH_SUBSCRIPTION' })
        })
        .catch(() => {
            // Best-effort; the page-side reconcile above is the primary path.
        })
}
