import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DisputesPageClient } from './DisputesPageClient'
import { generateOpenGraphMetadata } from '@/lib/og-metadata'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

export const metadata = generateOpenGraphMetadata({
    title: 'Disputes - Nego',
    description: 'File and manage disputes',
    url: `${APP_URL}/dashboard/disputes`,
    type: 'website',
    pageType: 'dashboard',
})

export default async function DisputesPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch user's disputes
    const { data: disputes } = await supabase
        .from('disputes')
        .select(`
            *,
            booking:bookings(id, status, total_price, created_at, talent_id, client_id),
            client:profiles!disputes_client_id_fkey(id, display_name, avatar_url),
            talent:profiles!disputes_talent_id_fkey(id, display_name, avatar_url)
        `)
        .or(`client_id.eq.${user.id},talent_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

    // Fetch user's bookings that can have disputes
    const { data: bookings } = await supabase
        .from('bookings')
        .select(`
            *,
            talent:profiles!bookings_talent_id_fkey(id, display_name, avatar_url),
            client:profiles!bookings_client_id_fkey(id, display_name, avatar_url)
        `)
        .or(`client_id.eq.${user.id},talent_id.eq.${user.id}`)
        .in('status', ['confirmed', 'completed'])
        .order('created_at', { ascending: false })
        .limit(50)

    return <DisputesPageClient userId={user.id} disputes={disputes || []} bookings={bookings || []} />
}
