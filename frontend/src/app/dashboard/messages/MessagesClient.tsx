'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, PaperPlaneRight, User, Chat, MagnifyingGlass,
  DotsThree, Phone, VideoCamera, SpinnerGap, CheckCircle, Checks
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { MobileBottomNav } from '@/components/MobileBottomNav'
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
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setMessages(data)
      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
    }
    setLoading(false)
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
        const { data } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .single()
        
        if (data) {
          // Fetch the other user's profile
          const otherUserId = data.participant_1 === userId ? data.participant_2 : data.participant_1
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, role')
            .eq('id', otherUserId)
            .single()
          
          const convWithUser = { ...data, other_user: profile }
          setConversations(prev => {
            if (prev.find(c => c.id === data.id)) return prev
            return [convWithUser, ...prev]
          })
          handleSelectConversation(convWithUser)
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

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: selectedConversation.id,
        sender_id: userId,
        content: messageContent,
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url)
      `)
      .single()

    if (!error && data) {
      // Replace temp message with real one
      setMessages(prev => prev.map(m => 
        m.id === tempMessage.id ? data : m
      ))
      
      // Update conversation's last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConversation.id)
    } else {
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id))
      setNewMessage(messageContent) // Restore message
    }
    setSending(false)
  }

  // Handle typing indicator
  const handleTyping = () => {
    if (!selectedConversation) return
    
    // Broadcast typing status
    supabase.channel(`typing:${selectedConversation.id}`).send({
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
      supabase.channel(`typing:${selectedConversation.id}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, isTyping: false }
      })
    }, 2000)
  }

  // Subscribe to new messages and typing indicators
  useEffect(() => {
    if (!selectedConversation) return

    // Message subscription
    const messageChannel = supabase
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

          // Fetch the full message with sender info
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setMessages(prev => {
              // Avoid duplicates
              if (prev.find(m => m.id === data.id)) return prev
              return [...prev, data]
            })
            
            // Mark as read
            await supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', data.id)
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
    const typingChannel = supabase
      .channel(`typing:${selectedConversation.id}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.userId !== userId) {
          setOtherUserTyping(payload.payload.isTyping)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(messageChannel)
      supabase.removeChannel(typingChannel)
    }
  }, [selectedConversation, userId, supabase])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
            <Link href="/dashboard" className="text-white/60 hover:text-white">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold text-white">Messages</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex h-[calc(100vh-80px)]">
          {/* Conversations List */}
          <div className={`w-full md:w-80 lg:w-96 border-r border-white/10 flex flex-col ${
            selectedConversation ? 'hidden md:flex' : 'flex'
          }`}>
            {/* Search */}
            <div className="p-4 border-b border-white/10">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <Chat size={48} className="text-white/20 mx-auto mb-4" />
                  <p className="text-white/50">No conversations yet</p>
                  <p className="text-white/30 text-sm mt-1">
                    Start chatting with a talent or client
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    data-testid={`conversation-${conv.id}`}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5 ${
                      selectedConversation?.id === conv.id ? 'bg-white/10' : ''
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden shrink-0">
                      {conv.other_user?.avatar_url ? (
                        <Image
                          src={conv.other_user.avatar_url}
                          alt={conv.other_user.display_name || ''}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User size={24} className="text-white/40" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <p className="text-white font-medium truncate">
                          {conv.other_user?.display_name || 'Unknown'}
                        </p>
                        <span className="text-white/40 text-xs">
                          {formatTime(conv.last_message_at)}
                        </span>
                      </div>
                      <p className="text-white/50 text-sm truncate capitalize">
                        {conv.other_user?.role || 'User'}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${
            !selectedConversation ? 'hidden md:flex' : 'flex'
          }`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="md:hidden text-white/60 hover:text-white"
                    >
                      <ArrowLeft size={24} />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden">
                      {selectedConversation.other_user?.avatar_url ? (
                        <Image
                          src={selectedConversation.other_user.avatar_url}
                          alt=""
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User size={20} className="text-white/40" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {selectedConversation.other_user?.display_name || 'Unknown'}
                      </p>
                      {otherUserTyping ? (
                        <p className="text-[#df2531] text-sm animate-pulse">typing...</p>
                      ) : (
                        <p className="text-white/40 text-sm capitalize">
                          {selectedConversation.other_user?.role || 'User'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10">
                      <Phone size={20} />
                    </button>
                    <button className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10">
                      <VideoCamera size={20} />
                    </button>
                    <button className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10">
                      <DotsThree size={20} weight="bold" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <SpinnerGap size={32} className="text-[#df2531] animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <Chat size={48} className="text-white/20 mx-auto mb-4" />
                      <p className="text-white/50">No messages yet</p>
                      <p className="text-white/30 text-sm">Send a message to start the conversation</p>
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
                              className={`px-4 py-2.5 rounded-2xl ${
                                isOwn
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
                                <span className="text-white/40">
                                  {message.is_read ? (
                                    <Checks size={14} className="text-blue-400" />
                                  ) : (
                                    <CheckCircle size={14} />
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
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value)
                        handleTyping()
                      }}
                      placeholder="Type a message..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50"
                      data-testid="message-input"
                    />
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="w-12 h-12 rounded-full bg-[#df2531] hover:bg-[#df2531]/90 text-white flex items-center justify-center disabled:opacity-50"
                      data-testid="send-message-btn"
                    >
                      {sending ? (
                        <SpinnerGap size={20} className="animate-spin" />
                      ) : (
                        <PaperPlaneRight size={20} weight="fill" />
                      )}
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Chat size={64} className="text-white/20 mx-auto mb-4" />
                  <p className="text-white/50 text-lg">Select a conversation</p>
                  <p className="text-white/30 text-sm">Choose from your existing conversations or start a new one</p>
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
