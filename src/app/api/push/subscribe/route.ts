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

        // Retire the endpoint the browser just replaced. Only ever the *old*
        // endpoint — never the new one, so a failure below cannot leave the user
        // with no subscription at all.
        if (oldEndpoint && oldEndpoint !== subscription.endpoint) {
            const { error: retireError } = await admin
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', oldEndpoint)

            if (retireError) {
                // The new subscription still needs saving; a leftover dead row
                // just gets cleaned up on its next 410 Gone.
                console.warn('[Push Subscribe] Failed to retire old endpoint:', retireError)
            }
        }

        // Upsert on `endpoint`, which is now uniquely indexed. This reassigns the
        // row to the current user in one statement, which is what makes a shared
        // device safe: whoever last authenticated on this browser owns the
        // endpoint, and the previous owner stops receiving pushes meant for them
        // on a device they no longer control.
        const { error: upsertError } = await admin
            .from('push_subscriptions')
            .upsert(
                {
                    user_id: user.id,
                    endpoint: subscription.endpoint,
                    p256dh_key: p256dh,
                    auth_key: auth,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'endpoint' }
            )

        if (upsertError) {
            throw upsertError
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
