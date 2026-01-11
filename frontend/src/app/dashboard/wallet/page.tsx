import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WalletClient } from './WalletClient'

export const metadata = {
  title: 'Wallet - Nego',
  description: 'Manage your coins and transactions on Nego',
}

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

  // Fetch transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <WalletClient 
      user={user} 
      profile={profile} 
      wallet={wallet} 
      transactions={transactions || []} 
    />
  )
}
