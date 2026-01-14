import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getTalentUrl } from '@/lib/talent-url'
import { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: talent } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', id)
    .single()

  return {
    title: talent?.display_name ? `${talent.display_name} - Nego` : 'Talent Profile - Nego',
    description: `View ${talent?.display_name || 'talent'}'s profile and services on Nego`,
  }
}

// Legacy route - redirects to new /t/[slug] format
export default async function TalentProfilePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  // First check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch talent profile to get username/display_name for slug
  const { data: talent, error } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .eq('id', id)
    .eq('role', 'talent')
    .single()

  if (error || !talent) {
    notFound()
  }

  // Redirect to the new slug-based URL
  const newUrl = getTalentUrl(talent)
  
  // Only redirect if the new URL is different (uses /t/ prefix)
  if (newUrl.startsWith('/t/')) {
    redirect(newUrl)
  }
  
  // If for some reason the talent URL still resolves to UUID format, 
  // redirect back to /t/[id] which will handle it
  redirect(`/t/${id}`)
}
