import { generateOpenGraphMetadata } from '@/lib/og-metadata'
import { createApiClient } from '@/lib/supabase/api'
import { CoinPackagesClient } from './CoinPackagesClient'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

export const metadata = generateOpenGraphMetadata({
    title: 'Coin Packages - Admin',
    description: 'Manage coin packages and pricing',
    url: `${APP_URL}/admin/coin-packages`,
    type: 'website',
    pageType: 'dashboard',
})

export default async function CoinPackagesPage() {
    const supabase = createApiClient()

    // Fetch all coin packages
    const { data: packages } = await supabase
        .from('coin_packages')
        .select('*')
        .order('display_order', { ascending: true })

    return <CoinPackagesClient initialPackages={packages || []} />
}
