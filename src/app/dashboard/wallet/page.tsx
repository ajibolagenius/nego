import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WalletClient } from './WalletClient'
import { generateOpenGraphMetadata } from '@/lib/og-metadata'
import { getCoinPackagesFromDB } from '@/lib/coinPackages'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

export const metadata = generateOpenGraphMetadata({
    title: 'Wallet - Nego',
    description: 'Manage your coins and view transaction history on Nego',
    url: `${APP_URL}/dashboard/wallet`,
    type: 'website',
    pageType: 'dashboard',
})

export default async function WalletPage() {
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

    // Fetch wallet
    const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single()

    // Fetch transactions (limit to 50 most recent)
    const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

    // Fetch coin packages from database
    const coinPackages = await getCoinPackagesFromDB(supabase)

    return (
        <WalletClient
            user={user}
            profile={profile}
            wallet={wallet}
            transactions={transactions || []}
            coinPackages={coinPackages}
        />
    )
}
