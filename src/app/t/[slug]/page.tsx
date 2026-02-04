import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect, notFound } from 'next/navigation'
import { TalentProfileClient } from '@/app/talent/[id]/TalentProfileClient'
import { Metadata } from 'next'
import { generateTalentOpenGraphMetadata } from '@/lib/og-metadata'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

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

interface PageProps {
    params: Promise<{ slug: string }>
}

// Helper to generate slug from display_name
function generateSlug(displayName: string): string {
    return displayName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const supabase = await createClient()

    // Try to find talent by username first
    const { data: talent } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url')
        .eq('role', 'talent')
        .or(`username.eq.${slug}`)
        .single()

    if (!talent) {
        return generateTalentOpenGraphMetadata('Talent Profile', undefined, slug)
    }

    // Prefer username if available, otherwise use ID for OG image generation
    return generateTalentOpenGraphMetadata(
        talent.display_name || 'Talent Profile',
        undefined, // Don't pass image URL, let the OG route fetch it
        talent.username || null, // Pass null if no username, so OG route uses ID
        talent.id
    )
}

export default async function TalentProfileBySlugPage({ params }: PageProps) {
    const { slug } = await params
    const supabase = await createClient()

    // Check if user is authenticated (optional - allows public viewing)
    const { data: { user } } = await supabase.auth.getUser()

    // First try exact username match (without media)
    let { data: talent } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'talent')
        .eq('username', slug)
        .single()

    // If not found by username, try matching by generated slug from display_name
    if (!talent) {
        const { data: allTalents } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'talent')

        talent = allTalents?.find(t => {
            const generatedSlug = t.display_name ? generateSlug(t.display_name) : null
            return generatedSlug === slug || t.username === slug
        }) || null
    }

    // If still not found, check if it's a UUID and try to find by ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!talent && uuidRegex.test(slug)) {
        // Try to find talent by UUID
        const { data: talentById } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', slug)
            .eq('role', 'talent')
            .single()

        talent = talentById
    }

    if (!talent) {
        notFound()
    }

    // Fetch talent_menus separately to ensure proper data structure
    // Use same query structure as dashboard for consistency
    const { data: talentMenus, error: menusError } = await supabase
        .from('talent_menus')
        .select(`
            *,
            service_type:service_types(*)
        `)
        .eq('talent_id', talent.id)
        .order('created_at', { ascending: true })

    if (menusError) {
        console.error('[TalentProfile] Error fetching talent_menus:', menusError)
    }

    // Fetch media - use admin client only for authenticated users to bypass RLS
    // For non-authenticated users, regular client will only return free media (due to RLS)
    // This allows public viewing of free media while protecting premium content
    let media = null

    if (user) {
        // Authenticated users - use admin client to see all media (including premium)
        // The client will filter based on unlocked status
        const supabaseAdmin = getAdminClient()
        if (supabaseAdmin) {
            const { data: mediaData } = await supabaseAdmin
                .from('media')
                .select('id, talent_id, url, type, is_premium, unlock_price, created_at')
                .eq('talent_id', talent.id)
                .or('moderation_status.is.null,moderation_status.eq.approved,moderation_status.eq.pending')
                .order('created_at', { ascending: false })
            media = mediaData
        } else {
            // Fallback to regular client if admin client unavailable
            const { data: mediaData } = await supabase
                .from('media')
                .select('id, talent_id, url, type, is_premium, unlock_price, created_at')
                .eq('talent_id', talent.id)
                .or('moderation_status.is.null,moderation_status.eq.approved,moderation_status.eq.pending')
                .order('created_at', { ascending: false })
            media = mediaData
        }
    } else {
        // Non-authenticated users - RLS will only return free media
        // Hide rejected media from public view
        const { data: mediaData } = await supabase
            .from('media')
            .select('id, talent_id, url, type, is_premium, unlock_price, created_at')
            .eq('talent_id', talent.id)
            .or('moderation_status.is.null,moderation_status.eq.approved,moderation_status.eq.pending')
            .order('created_at', { ascending: false })
        media = mediaData
    }

    // Attach media and services to talent object with proper structure
    // Map talent_menus to match expected structure (same as dashboard)
    const mappedMenus = (talentMenus || []).map((m: any) => {
        // service_types(*) returns an object, not an array
        const serviceType = m.service_type
        return {
            id: m.id,
            talent_id: m.talent_id || talent.id,
            service_type_id: m.service_type_id,
            price: m.price,
            is_active: m.is_active,
            created_at: m.created_at,
            service_type: serviceType
        }
    })

    const talentWithMedia = {
        ...talent,
        media: media || [],
        talent_menus: mappedMenus
    }

    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
        console.log('[TalentProfile] Talent data:', {
            id: talent.id,
            display_name: talent.display_name,
            username: talent.username,
            bio: talent.bio,
            location: talent.location,
            avatar_url: talent.avatar_url,
            mediaCount: media?.length || 0,
            menusCount: mappedMenus.length,
            activeMenusCount: mappedMenus.filter(m => m.is_active).length
        })
    }

    // Fetch all reviews for this talent to calculate accurate statistics
    const { data: allReviews } = await supabase
        .from('reviews')
        .select(`
      *,
      client:profiles!reviews_client_id_fkey(id, display_name, avatar_url)
    `)
        .eq('talent_id', talent.id)
        .order('created_at', { ascending: false })

    // Calculate average rating and count from all reviews
    let averageRating = 0
    let reviewCount = 0
    if (allReviews && allReviews.length > 0) {
        reviewCount = allReviews.length
        averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    }

    // Fetch current user's profile and wallet (only if authenticated)
    let currentUserProfile = null
    let wallet = null

    if (user) {
        const [profileResult, walletResult] = await Promise.all([
            supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single(),
            supabase
                .from('wallets')
                .select('*')
                .eq('user_id', user.id)
                .single()
        ])

        currentUserProfile = profileResult.data
        wallet = walletResult.data
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
