import { createApiClient } from '@/lib/supabase/api'
import { DisputesClient } from './DisputesClient'
import { generateOpenGraphMetadata } from '@/lib/og-metadata'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

export const metadata = generateOpenGraphMetadata({
    title: 'Disputes - Admin',
    description: 'Manage and resolve disputes',
    url: `${APP_URL}/admin/disputes`,
    type: 'website',
    pageType: 'dashboard',
})

export default async function DisputesPage() {
    const supabase = createApiClient()

    // Fetch all disputes with related data
    const { data: disputes } = await supabase
        .from('disputes')
        .select(`
            *,
            booking:bookings(id, status, total_price, created_at),
            client:profiles!disputes_client_id_fkey(id, display_name, username, avatar_url),
            talent:profiles!disputes_talent_id_fkey(id, display_name, username, avatar_url),
            resolver:profiles!disputes_resolved_by_fkey(id, display_name)
        `)
        .order('created_at', { ascending: false })
        .limit(200)

    return <DisputesClient initialDisputes={disputes || []} />
}
