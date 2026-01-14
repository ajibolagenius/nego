import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TalentDashboardClient } from './TalentDashboardClient'

export const metadata = {
  title: 'Talent Dashboard - Nego',
  description: 'Manage your services and bookings on Nego',
}

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
    .from('talent_menus')
    .select(`
      *,
      service_type:service_types(*)
    `)
    .eq('talent_id', user.id)
    .order('created_at', { ascending: true })

  // Fetch all available services for adding new ones
  const { data: allServices } = await supabase
    .from('service_types')
    .select('*')
    .eq('is_active', true)
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

  // Fetch earnings breakdown (gifts received, content unlocks)
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .gt('amount', 0)
    .in('type', ['gift', 'premium_unlock', 'booking'])
    .order('created_at', { ascending: false })

  // Fetch gifts received
  const { data: giftsReceived } = await supabase
    .from('gifts')
    .select('*, sender:profiles!gifts_sender_id_fkey(display_name, avatar_url)')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <TalentDashboardClient 
      user={user} 
      profile={profile}
      menu={menu || []}
      allServices={allServices || []}
      media={media || []}
      bookings={bookings || []}
      wallet={wallet}
      transactions={transactions || []}
      giftsReceived={giftsReceived || []}
    />
  )
}
