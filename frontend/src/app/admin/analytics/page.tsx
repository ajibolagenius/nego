import { createClient } from '@/lib/supabase/server'
import { AnalyticsClient } from './AnalyticsClient'

export const metadata = {
    title: 'Analytics - Nego Admin',
    description: 'Platform analytics and reporting',
}

export default async function AnalyticsPage() {
    const supabase = await createClient()

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
        { data: recentBookings },
        { data: transactions },
        { data: withdrawals },
    ] = await Promise.all([
        // Total users
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        // Total clients
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
        // Total talents
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'talent'),
        // Total bookings
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        // Pending bookings
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        // Completed bookings
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        // Recent user signups (last 30 days)
        supabase.from('profiles').select('id, role, created_at').gte('created_at', thirtyDaysAgo.toISOString()).order('created_at', { ascending: true }),
        // Recent bookings (last 30 days)
        supabase.from('bookings').select('id, status, total_price, created_at').gte('created_at', thirtyDaysAgo.toISOString()).order('created_at', { ascending: true }),
        // Transactions (last 30 days)
        supabase.from('transactions').select('id, type, amount, coins, status, created_at').gte('created_at', thirtyDaysAgo.toISOString()).order('created_at', { ascending: true }),
        // Withdrawals (last 30 days)
        supabase.from('withdrawal_requests').select('id, amount, status, created_at').gte('created_at', thirtyDaysAgo.toISOString()).order('created_at', { ascending: true }),
    ])

    // Calculate weekly stats
    const weeklyUsers = recentUsers?.filter(u => new Date(u.created_at) >= sevenDaysAgo).length || 0
    const weeklyBookings = recentBookings?.filter(b => new Date(b.created_at) >= sevenDaysAgo).length || 0

    // Calculate revenue from purchase transactions
    const totalRevenue = transactions?.filter(t => t.type === 'purchase' && t.status === 'completed')
        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0

    const weeklyRevenue = transactions?.filter(t =>
        t.type === 'purchase' &&
        t.status === 'completed' &&
        new Date(t.created_at) >= sevenDaysAgo
    ).reduce((sum, t) => sum + (t.amount || 0), 0) || 0

    // Calculate additional metrics
    const completedBookingsWithPrice = recentBookings?.filter(b => b.status === 'completed' && b.total_price) || []
    const averageBookingValue = completedBookingsWithPrice.length > 0
        ? completedBookingsWithPrice.reduce((sum, b) => sum + (b.total_price || 0), 0) / completedBookingsWithPrice.length
        : 0

    // Calculate peak booking times (by hour of day)
    const bookingHours = recentBookings?.map(b => {
        const date = new Date(b.created_at)
        return date.getHours()
    }) || []

    const hourCounts: { [key: number]: number } = {}
    bookingHours.forEach(hour => {
        hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })

    const peakHour = Object.keys(hourCounts).length > 0
        ? Object.entries(hourCounts).reduce((a, b) =>
            hourCounts[Number(a[0])] > hourCounts[Number(b[0])] ? a : b
        )[0]
        : undefined

    // Calculate client retention (users who made multiple bookings)
    const clientBookingCounts: { [key: string]: number } = {}
    recentBookings?.forEach(b => {
        // We'd need client_id from bookings, but for now use a placeholder
        // This would require fetching bookings with client_id
    })

    // Calculate popular service types (would need service_type data from bookings)

    // Process data for charts
    const userGrowthData = processTimeSeriesData(recentUsers || [], 'created_at', 30)
    const bookingTrendsData = processTimeSeriesData(recentBookings || [], 'created_at', 30)
    const revenueData = processRevenueData(transactions || [], 30)

    // Booking status distribution
    const bookingStatusData = [
        { name: 'Pending', value: pendingBookings || 0, color: '#f59e0b' },
        { name: 'Completed', value: completedBookings || 0, color: '#22c55e' },
        { name: 'Other', value: Math.max(0, (totalBookings || 0) - (pendingBookings || 0) - (completedBookings || 0)), color: '#6b7280' },
    ].filter(d => d.value > 0)

    // User role distribution
    const userRoleData = [
        { name: 'Clients', value: totalClients || 0, color: '#3b82f6' },
        { name: 'Talents', value: totalTalents || 0, color: '#df2531' },
    ].filter(d => d.value > 0)

    return (
        <AnalyticsClient
            stats={{
                totalUsers: totalUsers || 0,
                totalClients: totalClients || 0,
                totalTalents: totalTalents || 0,
                totalBookings: totalBookings || 0,
                pendingBookings: pendingBookings || 0,
                completedBookings: completedBookings || 0,
                totalRevenue,
                weeklyUsers,
                weeklyBookings,
                weeklyRevenue,
                averageBookingValue,
                peakHour: Number(peakHour),
            }}
            userGrowthData={userGrowthData}
            bookingTrendsData={bookingTrendsData}
            revenueData={revenueData}
            bookingStatusData={bookingStatusData}
            userRoleData={userRoleData}
        />
    )
}

// Helper function to process time series data
function processTimeSeriesData(data: any[], dateField: string, days: number) {
    const result: { date: string; count: number }[] = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split('T')[0]
        const count = data.filter(item => {
            const itemDate = new Date(item[dateField]).toISOString().split('T')[0]
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
function processRevenueData(transactions: any[], days: number) {
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
