import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MessagesClient } from './MessagesClient'

export default async function MessagesPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch user's conversations with other participant info
  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      *,
      participant_1_profile:profiles!conversations_participant_1_fkey(id, display_name, avatar_url, role),
      participant_2_profile:profiles!conversations_participant_2_fkey(id, display_name, avatar_url, role)
    `)
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .order('last_message_at', { ascending: false })

  // Transform conversations to include the other user's info
  const formattedConversations = (conversations || []).map(conv => {
    const otherUser = conv.participant_1 === user.id 
      ? conv.participant_2_profile 
      : conv.participant_1_profile
    
    return {
      ...conv,
      other_user: otherUser
    }
  })

  return <MessagesClient userId={user.id} conversations={formattedConversations} />
}
