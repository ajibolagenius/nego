import { NextRequest, NextResponse } from 'next/server'
import { sendPushNotification } from '@/lib/push/send-push'
import { createClient } from '@/lib/supabase/server'
import type { PushSubscription } from '@/lib/push/send-push'

/**
 * POST /api/push/send
 * Send push notification to a user
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Verify user is authenticated and is admin (or allow users to send to themselves)
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const payload = await request.json()
        const { userId, title, body, icon, badge, tag, data, url } = payload

        if (!userId || !title || !body) {
            return NextResponse.json(
                { error: 'userId, title, and body are required' },
                { status: 400 }
            )
        }

        // Check if user is admin or sending to themselves
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin' && userId !== user.id) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            )
        }

        // Get all push subscriptions for the user
        const { data: subscriptions, error: subError } = await supabase
            .from('push_subscriptions')
            .select('endpoint, p256dh_key, auth_key')
            .eq('user_id', userId)

        if (subError) {
            throw subError
        }

        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json(
                { error: 'No push subscriptions found for user' },
                { status: 404 }
            )
        }

        // Send push notification to all subscriptions
        const results = await Promise.allSettled(
            subscriptions.map(async (sub) => {
                const subscription: PushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh_key,
                        auth: sub.auth_key,
                    },
                }

                await sendPushNotification(subscription, {
                    title,
                    body,
                    icon,
                    badge,
                    tag,
                    data,
                    url,
                })
            })
        )

        // Remove expired/invalid subscriptions
        const expiredSubscriptions: string[] = []
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                const error = result.reason
                if (
                    error instanceof Error &&
                    (error.message.includes('expired') || error.message.includes('Invalid'))
                ) {
                    expiredSubscriptions.push(subscriptions[index]!.endpoint)
                }
            }
        })

        if (expiredSubscriptions.length > 0) {
            await supabase
                .from('push_subscriptions')
                .delete()
                .in('endpoint', expiredSubscriptions)
        }

        const successCount = results.filter((r) => r.status === 'fulfilled').length

        return NextResponse.json({
            success: true,
            sent: successCount,
            total: subscriptions.length,
        })
    } catch (error) {
        console.error('[Push Send] Error:', error)
        return NextResponse.json(
            { error: 'Failed to send push notification' },
            { status: 500 }
        )
    }
}
