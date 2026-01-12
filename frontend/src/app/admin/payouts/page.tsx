import { createClient } from '@/lib/supabase/server'
import { PayoutsClient } from './PayoutsClient'

export const metadata = {
  title: 'Payouts - Nego Admin',
  description: 'Manage talent payouts',
}

export default async function PayoutsPage() {
  const supabase = await createClient()

  // Fetch talent profiles with their wallets
  const { data: talents } = await supabase
    .from('profiles')
    .select(`
      *,
      wallet:wallets(*)
    `)
    .eq('role', 'talent')
    .order('created_at', { ascending: false })

  // Fetch payout transactions
  const { data: payouts } = await supabase
    .from('transactions')
    .select(`
      *,
      user:profiles(display_name, avatar_url)
    `)
    .eq('type', 'payout')
    .order('created_at', { ascending: false })
    .limit(50)

  // Fetch pending withdrawal requests
  const { data: withdrawalRequests } = await supabase
    .from('withdrawal_requests')
    .select(`
      *,
      talent:profiles(id, display_name, avatar_url, username)
    `)
    .order('created_at', { ascending: false })

  return <PayoutsClient talents={talents || []} payouts={payouts || []} withdrawalRequests={withdrawalRequests || []} />
}
