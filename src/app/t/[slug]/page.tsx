import { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { TalentProfileClient } from '@/app/talent/[id]/TalentProfileClient'
import { generateTalentOpenGraphMetadata } from '@/lib/og-metadata'
import { createApiClient } from '@/lib/supabase/api'
import { createClient, getServerProfile } from '@/lib/supabase/server'
import { talentSlug } from '@/lib/talent-url'
import type { Media, Profile, Review, ServiceType, TalentMenu, Wallet } from '@/types/database'

type TalentProfileRow = Profile & {
    talent_menus?: Array<TalentMenu & { service_type?: ServiceType | null }>
}

type ReviewWithClient = Review & {
    client?: Profile
}

const BOT_USER_AGENT_REGEX = /bot|crawler|spider|slurp|facebookexternalhit|twitterbot|whatsapp|telegram|discord|linkedinbot|headless|curl|wget|python-requests|go-http-client|axios|node-fetch|postman|insomnia/i
const LAST_ACTIVE_THROTTLE_MS = 5 * 60 * 1000

function recordProfileVisit(
    talentId: string,
    userId: string | undefined,
    viewerRole: string | undefined,
    lastActiveAt: string | null | undefined
) {
    const supabaseAdmin = createApiClient()
    supabaseAdmin.from('profile_views').insert({
        talent_id: talentId,
        viewer_id: userId || null,
        viewer_role: userId ? (viewerRole || 'client') : 'anonymous',
    }).then(({ error }) => {
        if (error) console.error('[TalentProfile] Error tracking view:', error)
    })

    if (userId) {
        const lastActiveMs = lastActiveAt ? new Date(lastActiveAt).getTime() : 0
        if (!lastActiveMs || Date.now() - lastActiveMs > LAST_ACTIVE_THROTTLE_MS) {
            supabaseAdmin.from('profiles')
                .update({ last_active_at: new Date().toISOString() })
                .eq('id', userId)
                .then(({ error }) => {
                    if (error) console.error('[TalentProfile] Error updating activity:', error)
                })
        }
    }
}

const getCachedTalentSlugMap = unstable_cache(
    async (): Promise<Record<string, string>> => {
        const supabase = createApiClient()
        const { data: candidates, error } = await supabase
            .from('profiles')
            .select('id, username, display_name')
            .eq('role', 'talent')

        if (error || !candidates) {
            throw error || new Error('Failed to load talent slug map')
        }

        const slugMap: Record<string, string> = {}
        for (const candidate of candidates) {
            slugMap[talentSlug(candidate)] = candidate.id
        }
        return slugMap
    },
    ['talent-slug-map-v1'],
    { revalidate: 3600, tags: ['talents'] }
)

// Cache talent profile data for 1 hour
// This includes basic profile and their service menus
async function getTalentProfile(slug: string) {
    // Reject obvious bot/scanner probes (valid talent slugs never contain dots)
    if (!slug || slug.includes('.')) {
        return { talent: null, failed: false }
    }

    const supabase = createApiClient()

    const talentProfileQuery = `
                *,
                talent_menus (
                    *,
                    service_type:service_types(*)
                )
            `

    // Validate if slug is a UUID to prevent Postgres type mismatch errors when querying the id column
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
    const orFilter = isUuid
        ? `username.eq."${slug}",slug.eq."${slug}",id.eq."${slug}"`
        : `username.eq."${slug}",slug.eq."${slug}"`

    // Priority: username > persisted slug column > id
    const { data: talent, error } = await supabase
        .from('profiles')
        .select(talentProfileQuery)
        .eq('role', 'talent')
        .or(orFilter)
        .maybeSingle()

    if (talent) {
        return { talent, failed: false }
    }

    if (error) {
        console.error(`[TalentProfile] Database error for slug "${slug}":`, error)
        return { talent: null, failed: true }
    }

    let matchedId: string | undefined
    try {
        const slugMap = await getCachedTalentSlugMap()
        matchedId = slugMap[slug]
    } catch {
        return { talent: null, failed: true }
    }

    if (!matchedId) {
        return { talent: null, failed: false }
    }

    const { data: fallbackTalent, error: fallbackError } = await supabase
        .from('profiles')
        .select(talentProfileQuery)
        .eq('role', 'talent')
        .eq('id', matchedId)
        .maybeSingle()

    if (fallbackError || !fallbackTalent) {
        return { talent: null, failed: Boolean(fallbackError) }
    }

    return { talent: fallbackTalent, failed: false }
}

const getCachedTalentMedia = unstable_cache(
    async (talentId: string, includePremium: boolean): Promise<Media[]> => {
        const supabase = createApiClient()
        let query = supabase
            .from('media')
            .select('id, talent_id, url, type, is_premium, unlock_price, created_at')
            .eq('talent_id', talentId)
            .or('moderation_status.is.null,moderation_status.eq.approved,moderation_status.eq.pending')
            .order('created_at', { ascending: false })

        if (!includePremium) {
            query = query.eq('is_premium', false)
        }

        const { data, error } = await query
        if (error) {
            throw error
        }
        return (data ?? []) as Media[]
    },
    ['talent-media-v1'],
    { revalidate: 120, tags: ['talents'] }
)

const getCachedTalentReviews = unstable_cache(
    async (talentId: string): Promise<ReviewWithClient[]> => {
        const supabase = createApiClient()
        const { data, error } = await supabase
            .from('reviews')
            .select(`*, client:profiles!reviews_client_id_fkey(id, display_name, avatar_url)`)
            .eq('talent_id', talentId)
            .order('created_at', { ascending: false })

        if (error) {
            throw error
        }
        return (data ?? []) as ReviewWithClient[]
    },
    ['talent-reviews-v1'],
    { revalidate: 300, tags: ['talents'] }
)

const getCachedTalentProfile = async (slug: string) => {
    // The key carries the shape version: entries written by an earlier shape
    // outlive the deploy that changed it, and reading one as this shape turns
    // every cached profile into a 404 for the rest of the hour.
    const cached = await unstable_cache(
        async () => getTalentProfile(slug),
        ['talent-profile-v2', slug],
        { revalidate: 3600, tags: ['talents'] }
    )()

    // A cached "no such talent" is authoritative and stays cached. A cached
    // failure is not: caching a transient database error as a miss pinned live
    // profiles to a 404 for the full hour, so that one is read again.
    const result = cached?.failed === false ? cached : await getTalentProfile(slug)

    return result.talent
}

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
    const requestHeaders = await headers()
    const userAgent = requestHeaders.get('user-agent') || ''
    const isBot = BOT_USER_AGENT_REGEX.test(userAgent)

    // Skip auth/wallet lookup for bots/crawlers so link previews cost zero auth calls
    const { profile: currentUserProfile, user } = isBot
        ? { profile: null, user: null }
        : await getServerProfile()

    // Get cached talent profile (includes menus)
    const talent = await getCachedTalentProfile(slug)

    if (!talent) {
        notFound()
    }

    // Fetch remaining data in parallel (cached media & reviews; uncached wallet only for signed-in users)
    const [media, allReviews, wallet] = await Promise.all([
        getCachedTalentMedia(talent.id, Boolean(user)).catch(() => [] as Media[]),
        getCachedTalentReviews(talent.id).catch(() => [] as ReviewWithClient[]),
        user ? (async () => {
            const supabase = await createClient()
            const { data } = await supabase.from('wallets').select('*').eq('user_id', user.id).single()
            return data as Wallet | null
        })() : Promise.resolve(null),
    ])

    let averageRating = 0
    let reviewCount = 0
    if (allReviews && allReviews.length > 0) {
        reviewCount = allReviews.length
        averageRating = allReviews.reduce((sum: number, r) => sum + r.rating, 0) / reviewCount
    }

    // Map talent_menus to expected structure
    const mappedMenus = ((talent as TalentProfileRow).talent_menus || []).map((m) => ({
        ...m,
        service_type: m.service_type || null
    }))

    const talentWithMedia = {
        ...talent,
        media: media || [],
        talent_menus: mappedMenus
    }

    // Track profile view and throttled activity status for human visitors only
    if (talent.id && !isBot) {
        recordProfileVisit(talent.id, user?.id, currentUserProfile?.role, currentUserProfile?.last_active_at)
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
