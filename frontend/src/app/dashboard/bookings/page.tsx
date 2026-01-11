import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookingsClient } from './BookingsClient'

export const metadata = {
  title: 'My Bookings - Nego',
  description: 'View and manage your bookings on Nego',
}

export default async function BookingsPage() {
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

  // Fetch bookings based on role
  const isClient = profile?.role === 'client'
  
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      talent:profiles!bookings_talent_id_fkey(id, display_name, avatar_url, location),
      client:profiles!bookings_client_id_fkey(id, display_name, avatar_url)
    `)
    .eq(isClient ? 'client_id' : 'talent_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <BookingsClient 
      user={user} 
      profile={profile}
      bookings={bookings || []}
      isClient={isClient}
    />
  )
}
