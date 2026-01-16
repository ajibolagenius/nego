import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { BookingDetailClient } from './BookingDetailClient'

export const metadata = {
  title: 'Booking Details - Nego',
  description: 'View your booking details on Nego',
}

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

  // Fetch booking with COMPLETE related profile data
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      *,
      talent:profiles!bookings_talent_id_fkey (*),
      client:profiles!bookings_client_id_fkey (*)
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

  // Fetch existing review for this booking (if completed)
  let review = null
  if (booking.status === 'completed') {
    const { data: reviewData } = await supabase
      .from('reviews')
      .select('*')
      .eq('booking_id', id)
      .single()
    
    review = reviewData
  }

  return <BookingDetailClient booking={{ ...booking, review }} wallet={wallet} userId={user.id} />
}
