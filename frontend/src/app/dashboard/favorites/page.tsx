import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FavoritesClient } from './FavoritesClient'

export const metadata = {
  title: 'Favorites - Nego',
  description: 'Your saved talents on Nego',
}

export default async function FavoritesPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch user profile to get role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = profile?.role === 'talent' ? 'talent' : 'client'

  return (
    <FavoritesClient 
      userId={user.id}
      userRole={userRole}
    />
  )
}
