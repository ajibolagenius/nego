import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GiftHistoryClient } from './GiftHistoryClient'

export const metadata = {
    title: 'Gift History - Nego',
    description: 'Track all your coin gifts sent and received on Nego',
}

export default async function GiftHistoryPage() {
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

    // Fetch sent gifts with COMPLETE recipient profile data
    const { data: sentGifts } = await supabase
        .from('gifts')
        .select(`
      *,
      recipient:profiles!gifts_recipient_id_fkey (*)
    `)
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

    // Fetch received gifts with COMPLETE sender profile data
    const { data: receivedGifts } = await supabase
        .from('gifts')
        .select(`
      *,
      sender:profiles!gifts_sender_id_fkey (*)
    `)
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

    // Get wallet
    const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single()

    return (
        <GiftHistoryClient
            user={user}
            profile={profile}
            sentGifts={sentGifts || []}
            receivedGifts={receivedGifts || []}
            wallet={wallet}
        />
    )
}
