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
        const { conversationId, content, mediaUrl, mediaType } = body

        if (!conversationId || typeof conversationId !== 'string' || !conversationId.trim()) {
            return NextResponse.json(
                { error: 'conversationId is required' },
                { status: 400 }
            )
        }

        const trimmedContent = typeof content === 'string' ? content.trim() : ''
        const rawMediaUrl = typeof mediaUrl === 'string' ? mediaUrl.trim() : ''
        const rawMediaType = typeof mediaType === 'string' ? mediaType.trim() : ''

        const hasContent = trimmedContent.length > 0
        const hasMediaUrl = rawMediaUrl.length > 0
        const hasMediaType = rawMediaType.length > 0

        // Media pair validation: mediaUrl and mediaType must be both present or both absent
        if (hasMediaUrl !== hasMediaType) {
            return NextResponse.json(
                { error: 'mediaUrl and mediaType must be provided together as a valid pair' },
                { status: 400 }
            )
        }

        if (hasMediaType && !['image', 'video'].includes(rawMediaType)) {
            return NextResponse.json(
                { error: 'mediaType must be "image" or "video"' },
                { status: 400 }
            )
        }

        if (!hasContent && !hasMediaUrl) {
            return NextResponse.json(
                { error: 'Message content or a valid media attachment is required' },
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

        let resolvedMediaUrl: string | null = null
        if (hasMediaUrl) {
            // Reject external URLs, absolute protocols, or directory traversal
            if (/^https?:\/\/|^\/\//i.test(rawMediaUrl) || rawMediaUrl.includes('..')) {
                return NextResponse.json(
                    { error: 'External or invalid media paths are not allowed' },
                    { status: 400 }
                )
            }

            // Must match conversation storage prefix: chat/<conversationId>/<filename>
            const expectedPrefix = `chat/${conversationId}/`
            if (!rawMediaUrl.startsWith(expectedPrefix) || rawMediaUrl.length <= expectedPrefix.length) {
                return NextResponse.json(
                    { error: 'Unauthorized media path for this conversation' },
                    { status: 403 }
                )
            }

            // Verify object exists in media bucket
            const pathParts = rawMediaUrl.split('/')
            const objectFolder = pathParts.slice(0, -1).join('/')
            const objectName = pathParts[pathParts.length - 1]

            const { data: objectList, error: listError } = await supabase.storage
                .from('media')
                .list(objectFolder, { search: objectName })

            if (listError || !objectList || !objectList.some(item => item.name === objectName)) {
                return NextResponse.json(
                    { error: 'Media object not found in storage bucket' },
                    { status: 400 }
                )
            }

            // Validated storage path is used directly to avoid persisting permanent public URLs
            resolvedMediaUrl = rawMediaUrl
        }

        const recipientId = conversation.participant_1 === user.id
            ? conversation.participant_2
            : conversation.participant_1

        // Insert the message with private storage object path
        const { data: message, error: messageError } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: user.id,
                content: hasContent ? trimmedContent : null,
                media_url: resolvedMediaUrl,
                media_type: hasMediaType ? (rawMediaType as 'image' | 'video') : null,
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

        // Generate short-lived signed URL for sender response if media is present
        let signedMediaUrl: string | null = null
        if (resolvedMediaUrl) {
            const { data: signedData } = await supabase.storage
                .from('media')
                .createSignedUrl(resolvedMediaUrl, 3600)

            signedMediaUrl = signedData?.signedUrl || null
        }

        // Send push notification to the other participant
        const { data: senderProfile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', user.id)
            .single()

        const senderName = senderProfile?.display_name || 'Someone'
        const notificationText = trimmedContent
            ? (trimmedContent.length > 100 ? trimmedContent.substring(0, 100) + '...' : trimmedContent)
            : (rawMediaType === 'video' ? 'Sent a video 🎥' : 'Sent a photo 📷')

        notifyUser({
            userId: recipientId,
            type: 'message_received',
            title: `New message from ${senderName}`,
            message: notificationText,
            data: {
                conversation_id: conversationId,
                sender_id: user.id,
                message_id: message.id,
            },
            url: `/dashboard/messages?conversation=${conversationId}`,
        }).catch(err => console.error('[Message Send] Notification failed:', err))

        const responseMessage = {
            ...message,
            media_url: signedMediaUrl || message.media_url,
        }

        return NextResponse.json({ message: responseMessage })
    } catch (error) {
        console.error('[Message Send] Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
