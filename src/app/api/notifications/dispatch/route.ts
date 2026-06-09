import { NextRequest, NextResponse } from 'next/server'
import { notifyTargets } from '@/lib/notifications'
import { createClient } from '@/lib/supabase/server'
import type { NotificationType, UserRole } from '@/types/database'

interface DispatchBody {
    type: NotificationType
    title: string
    message: string
    data?: Record<string, unknown>
    url?: string
    targets?: {
        userIds?: string[]
        roles?: UserRole[]
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as DispatchBody
        const { type, title, message, data, url, targets } = body

        if (!type || !title || !message) {
            return NextResponse.json({ error: 'type, title and message are required' }, { status: 400 })
        }

        const userIds = targets?.userIds || []
        const roles = targets?.roles || []
        if (userIds.length === 0 && roles.length === 0) {
            return NextResponse.json({ error: 'At least one target (userIds or roles) is required' }, { status: 400 })
        }

        const internalSecret = process.env.NOTIFICATION_DISPATCH_SECRET
        const headerSecret = request.headers.get('x-notification-secret')
        const isInternalRequest = Boolean(
            internalSecret &&
            internalSecret.length > 0 &&
            headerSecret &&
            headerSecret.length === internalSecret.length &&
            headerSecret === internalSecret
        )

        if (!isInternalRequest) {
            const supabase = await createClient()
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profileError || !profile) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }

            // Admins can dispatch any notification
            if (profile.role !== 'admin') {
                // Non-admin users can only dispatch specific notification types
                const allowedTypes = ['dispute_filed', 'review_received', 'message_received']
                if (!allowedTypes.includes(type)) {
                    return NextResponse.json({ error: 'Forbidden: non-admin users can only dispatch dispute, review, and message notifications' }, { status: 403 })
                }
            }
        }

        const result = await notifyTargets({
            type,
            title,
            message,
            data,
            url,
            userIds,
            roles,
        })

        if (!result.success) {
            return NextResponse.json({ error: 'Failed to dispatch notifications', details: result.error }, { status: 500 })
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error('[Notifications Dispatch] Error:', error)
        return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 })
    }
}
