import { NextRequest, NextResponse } from 'next/server'
import { notifyUser } from '@/lib/notifications'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { conversationId, content } = body

        if (!conversationId || !content?.trim()) {
            return NextResponse.json(
                { error: 'conversationId and content are required' },
                { status: 400 }
            )
        }

        // Verify user is a participant in this conversation
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .select('id, participant_1, participant_2')
            .eq('id', conversationId)
            .single()

        if (convError || !conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
        }

        const isParticipant = conversation.participant_1 === user.id || conversation.participant_2 === user.id
        if (!isParticipant) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const recipientId = conversation.participant_1 === user.id
            ? conversation.participant_2
            : conversation.participant_1

        // Insert the message
        const { data: message, error: messageError } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: user.id,
                content: content.trim(),
            })
            .select(`
                *,
                sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url, is_verified)
            `)
            .single()

        if (messageError) {
            console.error('[Message Send] Error inserting message:', messageError)
            return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
        }

        // Send push notification to the other participant
        const { data: senderProfile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', user.id)
            .single()

        const senderName = senderProfile?.display_name || 'Someone'
        const truncatedContent = content.length > 100
            ? content.substring(0, 100) + '...'
            : content

        notifyUser({
            userId: recipientId,
            type: 'message_received',
            title: `New message from ${senderName}`,
            message: truncatedContent,
            data: {
                conversation_id: conversationId,
                sender_id: user.id,
                message_id: message.id,
            },
            url: `/dashboard/messages?conversation=${conversationId}`,
        }).catch(err => console.error('[Message Send] Notification failed:', err))

        return NextResponse.json({ message })
    } catch (error) {
        console.error('[Message Send] Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
