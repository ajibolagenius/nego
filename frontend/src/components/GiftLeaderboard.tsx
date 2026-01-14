'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Trophy, Crown, Medal, Coin, SpinnerGap } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { getTalentUrl } from '@/lib/talent-url'

interface TopGifter {
  sender_id: string
  total_amount: number
  gift_count: number
  sender: {
    id: string
    display_name: string | null
    avatar_url: string | null
    username: string | null
  } | null
}

interface GiftLeaderboardProps {
  talentId: string
}

const rankIcons = [
  { icon: Crown, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  { icon: Medal, color: 'text-gray-300', bg: 'bg-gray-500/20' },
  { icon: Medal, color: 'text-amber-600', bg: 'bg-amber-600/20' },
]

export function GiftLeaderboard({ talentId }: GiftLeaderboardProps) {
  const [topGifters, setTopGifters] = useState<TopGifter[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('all')

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true)
      const supabase = createClient()

      // Calculate date filter
      let dateFilter = null
      if (timeRange === 'week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        dateFilter = weekAgo.toISOString()
      } else if (timeRange === 'month') {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        dateFilter = monthAgo.toISOString()
      }

      // Fetch gifts grouped by sender
      let query = supabase
        .from('gifts')
        .select(`
          sender_id,
          amount,
          created_at,
          sender:profiles!gifts_sender_id_fkey(id, display_name, avatar_url, username)
        `)
        .eq('recipient_id', talentId)

      if (dateFilter) {
        query = query.gte('created_at', dateFilter)
      }

      const { data: gifts, error } = await query

      if (error) {
        console.error('Leaderboard fetch error:', error)
        setLoading(false)
        return
      }

      // Aggregate by sender
      const aggregated: Record<string, TopGifter> = {}
      
      gifts?.forEach(gift => {
        if (!aggregated[gift.sender_id]) {
          aggregated[gift.sender_id] = {
            sender_id: gift.sender_id,
            total_amount: 0,
            gift_count: 0,
            sender: gift.sender as TopGifter['sender']
          }
        }
        aggregated[gift.sender_id].total_amount += gift.amount
        aggregated[gift.sender_id].gift_count += 1
      })

      // Sort by total amount and take top 10
      const sorted = Object.values(aggregated)
        .sort((a, b) => b.total_amount - a.total_amount)
        .slice(0, 10)

      setTopGifters(sorted)
      setLoading(false)
    }

    fetchLeaderboard()
  }, [talentId, timeRange])

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-center py-8">
          <SpinnerGap size={24} className="text-amber-500 animate-spin" />
        </div>
      </div>
    )
  }

  if (topGifters.length === 0) {
    return null // Don't show leaderboard if no gifts
  }

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Trophy size={20} weight="fill" className="text-amber-500" />
          Top Supporters
        </h3>
        <div className="flex gap-1">
          {(['week', 'month', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                timeRange === range
                  ? 'bg-amber-500 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              {range === 'week' ? '7D' : range === 'month' ? '30D' : 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {topGifters.map((gifter, index) => {
          const RankIcon = rankIcons[index]?.icon || Medal
          const rankColor = rankIcons[index]?.color || 'text-white/40'
          const rankBg = rankIcons[index]?.bg || 'bg-white/10'

          return (
            <div
              key={gifter.sender_id}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              {/* Rank */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${rankBg}`}>
                {index < 3 ? (
                  <RankIcon size={16} weight="fill" className={rankColor} />
                ) : (
                  <span className="text-white/40 text-sm font-bold">{index + 1}</span>
                )}
              </div>

              {/* Avatar */}
              <Link 
                href={gifter.sender ? getTalentUrl(gifter.sender) : '#'}
                className="relative w-10 h-10 rounded-full overflow-hidden bg-white/10 flex-shrink-0"
              >
                {gifter.sender?.avatar_url ? (
                  <Image
                    src={gifter.sender.avatar_url}
                    alt={gifter.sender.display_name || 'User'}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40 text-sm font-bold">
                    {gifter.sender?.display_name?.[0] || '?'}
                  </div>
                )}
              </Link>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {gifter.sender?.display_name || 'Anonymous'}
                </p>
                <p className="text-white/40 text-xs">
                  {gifter.gift_count} gift{gifter.gift_count > 1 ? 's' : ''}
                </p>
              </div>

              {/* Amount */}
              <div className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                {gifter.total_amount.toLocaleString()}
                <Coin size={14} weight="fill" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
