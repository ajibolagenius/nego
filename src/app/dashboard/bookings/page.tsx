import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookingsClient } from './BookingsClient'
import { generateOpenGraphMetadata } from '@/lib/og-metadata'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

export const metadata = generateOpenGraphMetadata({
    title: 'My Bookings - Nego',
    description: 'View and manage your bookings on Nego - Track your service requests and appointments',
    url: `${APP_URL}/dashboard/bookings`,
    image: `${APP_URL}/og-image.png`,
    type: 'website',
})

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

    // Fetch bookings with COMPLETE profile data
    const { data: bookings } = await supabase
        .from('bookings')
        .select(`
      *,
      talent:profiles!bookings_talent_id_fkey (*),
      client:profiles!bookings_client_id_fkey (*)
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
