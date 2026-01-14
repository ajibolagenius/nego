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

  // Generate random limit between 8 and 16
  const randomLimit = Math.floor(Math.random() * 9) + 8 // 8 to 16

  // Fetch featured talents (random selection of talents)
  const { data: featuredTalents } = await supabase
    .from('profiles')
    .select(`
      id,
      display_name,
      username,
      avatar_url,
      location,
      status,
      starting_price,
      is_verified,
      talent_menus (
        price,
        is_active
      )
    `)
    .eq('role', 'talent')
    .limit(50) // Fetch more to randomize from

  // Shuffle and pick random talents
  const shuffledTalents = (featuredTalents || [])
    .sort(() => Math.random() - 0.5)
    .slice(0, randomLimit)

  // Fetch active bookings count
  const { count: activeBookingsCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq(profile?.role === 'talent' ? 'talent_id' : 'client_id', user.id)
    .in('status', ['pending', 'accepted', 'payment_pending'])

  // Fetch favorites count (for clients)
  const { count: favoritesCount } = await supabase
    .from('favorites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Transform data to include starting_price
  const talents = shuffledTalents.map(talent => {
    // Get the minimum active price from talent_menus, or fallback to starting_price
    const activePrices = talent.talent_menus?.filter((m: { is_active: boolean; price: number }) => m.is_active).map((m: { price: number }) => m.price) || []
    const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : (talent.starting_price || 100000)
    
    return {
      id: talent.id,
      display_name: talent.display_name || 'Talent',
      username: talent.username,
      avatar_url: talent.avatar_url,
      location: talent.location || 'Lagos',
      status: (talent.status === 'online' ? 'online' : 'offline') as 'online' | 'offline',
      starting_price: minPrice
    }
  })

  return (
    <DashboardClient 
      user={user} 
      profile={profile} 
      wallet={wallet} 
      featuredTalents={talents}
      activeBookings={activeBookingsCount || 0}
      favoritesCount={favoritesCount || 0}
    />
  )
}
