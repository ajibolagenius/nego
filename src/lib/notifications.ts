import { getTemplateForNotification, sendEmail } from '@/lib/email'
import { sendPushNotification } from '@/lib/push/send-push'
import { createApiClient } from '@/lib/supabase/api'
import type { NotificationType, UserRole } from '@/types/database'

type JsonPayload = Record<string, unknown>

interface NotificationContent {
    type: NotificationType
    title: string
    message: string
    data?: JsonPayload
    url?: string
}

interface NotifyUserParams extends NotificationContent {
    userId: string
}

interface NotifyRoleParams extends NotificationContent {
    role: UserRole
}

interface NotifyTargetsParams extends NotificationContent {
    userIds?: string[]
    roles?: UserRole[]
}

interface NotificationResult {
    success: boolean
    inserted: number
    pushed: number
    failedPushes: number
    emailed: number
    failedEmails: number
    notifications: Array<{ id: string; user_id: string }>
    error?: unknown
}

function dedupeIds(ids: string[] = []): string[] {
    return [...new Set(ids.filter(Boolean))]
}

async function resolveRoleTargets(roles: UserRole[]): Promise<string[]> {
    if (roles.length === 0) {
        return []
    }

    const supabase = createApiClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .in('role', roles)

    if (error) {
        throw error
    }

    return (data || []).map((row) => row.id as string)
}

async function sendPushToUsers(userIds: string[], payload: NotificationContent): Promise<{ pushed: number; failedPushes: number }> {
    if (userIds.length === 0) {
        return { pushed: 0, failedPushes: 0 }
    }

    const supabase = createApiClient()
    const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('user_id, endpoint, p256dh_key, auth_key')
        .in('user_id', userIds)

    if (subError || !subscriptions || subscriptions.length === 0) {
        return { pushed: 0, failedPushes: 0 }
    }

    const { data: profileRows } = await supabase
        .from('profiles')
        .select('id, push_notifications_enabled')
        .in('id', userIds)

    const pushEnabledByUser = new Map<string, boolean>(
        (profileRows || []).map((row) => [row.id as string, Boolean((row as { push_notifications_enabled?: boolean }).push_notifications_enabled)])
    )

    const eligibleSubscriptions = subscriptions.filter((sub) => {
        // If profile flag is missing, default to true to avoid silently dropping notifications.
        const enabled = pushEnabledByUser.get(sub.user_id as string)
        return enabled !== false
    })

    let pushed = 0
    let failedPushes = 0
    const expiredEndpoints: string[] = []

    const results = await Promise.allSettled(
        eligibleSubscriptions.map(async (sub) => {
            await sendPushNotification(
                {
                    endpoint: sub.endpoint as string,
                    keys: {
                        p256dh: sub.p256dh_key as string,
                        auth: sub.auth_key as string,
                    },
                },
                {
                    title: payload.title,
                    body: payload.message,
                    tag: `notification-${payload.type}`,
                    data: payload.data || {},
                    url: payload.url || '/dashboard/notifications',
                }
            )
        })
    )

    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            pushed += 1
            return
        }

        failedPushes += 1
        const reason = result.reason
        if (reason instanceof Error && (reason.message.includes('expired') || reason.message.includes('Invalid'))) {
            expiredEndpoints.push(eligibleSubscriptions[index]!.endpoint as string)
        }
    })

    if (expiredEndpoints.length > 0) {
        await supabase
            .from('push_subscriptions')
            .delete()
            .in('endpoint', expiredEndpoints)
    }

    return { pushed, failedPushes }
}

async function sendEmailToUsers(userIds: string[], payload: NotificationContent): Promise<{ emailed: number; failedEmails: number }> {
    if (userIds.length === 0) {
        return { emailed: 0, failedEmails: 0 }
    }

    const supabase = createApiClient()
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, full_name, email_notifications_enabled')
        .in('id', userIds)

    const profileById = new Map<string, { display_name?: string | null; full_name?: string | null; email_notifications_enabled?: boolean | null }>(
        (profiles || []).map((row) => [row.id as string, row as { display_name?: string | null; full_name?: string | null; email_notifications_enabled?: boolean | null }])
    )

    let emailed = 0
    let failedEmails = 0

    const results = await Promise.allSettled(
        userIds.map(async (userId) => {
            const profile = profileById.get(userId)
            if (profile?.email_notifications_enabled === false) {
                return
            }

            const name = profile?.display_name || profile?.full_name || 'there'
            const template = getTemplateForNotification(name, {
                type: payload.type,
                title: payload.title,
                message: payload.message,
                data: payload.data,
                url: payload.url,
            })

            if (!template) {
                return
            }

            const userResponse = await supabase.auth.admin.getUserById(userId)
            const email = userResponse.data.user?.email
            if (!email) {
                return
            }

            const result = await sendEmail(email, template)
            if (!result.success) {
                throw new Error('Email delivery failed')
            }
        })
    )

    results.forEach((result) => {
        if (result.status === 'fulfilled') {
            emailed += 1
        } else {
            failedEmails += 1
        }
    })

    return { emailed, failedEmails }
}

export async function notifyTargets(params: NotifyTargetsParams): Promise<NotificationResult> {
    try {
        const { userIds = [], roles = [], type, title, message, data = {}, url } = params
        const roleUsers = await resolveRoleTargets(roles)
        const recipients = dedupeIds([...userIds, ...roleUsers])

        if (recipients.length === 0) {
            return {
                success: true,
                inserted: 0,
                pushed: 0,
                failedPushes: 0,
                emailed: 0,
                failedEmails: 0,
                notifications: [],
            }
        }

        const supabase = createApiClient()
        const notificationRows = recipients.map((targetUserId) => ({
            user_id: targetUserId,
            type,
            title,
            message,
            data: { ...data, url },
            is_read: false,
        }))

        const { data: insertedRows, error: insertError } = await supabase
            .from('notifications')
            .insert(notificationRows)
            .select('id, user_id')

        if (insertError) {
            return {
                success: false,
                inserted: 0,
                pushed: 0,
                failedPushes: 0,
                emailed: 0,
                failedEmails: 0,
                notifications: [],
                error: insertError,
            }
        }

        const { pushed, failedPushes } = await sendPushToUsers(recipients, {
            type,
            title,
            message,
            data,
            url,
        })

        // Email is best-effort; failures should not fail in-app or push delivery.
        const { emailed, failedEmails } = await sendEmailToUsers(recipients, {
            type,
            title,
            message,
            data,
            url,
        })

        return {
            success: true,
            inserted: insertedRows?.length || 0,
            pushed,
            failedPushes,
            emailed,
            failedEmails,
            notifications: (insertedRows || []) as Array<{ id: string; user_id: string }>,
        }
    } catch (error) {
        return {
            success: false,
            inserted: 0,
            pushed: 0,
            failedPushes: 0,
            emailed: 0,
            failedEmails: 0,
            notifications: [],
            error,
        }
    }
}

export async function notifyUser(params: NotifyUserParams): Promise<NotificationResult> {
    const { userId, ...content } = params
    return notifyTargets({ ...content, userIds: [userId] })
}

export async function notifyRole(params: NotifyRoleParams): Promise<NotificationResult> {
    const { role, ...content } = params
    return notifyTargets({ ...content, roles: [role] })
}

// Backward-compatible alias for existing call sites.
export async function createNotification(params: NotifyUserParams): Promise<NotificationResult> {
    return notifyUser(params)
}
