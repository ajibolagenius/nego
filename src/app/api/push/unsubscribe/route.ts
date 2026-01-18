import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/push/unsubscribe
 * Remove push subscription for a user
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
        const { endpoint } = body

        if (!endpoint) {
            return NextResponse.json(
                { error: 'Endpoint is required' },
                { status: 400 }
            )
        }

        // Delete subscription
        const { error: deleteError } = await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('endpoint', endpoint)

        if (deleteError) {
            throw deleteError
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[Push Unsubscribe] Error:', error)
        return NextResponse.json(
            { error: 'Failed to remove subscription' },
            { status: 500 }
        )
    }
}
