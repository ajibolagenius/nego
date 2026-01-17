import type { PushSubscription as WebPushSubscription } from 'web-push'
import { getVapidPrivateKey } from './vapid'

export interface PushNotificationPayload {
    title: string
    body: string
    icon?: string
    badge?: string
    tag?: string
    data?: Record<string, unknown>
    url?: string
    actions?: Array<{ action: string; title: string; icon?: string }>
}

export interface PushSubscription {
    endpoint: string
    keys: {
        p256dh: string
        auth: string
    }
}

// Initialize web-push lazily (server-side only)
let webpushInitialized = false

async function initializeWebPush() {
    if (typeof window !== 'undefined') {
        throw new Error('web-push can only be used server-side')
    }

    if (webpushInitialized) {
        return
    }

    try {
        const webpush = await import('web-push')
        const vapidPrivateKey = getVapidPrivateKey()
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

        if (vapidPrivateKey && vapidPublicKey) {
            webpush.default.setVapidDetails(
                `mailto:${process.env.VAPID_EMAIL || 'notifications@nego.app'}`,
                vapidPublicKey,
                vapidPrivateKey
            )
            webpushInitialized = true
        }
    } catch (error) {
        console.warn('[Push] Failed to initialize web-push:', error)
        throw error
    }
}

/**
 * Send a push notification to a subscription
 */
export async function sendPushNotification(
    subscription: PushSubscription,
    payload: PushNotificationPayload
): Promise<void> {
    if (typeof window !== 'undefined') {
        throw new Error('sendPushNotification can only be used server-side')
    }

    try {
        await initializeWebPush()
        const webpush = await import('web-push')

        const notificationPayload = JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/icon-192.png',
            badge: payload.badge || '/badge-72.png',
            tag: payload.tag || 'nego-notification',
            data: {
                ...payload.data,
                url: payload.url || '/dashboard/notifications',
            },
            actions: payload.actions || [
                { action: 'open', title: 'Open', icon: '/icon-192.png' },
                { action: 'close', title: 'Close' },
            ],
        })

        const webPushSubscription: WebPushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            },
        }

        await webpush.default.sendNotification(webPushSubscription, notificationPayload)
    } catch (error) {
        // Handle specific error cases
        if (error instanceof Error) {
            // Subscription is invalid or expired
            if (error.message.includes('410') || error.message.includes('Gone')) {
                throw new Error('Subscription expired')
            }
            // Subscription is invalid
            if (error.message.includes('404') || error.message.includes('Not Found')) {
                throw new Error('Invalid subscription')
            }
        }
        throw error
    }
}
