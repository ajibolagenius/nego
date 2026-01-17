import { createClient } from '@/lib/supabase/server'
import { sendPushNotification } from './send-push'
import type { PushSubscription } from './send-push'

/**
 * Send push notification when a database notification is created
 * This should be called from database triggers or API routes
 */
export async function sendPushForNotification(
    userId: string,
    notification: {
        id: string
        title: string
        message: string
        type: string
        data?: Record<string, unknown>
    }
): Promise<void> {
    try {
        const supabase = await createClient()

        // Get user's push subscriptions
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('endpoint, p256dh_key, auth_key')
            .eq('user_id', userId)

        if (error || !subscriptions || subscriptions.length === 0) {
            // User doesn't have push subscriptions, that's okay
            return
        }

        // Check if user has push notifications enabled
        const { data: profile } = await supabase
            .from('profiles')
            .select('push_notifications_enabled')
            .eq('id', userId)
            .single()

        if (!profile?.push_notifications_enabled) {
            // User has disabled push notifications
            return
        }

        // Determine notification icon based on type
        const iconMap: Record<string, string> = {
            booking_request: '/icon-192.png',
            booking_accepted: '/icon-192.png',
            booking_rejected: '/icon-192.png',
            booking_completed: '/icon-192.png',
            withdrawal_approved: '/icon-192.png',
            withdrawal_rejected: '/icon-192.png',
            gift_received: '/icon-192.png',
            general: '/icon-192.png',
        }

        // Send push to all subscriptions
        await Promise.allSettled(
            subscriptions.map(async (sub) => {
                const subscription: PushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh_key,
                        auth: sub.auth_key,
                    },
                }

                await sendPushNotification(subscription, {
                    title: notification.title,
                    body: notification.message,
                    icon: iconMap[notification.type] || '/icon-192.png',
                    tag: `notification-${notification.id}`,
                    data: {
                        notificationId: notification.id,
                        type: notification.type,
                        ...notification.data,
                    },
                    url: '/dashboard/notifications',
                })
            })
        )
    } catch (error) {
        // Don't throw - push notifications are non-critical
        console.error('[Push Notification Integration] Error:', error)
    }
}
