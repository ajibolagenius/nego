import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './DashboardClient'
import { generateOpenGraphMetadata } from '@/lib/og-metadata'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

export const metadata = generateOpenGraphMetadata({
    title: 'Dashboard - Nego',
    description: 'Your personal dashboard on Nego - Manage bookings, browse talent, and access all features',
    url: `${APP_URL}/dashboard`,
    type: 'website',
    pageType: 'dashboard',
})

interface DashboardPageProps {
    searchParams: Promise<{ verified?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
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

    // Fetch wallet
    const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single()

    // Generate random limit between 8 and 16
    const randomLimit = Math.floor(Math.random() * 9) + 8 // 8 to 16

    // Fetch featured talents with COMPLETE profile data (random selection of talents)
    const { data: featuredTalents } = await supabase
        .from('profiles')
        .select(`
      *,
      talent_menus (
        id,
        price,
        is_active,
        service_type:service_types (
          id,
          name,
          icon,
          description
        )
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

    return (
        <DashboardClient
            user={user}
            profile={profile}
            wallet={wallet}
            featuredTalents={shuffledTalents}
            activeBookings={activeBookingsCount || 0}
            favoritesCount={favoritesCount || 0}
            showVerificationSuccess={params.verified === 'true'}
        />
    )
}
