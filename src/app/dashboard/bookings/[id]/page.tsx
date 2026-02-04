import { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { generateOpenGraphMetadata } from '@/lib/og-metadata'
import { createClient } from '@/lib/supabase/server'
import { BookingDetailClient } from './BookingDetailClient'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

interface PageProps {
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params
    return generateOpenGraphMetadata({
        title: 'Booking Details - Nego',
        description: 'View your booking details on Nego',
        url: `${APP_URL}/dashboard/bookings/${id}`,
        type: 'website',
        pageType: 'dashboard',
    })
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

    // Fetch verification data (including admin notes) for both cancelled bookings and verification_pending status
    // This allows both client and talent to see admin notes if verification was rejected
    let verification = null
    if (booking.status === 'cancelled' || booking.status === 'verification_pending') {
        const { data: verificationData } = await supabase
            .from('verifications')
            .select('admin_notes, status')
            .eq('booking_id', id)
            .maybeSingle()

        verification = verificationData
    }

    return <BookingDetailClient booking={{ ...booking, review, verification }} wallet={wallet} userId={user.id} />
}
