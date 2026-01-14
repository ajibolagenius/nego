'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft, Gift, Coin, ArrowUpRight, ArrowDownLeft,
  Calendar, ChatCircle, Trophy, Crown, Medal, Star
} from '@phosphor-icons/react'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { getTalentUrl } from '@/lib/talent-url'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

interface GiftWithUser {
  id: string
  sender_id: string
  recipient_id: string
  amount: number
  message: string | null
  created_at: string
  sender?: Profile
  recipient?: Profile
}

interface GiftHistoryClientProps {
  user: SupabaseUser
  profile: Profile | null
  sentGifts: GiftWithUser[]
  receivedGifts: GiftWithUser[]
  walletBalance: number
}

type TabType = 'received' | 'sent'

export function GiftHistoryClient({ 
  user, 
  profile, 
  sentGifts, 
  receivedGifts,
  walletBalance 
}: GiftHistoryClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('received')

  const totalReceived = receivedGifts.reduce((sum, g) => sum + g.amount, 0)
  const totalSent = sentGifts.reduce((sum, g) => sum + g.amount, 0)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    }
    return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
  }

  const currentGifts = activeTab === 'received' ? receivedGifts : sentGifts

  return (
    <>
      <div className="min-h-screen bg-black pt-16 lg:pt-0 pb-20 lg:pb-0">
        {/* Header */}
        <header className="sticky top-16 lg:top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
                <ArrowLeft size={24} />
              </Link>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Gift size={24} weight="duotone" className="text-amber-500" />
                  Gift History
                </h1>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <ArrowDownLeft size={18} />
                <span className="text-sm font-medium">Received</span>
              </div>
              <p className="text-2xl font-bold text-white">{totalReceived.toLocaleString()}</p>
              <p className="text-green-400/70 text-xs">{receivedGifts.length} gifts</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <ArrowUpRight size={18} />
                <span className="text-sm font-medium">Sent</span>
              </div>
              <p className="text-2xl font-bold text-white">{totalSent.toLocaleString()}</p>
              <p className="text-amber-400/70 text-xs">{sentGifts.length} gifts</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'received'
                  ? 'bg-green-500 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <ArrowDownLeft size={18} />
              Received ({receivedGifts.length})
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'sent'
                  ? 'bg-amber-500 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <ArrowUpRight size={18} />
              Sent ({sentGifts.length})
            </button>
          </div>

          {/* Gift List */}
          {currentGifts.length === 0 ? (
            <div className="text-center py-16 rounded-2xl bg-white/5 border border-white/10">
              <Gift size={48} weight="duotone" className="text-white/20 mx-auto mb-4" />
              <p className="text-white/50 mb-2">
                {activeTab === 'received' ? 'No gifts received yet' : 'No gifts sent yet'}
              </p>
              <p className="text-white/30 text-sm">
                {activeTab === 'received' 
                  ? 'When someone sends you a gift, it will appear here'
                  : 'Send a gift to your favorite talent to show appreciation'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentGifts.map((gift) => {
                const otherUser = activeTab === 'received' ? gift.sender : gift.recipient
                const isReceived = activeTab === 'received'
                
                return (
                  <div
                    key={gift.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    {/* Avatar */}
                    <Link 
                      href={otherUser ? getTalentUrl(otherUser) : '#'}
                      className="relative w-12 h-12 rounded-full overflow-hidden bg-white/10 flex-shrink-0"
                    >
                      {otherUser?.avatar_url ? (
                        <Image
                          src={otherUser.avatar_url}
                          alt={otherUser.display_name || 'User'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/40">
                          <Gift size={20} />
                        </div>
                      )}
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium truncate">
                          {isReceived ? 'From' : 'To'} {otherUser?.display_name || 'Unknown'}
                        </p>
                      </div>
                      {gift.message && (
                        <p className="text-white/50 text-sm truncate flex items-center gap-1 mt-1">
                          <ChatCircle size={14} />
                          {gift.message}
                        </p>
                      )}
                      <p className="text-white/40 text-xs mt-1 flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(gift.created_at)}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className={`text-right ${isReceived ? 'text-green-400' : 'text-amber-400'}`}>
                      <div className="flex items-center gap-1 font-bold">
                        {isReceived ? '+' : '-'}{gift.amount.toLocaleString()}
                        <Coin size={16} weight="fill" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <MobileBottomNav userRole={profile?.role || 'client'} />
    </>
  )
}
