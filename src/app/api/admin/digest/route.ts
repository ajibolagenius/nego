import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, emailTemplates } from '@/lib/email'
import { createApiClient } from '@/lib/supabase/api'

interface AdminDigestRecipient {
    id: string
    email: string | null
}

// Weekly Admin Digest - Call via cron job every week
export async function POST(request: NextRequest) {
    try {
        // Verify cron secret (optional security)
        const authHeader = request.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Use API client (service role) to bypass RLS for admin operations
        const supabase = createApiClient()

        const now = new Date()
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        // Fetch all stats in parallel
        const [
            { count: totalUsers },
            { count: newUsersThisWeek },
            { count: totalBookings },
            { count: newBookingsThisWeek },
            { count: pendingVerifications },
            { count: pendingWithdrawals },
            { data: transactions },
            { data: weeklyTransactions },
            { data: adminProfiles },
        ] = await Promise.all([
            // Total users
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            // New users this week
            supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo.toISOString()),
            // Total bookings
            supabase.from('bookings').select('*', { count: 'exact', head: true }),
            // New bookings this week
            supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo.toISOString()),
            // Pending verifications
            supabase.from('verifications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            // Pending withdrawals
            supabase.from('withdrawal_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            // All purchase transactions for total revenue
            supabase.from('transactions').select('amount').eq('type', 'purchase').eq('status', 'completed'),
            // Weekly purchase transactions
            supabase.from('transactions').select('amount').eq('type', 'purchase').eq('status', 'completed').gte('created_at', oneWeekAgo.toISOString()),
            // Admin recipients from profiles to avoid per-admin auth lookups
            supabase.from('profiles').select('id, email').eq('role', 'admin'),
        ])

        // Calculate revenue
        const totalRevenue = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
        const revenueThisWeek = weeklyTransactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0

        const digestData = {
            totalUsers: totalUsers || 0,
            newUsersThisWeek: newUsersThisWeek || 0,
            totalBookings: totalBookings || 0,
            newBookingsThisWeek: newBookingsThisWeek || 0,
            pendingVerifications: pendingVerifications || 0,
            pendingWithdrawals: pendingWithdrawals || 0,
            totalRevenue,
            revenueThisWeek,
        }

        // Send email to all admins
        const results = {
            sent: 0,
            failed: 0,
            errors: [] as string[],
        }

        if (adminProfiles && adminProfiles.length > 0) {
            const template = emailTemplates.adminDigest(digestData)
            const uniqueRecipients = new Map<string, AdminDigestRecipient>()

            for (const admin of adminProfiles as AdminDigestRecipient[]) {
                if (!admin.email) {
                    results.failed++
                    results.errors.push(`Admin ${admin.id} is missing an email address`)
                    continue
                }

                if (!uniqueRecipients.has(admin.email)) {
                    uniqueRecipients.set(admin.email, admin)
                }
            }

            const settledResults = await Promise.allSettled(
                Array.from(uniqueRecipients.values()).map(async (admin) => {
                    const result = await sendEmail(admin.email!, template)

                    if (!result.success) {
                        throw new Error(`Failed to send to ${admin.email}`)
                    }

                    return admin.email
                })
            )

            settledResults.forEach((result) => {
                if (result.status === 'fulfilled') {
                    results.sent++
                    return
                }

                results.failed++
                results.errors.push(result.reason instanceof Error ? result.reason.message : String(result.reason))
            })
        }

        // If no admins found, try to send to a default admin email if configured
        const defaultAdminEmail = process.env.ADMIN_EMAIL
        if (defaultAdminEmail && results.sent === 0) {
            try {
                const template = emailTemplates.adminDigest(digestData)
                const result = await sendEmail(defaultAdminEmail, template)

                if (result.success) {
                    results.sent++
                }
            } catch (err) {
                results.errors.push(`Failed to send to default admin: ${err}`)
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Weekly digest processed',
            results,
            digestData,
            timestamp: now.toISOString(),
        })
    } catch (error) {
        console.error('Admin digest error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        )
    }
}

// Support GET for manual testing
export async function GET(request: NextRequest) {
    return POST(request)
}
