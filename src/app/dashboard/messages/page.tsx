import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MessagesClient } from './MessagesClient'

export default async function MessagesPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch user's profile for role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const userRole = profile?.role === 'talent' ? 'talent' : 'client'

    // Fetch user's conversations
    const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('last_message_at', { ascending: false })

    if (error) {
        console.error('Error fetching conversations:', error)
    }

    // Fetch profiles for all participants
    const participantIds = new Set<string>()
        ; (conversations || []).forEach(conv => {
            participantIds.add(conv.participant_1)
            participantIds.add(conv.participant_2)
        })
    participantIds.delete(user.id)

    // Fetch COMPLETE profile data for all participants (talents)
    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', Array.from(participantIds))

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    // Transform conversations to include the other user's info
    const formattedConversations = (conversations || []).map(conv => {
        const otherUserId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1
        const otherUser = profileMap.get(otherUserId)

        return {
            ...conv,
            other_user: otherUser || null
        }
    })

    return <MessagesClient userId={user.id} conversations={formattedConversations} userRole={userRole} />
}
