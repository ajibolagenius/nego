import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { BookingDetailClient } from './BookingDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function BookingDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch booking with related data
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      *,
      talent:profiles!bookings_talent_id_fkey (
        id,
        display_name,
        avatar_url,
        location
      )
    `)
    .eq('id', id)
    .single()

  if (error || !booking) {
    notFound()
  }

  // Check if user owns this booking
  if (booking.client_id !== user.id && booking.talent_id !== user.id) {
    redirect('/dashboard')
  }

  // Fetch wallet
  const { data: wallet } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return <BookingDetailClient booking={booking} wallet={wallet} userId={user.id} />
}
