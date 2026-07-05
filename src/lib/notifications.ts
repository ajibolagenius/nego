import { getTemplateForNotification, sendBatchEmails, sendEmail } from '@/lib/email'
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

interface NotificationPreferences {
    in_app_enabled: boolean
    push_enabled: boolean
    email_enabled: boolean
    chat_enabled: boolean
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
    in_app_enabled: true,
    push_enabled: true,
    email_enabled: true,
    chat_enabled: true,
}

// message_received is the only chat-delivered notification type today;
// chat_enabled gates it across every channel, on top of the per-channel toggle.
function isChatNotification(type: NotificationType): boolean {
    return type === 'message_received'
}

async function getPreferencesByUser(userIds: string[]): Promise<Map<string, NotificationPreferences>> {
    const map = new Map<string, NotificationPreferences>()
    if (userIds.length === 0) {
        return map
    }

    const supabase = createApiClient()
    const { data, error } = await supabase
        .from('notification_preferences')
        .select('user_id, in_app_enabled, push_enabled, email_enabled, chat_enabled')
        .in('user_id', userIds)

    if (error) {
        // Fail open: if preferences can't be read, don't silently drop notifications.
        return map
    }

    for (const row of data || []) {
        map.set(row.user_id as string, {
            in_app_enabled: row.in_app_enabled !== false,
            push_enabled: row.push_enabled !== false,
            email_enabled: row.email_enabled !== false,
            chat_enabled: row.chat_enabled !== false,
        })
    }

    return map
}

function resolvePreferences(map: Map<string, NotificationPreferences>, userId: string): NotificationPreferences {
    return map.get(userId) ?? DEFAULT_PREFERENCES
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

    let pushed = 0
    let failedPushes = 0
    const expiredEndpoints: string[] = []

    const results = await Promise.allSettled(
        subscriptions.map(async (sub) => {
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
            expiredEndpoints.push(subscriptions[index]!.endpoint as string)
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
        .select('id, display_name, full_name')
        .in('id', userIds)

    const profileById = new Map<string, { display_name?: string | null; full_name?: string | null }>(
        (profiles || []).map((row) => [row.id as string, row as { display_name?: string | null; full_name?: string | null }])
    )

    const resolved = await Promise.all(
        userIds.map(async (userId) => {
            const profile = profileById.get(userId)
            const name = profile?.display_name || profile?.full_name || 'there'
            const template = getTemplateForNotification(name, {
                type: payload.type,
                title: payload.title,
                message: payload.message,
                data: payload.data,
                url: payload.url,
            })
            if (!template) {
                return null
            }

            const userResponse = await supabase.auth.admin.getUserById(userId)
            const email = userResponse.data.user?.email
            if (!email) {
                return null
            }

            return { email, template }
        })
    )

    const messages = resolved.filter((m): m is { email: string; template: { subject: string; html: string } } => m !== null)
    if (messages.length === 0) {
        return { emailed: 0, failedEmails: 0 }
    }

    // A single recipient just sends directly; multiple recipients batch into
    // one Resend API call instead of one request per user.
    if (messages.length === 1) {
        const result = await sendEmail(messages[0]!.email, messages[0]!.template)
        if (!result.success) {
            console.error('[Notifications] Email send failed:', result.error)
            return { emailed: 0, failedEmails: 1 }
        }
        return { emailed: 1, failedEmails: 0 }
    }

    const batchResult = await sendBatchEmails(messages.map((m) => ({ to: m.email, template: m.template })))
    if (!batchResult.success) {
        console.error('[Notifications] Batch email send failed:', batchResult.error)
    }
    return { emailed: batchResult.sent, failedEmails: batchResult.failed }
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
        const preferences = await getPreferencesByUser(recipients)
        const chatGated = isChatNotification(type)

        const isEligible = (userId: string, channel: keyof NotificationPreferences) => {
            const prefs = resolvePreferences(preferences, userId)
            return prefs[channel] && (!chatGated || prefs.chat_enabled)
        }

        const inAppRecipients = recipients.filter((id) => isEligible(id, 'in_app_enabled'))
        const pushRecipients = recipients.filter((id) => isEligible(id, 'push_enabled'))
        const emailRecipients = recipients.filter((id) => isEligible(id, 'email_enabled'))

        let insertedRows: Array<{ id: string; user_id: string }> = []
        if (inAppRecipients.length > 0) {
            const notificationRows = inAppRecipients.map((targetUserId) => ({
                user_id: targetUserId,
                type,
                title,
                message,
                data: { ...data, url },
                is_read: false,
            }))

            const { data: rows, error: insertError } = await supabase
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

            insertedRows = (rows || []) as Array<{ id: string; user_id: string }>
        }

        const { pushed, failedPushes } = await sendPushToUsers(pushRecipients, {
            type,
            title,
            message,
            data,
            url,
        })

        // Email is best-effort; failures should not fail in-app or push delivery.
        const { emailed, failedEmails } = await sendEmailToUsers(emailRecipients, {
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
