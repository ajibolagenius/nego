'use client'

import {
    ArrowLeft, Gift, Coin, ArrowUpRight, ArrowDownLeft,
    Calendar, ChatCircle, MagnifyingGlass, X
} from '@phosphor-icons/react'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { useWallet } from '@/hooks/useWallet'
import { getTalentUrl } from '@/lib/talent-url'
import type { Profile, Gift as GiftType, Wallet } from '@/types/database'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface GiftHistoryClientProps {
    user: SupabaseUser
    profile: Profile | null
    sentGifts: GiftType[]
    receivedGifts: GiftType[]
    wallet: Wallet | null
}

type TabType = 'received' | 'sent'

// Helper function to format amount consistently
const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export function GiftHistoryClient({
    user,
    profile,
    sentGifts,
    receivedGifts,
    wallet: initialWallet
}: GiftHistoryClientProps) {
    const [activeTab, setActiveTab] = useState<TabType>('received')
    const [searchQuery, setSearchQuery] = useState('')

    // Real-time wallet synchronization
    const { wallet } = useWallet({ userId: user.id, initialWallet })
    const walletBalance = wallet?.balance || 0

    // Memoized totals
    const totalReceived = useMemo(() =>
        receivedGifts.reduce((sum, g) => sum + g.amount, 0),
        [receivedGifts]
    )
    const totalSent = useMemo(() =>
        sentGifts.reduce((sum, g) => sum + g.amount, 0),
        [sentGifts]
    )

    // Memoized filtered gifts based on search query
    const filteredGifts = useMemo(() => {
        const currentGifts = activeTab === 'received' ? receivedGifts : sentGifts

        if (!searchQuery.trim()) {
            return currentGifts
        }

        const query = searchQuery.toLowerCase()
        return currentGifts.filter(gift => {
            const otherUser = activeTab === 'received' ? gift.sender : gift.recipient

            // Search by name
            if (otherUser?.display_name?.toLowerCase().includes(query)) {
                return true
            }

            // Search by message
            if (gift.message?.toLowerCase().includes(query)) {
                return true
            }

            // Search by amount
            if (gift.amount.toString().includes(query)) {
                return true
            }

            return false
        })
    }, [activeTab, receivedGifts, sentGifts, searchQuery])

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

    const clearSearch = () => {
        setSearchQuery('')
    }

    const receivedCount = receivedGifts.length
    const sentCount = sentGifts.length

    return (
        <>
            <div className="min-h-screen bg-black pt-16 lg:pt-0 pb-20 lg:pb-0">
                {/* Header */}
                <header className="fixed lg:sticky top-[64px] lg:top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 border-t-0">
                    <div className="max-w-3xl mx-auto px-4 py-4">
                        <div className="flex items-center gap-4 mb-4">
                            <Link
                                href="/dashboard"
                                className="text-white/60 hover:text-white transition-colors"
                                aria-label="Back to dashboard"
                            >
                                <ArrowLeft size={24} aria-hidden="true" />
                            </Link>
                            <div className="flex-1">
                                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Gift size={24} weight="duotone" className="text-amber-500" aria-hidden="true" />
                                    Gift History
                                </h1>
                                <p className="text-white/50 text-sm mt-1">
                                    Track all your coin gifts sent and received
                                </p>
                            </div>
                        </div>

                        {/* Search Bar */}
                        {(receivedGifts.length > 0 || sentGifts.length > 0) && (
                            <div className="relative">
                                <MagnifyingGlass
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                                    size={18}
                                    aria-hidden="true"
                                />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name, message, or amount..."
                                    autoComplete="off"
                                    aria-label="Search gifts by name, message, or amount"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={clearSearch}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                        aria-label="Clear search"
                                        title="Clear search"
                                    >
                                        <X size={18} aria-hidden="true" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </header>

                <div className="max-w-3xl mx-auto px-4 py-6 pt-[128px] lg:pt-6 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20">
                            <div className="flex items-center gap-2 text-green-400 mb-2">
                                <ArrowDownLeft size={18} aria-hidden="true" />
                                <span className="text-sm font-medium">Total Received</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{formatAmount(totalReceived)}</p>
                            <p className="text-green-400/70 text-xs">
                                {receivedCount === 1 ? '1 gift' : `${receivedCount} gifts`}
                            </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20">
                            <div className="flex items-center gap-2 text-amber-400 mb-2">
                                <ArrowUpRight size={18} aria-hidden="true" />
                                <span className="text-sm font-medium">Total Sent</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{formatAmount(totalSent)}</p>
                            <p className="text-amber-400/70 text-xs">
                                {sentCount === 1 ? '1 gift' : `${sentCount} gifts`}
                            </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20">
                            <div className="flex items-center gap-2 text-blue-400 mb-2">
                                <Coin size={18} weight="fill" aria-hidden="true" />
                                <span className="text-sm font-medium">Available Balance</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{formatAmount(walletBalance)}</p>
                            <p className="text-blue-400/70 text-xs">coins</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 p-1 bg-white/5 rounded-xl" role="tablist">
                        <button
                            onClick={() => setActiveTab('received')}
                            role="tab"
                            aria-pressed={activeTab === 'received'}
                            aria-label={`Received gifts tab, ${receivedCount} gifts`}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${activeTab === 'received'
                                    ? 'bg-green-500 text-white'
                                    : 'text-white/60 hover:text-white'
                                }`}
                        >
                            <ArrowDownLeft size={18} aria-hidden="true" />
                            Received ({receivedCount})
                        </button>
                        <button
                            onClick={() => setActiveTab('sent')}
                            role="tab"
                            aria-pressed={activeTab === 'sent'}
                            aria-label={`Sent gifts tab, ${sentCount} gifts`}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${activeTab === 'sent'
                                    ? 'bg-amber-500 text-white'
                                    : 'text-white/60 hover:text-white'
                                }`}
                        >
                            <ArrowUpRight size={18} aria-hidden="true" />
                            Sent ({sentCount})
                        </button>
                    </div>

                    {/* Gift List */}
                    {filteredGifts.length === 0 ? (
                        <div className="text-center py-16 rounded-2xl bg-white/5 border border-white/10">
                            {searchQuery ? (
                                <>
                                    <MagnifyingGlass size={48} weight="duotone" className="text-white/20 mx-auto mb-4" aria-hidden="true" />
                                    <p className="text-white/50 font-medium mb-2">No results found</p>
                                    <p className="text-white/30 text-sm mb-4">
                                        No gifts match your search. Try a different term or clear your search.
                                    </p>
                                    <button
                                        onClick={clearSearch}
                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                                        aria-label="Clear search to show all gifts"
                                    >
                                        <X size={18} aria-hidden="true" />
                                        Clear Search
                                    </button>
                                </>
                            ) : activeTab === 'received' ? (
                                <>
                                    <Gift size={48} weight="duotone" className="text-white/20 mx-auto mb-4" aria-hidden="true" />
                                    <p className="text-white/50 font-medium mb-2">No gifts received yet</p>
                                    <p className="text-white/30 text-sm">
                                        When someone sends you a coin gift, it will appear here. Gifts are a way for clients to show appreciation to talents.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Gift size={48} weight="duotone" className="text-white/20 mx-auto mb-4" aria-hidden="true" />
                                    <p className="text-white/50 font-medium mb-2">No gifts sent yet</p>
                                    <p className="text-white/30 text-sm mb-4">
                                        Send a gift to your favorite talent to show appreciation
                                    </p>
                                    <Link
                                        href="/dashboard/browse"
                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#df2531] text-white font-medium hover:bg-[#c41f2a] transition-colors"
                                        aria-label="Browse talent to send gifts"
                                    >
                                        <MagnifyingGlass size={18} aria-hidden="true" />
                                        Browse Talent
                                    </Link>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredGifts.map((gift) => {
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
                                            aria-label={`View ${otherUser?.display_name || 'user'} profile`}
                                        >
                                            {otherUser?.avatar_url ? (
                                                <Image
                                                    src={otherUser.avatar_url}
                                                    alt={otherUser.display_name || 'User'}
                                                    fill
                                                    sizes="48px"
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white/40" aria-hidden="true">
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
                                                <p className="text-white/50 text-sm line-clamp-2 break-words flex items-start gap-1 mt-1">
                                                    <ChatCircle size={14} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
                                                    <span>{gift.message}</span>
                                                </p>
                                            )}
                                            <p className="text-white/40 text-xs mt-1 flex items-center gap-1">
                                                <Calendar size={12} aria-hidden="true" />
                                                {formatDate(gift.created_at)}
                                            </p>
                                        </div>

                                        {/* Amount */}
                                        <div className={`text-right flex-shrink-0 ${isReceived ? 'text-green-400' : 'text-amber-400'}`}>
                                            <div className="flex items-center gap-1 font-bold">
                                                {isReceived ? '+' : '-'}{formatAmount(gift.amount)}
                                                <Coin size={16} weight="fill" aria-hidden="true" />
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
