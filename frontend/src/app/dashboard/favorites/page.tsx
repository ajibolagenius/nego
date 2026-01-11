import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FavoritesClient } from './FavoritesClient'

export default async function FavoritesPage() {
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

  // For now, favorites will be stored in localStorage on the client
  // In production, you'd have a favorites table in the database
  
  // Fetch all talents for now (we'll filter on client side based on favorites)
  const { data: talents } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'talent')
    .order('display_name', { ascending: true })

  return (
    <FavoritesClient 
      user={user} 
      profile={profile} 
      talents={talents || []}
    />
  )
}
