import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VerifyClient } from './VerifyClient'

interface VerifyPageProps {
  searchParams: Promise<{ booking?: string }>
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const supabase = await createClient()
  const params = await searchParams
  
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

  // Get booking ID from query params
  const bookingId = params.booking

  // Fetch the specific booking if provided
  let booking = null
  if (bookingId) {
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        talent:profiles!bookings_talent_id_fkey(display_name, avatar_url, location)
      `)
      .eq('id', bookingId)
      .eq('client_id', user.id)
      .single()
    booking = data
  }

  // Fetch existing verification if any
  let verification = null
  if (bookingId) {
    const { data } = await supabase
      .from('verifications')
      .select('*')
      .eq('booking_id', bookingId)
      .single()
    verification = data
  }

  return (
    <VerifyClient 
      user={user} 
      profile={profile}
      booking={booking}
      verification={verification}
    />
  )
}
