import { generateOpenGraphMetadata } from '@/lib/og-metadata'
import { createApiClient } from '@/lib/supabase/api'
import { AnalyticsClient } from './AnalyticsClient'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

export const metadata = generateOpenGraphMetadata({
    title: 'Analytics - Nego Admin',
    description: 'Platform analytics and reporting',
    url: `${APP_URL}/admin/analytics`,
    type: 'website',
    pageType: 'admin',
})

export default async function AnalyticsPage() {
    // Use API client (service role) to bypass RLS for admin operations
    const supabase = createApiClient()

    // Get current date info
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Fetch all required data in parallel
    const [
        { count: totalUsers },
        { count: totalClients },
        { count: totalTalents },
        { count: totalBookings },
        { count: pendingBookings },
        { count: completedBookings },
        { data: recentUsers },
        { data: allBookings }, // Get all for service distribution
        { data: transactions },
        { data: wallets },
        { count: pendingModeration },
        { data: verifications },
        { data: disputes },
        profileViewsRes,
    ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'talent'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('profiles').select('id, role, location, created_at').gte('created_at', thirtyDaysAgo.toISOString()).order('created_at', { ascending: true }),
        supabase.from('bookings').select('id, client_id, status, total_price, services_snapshot, created_at'),
        supabase.from('transactions').select('id, type, amount, coins, status, created_at').gte('created_at', thirtyDaysAgo.toISOString()).order('created_at', { ascending: true }),
        supabase.from('wallets').select('escrow_balance'),
        supabase.from('media').select('*', { count: 'exact', head: true }).eq('moderation_status', 'pending'),
        supabase.from('verifications').select('created_at, updated_at, status'),
        supabase.from('disputes').select('status, dispute_type'),
        supabase.from('profile_views').select('*', { count: 'exact', head: true }),
    ])

    const totalProfileViews = profileViewsRes.count || 0
    const recentBookings = allBookings?.filter((b: any) => new Date(b.created_at) >= thirtyDaysAgo) || []

    // 1. Financial Metrics
    const totalEscrow = wallets?.reduce((sum: number, w: any) => sum + (w.escrow_balance || 0), 0) || 0
    const totalRevenue = transactions?.filter((t: any) => t.type === 'purchase' && t.status === 'completed')
        .reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0

    // 2. Service Category Popularity
    const serviceCounts: Record<string, number> = {}
    allBookings?.forEach((b: any) => {
        if (b.services_snapshot && Array.isArray(b.services_snapshot)) {
            b.services_snapshot.forEach((s: any) => {
                const name = s.service_type?.name || 'Unknown'
                serviceCounts[name] = (serviceCounts[name] || 0) + 1
            })
        }
    })
    const servicePopularityData = Object.entries(serviceCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)

    // 3. Location Data
    const locationCounts: Record<string, number> = {}
    recentUsers?.forEach((u: any) => {
        if (u.location) {
            locationCounts[u.location] = (locationCounts[u.location] || 0) + 1
        }
    })
    const locationData = Object.entries(locationCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)

    // 4. Operational Metrics (Velocity)
    const approvedVerifications = verifications?.filter((v: any) => v.status === 'approved' && v.updated_at) || []
    const avgVerificationTime = approvedVerifications.length > 0
        ? approvedVerifications.reduce((sum: number, v: any) => {
            const start = new Date(v.created_at).getTime()
            const end = new Date(v.updated_at).getTime()
            return sum + (end - start)
        }, 0) / approvedVerifications.length / (1000 * 60 * 60) // in hours
        : 0

    // 5. Dispute Breakdown
    const disputeCounts: Record<string, number> = {}
    disputes?.forEach((d: any) => {
        const type = d.dispute_type || 'other'
        disputeCounts[type] = (disputeCounts[type] || 0) + 1
    })
    const disputeDistribution = Object.entries(disputeCounts).map(([name, value], i) => ({
        name,
        value,
        color: ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'][i % 4]
    }))

    // Existing Weekly Stats
    const weeklyUsers = recentUsers?.filter((u: any) => new Date(u.created_at) >= sevenDaysAgo).length || 0
    const weeklyBookings = recentBookings?.filter((b: any) => new Date(b.created_at) >= sevenDaysAgo).length || 0
    const weeklyRevenue = transactions?.filter((t: any) =>
        t.type === 'purchase' &&
        t.status === 'completed' &&
        new Date(t.created_at) >= sevenDaysAgo
    ).reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0

    const completedBookingsWithPrice = recentBookings?.filter((b: any) => b.status === 'completed' && b.total_price) || []
    const averageBookingValue = completedBookingsWithPrice.length > 0
        ? completedBookingsWithPrice.reduce((sum: number, b: any) => sum + (b.total_price || 0), 0) / completedBookingsWithPrice.length
        : 0

    const cancelledBookings = recentBookings?.filter((b: any) => b.status === 'cancelled').length || 0
    const cancellationRate = recentBookings.length > 0
        ? (cancelledBookings / recentBookings.length) * 100
        : 0
    
    // 7. Peak Booking Hour
    const hourCounts: Record<number, number> = {}
    allBookings?.forEach((b: any) => {
        const hour = new Date(b.created_at).getHours()
        hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })
    
    let peakHour = 0
    const hours = Object.entries(hourCounts)
    if (hours.length > 0) {
        const sortedHours = hours.sort((a, b) => b[1] - a[1])
        const topHour = sortedHours[0]
        if (topHour) {
            peakHour = parseInt(topHour[0])
        }
    }

    // 8. Retention Rate (Clients with >1 booking)
    const clientBookingCounts: Record<string, number> = {}
    allBookings?.forEach((b: any) => {
        if (b.client_id) {
            clientBookingCounts[b.client_id] = (clientBookingCounts[b.client_id] || 0) + 1
        }
    })
    const totalClientsWithBookings = Object.keys(clientBookingCounts).length
    const repeatClients = Object.values(clientBookingCounts).filter(count => count > 1).length
    const retentionRate = totalClientsWithBookings > 0
        ? (repeatClients / totalClientsWithBookings) * 100
        : 0

    // Charts processing
    const userGrowthData = processTimeSeriesData(recentUsers || [], 'created_at', 30)
    const bookingTrendsData = processTimeSeriesData(recentBookings || [], 'created_at', 30)
    const revenueData = processRevenueData(transactions || [], 30)

    // 6. Top Talents (Revenue + Views)
    // For revenue, we ideally need to aggregate booking totals per talent.
    const talentRevenue: Record<string, number> = {}
    if (allBookings) {
        completedBookingsWithPrice.forEach((b: any) => {
            if (b.talent_id) {
                talentRevenue[b.talent_id] = (talentRevenue[b.talent_id] || 0) + (b.total_price || 0)
            }
        })
    }

    // Get the actual talent names for the top 5
    const topTalentIds = Object.entries(talentRevenue)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(t => t[0])

    const { data: topTalents } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', topTalentIds)

    const topTalentsData = topTalentIds.map(id => {
        const talent = topTalents?.find(t => t.id === id)
        return {
            id,
            name: talent?.display_name || 'Unknown',
            avatar: talent?.avatar_url,
            revenue: talentRevenue[id] || 0
        }
    })

    const statsData = {
        totalUsers: totalUsers || 0,
        totalClients: totalClients || 0,
        totalTalents: totalTalents || 0,
        totalBookings: totalBookings || 0,
        pendingBookings: pendingBookings || 0,
        completedBookings: completedBookings || 0,
        totalRevenue,
        totalEscrow,
        pendingModeration: pendingModeration || 0,
        avgVerificationTime,
        weeklyUsers,
        weeklyBookings,
        weeklyRevenue,
        averageBookingValue,
        retentionRate,
        peakHour,
        cancellationRate,
        totalProfileViews,
    }

    return (
        <AnalyticsClient
            stats={statsData}
            userGrowthData={userGrowthData}
            bookingTrendsData={bookingTrendsData}
            revenueData={revenueData}
            servicePopularityData={servicePopularityData}
            locationData={locationData}
            disputeDistribution={disputeDistribution}
            topTalents={topTalentsData}
        />
    )
}

// Helper function to process time series data
function processTimeSeriesData(data: Array<{ created_at: string;[key: string]: unknown }>, dateField: string, days: number) {
    const result: { date: string; count: number }[] = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split('T')[0]
        const count = data.filter(item => {
            const dateValue = item[dateField]
            if (typeof dateValue !== 'string' && !(dateValue instanceof Date)) {
                return false
            }
            const itemDate = new Date(dateValue as string | Date).toISOString().split('T')[0]
            return itemDate === dateStr
        }).length

        result.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            count,
        })
    }

    return result
}

// Helper function to process revenue data
function processRevenueData(transactions: Array<{ created_at: string; type: string; status: string; amount: number | null }>, days: number) {
    const result: { date: string; amount: number }[] = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split('T')[0]

        const amount = transactions
            .filter(t => {
                const itemDate = new Date(t.created_at).toISOString().split('T')[0]
                return itemDate === dateStr && t.type === 'purchase' && t.status === 'completed'
            })
            .reduce((sum, t) => sum + (t.amount || 0), 0)

        result.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            amount,
        })
    }

    return result
}
