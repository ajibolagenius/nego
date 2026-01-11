import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TalentDashboardClient } from './TalentDashboardClient'

export default async function TalentDashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Check if user is a talent
  if (profile?.role !== 'talent') {
    redirect('/dashboard')
  }

  // Fetch talent services (menu)
  const { data: menu } = await supabase
    .from('talent_services')
    .select(`
      *,
      service:services(*)
    `)
    .eq('talent_id', user.id)
    .order('created_at', { ascending: true })

  // Fetch all available services for adding new ones
  const { data: allServices } = await supabase
    .from('services')
    .select('*')
    .order('name', { ascending: true })

  // Fetch talent media
  const { data: media } = await supabase
    .from('media')
    .select('*')
    .eq('talent_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch recent bookings for the talent
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      client:profiles!bookings_client_id_fkey(display_name, avatar_url)
    `)
    .eq('talent_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch wallet
  const { data: wallet } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <TalentDashboardClient 
      user={user} 
      profile={profile}
      menu={menu || []}
      allServices={allServices || []}
      media={media || []}
      bookings={bookings || []}
      wallet={wallet}
    />
  )
}
