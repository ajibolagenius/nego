'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import {
    ArrowLeft, PaperPlaneRight, User, Chat, MagnifyingGlass,
    DotsThree, Phone, VideoCamera, SpinnerGap, CheckCircle, Checks,
    CalendarPlus, Gift
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { GiftCoins } from '@/components/GiftCoins'
import { getTalentUrl } from '@/lib/talent-url'
import type { Conversation, Message, Profile } from '@/types/database'

interface MessagesClientProps {
    userId: string
    conversations: (Conversation & { other_user?: Profile | null })[]
    userRole?: 'client' | 'talent'
}

export function MessagesClient({ userId, conversations: initialConversations, userRole = 'client' }: MessagesClientProps) {
    const supabase = createClient()
    const searchParams = useSearchParams()
    const router = useRouter()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const [conversations, setConversations] = useState(initialConversations)
    const [selectedConversation, setSelectedConversation] = useState<(Conversation & { other_user?: Profile | null }) | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [sending, setSending] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [otherUserTyping, setOtherUserTyping] = useState(false)
    const [walletBalance, setWalletBalance] = useState(0)
    const [error, setError] = useState<string | null>(null)

    // Fetch wallet balance for gift feature
    useEffect(() => {
        const fetchWallet = async () => {
            try {
                const { data, error: walletError } = await supabase
                    .from('wallets')
                    .select('balance')
                    .eq('user_id', userId)
                    .single()
                if (walletError) throw walletError
                if (data) setWalletBalance(data.balance)
            } catch (err) {
                console.error('Error fetching wallet balance:', err)
                // Non-critical error, don't show to user
            }
        }
        fetchWallet()
    }, [supabase, userId])

    // Scroll to bottom of messages
    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [])

    // Fetch messages for selected conversation
    const fetchMessages = useCallback(async (conversationId: string) => {
        setLoading(true)
        setError(null)
        try {
            const { data, error: messagesError } = await supabase
                .from('messages')
                .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url, is_verified)
        `)
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true })

            if (messagesError) throw messagesError

            if (data) {
                setMessages(data)
                // Mark messages as read
                const { error: readError } = await supabase
                    .from('messages')
                    .update({ is_read: true })
                    .eq('conversation_id', conversationId)
                    .neq('sender_id', userId)

                if (readError) {
                    console.error('Error marking messages as read:', readError)
                    // Non-critical error, don't show to user
                }
            }
        } catch (err) {
            console.error('Error fetching messages:', err)
            setError('Failed to load messages. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [supabase, userId])

    // Select a conversation
    const handleSelectConversation = useCallback((conv: Conversation & { other_user?: Profile | null }) => {
        setSelectedConversation(conv)
        fetchMessages(conv.id)
        inputRef.current?.focus()
    }, [fetchMessages])

    // Auto-select conversation from URL parameter
    useEffect(() => {
        const conversationId = searchParams.get('conversation')
        if (conversationId && conversations.length > 0) {
            const conv = conversations.find(c => c.id === conversationId)
            if (conv) {
                handleSelectConversation(conv)
            }
        } else if (conversationId && conversations.length === 0) {
            // Fetch the new conversation if not in list
            const fetchNewConversation = async () => {
                try {
                    const { data, error: convError } = await supabase
                        .from('conversations')
                        .select('*')
                        .eq('id', conversationId)
                        .single()

                    if (convError) throw convError

                    if (data) {
                        // Fetch the other user's profile
                        const otherUserId = data.participant_1 === userId ? data.participant_2 : data.participant_1
                        const { data: profile, error: profileError } = await supabase
                            .from('profiles')
                            .select('id, display_name, avatar_url, role, is_verified')
                            .eq('id', otherUserId)
                            .single()

                        if (profileError) throw profileError

                        const convWithUser = { ...data, other_user: profile }
                        setConversations(prev => {
                            if (prev.find(c => c.id === data.id)) return prev
                            return [convWithUser, ...prev]
                        })
                        handleSelectConversation(convWithUser)
                    }
                } catch (err) {
                    console.error('Error fetching new conversation:', err)
                    setError('Failed to load conversation. Please try again.')
                }
            }
            fetchNewConversation()
        }
    }, [searchParams, conversations.length, handleSelectConversation, supabase, userId])

    // Send a message
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !selectedConversation) return

        setSending(true)
        setError(null)
        const messageContent = newMessage.trim()
        setNewMessage('')

        // Optimistically add message to UI
        const tempMessage: Message = {
            id: `temp-${Date.now()}`,
            conversation_id: selectedConversation.id,
            sender_id: userId,
            content: messageContent,
            is_read: false,
            created_at: new Date().toISOString(),
            sender: undefined
        }
        setMessages(prev => [...prev, tempMessage])
        scrollToBottom()

        try {
            const { data, error: sendError } = await supabase
                .from('messages')
                .insert({
                    conversation_id: selectedConversation.id,
                    sender_id: userId,
                    content: messageContent,
                })
                .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url, is_verified)
        `)
                .single()

            if (sendError) throw sendError

            if (data) {
                // Replace temp message with real one
                setMessages(prev => prev.map(m =>
                    m.id === tempMessage.id ? data : m
                ))

                // Update conversation's last_message_at
                const { error: updateError } = await supabase
                    .from('conversations')
                    .update({ last_message_at: new Date().toISOString() })
                    .eq('id', selectedConversation.id)

                if (updateError) {
                    console.error('Error updating conversation:', updateError)
                    // Non-critical error, don't show to user
                }
            }
        } catch (err) {
            console.error('Error sending message:', err)
            // Remove temp message on error
            setMessages(prev => prev.filter(m => m.id !== tempMessage.id))
            setNewMessage(messageContent) // Restore message
            setError('Failed to send message. Please try again.')
        } finally {
            setSending(false)
        }
    }

    // Handle typing indicator
    const handleTyping = useCallback(() => {
        if (!selectedConversation) return

        // Broadcast typing status
        const channel = supabase.channel(`typing:${selectedConversation.id}`)
        channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId, isTyping: true }
        })

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }

        // Set timeout to stop typing indicator
        typingTimeoutRef.current = setTimeout(() => {
            channel.send({
                type: 'broadcast',
                event: 'typing',
                payload: { userId, isTyping: false }
            })
        }, 2000)
    }, [selectedConversation, userId, supabase])

    // Cleanup typing timeout on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }
        }
    }, [])

    // Subscribe to new messages and typing indicators
    useEffect(() => {
        if (!selectedConversation) return

        let messageChannel: ReturnType<typeof supabase.channel> | null = null
        let typingChannel: ReturnType<typeof supabase.channel> | null = null

        // Message subscription
        messageChannel = supabase
            .channel(`messages:${selectedConversation.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${selectedConversation.id}`,
                },
                async (payload) => {
                    // Only process messages from other users
                    if (payload.new.sender_id === userId) return

                    try {
                        // Fetch the full message with sender info
                        const { data, error: fetchError } = await supabase
                            .from('messages')
                            .select(`
                *,
                sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url, is_verified)
              `)
                            .eq('id', payload.new.id)
                            .single()

                        if (fetchError) {
                            console.error('Error fetching new message:', fetchError)
                            return
                        }

                        if (data) {
                            setMessages(prev => {
                                // Avoid duplicates
                                if (prev.find(m => m.id === data.id)) return prev
                                return [...prev, data]
                            })

                            // Mark as read
                            const { error: readError } = await supabase
                                .from('messages')
                                .update({ is_read: true })
                                .eq('id', data.id)

                            if (readError) {
                                console.error('Error marking message as read:', readError)
                                // Non-critical error
                            }
                        }
                    } catch (err) {
                        console.error('Error processing new message:', err)
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${selectedConversation.id}`,
                },
                (payload) => {
                    // Update read status in UI
                    setMessages(prev => prev.map(m =>
                        m.id === payload.new.id ? { ...m, is_read: payload.new.is_read } : m
                    ))
                }
            )
            .subscribe()

        // Typing indicator subscription
        typingChannel = supabase
            .channel(`typing:${selectedConversation.id}`)
            .on('broadcast', { event: 'typing' }, (payload) => {
                if (payload.payload.userId !== userId) {
                    setOtherUserTyping(payload.payload.isTyping)
                }
            })
            .subscribe()

        return () => {
            if (messageChannel) {
                supabase.removeChannel(messageChannel)
            }
            if (typingChannel) {
                supabase.removeChannel(typingChannel)
            }
            // Clear typing indicator on cleanup
            setOtherUserTyping(false)
        }
    }, [selectedConversation, userId, supabase])

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messages.length > 0) {
            // Use setTimeout to ensure DOM is updated
            const timeoutId = setTimeout(() => {
                scrollToBottom()
            }, 100)
            return () => clearTimeout(timeoutId)
        }
    }, [messages, scrollToBottom])

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

        const isToday = messageDate.getTime() === today.getTime()
        const isYesterday = messageDate.getTime() === yesterday.getTime()

        if (isToday) {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        }
        if (isYesterday) {
            return 'Yesterday'
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const getRoleLabel = (role: string | null | undefined, isVerified: boolean | undefined) => {
        if (!role) return 'User'
        if (role === 'talent' && isVerified) return 'Verified Talent'
        if (role === 'talent') return 'Talent'
        if (role === 'client') return 'Client'
        return 'User'
    }

    const filteredConversations = conversations.filter(conv =>
        conv.other_user?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <>
            <div className="min-h-screen bg-black pb-16 lg:pb-0">
                {/* Header */}
                <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 py-4">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors" aria-label="Back to dashboard">
                                <ArrowLeft size={24} aria-hidden="true" />
                            </Link>
                            <h1 className="text-xl font-bold text-white">Messages</h1>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto">
                    <div className="flex h-[calc(100vh-80px)]">
                        {/* Conversations List */}
                        <div className={`w-full md:w-80 lg:w-96 border-r border-white/10 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'
                            }`}>
                            {/* Header with dynamic subtitle */}
                            <div className="p-4 border-b border-white/10">
                                <h2 className="text-lg font-semibold text-white mb-1">Conversations</h2>
                                <p className="text-white/50 text-sm">
                                    {filteredConversations.length === 1
                                        ? '1 active conversation'
                                        : `${filteredConversations.length} active conversations`}
                                </p>
                            </div>

                            {/* Search */}
                            <div className="p-4 border-b border-white/10">
                                <div className="relative">
                                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} aria-hidden="true" />
                                    <label htmlFor="search-conversations" className="sr-only">Search conversations</label>
                                    <input
                                        id="search-conversations"
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search conversations by name..."
                                        autoComplete="off"
                                        aria-label="Search conversations by name"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50"
                                    />
                                </div>
                            </div>

                            {/* Conversations */}
                            <div className="flex-1 overflow-y-auto">
                                {filteredConversations.length === 0 ? (
                                    <div className="p-8 text-center">
                                        {searchQuery ? (
                                            <>
                                                <MagnifyingGlass size={48} className="text-white/20 mx-auto mb-4" aria-hidden="true" />
                                                <p className="text-white/50 font-medium">No conversations found</p>
                                                <p className="text-white/30 text-sm mt-1">
                                                    Try searching with a different name
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <Chat size={48} className="text-white/20 mx-auto mb-4" aria-hidden="true" />
                                                <p className="text-white/50 font-medium">
                                                    {userRole === 'client'
                                                        ? 'No conversations yet'
                                                        : 'No conversations yet'}
                                                </p>
                                                <p className="text-white/30 text-sm mt-1 mb-4">
                                                    {userRole === 'client'
                                                        ? 'Start chatting with a talent to begin'
                                                        : 'Start chatting with a client to begin'}
                                                </p>
                                                {userRole === 'client' && (
                                                    <Link
                                                        href="/dashboard/browse"
                                                        className="inline-block px-4 py-2 bg-[#df2531] hover:bg-[#df2531]/90 text-white rounded-lg text-sm font-medium transition-colors"
                                                        aria-label="Browse talent to start a conversation"
                                                    >
                                                        Browse Talent
                                                    </Link>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    filteredConversations.map((conv) => (
                                        <button
                                            key={conv.id}
                                            onClick={() => handleSelectConversation(conv)}
                                            data-testid={`conversation-${conv.id}`}
                                            aria-label={`Open conversation with ${conv.other_user?.display_name || 'Unknown'}`}
                                            className={`w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5 ${selectedConversation?.id === conv.id ? 'bg-white/10' : ''
                                                }`}
                                        >
                                            <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden shrink-0">
                                                {conv.other_user?.avatar_url ? (
                                                    <Image
                                                        src={conv.other_user.avatar_url}
                                                        alt={conv.other_user.display_name || 'User avatar'}
                                                        width={48}
                                                        height={48}
                                                        sizes="48px"
                                                        className="w-full h-full object-cover"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center" aria-hidden="true">
                                                        <User size={24} className="text-white/40" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-white font-medium truncate">
                                                        {conv.other_user?.display_name || 'Unknown'}
                                                    </p>
                                                    <span className="text-white/40 text-xs shrink-0">
                                                        {formatTime(conv.last_message_at)}
                                                    </span>
                                                </div>
                                                <p className="text-white/50 text-sm truncate">
                                                    {getRoleLabel(conv.other_user?.role, conv.other_user?.is_verified)}
                                                </p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : 'flex'
                            }`}>
                            {selectedConversation ? (
                                <>
                                    {/* Chat Header */}
                                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setSelectedConversation(null)}
                                                className="md:hidden text-white/60 hover:text-white transition-colors"
                                                aria-label="Back to conversations list"
                                            >
                                                <ArrowLeft size={24} aria-hidden="true" />
                                            </button>
                                            <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden shrink-0">
                                                {selectedConversation.other_user?.avatar_url ? (
                                                    <Image
                                                        src={selectedConversation.other_user.avatar_url}
                                                        alt={selectedConversation.other_user.display_name || 'User avatar'}
                                                        width={40}
                                                        height={40}
                                                        sizes="40px"
                                                        className="w-full h-full object-cover"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center" aria-hidden="true">
                                                        <User size={20} className="text-white/40" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-white font-medium truncate">
                                                    {selectedConversation.other_user?.display_name || 'Unknown'}
                                                </p>
                                                {otherUserTyping ? (
                                                    <p className="text-[#df2531] text-sm animate-pulse" aria-live="polite">
                                                        <span className="sr-only">User is typing</span>
                                                        typing...
                                                    </p>
                                                ) : (
                                                    <p className="text-white/40 text-sm truncate">
                                                        {getRoleLabel(selectedConversation.other_user?.role, selectedConversation.other_user?.is_verified)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Quick Actions for Clients chatting with Talents */}
                                            {userRole === 'client' && selectedConversation.other_user?.role === 'talent' && (
                                                <>
                                                    <GiftCoins
                                                        talentId={selectedConversation.other_user.id}
                                                        talentName={selectedConversation.other_user.display_name || 'Talent'}
                                                        senderId={userId}
                                                        senderBalance={walletBalance}
                                                        onSuccess={() => {
                                                            // Refresh wallet balance
                                                            supabase.from('wallets').select('balance').eq('user_id', userId).single()
                                                                .then(({ data }) => data && setWalletBalance(data.balance))
                                                        }}
                                                    />
                                                    <Link
                                                        href={getTalentUrl(selectedConversation.other_user)}
                                                        className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                                        aria-label="View profile and book"
                                                        title="View Profile & Book"
                                                    >
                                                        <CalendarPlus size={20} aria-hidden="true" />
                                                    </Link>
                                                </>
                                            )}
                                            <button
                                                className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                                aria-label="Call"
                                                title="Call"
                                            >
                                                <Phone size={20} aria-hidden="true" />
                                            </button>
                                            <button
                                                className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                                aria-label="Video call"
                                                title="Video Call"
                                            >
                                                <VideoCamera size={20} aria-hidden="true" />
                                            </button>
                                            <button
                                                className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                                aria-label="More options"
                                                title="More Options"
                                            >
                                                <DotsThree size={20} weight="bold" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                        {error && (
                                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                                                <p className="text-red-400 text-sm">{error}</p>
                                            </div>
                                        )}
                                        {loading ? (
                                            <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
                                                <SpinnerGap size={32} className="text-[#df2531] animate-spin" aria-hidden="true" />
                                                <span className="sr-only">Loading messages</span>
                                            </div>
                                        ) : messages.length === 0 ? (
                                            <div className="text-center py-8">
                                                <Chat size={48} className="text-white/20 mx-auto mb-4" aria-hidden="true" />
                                                <p className="text-white/50 font-medium mb-1">No messages yet</p>
                                                <p className="text-white/30 text-sm">
                                                    Start the conversation by sending your first message
                                                </p>
                                            </div>
                                        ) : (
                                            messages.map((message) => {
                                                const isOwn = message.sender_id === userId
                                                return (
                                                    <div
                                                        key={message.id}
                                                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                                    >
                                                        <div className={`max-w-[70%] ${isOwn ? 'order-1' : ''}`}>
                                                            <div
                                                                className={`px-4 py-2.5 rounded-2xl ${isOwn
                                                                        ? 'bg-[#df2531] text-white rounded-br-md'
                                                                        : 'bg-white/10 text-white rounded-bl-md'
                                                                    }`}
                                                            >
                                                                <p className="break-words">{message.content}</p>
                                                            </div>
                                                            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                                                                <span className="text-white/40 text-xs">
                                                                    {formatTime(message.created_at)}
                                                                </span>
                                                                {isOwn && (
                                                                    <span className="text-white/40" aria-label={message.is_read ? 'Message read' : 'Message sent'}>
                                                                        {message.is_read ? (
                                                                            <Checks size={14} className="text-blue-400" aria-hidden="true" />
                                                                        ) : (
                                                                            <CheckCircle size={14} aria-hidden="true" />
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Message Input */}
                                    <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
                                        <div className="flex items-center gap-3">
                                            <label htmlFor="message-input" className="sr-only">Type your message</label>
                                            <input
                                                id="message-input"
                                                ref={inputRef}
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => {
                                                    setNewMessage(e.target.value)
                                                    handleTyping()
                                                }}
                                                placeholder="Type your message..."
                                                autoComplete="off"
                                                aria-label="Type your message"
                                                className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50"
                                                data-testid="message-input"
                                            />
                                            <Button
                                                type="submit"
                                                disabled={!newMessage.trim() || sending}
                                                className="w-12 h-12 rounded-full bg-[#df2531] hover:bg-[#df2531]/90 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                data-testid="send-message-btn"
                                                aria-label={sending ? 'Sending message' : 'Send message'}
                                            >
                                                {sending ? (
                                                    <>
                                                        <SpinnerGap size={20} className="animate-spin" aria-hidden="true" />
                                                        <span className="sr-only">Sending</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <PaperPlaneRight size={20} weight="fill" aria-hidden="true" />
                                                        <span className="sr-only">Send</span>
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center">
                                        <Chat size={64} className="text-white/20 mx-auto mb-4" aria-hidden="true" />
                                        <p className="text-white/50 text-lg font-medium">Select a conversation</p>
                                        <p className="text-white/30 text-sm mt-1">
                                            Choose from your existing conversations or start a new one
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <MobileBottomNav userRole={userRole} />
        </>
    )
}
