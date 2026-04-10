import { redirect } from 'next/navigation'
import { generateOpenGraphMetadata } from '@/lib/og-metadata'
import { createClient, getServerProfile } from '@/lib/supabase/server'
import { DashboardClient, type TalentWithMenu } from './DashboardClient'

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
    const params = await searchParams
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

    const isTalent = profile?.role === 'talent'
    const actualRole = profile?.role || 'client'
    let shuffledTalents: TalentWithMenu[] = []

    if (!isTalent) {
        // Generate random limit between 8 and 16
        // eslint-disable-next-line react-hooks/purity
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
            .not('avatar_url', 'is', null)
            .neq('avatar_url', '')
            .limit(50) // Fetch more to randomize from

        // Shuffle and pick random talents
        shuffledTalents = (featuredTalents || [])
            // eslint-disable-next-line react-hooks/purity
            .sort(() => Math.random() - 0.5)
            .slice(0, randomLimit)
    }

    // Fetch active bookings count
    const { count: activeBookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq(actualRole === 'talent' ? 'talent_id' : 'client_id', user.id)
        .in('status', ['pending', 'accepted', 'payment_pending'])

    // Fetch favorites count (for clients)
    let favoritesCount = 0
    if (!isTalent) {
        const { count } = await supabase
            .from('favorites')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
        favoritesCount = count || 0
    }

    return (
        <DashboardClient
            user={user}
            profile={profile}
            wallet={wallet}
            featuredTalents={shuffledTalents}
            activeBookings={activeBookingsCount || 0}
            favoritesCount={favoritesCount}
            showVerificationSuccess={params.verified === 'true'}
        />
    )
}
