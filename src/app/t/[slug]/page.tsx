import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import { TalentProfileClient } from '@/app/talent/[id]/TalentProfileClient'
import { generateTalentOpenGraphMetadata } from '@/lib/og-metadata'
import { createApiClient } from '@/lib/supabase/api'
import { createClient } from '@/lib/supabase/server'

// Create admin client lazily with service role key for bypassing RLS
function getAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('Missing Supabase env vars for admin client')
        return null
    }

    return createAdminClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false }
    })
}

// Cache talent profile data for 1 hour
// This includes basic profile and their service menus
const getCachedTalentProfile = unstable_cache(
    async (slug: string) => {
        const supabase = createApiClient()
        
        // Priority: username > slug column > id
        const { data: talent, error } = await supabase
            .from('profiles')
            .select(`
                *,
                talent_menus (
                    *,
                    service_type:service_types(*)
                )
            `)
            .eq('role', 'talent')
            .or(`username.eq."${slug}",slug.eq."${slug}",id.eq."${slug}"`)
            .maybeSingle()

        if (error || !talent) {
            return null
        }

        return talent
    },
    ['talent-profile'],
    { revalidate: 3600, tags: ['talents'] }
)

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const talent = await getCachedTalentProfile(slug)

    if (!talent) {
        return generateTalentOpenGraphMetadata('Talent Profile', undefined, slug)
    }

    return generateTalentOpenGraphMetadata(
        talent.display_name || 'Talent Profile',
        undefined,
        talent.username || null,
        talent.id
    )
}

export default async function TalentProfileBySlugPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    // Auth check (fast)
    const { data: { user } } = await supabase.auth.getUser()

    // Get cached talent profile (includes menus)
    const talent = await getCachedTalentProfile(slug)

    if (!talent) {
        notFound()
    }

    // Fetch remaining data in parallel
    const [mediaResult, reviewsResult, userContextResult] = await Promise.all([
        // 1. Fetch media (respecting RLS or using admin if authenticated)
        user ? (async () => {
            const supabaseAdmin = getAdminClient()
            if (!supabaseAdmin) return supabase.from('media').select('id, talent_id, url, type, is_premium, unlock_price, created_at').eq('talent_id', talent.id).or('moderation_status.is.null,moderation_status.eq.approved,moderation_status.eq.pending').order('created_at', { ascending: false })
            return supabaseAdmin.from('media').select('id, talent_id, url, type, is_premium, unlock_price, created_at').eq('talent_id', talent.id).or('moderation_status.is.null,moderation_status.eq.approved,moderation_status.eq.pending').order('created_at', { ascending: false })
        })() : supabase.from('media').select('id, talent_id, url, type, is_premium, unlock_price, created_at').eq('talent_id', talent.id).or('moderation_status.is.null,moderation_status.eq.approved,moderation_status.eq.pending').order('created_at', { ascending: false }),

        // 2. Fetch reviews
        supabase.from('reviews').select(`*, client:profiles!reviews_client_id_fkey(id, display_name, avatar_url)`).eq('talent_id', talent.id).order('created_at', { ascending: false }),

        // 3. Fetch current user context
        user ? Promise.all([
            supabase.from('profiles').select('*').eq('id', user.id).single(),
            supabase.from('wallets').select('*').eq('user_id', user.id).single()
        ]) : Promise.resolve([null, null])
    ])

    const media = mediaResult.data
    const allReviews = reviewsResult.data
    const [profileResult, walletResult] = userContextResult as any
    const currentUserProfile = profileResult?.data || null
    const wallet = walletResult?.data || null

    // Calculate statistics
    let averageRating = 0
    let reviewCount = 0
    if (allReviews && allReviews.length > 0) {
        reviewCount = allReviews.length
        averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    }

    // Map talent_menus to expected structure
    const mappedMenus = (talent.talent_menus || []).map((m: any) => ({
        ...m,
        service_type: m.service_type
    }))

    const talentWithMedia = {
        ...talent,
        media: media || [],
        talent_menus: mappedMenus
    }

    // Track profile view and update activity status (async/background)
    if (talent.id) {
        const supabaseAdmin = getAdminClient()
        if (supabaseAdmin) {
            // Record view
            supabaseAdmin.from('profile_views').insert({
                talent_id: talent.id,
                viewer_id: user?.id || null,
                viewer_role: user ? (currentUserProfile?.role || 'client') : 'anonymous'
            }).then(({ error }) => {
                if (error) console.error('[TalentProfile] Error tracking view:', error)
            })

            // Update viewer activity
            if (user?.id) {
                supabaseAdmin.from('profiles')
                    .update({ last_active_at: new Date().toISOString() })
                    .eq('id', user.id)
                    .then(({ error }) => {
                        if (error) console.error('[TalentProfile] Error updating activity:', error)
                    })
            }
        }
    }

    return (
        <TalentProfileClient
            talent={{
                ...talentWithMedia,
                reviews: allReviews || [], // Pass all reviews for accurate distribution calculation
                average_rating: averageRating,
                review_count: reviewCount
            }}
            currentUser={currentUserProfile}
            wallet={wallet}
            userId={user?.id || ''}
        />
    )
}
