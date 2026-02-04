import { generateOpenGraphMetadata } from '@/lib/og-metadata'
import { createApiClient } from '@/lib/supabase/api'
import { ContentModerationClient } from './ContentModerationClient'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

export const metadata = generateOpenGraphMetadata({
    title: 'Content Moderation - Admin',
    description: 'Moderate talent content and media',
    url: `${APP_URL}/admin/content`,
    type: 'website',
    pageType: 'dashboard',
})

export default async function ContentModerationPage() {
    const supabase = createApiClient()

    // Fetch pending media for moderation
    const { data: pendingMedia } = await supabase
        .from('media')
        .select(`
            *,
            talent:profiles!media_talent_id_fkey(id, display_name, username, avatar_url)
        `)
        .in('moderation_status', ['pending'])
        .order('created_at', { ascending: false })
        .limit(100)

    // Fetch flagged media
    const { data: flaggedMedia } = await supabase
        .from('media')
        .select(`
            *,
            talent:profiles!media_talent_id_fkey(id, display_name, username, avatar_url)
        `)
        .eq('flagged', true)
        .order('created_at', { ascending: false })
        .limit(100)

    // Fetch all media with moderation status
    const { data: allMedia } = await supabase
        .from('media')
        .select(`
            *,
            talent:profiles!media_talent_id_fkey(id, display_name, username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(500)

    return (
        <ContentModerationClient
            pendingMedia={pendingMedia || []}
            flaggedMedia={flaggedMedia || []}
            allMedia={allMedia || []}
        />
    )
}
