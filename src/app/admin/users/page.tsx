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

    // Fetch auth users to ensure we get emails even from Google auth provider
    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 2000 })
    const authUsers = authData.users || []

    const usersList = (users || []).map((user: unknown) => {
        const u = user as Profile & { wallets?: { balance: number; escrow_balance: number }[], email?: string | null }
        const authUser = authUsers.find(a => a.id === u.id)
        
        return {
            ...u,
            email: authUser?.email || u.email
        } as Profile & { wallets?: { balance: number; escrow_balance: number }[], email?: string | null }
    })

    return <UsersClient users={usersList} />
}
