import { redirect } from 'next/navigation'
import { generateOpenGraphMetadata } from '@/lib/og-metadata'
import { createClient } from '@/lib/supabase/server'
import { TalentDashboardClient } from './TalentDashboardClient'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

export const metadata = generateOpenGraphMetadata({
    title: 'Talent Dashboard - Nego',
    description: 'Manage your services, bookings, earnings, and media on Nego',
    url: `${APP_URL}/dashboard/talent`,
    type: 'website',
    pageType: 'dashboard',
})

export default async function TalentDashboardPage() {
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

    // Check if user is a talent
    if (profile?.role !== 'talent') {
        redirect('/dashboard')
    }

    // Fetch talent services (menu)
    const { data: menu } = await supabase
        .from('talent_menus')
        .select(`
      *,
      service_type:service_types(*)
    `)
        .eq('talent_id', user.id)
        .order('created_at', { ascending: true })

    // Fetch all available services for adding new ones
    const { data: allServices } = await supabase
        .from('service_types')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

    // Fetch talent media
    const { data: media } = await supabase
        .from('media')
        .select('*')
        .eq('talent_id', user.id)
        .order('created_at', { ascending: false })

    // Fetch recent bookings for the talent
    const { data: bookings } = await supabase
        .from('bookings')
        .select(`
      *,
      client:profiles!bookings_client_id_fkey(display_name, avatar_url)
    `)
        .eq('talent_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

    // Fetch wallet
    const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single()

    // Fetch earnings breakdown (gifts received, content unlocks, bookings)
    // Also fetch payout transactions for withdrawals tab
    // Use OR filter to include transactions where either amount > 0 OR coins > 0
    // This ensures booking transactions with amount: 0 but coins > 0 are included
    const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .in('type', ['gift', 'premium_unlock', 'booking', 'payout'])
        .or('amount.gt.0,coins.gt.0,amount.lt.0,coins.lt.0')
        .order('created_at', { ascending: false })

    // Fetch gifts received
    const { data: giftsReceived } = await supabase
        .from('gifts')
        .select('*, sender:profiles!gifts_sender_id_fkey(display_name, avatar_url)')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

    return (
        <TalentDashboardClient
            user={user}
            profile={profile}
            menu={menu || []}
            allServices={allServices || []}
            media={media || []}
            bookings={bookings || []}
            wallet={wallet}
            transactions={transactions || []}
            giftsReceived={giftsReceived || []}
        />
    )
}
