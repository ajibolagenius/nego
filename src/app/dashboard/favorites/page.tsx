import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FavoritesClient } from './FavoritesClient'
import { generateOpenGraphMetadata } from '@/lib/og-metadata'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

export const metadata = generateOpenGraphMetadata({
    title: 'Saved Favorites - Nego',
    description: 'View and manage your saved favorite talents on Nego',
    url: `${APP_URL}/dashboard/favorites`,
    image: `${APP_URL}/og-image.png`,
    type: 'website',
})

export default async function FavoritesPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch user profile to get role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const userRole = profile?.role === 'talent' ? 'talent' : 'client'

    return (
        <FavoritesClient
            userId={user.id}
            userRole={userRole}
        />
    )
}
