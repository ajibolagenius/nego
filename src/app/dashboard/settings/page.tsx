import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from './SettingsClient'
import { generateOpenGraphMetadata } from '@/lib/og-metadata'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

export const metadata = generateOpenGraphMetadata({
    title: 'Settings - Nego',
    description: 'Manage your account settings, preferences, and security on Nego',
    url: `${APP_URL}/dashboard/settings`,
    image: `${APP_URL}/og-image.png`,
    type: 'website',
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
