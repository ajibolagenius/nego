import { redirect } from 'next/navigation'
import { generateOpenGraphMetadata } from '@/lib/og-metadata'
import { createClient, getServerProfile } from '@/lib/supabase/server'
import { ProfileClient } from './ProfileClient'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

export const metadata = generateOpenGraphMetadata({
    title: 'Profile - Nego',
    description: 'View and manage your profile, update your information, and see your account statistics on Nego',
    url: `${APP_URL}/dashboard/profile`,
    type: 'website',
    pageType: 'dashboard',
})

export default async function ProfilePage() {
    const { profile, user } = await getServerProfile()

    if (!user) {
        redirect('/login')
    }

    // Fetch wallet
    const supabase = await createClient()
    const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single()

    // Fetch user's booking count (both as client and talent)
    const [clientBookings, talentBookings] = await Promise.all([
        supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', user.id),
        supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('talent_id', user.id)
    ])

    const bookingCount = (clientBookings.count || 0) + (talentBookings.count || 0)

    return (
        <ProfileClient
            user={user}
            profile={profile}
            wallet={wallet}
            bookingCount={bookingCount || 0}
        />
    )
}
