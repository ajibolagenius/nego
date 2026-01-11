import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TalentProfileClient } from './TalentProfileClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TalentProfilePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch talent profile
  const { data: talent, error } = await supabase
    .from('profiles')
    .select(`
      *,
      talent_menus (
        id,
        price,
        is_active,
        service_type:service_types (
          id,
          name,
          icon,
          description
        )
      ),
      media (
        id,
        url,
        type,
        is_premium,
        unlock_price
      )
    `)
    .eq('id', id)
    .eq('role', 'talent')
    .single()

  if (error || !talent) {
    notFound()
  }

  // Fetch current user's profile and wallet
  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: wallet } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <TalentProfileClient 
      talent={talent} 
      currentUser={currentUserProfile}
      wallet={wallet}
      userId={user.id}
    />
  )
}
