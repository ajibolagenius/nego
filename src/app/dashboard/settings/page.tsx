import { redirect } from 'next/navigation'
import { generateOpenGraphMetadata } from '@/lib/og-metadata'
import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from './SettingsClient'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

export const metadata = generateOpenGraphMetadata({
    title: 'Settings - Nego',
    description: 'Manage your account settings, preferences, and security on Nego',
    url: `${APP_URL}/dashboard/settings`,
    type: 'website',
    pageType: 'dashboard',
})

export default async function SettingsPage() {
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

    return (
        <SettingsClient
            user={user}
            profile={profile}
        />
    )
}
