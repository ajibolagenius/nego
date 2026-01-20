import { createApiClient } from '@/lib/supabase/api'
import { TalentsClient } from './TalentsClient'
import type { Profile } from '@/types/database'
import { generateOpenGraphMetadata } from '@/lib/og-metadata'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

export const metadata = generateOpenGraphMetadata({
    title: 'Talents - Nego Admin',
    description: 'Manage talent accounts and verification status',
    url: `${APP_URL}/admin/talents`,
    image: `${APP_URL}/og-image.png`,
    type: 'website',
})

export default async function TalentsPage() {
    // Use API client (service role) to bypass RLS for admin operations
    const supabase = createApiClient()

    // Fetch all talents with their profile information
    const { data: talents, error } = await supabase
        .from('profiles')
        .select(`
            id,
            role,
            username,
            full_name,
            display_name,
            avatar_url,
            location,
            bio,
            is_verified,
            status,
            starting_price,
            admin_notes,
            created_at,
            updated_at
        `)
        .eq('role', 'talent')
        .order('created_at', { ascending: false })
        .limit(1000) // Reasonable limit for client-side pagination

    // Log errors for debugging
    if (error) {
        console.error('[TalentsPage] Error fetching talents:', error)
    }

    const talentsList: Profile[] = (talents || []) as Profile[]

    console.log('[TalentsPage] Loaded talents:', talentsList.length)

    return <TalentsClient talents={talentsList} />
}
