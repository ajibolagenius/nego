import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './DashboardClient'

export const metadata = {
  title: 'Dashboard - Nego',
  description: 'Your personal dashboard on Nego',
}

export default async function DashboardPage() {
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

  // Fetch wallet
  const { data: wallet } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Fetch featured talents (role = 'talent', is_active = true, limit 4)
  const { data: featuredTalents } = await supabase
    .from('profiles')
    .select(`
      id,
      display_name,
      avatar_url,
      location,
      is_online,
      talent_menus (
        price
      )
    `)
    .eq('role', 'talent')
    .eq('is_active', true)
    .limit(4)

  // Transform data to include starting_price
  const talents = (featuredTalents || []).map(talent => ({
    id: talent.id,
    display_name: talent.display_name || 'Unknown',
    avatar_url: talent.avatar_url,
    location: talent.location || 'Nigeria',
    status: talent.is_online ? 'online' : 'offline',
    starting_price: talent.talent_menus?.[0]?.price || 50000
  }))

  return <DashboardClient user={user} profile={profile} wallet={wallet} featuredTalents={talents} />
}
