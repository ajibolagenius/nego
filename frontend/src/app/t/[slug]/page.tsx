import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect, notFound } from 'next/navigation'
import { TalentProfileClient } from '@/app/talent/[id]/TalentProfileClient'
import { Metadata } from 'next'

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
    .select('display_name, username')
    .eq('role', 'talent')
    .or(`username.eq.${slug}`)
    .single()

  return {
    title: talent?.display_name ? `${talent.display_name} - Nego` : 'Talent Profile - Nego',
    description: `View ${talent?.display_name || 'talent'}'s profile and services on Nego`,
  }
}

export default async function TalentProfileBySlugPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // First try exact username match (without media)
  let { data: talent } = await supabase
    .from('profiles')
    .select(`
      *,
      talent_menus (
        id,
        price,
        is_active,
        service_type:service_types (
          id,
          name,
          icon,
          description
        )
      )
    `)
    .eq('role', 'talent')
    .eq('username', slug)
    .single()

  // If not found by username, try matching by generated slug from display_name
  if (!talent) {
    const { data: allTalents } = await supabase
      .from('profiles')
      .select(`
        *,
        talent_menus (
          id,
          price,
          is_active,
          service_type:service_types (
            id,
            name,
            icon,
            description
          )
        )
      `)
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
      .select(`
        *,
        talent_menus (
          id,
          price,
          is_active,
          service_type:service_types (
            id,
            name,
            icon,
            description
          )
        )
      `)
      .eq('id', slug)
      .eq('role', 'talent')
      .single()
    
    talent = talentById
  }

  if (!talent) {
    notFound()
  }

  // Fetch ALL media (including premium) using admin client to bypass RLS
  let media = null
  const supabaseAdmin = getAdminClient()
  
  if (supabaseAdmin) {
    const { data: mediaData } = await supabaseAdmin
      .from('media')
      .select('id, talent_id, url, type, is_premium, unlock_price, created_at')
      .eq('talent_id', talent.id)
      .order('created_at', { ascending: false })
    media = mediaData
  } else {
    // Fallback to regular client (will only get non-premium media due to RLS)
    const { data: mediaData } = await supabase
      .from('media')
      .select('id, talent_id, url, type, is_premium, unlock_price, created_at')
      .eq('talent_id', talent.id)
      .order('created_at', { ascending: false })
    media = mediaData
  }

  // Attach media to talent object
  const talentWithMedia = {
    ...talent,
    media: media || []
  }

  // Fetch reviews for this talent
  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      *,
      client:profiles!reviews_client_id_fkey(id, display_name, avatar_url)
    `)
    .eq('talent_id', talent.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Calculate average rating
  let averageRating = 0
  let reviewCount = 0
  if (reviews && reviews.length > 0) {
    reviewCount = reviews.length
    averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
  }

  // Fetch current user's profile and wallet
  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: wallet } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <TalentProfileClient 
      talent={{
        ...talentWithMedia,
        reviews: reviews || [],
        average_rating: averageRating,
        review_count: reviewCount
      }} 
      currentUser={currentUserProfile}
      wallet={wallet}
      userId={user.id}
    />
  )
}
