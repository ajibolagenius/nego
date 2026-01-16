'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import {
    ArrowLeft, PaperPlaneRight, User, Chat, MagnifyingGlass,
    SpinnerGap, CheckCircle, Checks,
    CalendarPlus
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

    // Channel refs for real-time subscriptions
    const messageChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
    const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
    const conversationsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

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
                // Sort messages by created_at to ensure proper order
                const sortedMessages = [...data].sort((a, b) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                )
                setMessages(sortedMessages)

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
        setMessages(prev => {
            const updated = [...prev, tempMessage]
            // Sort to maintain order
            return updated.sort((a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
        })
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
                // Replace temp message with real one when received via real-time
                // The real-time subscription will handle this, but we update optimistically
                setMessages(prev => {
                    const filtered = prev.filter(m => m.id !== tempMessage.id)
                    const updated = [...filtered, data]
                    // Sort to maintain order
                    return updated.sort((a, b) =>
                        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    )
                })

                // Note: last_message_at is updated by database trigger, but we can also update it here
                // The conversations channel will handle real-time updates
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
        if (!selectedConversation || !typingChannelRef.current) return

        // Broadcast typing status
        typingChannelRef.current.send({
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
            if (typingChannelRef.current) {
                typingChannelRef.current.send({
                    type: 'broadcast',
                    event: 'typing',
                    payload: { userId, isTyping: false }
                })
            }
        }, 2000)
    }, [selectedConversation, userId])

    // Cleanup typing timeout on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }
        }
    }, [])

    // Subscribe to messages for selected conversation
    useEffect(() => {
        if (!selectedConversation) {
            // Cleanup channels when no conversation is selected
            if (messageChannelRef.current) {
                supabase.removeChannel(messageChannelRef.current)
                messageChannelRef.current = null
            }
            if (typingChannelRef.current) {
                supabase.removeChannel(typingChannelRef.current)
                typingChannelRef.current = null
            }
            return
        }

        // Cleanup existing channels
        if (messageChannelRef.current) {
            supabase.removeChannel(messageChannelRef.current)
        }
        if (typingChannelRef.current) {
            supabase.removeChannel(typingChannelRef.current)
        }

        // Message channel - subscribes to INSERT and UPDATE events
        const messageChannel = supabase
            .channel(`messages:${selectedConversation.id}`, {
                config: {
                    broadcast: { self: true }
                }
            })
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${selectedConversation.id}`,
                },
                async (payload) => {
                    console.log('[Real-time] Message INSERT received:', payload.new.id, 'from:', payload.new.sender_id)

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
                            console.error('[Real-time] Error fetching new message:', fetchError)
                            return
                        }

                        if (data) {
                            setMessages(prev => {
                                // Check for duplicates
                                if (prev.find(m => m.id === data.id)) {
                                    console.log('[Real-time] Duplicate message detected, skipping:', data.id)
                                    return prev
                                }

                                // Add new message and sort by created_at
                                const updated = [...prev, data]
                                return updated.sort((a, b) =>
                                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                                )
                            })

                            // Mark as read if message is from other user
                            if (data.sender_id !== userId) {
                                const { error: readError } = await supabase
                                    .from('messages')
                                    .update({ is_read: true })
                                    .eq('id', data.id)

                                if (readError) {
                                    console.error('[Real-time] Error marking message as read:', readError)
                                }
                            }
                        }
                    } catch (err) {
                        console.error('[Real-time] Error processing new message:', err)
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
                    console.log('[Real-time] Message UPDATE received:', payload.new.id)
                    // Update message in UI (e.g., read status)
                    setMessages(prev => prev.map(m =>
                        m.id === payload.new.id ? { ...m, is_read: payload.new.is_read } : m
                    ))
                }
            )
            .subscribe((status) => {
                console.log('[Real-time] Message channel subscription status:', status)
            })

        messageChannelRef.current = messageChannel

        // Typing indicator channel
        const typingChannel = supabase
            .channel(`typing:${selectedConversation.id}`, {
                config: {
                    broadcast: { self: false }
                }
            })
            .on('broadcast', { event: 'typing' }, (payload) => {
                if (payload.payload.userId !== userId) {
                    setOtherUserTyping(payload.payload.isTyping)
                }
            })
            .subscribe((status) => {
                console.log('[Real-time] Typing channel subscription status:', status)
            })

        typingChannelRef.current = typingChannel

        return () => {
            console.log('[Real-time] Cleaning up channels for conversation:', selectedConversation.id)
            if (messageChannelRef.current) {
                supabase.removeChannel(messageChannelRef.current)
                messageChannelRef.current = null
            }
            if (typingChannelRef.current) {
                supabase.removeChannel(typingChannelRef.current)
                typingChannelRef.current = null
            }
            setOtherUserTyping(false)
        }
    }, [selectedConversation, userId, supabase])

    // Subscribe to conversations for real-time updates
    useEffect(() => {
        // Cleanup existing conversations channel
        if (conversationsChannelRef.current) {
            supabase.removeChannel(conversationsChannelRef.current)
        }

        // Conversations channel - subscribes to INSERT and UPDATE events
        // We subscribe to all conversations and filter in the handler
        const conversationsChannel = supabase
            .channel('conversations:user', {
                config: {
                    broadcast: { self: true }
                }
            })
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'conversations',
                },
                async (payload) => {
                    // Filter to only process conversations where user is a participant
                    const isParticipant = payload.new.participant_1 === userId || payload.new.participant_2 === userId
                    if (!isParticipant) return

                    console.log('[Real-time] New conversation created:', payload.new.id)

                    try {
                        // Fetch the other user's profile
                        const otherUserId = payload.new.participant_1 === userId
                            ? payload.new.participant_2
                            : payload.new.participant_1

                        const { data: profile, error: profileError } = await supabase
                            .from('profiles')
                            .select('id, display_name, avatar_url, role, is_verified')
                            .eq('id', otherUserId)
                            .single()

                        if (profileError) {
                            console.error('[Real-time] Error fetching profile for new conversation:', profileError)
                            return
                        }

                        const newConversation = { ...payload.new, other_user: profile }

                        setConversations(prev => {
                            // Check for duplicates
                            if (prev.find(c => c.id === newConversation.id)) {
                                return prev
                            }
                            // Add new conversation and sort by last_message_at
                            const updated = [newConversation, ...prev]
                            return updated.sort((a, b) =>
                                new Date(b.last_message_at || b.created_at).getTime() -
                                new Date(a.last_message_at || a.created_at).getTime()
                            )
                        })
                    } catch (err) {
                        console.error('[Real-time] Error processing new conversation:', err)
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'conversations',
                },
                (payload) => {
                    // Filter to only process conversations where user is a participant
                    const isParticipant = payload.new.participant_1 === userId || payload.new.participant_2 === userId
                    if (!isParticipant) return

                    console.log('[Real-time] Conversation UPDATE received:', payload.new.id, 'last_message_at:', payload.new.last_message_at)

                    // Update conversation in list (e.g., last_message_at)
                    setConversations(prev => {
                        const updated = prev.map(conv =>
                            conv.id === payload.new.id
                                ? { ...conv, ...payload.new }
                                : conv
                        )
                        // Re-sort by last_message_at descending
                        return updated.sort((a, b) =>
                            new Date(b.last_message_at || b.created_at).getTime() -
                            new Date(a.last_message_at || a.created_at).getTime()
                        )
                    })
                }
            )
            .subscribe((status) => {
                console.log('[Real-time] Conversations channel subscription status:', status)
            })

        conversationsChannelRef.current = conversationsChannel

        return () => {
            console.log('[Real-time] Cleaning up conversations channel')
            if (conversationsChannelRef.current) {
                supabase.removeChannel(conversationsChannelRef.current)
                conversationsChannelRef.current = null
            }
        }
    }, [userId, supabase])

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
            <div className="min-h-screen bg-black pt-16 lg:pt-0 pb-16 lg:pb-0">
                {/* Header */}
                <div className={`sticky top-16 lg:top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 ${selectedConversation ? 'hidden md:block' : ''}`}>
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
                    <div className="flex h-[calc(100vh-144px)] lg:h-[calc(100vh-80px)]">
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
                                    <div className="sticky top-0 md:relative md:top-0 z-30 bg-black/95 backdrop-blur-xl border-b border-white/10 p-3 md:p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <Link
                                                href="/dashboard/messages"
                                                className="md:hidden text-white/60 hover:text-white transition-colors"
                                                aria-label="Back to conversations list"
                                            >
                                                <ArrowLeft size={20} className="md:hidden" aria-hidden="true" />
                                            </Link>
                                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 overflow-hidden shrink-0">
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
                                                        <User size={16} className="md:w-5 md:h-5 text-white/40" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-white font-medium truncate text-sm md:text-base">
                                                    {selectedConversation.other_user?.display_name || 'Unknown'}
                                                </p>
                                                {otherUserTyping ? (
                                                    <p className="text-[#df2531] text-xs md:text-sm animate-pulse" aria-live="polite">
                                                        <span className="sr-only">User is typing</span>
                                                        typing...
                                                    </p>
                                                ) : (
                                                    <p className="text-white/40 text-xs md:text-sm truncate">
                                                        {getRoleLabel(selectedConversation.other_user?.role, selectedConversation.other_user?.is_verified)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 md:gap-2">
                                            {/* Quick Actions for Clients chatting with Talents */}
                                            {userRole === 'client' && selectedConversation.other_user?.role === 'talent' && (
                                                <>
                                                    {/* Custom Gift Button - Totally different design from talent page */}
                                                    <div className="[&>button]:!bg-gradient-to-br [&>button]:!from-purple-600 [&>button]:!to-indigo-600 [&>button]:!rounded-lg [&>button]:!p-1.5 [&>button]:!md:p-2 [&>button]:!min-w-0 [&>button]:!w-8 [&>button]:!h-8 [&>button]:!md:w-9 [&>button]:!md:h-9 [&>button]:!flex [&>button]:!items-center [&>button]:!justify-center [&>button]:!border-0 [&>button]:!shadow-md [&>button]:!shadow-purple-500/30 [&>button]:!hover:from-purple-500 [&>button]:!hover:to-indigo-500 [&>button]:!hover:shadow-lg [&>button]:!hover:shadow-purple-500/40 [&>button]:!hover:scale-105 [&>button]:!transition-all [&>button]:!duration-200 [&>button]:!active:scale-95 [&>button]:!text-white [&>button]:!gap-0 [&>button_span]:!hidden [&>button_svg]:!w-4 [&>button_svg]:!h-4 [&>button_svg]:!md:w-5 [&>button_svg]:!md:h-5">
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
                                                    </div>
                                                    <Link
                                                        href={getTalentUrl(selectedConversation.other_user)}
                                                        className="px-2 py-1.5 md:px-3 md:py-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                                                        aria-label="View profile and book"
                                                        title="View Profile & Book"
                                                    >
                                                        <CalendarPlus size={14} className="md:w-[18px] md:h-[18px]" aria-hidden="true" />
                                                        <span>Book</span>
                                                    </Link>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 md:pb-4">
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
                                    <form
                                        onSubmit={handleSendMessage}
                                        className="fixed md:sticky bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] md:bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-t border-white/10 p-3 md:p-4"
                                        style={{ maxWidth: '100%' }}
                                    >
                                        <div className="max-w-7xl mx-auto flex items-center gap-2 md:gap-3">
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
                                                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 md:px-5 py-2.5 md:py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50 text-sm md:text-base"
                                                data-testid="message-input"
                                            />
                                            <Button
                                                type="submit"
                                                disabled={!newMessage.trim() || sending}
                                                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#df2531] hover:bg-[#df2531]/90 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                                                data-testid="send-message-btn"
                                                aria-label={sending ? 'Sending message' : 'Send message'}
                                            >
                                                {sending ? (
                                                    <>
                                                        <SpinnerGap size={18} className="md:w-5 md:h-5 animate-spin" aria-hidden="true" />
                                                        <span className="sr-only">Sending</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <PaperPlaneRight size={18} className="md:w-5 md:h-5" weight="fill" aria-hidden="true" />
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
