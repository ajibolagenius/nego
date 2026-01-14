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

  // Fetch featured talents (role = 'talent', limit 6)
  const { data: featuredTalents } = await supabase
    .from('profiles')
    .select(`
      id,
      display_name,
      avatar_url,
      location,
      status,
      starting_price,
      talent_menus (
        price,
        is_active
      )
    `)
    .eq('role', 'talent')
    .limit(6)

  // Transform data to include starting_price
  const talents = (featuredTalents || []).map(talent => {
    // Get the minimum active price from talent_menus, or fallback to starting_price
    const activePrices = talent.talent_menus?.filter((m: { is_active: boolean; price: number }) => m.is_active).map((m: { price: number }) => m.price) || []
    const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : (talent.starting_price || 100000)
    
    return {
      id: talent.id,
      display_name: talent.display_name || 'Talent',
      avatar_url: talent.avatar_url,
      location: talent.location || 'Lagos',
      status: (talent.status === 'online' ? 'online' : 'offline') as 'online' | 'offline',
      starting_price: minPrice
    }
  })

  return <DashboardClient user={user} profile={profile} wallet={wallet} featuredTalents={talents} />
}
