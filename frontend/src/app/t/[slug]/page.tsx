import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TalentProfileClient } from '@/app/talent/[id]/TalentProfileClient'
import { Metadata } from 'next'

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
  
  // Try to find talent by username first, then by slug match
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

  // First try exact username match
  let { data: talent, error } = await supabase
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
      ),
      media (
        id,
        url,
        type,
        is_premium,
        unlock_price
      )
    `)
    .eq('role', 'talent')
    .eq('username', slug)
    .single()

  // If not found by username, try matching by generated slug from display_name
  if (!talent) {
    // Fetch all talents and find by slug match
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
        ),
        media (
          id,
          url,
          type,
          is_premium,
          unlock_price
        )
      `)
      .eq('role', 'talent')

    talent = allTalents?.find(t => {
      const generatedSlug = t.display_name ? generateSlug(t.display_name) : null
      return generatedSlug === slug || t.username === slug
    }) || null
  }

  // If still not found, check if it's a UUID and redirect to /talent/[id]
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!talent && uuidRegex.test(slug)) {
    redirect(`/talent/${slug}`)
  }

  if (!talent) {
    notFound()
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
        ...talent,
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
