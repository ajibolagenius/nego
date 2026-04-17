import { UsersClient } from '@/app/admin/users/UsersClient'
import { generateOpenGraphMetadata } from '@/lib/og-metadata'
import { createApiClient } from '@/lib/supabase/api'
import type { Profile } from '@/types/database'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

export const metadata = generateOpenGraphMetadata({
    title: 'Users - Nego Admin',
    description: 'Manage all user accounts across the platform',
    url: `${APP_URL}/admin/users`,
    type: 'website',
    pageType: 'admin',
})

export default async function UsersPage() {
    const supabase = createApiClient()

    // Fetch all profiles
    const { data: users, error } = await supabase
        .from('profiles')
        .select(`
            id,
            role,
            username,
            full_name,
            display_name,
            avatar_url,
            email,
            location,
            bio,
            is_verified,
            status,
            created_at,
            updated_at,
            wallets (
                balance,
                escrow_balance
            )
        `)
        .eq('role', 'client')
        .order('created_at', { ascending: false })
        .limit(2000)

    if (error) {
        console.error('[UsersPage] Error fetching users:', error)
    }

    const usersList = (users || []) as unknown as (Profile & { wallets?: { balance: number; escrow_balance: number }[] })[]

    return <UsersClient users={usersList} />
}
