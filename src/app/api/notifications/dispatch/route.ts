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

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

interface ResolvedTargets {
    userIds: string[]
    roles: UserRole[]
}

/**
 * Non-admin callers cannot be trusted to supply their own targets — otherwise
 * any authenticated user could fabricate a notification (fake review, fake
 * dispute, fake booking) and send it to an arbitrary user. Instead, for each
 * self-servable type we look up the underlying record and derive the target
 * from it, verifying the caller actually owns/participates in that record.
 */
async function resolveSelfServiceTargets(
    supabase: SupabaseServerClient,
    userId: string,
    type: NotificationType,
    data: Record<string, unknown> | undefined
): Promise<ResolvedTargets | null> {
    const bookingId = typeof data?.booking_id === 'string' ? data.booking_id : null

    if (type === 'booking_request' || type === 'review_received') {
        if (!bookingId) return null
        const { data: booking } = await supabase
            .from('bookings')
            .select('client_id, talent_id')
            .eq('id', bookingId)
            .single()

        if (!booking || booking.client_id !== userId) return null
        return { userIds: [booking.talent_id as string], roles: [] }
    }

    if (type === 'dispute_filed') {
        if (!bookingId) return null
        const { data: booking } = await supabase
            .from('bookings')
            .select('client_id, talent_id')
            .eq('id', bookingId)
            .single()

        if (!booking) return null
        if (booking.client_id !== userId && booking.talent_id !== userId) return null

        const otherPartyId = booking.client_id === userId ? booking.talent_id : booking.client_id
        return { userIds: [otherPartyId as string], roles: ['admin'] }
    }

    return null
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as DispatchBody
        const { type, title, message, data, url } = body

        if (!type || !title || !message) {
            return NextResponse.json({ error: 'type, title and message are required' }, { status: 400 })
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

        let userIds: string[] = []
        let roles: UserRole[] = []

        if (isInternalRequest) {
            userIds = body.targets?.userIds || []
            roles = body.targets?.roles || []
        } else {
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

            if (profile.role === 'admin') {
                // Admins can dispatch any notification to any target.
                userIds = body.targets?.userIds || []
                roles = body.targets?.roles || []
            } else {
                // Non-admins can only self-serve a handful of event-backed types,
                // and never choose their own targets — see resolveSelfServiceTargets.
                const resolved = await resolveSelfServiceTargets(supabase, user.id, type, data)
                if (!resolved) {
                    return NextResponse.json(
                        { error: 'Forbidden: could not verify this notification against an owned record' },
                        { status: 403 }
                    )
                }
                userIds = resolved.userIds
                roles = resolved.roles
            }
        }

        if (userIds.length === 0 && roles.length === 0) {
            return NextResponse.json({ error: 'At least one target (userIds or roles) is required' }, { status: 400 })
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
