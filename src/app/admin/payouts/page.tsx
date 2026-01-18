import { createApiClient } from '@/lib/supabase/api'
import { PayoutsClient } from './PayoutsClient'

export const metadata = {
  title: 'Payouts - Nego Admin',
  description: 'Manage talent payouts',
}

export default async function PayoutsPage() {
  // Use API client (service role) to bypass RLS for admin operations
  const supabase = createApiClient()

  // Fetch talent profiles with their wallets
  // Note: Client-side pagination handles the display
  const { data: talents, error: talentsError } = await supabase
    .from('profiles')
    .select(`
      *,
      wallet:wallets(*)
    `)
    .eq('role', 'talent')
    .order('created_at', { ascending: false })
    .limit(1000) // Reasonable limit for client-side pagination

  if (talentsError) {
    console.error('[PayoutsPage] Error fetching talents:', talentsError)
  }

  // Fetch payout transactions
  const { data: payouts, error: payoutsError } = await supabase
    .from('transactions')
    .select(`
      *,
      user:profiles(display_name, avatar_url)
    `)
    .eq('type', 'payout')
    .order('created_at', { ascending: false })
    .limit(50)

  if (payoutsError) {
    console.error('[PayoutsPage] Error fetching payouts:', payoutsError)
  }

  // Fetch pending withdrawal requests
  // Note: Client-side pagination handles the display
  const { data: withdrawalRequests, error: withdrawalError } = await supabase
    .from('withdrawal_requests')
    .select(`
      *,
      talent:profiles(id, display_name, avatar_url, username)
    `)
    .order('created_at', { ascending: false })
    .limit(1000) // Reasonable limit for client-side pagination

  if (withdrawalError) {
    console.error('[PayoutsPage] Error fetching withdrawal requests:', withdrawalError)
  }

  console.log('[PayoutsPage] Loaded data:', {
    talents: talents?.length || 0,
    payouts: payouts?.length || 0,
    withdrawalRequests: withdrawalRequests?.length || 0
  })

  return <PayoutsClient talents={talents || []} payouts={payouts || []} withdrawalRequests={withdrawalRequests || []} />
}
