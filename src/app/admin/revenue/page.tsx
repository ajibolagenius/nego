import { createApiClient } from '@/lib/supabase/api'
import { RevenueClient } from './RevenueClient'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function RevenuePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify admin role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        redirect('/dashboard')
    }

    const apiClient = createApiClient()

    // Fetch all confirmed and completed bookings for revenue tracking
    const { data: bookings, error } = await apiClient
        .from('bookings')
        .select(`
            *,
            talent:talent_id(id, display_name, avatar_url),
            client:client_id(id, display_name, avatar_url)
        `)
        .in('status', ['confirmed', 'completed'])
        .order('created_at', { ascending: false })

    if (error) {
        console.error('[RevenuePage] Error fetching bookings:', error)
    }

    return <RevenueClient initialBookings={bookings || []} />
}
