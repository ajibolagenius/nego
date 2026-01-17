import { createClient } from '@/lib/supabase/server'

export interface AuditLogEntry {
    admin_id: string
    action: string
    resource_type: 'verification' | 'withdrawal' | 'payout' | 'user' | 'booking'
    resource_id: string
    details?: Record<string, unknown>
    ip_address?: string
    user_agent?: string
}

/**
 * Log admin action for audit trail
 */
export async function logAdminAction(entry: AuditLogEntry): Promise<void> {
    try {
        const supabase = await createClient()

        // Check if audit_logs table exists by attempting to insert
        // If table doesn't exist, this will fail gracefully
        const { error } = await supabase.from('audit_logs').insert({
            admin_id: entry.admin_id,
            action: entry.action,
            resource_type: entry.resource_type,
            resource_id: entry.resource_id,
            details: entry.details || {},
            ip_address: entry.ip_address,
            user_agent: entry.user_agent,
            created_at: new Date().toISOString(),
        })

        if (error) {
            // Table might not exist yet - log but don't throw
            console.warn('Audit logging failed (table may not exist):', error.message)
        }
    } catch (error) {
        // Don't throw - audit logging should not break the main flow
        console.error('Failed to log admin action:', error)
    }
}

/**
 * Get client IP address from request headers
 */
export function getClientIP(headers: Headers): string | undefined {
    // Check various headers for IP address
    const forwarded = headers.get('x-forwarded-for')
    if (forwarded) {
        return forwarded.split(',')[0].trim()
    }

    const realIP = headers.get('x-real-ip')
    if (realIP) {
        return realIP
    }

    return undefined
}

/**
 * Get user agent from request headers
 */
export function getUserAgent(headers: Headers): string | undefined {
    return headers.get('user-agent') || undefined
}
