import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'
import { createClient } from '@/lib/supabase/server'

interface PushSubscriptionKeys {
    p256dh: string
    auth: string
}

interface IncomingPushSubscription {
    endpoint: string
    keys: PushSubscriptionKeys
}

/**
 * POST /api/push/subscribe
 * Save (or repair) the push subscription for the authenticated user.
 *
 * Called from three places:
 *   1. the user pressing "Enable" in Settings / the dashboard prompt,
 *   2. the service worker's `pushsubscriptionchange` handler after the browser
 *      rotates a subscription,
 *   3. the app's on-load reconcile, when the browser holds a subscription the
 *      server does not know about.
 *
 * (2) and (3) are the reason this endpoint has to be idempotent and has to
 * accept a subscription for an endpoint that may currently be attributed to a
 * different user.
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { subscription, oldEndpoint } = body as {
            subscription: IncomingPushSubscription
            oldEndpoint?: string
        }

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return NextResponse.json(
                { error: 'Invalid subscription data' },
                { status: 400 }
            )
        }

        const { p256dh, auth } = subscription.keys
        if (!p256dh || !auth) {
            return NextResponse.json(
                { error: 'Invalid subscription data: missing encryption keys' },
                { status: 400 }
            )
        }

        // An endpoint identifies a browser install, not an account, so it must
        // belong to exactly one user. Writes go through the service-role client:
        // clearing a row owned by a *previous* user of this device is invisible
        // to the caller's RLS policies, and the caller has already been
        // authenticated above.
        const admin = createApiClient()

        // Retire the endpoint the browser just replaced, plus any stale
        // attribution of the new endpoint to another account (shared device).
        const endpointsToClear = [subscription.endpoint]
        if (oldEndpoint && oldEndpoint !== subscription.endpoint) {
            endpointsToClear.push(oldEndpoint)
        }

        const { error: clearError } = await admin
            .from('push_subscriptions')
            .delete()
            .in('endpoint', endpointsToClear)

        if (clearError) {
            throw clearError
        }

        const { error: insertError } = await admin
            .from('push_subscriptions')
            .insert({
                user_id: user.id,
                endpoint: subscription.endpoint,
                p256dh_key: p256dh,
                auth_key: auth,
                updated_at: new Date().toISOString(),
            })

        if (insertError) {
            throw insertError
        }

        // A stored subscription and `push_enabled = false` is a contradiction
        // that silently drops every push (notifyTargets filters on the flag).
        // The user just granted permission, so make the preference agree.
        const { error: prefError } = await admin
            .from('notification_preferences')
            .upsert(
                { user_id: user.id, push_enabled: true, updated_at: new Date().toISOString() },
                { onConflict: 'user_id' }
            )

        if (prefError) {
            // Non-fatal: the subscription is saved, so log and continue rather
            // than making the caller think enabling failed.
            console.warn('[Push Subscribe] Failed to enable push preference:', prefError)
        }

        // Keep the legacy flat flag in step for any code still reading it.
        await admin
            .from('profiles')
            .update({ push_notifications_enabled: true })
            .eq('id', user.id)

        return NextResponse.json({ success: true, endpoint: subscription.endpoint })
    } catch (error) {
        console.error('[Push Subscribe] Error:', error)
        return NextResponse.json(
            { error: 'Failed to save subscription' },
            { status: 500 }
        )
    }
}
