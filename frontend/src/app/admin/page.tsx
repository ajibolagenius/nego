import { createClient } from '@/lib/supabase/server'
import { AdminDashboardClient } from './AdminDashboardClient'

export const metadata = {
  title: 'Admin Dashboard - Nego',
  description: 'Nego Admin Dashboard',
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()

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
    supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('type', 'payout').eq('status', 'pending'),
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
