import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface PushSubscription {
    endpoint: string
    keys: {
        p256dh: string
        auth: string
    }
}

/**
 * POST /api/push/subscribe
 * Save push subscription for a user
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { subscription }: { subscription: PushSubscription } = body

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return NextResponse.json(
                { error: 'Invalid subscription data' },
                { status: 400 }
            )
        }

        // Check if subscription already exists
        const { data: existing } = await supabase
            .from('push_subscriptions')
            .select('id')
            .eq('user_id', user.id)
            .eq('endpoint', subscription.endpoint)
            .single()

        if (existing) {
            // Update existing subscription
            const { error: updateError } = await supabase
                .from('push_subscriptions')
                .update({
                    p256dh_key: subscription.keys.p256dh,
                    auth_key: subscription.keys.auth,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id)

            if (updateError) {
                throw updateError
            }
        } else {
            // Insert new subscription
            const { error: insertError } = await supabase
                .from('push_subscriptions')
                .insert({
                    user_id: user.id,
                    endpoint: subscription.endpoint,
                    p256dh_key: subscription.keys.p256dh,
                    auth_key: subscription.keys.auth,
                })

            if (insertError) {
                throw insertError
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[Push Subscribe] Error:', error)
        return NextResponse.json(
            { error: 'Failed to save subscription' },
            { status: 500 }
        )
    }
}
