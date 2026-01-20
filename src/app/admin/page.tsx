import { createApiClient } from '@/lib/supabase/api'
import { AdminDashboardClient } from './AdminDashboardClient'
import { generateOpenGraphMetadata } from '@/lib/og-metadata'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

export const metadata = generateOpenGraphMetadata({
    title: 'Admin Dashboard - Nego',
    description: 'Nego Admin Dashboard - Manage platform operations, verifications, and payouts',
    url: `${APP_URL}/admin`,
    type: 'website',
    pageType: 'admin',
})

export default async function AdminDashboardPage() {
    // Use API client (service role) to bypass RLS for admin operations
    const supabase = createApiClient()

    // Fetch initial stats
    const [
        { count: pendingVerifications },
        { count: totalUsers },
        { count: totalBookings },
        { count: pendingPayouts },
    ] = await Promise.all([
        supabase.from('verifications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('withdrawal_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ])

    return (
        <AdminDashboardClient
            initialPendingVerifications={pendingVerifications || 0}
            initialTotalUsers={totalUsers || 0}
            initialTotalBookings={totalBookings || 0}
            initialPendingPayouts={pendingPayouts || 0}
        />
    )
}
