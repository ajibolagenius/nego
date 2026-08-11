import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/push/status?endpoint=<endpoint>
 *
 * Reports whether the server actually holds a usable push subscription for the
 * caller, and whether their push preference is on.
 *
 * The UI previously decided it was "subscribed" from
 * `pushManager.getSubscription()` alone. That only proves the *browser* has a
 * subscription — it says nothing about whether the server has the matching row
 * needed to send to it. Those two states drift apart constantly (rotated
 * subscription, row deleted after a 410, a sign-up whose save request failed),
 * and every time they did the user was shown a green "Notifications Enabled"
 * badge while receiving nothing. This endpoint is what lets the client tell the
 * difference and repair it.
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const endpoint = request.nextUrl.searchParams.get('endpoint')
        const admin = createApiClient()

        const { data: rows, error: subError } = await admin
            .from('push_subscriptions')
            .select('endpoint, updated_at')
            .eq('user_id', user.id)

        if (subError) {
            throw subError
        }

        const subscriptions = rows || []
        const { data: prefs } = await admin
            .from('notification_preferences')
            .select('push_enabled, in_app_enabled, email_enabled, chat_enabled')
            .eq('user_id', user.id)
            .maybeSingle()

        // A missing preferences row means "all channels on" everywhere else in
        // the codebase (see resolvePreferences), so report it the same way.
        const pushEnabled = prefs ? prefs.push_enabled !== false : true

        return NextResponse.json({
            // True only when this exact browser endpoint is registered server-side.
            registered: endpoint ? subscriptions.some((s) => s.endpoint === endpoint) : false,
            subscriptionCount: subscriptions.length,
            pushEnabled,
            preferences: prefs ?? null,
        })
    } catch (error) {
        console.error('[Push Status] Error:', error)
        return NextResponse.json({ error: 'Failed to read push status' }, { status: 500 })
    }
}
