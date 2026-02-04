'use client'

import { Trophy, Crown, Medal, Coin, SpinnerGap } from '@phosphor-icons/react'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
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
    const [error, setError] = useState<string | null>(null)
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('all')

    useEffect(() => {
        async function fetchLeaderboard() {
            setLoading(true)
            setError(null)
            const supabase = createClient()

            try {
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

                const { data: gifts, error: fetchError } = await query

                if (fetchError) {
                    console.error('Leaderboard fetch error:', fetchError)
                    setError('Failed to load leaderboard')
                    setLoading(false)
                    return
                }

                // Aggregate by sender
                const aggregated: Record<string, TopGifter> = {}

                gifts?.forEach(gift => {
                    if (!aggregated[gift.sender_id]) {
                        // Handle sender which could be an array or single object from Supabase
                        const senderData = Array.isArray(gift.sender) ? gift.sender[0] : gift.sender
                        aggregated[gift.sender_id] = {
                            sender_id: gift.sender_id,
                            total_amount: 0,
                            gift_count: 0,
                            sender: senderData as TopGifter['sender']
                        }
                    }
                    const entry = aggregated[gift.sender_id]
                    if (entry) {
                        entry.total_amount += gift.amount
                        entry.gift_count += 1
                    }
                })

                // Sort by total amount and take top 10
                const sorted = Object.values(aggregated)
                    .sort((a, b) => b.total_amount - a.total_amount)
                    .slice(0, 10)

                setTopGifters(sorted)
            } catch (err) {
                console.error('Leaderboard error:', err)
                setError('Failed to load leaderboard')
            } finally {
                setLoading(false)
            }
        }

        fetchLeaderboard()
    }, [talentId, timeRange])

    if (loading) {
        return (
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10" role="status" aria-live="polite">
                <div className="flex items-center justify-center py-8">
                    <SpinnerGap size={24} className="text-amber-500 animate-spin" aria-hidden="true" />
                    <span className="sr-only">Loading leaderboard</span>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-6 rounded-2xl bg-white/5 border border-red-500/20" role="alert">
                <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
        )
    }

    if (topGifters.length === 0) {
        return (
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-center py-4">
                    <Trophy size={32} weight="duotone" className="text-white/20 mx-auto mb-2" aria-hidden="true" />
                    <p className="text-white/50 text-sm">No gifts yet</p>
                    <p className="text-white/30 text-xs mt-1">Be the first to send a gift!</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Trophy size={20} weight="fill" className="text-amber-500" aria-hidden="true" />
                    Top Supporters
                </h3>
                <div className="flex gap-1" role="tablist" aria-label="Time range filter">
                    {(['week', 'month', 'all'] as const).map((range) => {
                        const isSelected = timeRange === range
                        return (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                role="tab"
                                aria-pressed={isSelected}
                                aria-label={`Filter by ${range === 'week' ? '7 days' : range === 'month' ? '30 days' : 'all time'}`}
                                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${isSelected
                                        ? 'bg-amber-500 text-white'
                                        : 'text-white/50 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                {range === 'week' ? '7D' : range === 'month' ? '30D' : 'All'}
                            </button>
                        )
                    })}
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
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${rankBg}`} aria-label={`Rank ${index + 1}`}>
                                {index < 3 ? (
                                    <RankIcon size={16} weight="fill" className={rankColor} aria-hidden="true" />
                                ) : (
                                    <span className="text-white/40 text-sm font-bold">{index + 1}</span>
                                )}
                            </div>

                            {/* Avatar */}
                            <Link
                                href={gifter.sender ? getTalentUrl(gifter.sender) : '#'}
                                className="relative w-10 h-10 rounded-full overflow-hidden bg-white/10 flex-shrink-0"
                                aria-label={`View ${gifter.sender?.display_name || 'user'} profile`}
                            >
                                {gifter.sender?.avatar_url ? (
                                    <Image
                                        src={gifter.sender.avatar_url}
                                        alt={gifter.sender.display_name || 'User'}
                                        fill
                                        sizes="40px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/40 text-sm font-bold" aria-hidden="true">
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
                                    {gifter.gift_count === 1 ? '1 gift' : `${gifter.gift_count} gifts`}
                                </p>
                            </div>

                            {/* Amount */}
                            <div className="flex items-center gap-1 text-amber-400 font-bold text-sm" aria-label={`${gifter.total_amount.toLocaleString()} coins`}>
                                {gifter.total_amount.toLocaleString()}
                                <Coin size={14} weight="fill" aria-hidden="true" />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
