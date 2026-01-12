'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft, PaperPlaneRight, User, Chat, MagnifyingGlass,
  DotsThree, Phone, VideoCamera, SpinnerGap, CheckCircle
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

export function MessagesClient({ userId, conversations: initialConversations }: MessagesClientProps) {
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const [conversations, setConversations] = useState(initialConversations)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Fetch messages for selected conversation
  const fetchMessages = async (conversationId: string) => {
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
  }

  // Select a conversation
  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv)
    fetchMessages(conv.id)
    inputRef.current?.focus()
  }

  // Send a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    setSending(true)
    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: selectedConversation.id,
        sender_id: userId,
        content: newMessage.trim(),
      })

    if (!error) {
      setNewMessage('')
    }
    setSending(false)
  }

  // Subscribe to new messages
  useEffect(() => {
    if (!selectedConversation) return

    const channel = supabase
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
            setMessages(prev => [...prev, data])
            // Mark as read if not from current user
            if (data.sender_id !== userId) {
              await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', data.id)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedConversation, userId])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
    <div className="min-h-screen bg-black">
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
                      <p className="text-white/40 text-xs capitalize">
                        {selectedConversation.other_user?.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                      <Phone size={20} />
                    </button>
                    <button className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                      <VideoCamera size={20} />
                    </button>
                    <button className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                      <DotsThree size={20} weight="bold" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <SpinnerGap size={32} className="text-[#df2531] animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                      <Chat size={48} className="text-white/20 mx-auto mb-4" />
                      <p className="text-white/50">No messages yet</p>
                      <p className="text-white/30 text-sm">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.sender_id === userId
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex items-end gap-2 max-w-[75%] ${isMine ? 'flex-row-reverse' : ''}`}>
                            {!isMine && (
                              <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden shrink-0">
                                {msg.sender?.avatar_url ? (
                                  <Image
                                    src={msg.sender.avatar_url}
                                    alt=""
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <User size={16} className="text-white/40" />
                                  </div>
                                )}
                              </div>
                            )}
                            <div
                              className={`px-4 py-2.5 rounded-2xl ${
                                isMine
                                  ? 'bg-[#df2531] text-white rounded-br-md'
                                  : 'bg-white/10 text-white rounded-bl-md'
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                              <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                                <span className="text-[10px] opacity-60">
                                  {formatTime(msg.created_at)}
                                </span>
                                {isMine && msg.is_read && (
                                  <CheckCircle size={12} className="opacity-60" />
                                )}
                              </div>
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
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50"
                    />
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="bg-[#df2531] hover:bg-[#c41f2a] text-white p-3 rounded-xl disabled:opacity-50"
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
                  <p className="text-white/30 text-sm mt-1">
                    Choose from your existing conversations
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
