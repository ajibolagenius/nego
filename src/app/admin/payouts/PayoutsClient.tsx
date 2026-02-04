'use client'

import {
    Money,
    User,
    CheckCircle,
    Clock,
    XCircle,
    Wallet,
    SpinnerGap,
    Warning,
    MagnifyingGlass,
    X
, Download, Info } from '@phosphor-icons/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/admin/EmptyState'
import { Pagination } from '@/components/admin/Pagination'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Tooltip } from '@/components/admin/Tooltip'
import { Button } from '@/components/ui/button'
import { usePagination } from '@/hooks/admin/usePagination'
import { exportWithdrawalRequests, exportPayoutHistory } from '@/lib/admin/export-utils'
import { createClient } from '@/lib/supabase/client'
import type { WithdrawalRequestWithTalent, PayoutTransaction } from '@/types/admin'
import type { Profile, Wallet as WalletType } from '@/types/database'

interface TalentWithWallet extends Profile {
    wallet: WalletType | null
}

interface PayoutsClientProps {
    talents: TalentWithWallet[]
    payouts: PayoutTransaction[]
    withdrawalRequests: WithdrawalRequestWithTalent[]
}

export function PayoutsClient({
    talents: initialTalents,
    payouts: initialPayouts,
    withdrawalRequests: initialWithdrawalRequests
}: PayoutsClientProps) {
    const router = useRouter()
    const supabase = createClient()
    const [talents, setTalents] = useState<TalentWithWallet[]>(initialTalents)
    const [payouts, setPayouts] = useState<PayoutTransaction[]>(initialPayouts)
    const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequestWithTalent[]>(initialWithdrawalRequests)
    const [activeTab, setActiveTab] = useState<'requests' | 'balances' | 'history'>('requests')
    const [processing, setProcessing] = useState<string | null>(null)
    const [showRejectModal, setShowRejectModal] = useState<string | null>(null)
    const [rejectReason, setRejectReason] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const payoutChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

    // Real-time subscription for withdrawal requests, payouts, and wallets
    useEffect(() => {
        // Cleanup existing channel
        if (payoutChannelRef.current) {
            supabase.removeChannel(payoutChannelRef.current)
        }

        const payoutChannel = supabase
            .channel('admin-payouts', {
                config: {
                    broadcast: { self: false }
                }
            })
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'withdrawal_requests',
                },
                async () => {
                    // Refetch withdrawal requests
                    const { data: updatedRequests } = await supabase
                        .from('withdrawal_requests')
                        .select(`
              *,
              talent:profiles(id, display_name, avatar_url, username)
            `)
                        .order('created_at', { ascending: false })

                    if (updatedRequests) {
                        setWithdrawalRequests(updatedRequests as WithdrawalRequestWithTalent[])
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'transactions',
                    filter: 'type=eq.payout',
                },
                async () => {
                    // Refetch payout transactions
                    const { data: updatedPayouts } = await supabase
                        .from('transactions')
                        .select(`
              *,
              user:profiles(display_name, avatar_url)
            `)
                        .eq('type', 'payout')
                        .order('created_at', { ascending: false })
                        .limit(50)

                    if (updatedPayouts) {
                        setPayouts(updatedPayouts as PayoutTransaction[])
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'wallets',
                },
                async () => {
                    // Refetch talents with updated wallet balances
                    const { data: updatedTalents } = await supabase
                        .from('profiles')
                        .select(`
              *,
              wallet:wallets(*)
            `)
                        .eq('role', 'talent')
                        .order('created_at', { ascending: false })

                    if (updatedTalents) {
                        setTalents(updatedTalents as TalentWithWallet[])
                    }
                }
            )
            .subscribe((status) => {
                console.log('[Payouts] Channel subscription status:', status)
            })

        payoutChannelRef.current = payoutChannel

        return () => {
            if (payoutChannelRef.current) {
                supabase.removeChannel(payoutChannelRef.current)
                payoutChannelRef.current = null
            }
        }
    }, [supabase])

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    // Calculate totals
    const totalBalance = talents.reduce((sum, t) => sum + (t.wallet?.balance || 0), 0)
    const totalEscrow = talents.reduce((sum, t) => sum + (t.wallet?.escrow_balance || 0), 0)
    const pendingRequests = withdrawalRequests.filter((r) => r.status === 'pending')

    // Filter withdrawal requests by search
    const filteredWithdrawalRequests = withdrawalRequests.filter((request) => {
        if (!searchQuery.trim()) return true

        const query = searchQuery.toLowerCase()
        const name = (request.talent?.display_name || '').toLowerCase()
        const accountNumber = (request.account_number || '').toLowerCase()
        const bankName = (request.bank_name || '').toLowerCase()

        return name.includes(query) || accountNumber.includes(query) || bankName.includes(query)
    })

    // Filter talents by search
    const filteredTalents = talents.filter((talent) => {
        if (!searchQuery.trim()) return true

        const query = searchQuery.toLowerCase()
        const name = (talent.display_name || '').toLowerCase()
        const location = (talent.location || '').toLowerCase()

        return name.includes(query) || location.includes(query)
    })

    // Filter payouts by search
    const filteredPayouts = payouts.filter((payout) => {
        if (!searchQuery.trim()) return true

        const query = searchQuery.toLowerCase()
        const name = (payout.user?.display_name || '').toLowerCase()

        return name.includes(query)
    })

    // Pagination for withdrawal requests
    const requestsPagination = usePagination({
        data: filteredWithdrawalRequests,
        itemsPerPage: 10,
    })

    // Pagination for talents
    const talentsPagination = usePagination({
        data: filteredTalents,
        itemsPerPage: 10,
    })

    // Pagination for payouts
    const payoutsPagination = usePagination({
        data: filteredPayouts,
        itemsPerPage: 10,
    })

    const handleExportRequests = () => {
        exportWithdrawalRequests(withdrawalRequests)
        toast.success('Export Started', {
            description: 'Withdrawal requests data is being downloaded as CSV.'
        })
    }

    const handleExportHistory = () => {
        exportPayoutHistory(payouts)
        toast.success('Export Started', {
            description: 'Payout history data is being downloaded as CSV.'
        })
    }

    // Handle approve withdrawal
    const handleApprove = async (request: WithdrawalRequestWithTalent) => {
        setProcessing(request.id)

        // Optimistic update: Update UI immediately
        const previousRequests = [...withdrawalRequests]
        setWithdrawalRequests(prev => prev.map(r =>
            r.id === request.id
                ? { ...r, status: 'approved', processed_at: new Date().toISOString() }
                : r
        ))

        try {
            const response = await fetch(`/api/admin/payouts/${request.id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to approve withdrawal')
            }

            toast.success('Withdrawal Approved', {
                description: `Successfully approved withdrawal of ${request.amount.toLocaleString()} coins for ${request.talent?.display_name || 'talent'}.`
            })

            router.refresh()
        } catch (error) {
            // Revert optimistic update on error
            setWithdrawalRequests(previousRequests)

            console.error('Error approving withdrawal:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to approve withdrawal. Please try again.'
            toast.error('Approval Failed', {
                description: errorMessage
            })
        } finally {
            setProcessing(null)
        }
    }

    // Handle reject withdrawal
    const handleReject = async (requestId: string) => {
        setProcessing(requestId)

        // Optimistic update: Update UI immediately
        const previousRequests = [...withdrawalRequests]
        setWithdrawalRequests(prev => prev.map(r =>
            r.id === requestId
                ? { ...r, status: 'rejected', admin_notes: rejectReason || 'Rejected by admin', processed_at: new Date().toISOString() }
                : r
        ))

        try {
            const response = await fetch(`/api/admin/payouts/${requestId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: rejectReason || 'Rejected by admin' }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to reject withdrawal')
            }

            setShowRejectModal(null)
            setRejectReason('')

            toast.success('Withdrawal Rejected', {
                description: `Withdrawal request has been rejected.`
            })

            router.refresh()
        } catch (error) {
            // Revert optimistic update on error
            setWithdrawalRequests(previousRequests)

            console.error('Error rejecting withdrawal:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to reject withdrawal. Please try again.'
            toast.error('Rejection Failed', {
                description: errorMessage
            })
        } finally {
            setProcessing(null)
        }
    }

    return (
        <div className="p-4 sm:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Payouts</h1>
                    <div className="flex items-center gap-2">
                        <p className="text-white/60">Manage talent earnings and process withdrawal requests</p>
                        <Tooltip content="Approve withdrawals to deduct coins from talent wallets. Rejected withdrawals keep the coins in the talent's wallet.">
                            <Info size={16} className="text-white/40 hover:text-white/60 cursor-help" />
                        </Tooltip>
                    </div>
                </div>
                <div className="flex gap-2">
                    {activeTab === 'requests' && (
                        <button
                            onClick={handleExportRequests}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black"
                            aria-label="Export withdrawal requests to CSV"
                        >
                            <Download size={18} aria-hidden="true" />
                            <span className="text-sm font-medium">Export CSV</span>
                        </button>
                    )}
                    {activeTab === 'history' && (
                        <button
                            onClick={handleExportHistory}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black"
                            aria-label="Export payout history to CSV"
                        >
                            <Download size={18} aria-hidden="true" />
                            <span className="text-sm font-medium">Export CSV</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <Clock size={20} className="text-amber-400" />
                        </div>
                        <p className="text-white/60 text-sm">Pending Requests</p>
                    </div>
                    <p className="text-2xl font-bold text-white">{pendingRequests.length}</p>
                </div>

                <div className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <Wallet size={20} className="text-green-400" />
                        </div>
                        <p className="text-white/60 text-sm">Total Balances</p>
                    </div>
                    <p className="text-2xl font-bold text-white">{totalBalance.toLocaleString()}</p>
                </div>

                <div className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Money size={20} className="text-blue-400" />
                        </div>
                        <p className="text-white/60 text-sm">In Escrow</p>
                    </div>
                    <p className="text-2xl font-bold text-white">{totalEscrow.toLocaleString()}</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <MagnifyingGlass
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                    size={18}
                    aria-hidden="true"
                />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                        activeTab === 'requests'
                            ? 'Search by talent name, account number, or bank...'
                            : activeTab === 'balances'
                                ? 'Search by talent name or location...'
                                : 'Search by name...'
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:border-[#df2531]/50 transition-colors"
                    aria-label="Search"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#df2531] rounded p-1"
                        aria-label="Clear search"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors relative focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black ${activeTab === 'requests'
                        ? 'bg-[#df2531] text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                    aria-label="View withdrawal requests"
                    aria-pressed={activeTab === 'requests'}
                >
                    Withdrawal Requests
                    {pendingRequests.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">
                            {pendingRequests.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('balances')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black ${activeTab === 'balances'
                        ? 'bg-[#df2531] text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                >
                    Talent Balances
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black ${activeTab === 'history'
                        ? 'bg-[#df2531] text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                >
                    History
                </button>
            </div>

            {/* Content */}
            {activeTab === 'requests' && (
                <div className="space-y-4">
                    {requestsPagination.totalItems === 0 ? (
                        <EmptyState
                            icon={searchQuery ? MagnifyingGlass : Money}
                            title={searchQuery ? 'No results found' : 'No withdrawal requests'}
                            description={
                                searchQuery
                                    ? `No withdrawal requests match "${searchQuery}". Try adjusting your search terms.`
                                    : 'All withdrawal requests have been processed.'
                            }
                            size="md"
                        />
                    ) : (
                        <>
                            {requestsPagination.currentData.map((request) => {
                                const isPending = request.status === 'pending'

                                return (
                                    <div
                                        key={request.id}
                                        className={`p-4 sm:p-6 rounded-2xl border transition-colors ${isPending ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white/5 border-white/10'
                                            }`}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                            {/* Talent Info */}
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 shrink-0">
                                                    {request.talent?.avatar_url ? (
                                                        <Image
                                                            src={request.talent.avatar_url}
                                                            alt=""
                                                            width={48}
                                                            height={48}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <User size={24} className="text-white/30" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">
                                                        {request.talent?.display_name || 'Unknown'}
                                                    </p>
                                                    <p className="text-white/40 text-sm">{formatDate(request.created_at)}</p>
                                                </div>
                                            </div>

                                            {/* Bank Details */}
                                            <div className="flex-1 px-4 py-3 rounded-xl bg-black/20">
                                                <p className="text-white/60 text-xs mb-1">Bank Details</p>
                                                <p className="text-white font-medium text-sm">{request.bank_name}</p>
                                                <p className="text-white/70 text-sm">{request.account_number}</p>
                                                <p className="text-white/50 text-xs">{request.account_name}</p>
                                            </div>

                                            {/* Amount & Status */}
                                            <div className="text-right">
                                                <p className="text-white font-bold text-xl">{request.amount.toLocaleString()}</p>
                                                <p className="text-white/40 text-sm">coins</p>
                                                <div className="mt-2 flex justify-end">
                                                    <StatusBadge
                                                        status={request.status as 'pending' | 'approved' | 'rejected' | 'completed' | 'failed'}
                                                        size="sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions for pending requests */}
                                        {isPending && (
                                            <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
                                                <Button
                                                    onClick={() => handleApprove(request)}
                                                    disabled={processing === request.id}
                                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    {processing === request.id ? (
                                                        <SpinnerGap size={18} className="animate-spin" />
                                                    ) : (
                                                        <>
                                                            <CheckCircle size={18} className="mr-2" />
                                                            Approve
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    onClick={() => setShowRejectModal(request.id)}
                                                    disabled={processing === request.id}
                                                    variant="outline"
                                                    className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                                                >
                                                    <XCircle size={18} className="mr-2" />
                                                    Reject
                                                </Button>
                                            </div>
                                        )}

                                        {/* Admin notes for rejected */}
                                        {request.status === 'rejected' && request.admin_notes && (
                                            <div className="mt-4 pt-4 border-t border-white/10">
                                                <p className="text-red-400 text-sm">
                                                    <Warning size={14} className="inline mr-1" />
                                                    {request.admin_notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}

                            {/* Pagination */}
                            {requestsPagination.totalItems > 0 && (
                                <Pagination
                                    currentPage={requestsPagination.currentPage}
                                    totalPages={requestsPagination.totalPages}
                                    totalItems={requestsPagination.totalItems}
                                    itemsPerPage={10}
                                    onPageChange={requestsPagination.goToPage}
                                    onItemsPerPageChange={requestsPagination.setItemsPerPage}
                                />
                            )}
                        </>
                    )}
                </div>
            )}

            {activeTab === 'balances' && (
                <div className="space-y-4">
                    {talentsPagination.totalItems === 0 ? (
                        <EmptyState
                            icon={searchQuery ? MagnifyingGlass : User}
                            title={searchQuery ? 'No results found' : 'No talents registered yet'}
                            description={
                                searchQuery
                                    ? `No talents match "${searchQuery}". Try adjusting your search terms.`
                                    : 'No talent accounts have been created yet.'
                            }
                            size="md"
                        />
                    ) : (
                        <>
                            {talentsPagination.currentData.map((talent) => (
                                <div
                                    key={talent.id}
                                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10"
                                >
                                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white/10 shrink-0">
                                        {talent.avatar_url ? (
                                            <Image
                                                src={talent.avatar_url}
                                                alt={talent.display_name || ''}
                                                fill
                                                sizes="48px"
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User size={24} className="text-white/30" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium truncate">
                                            {talent.display_name || 'Unknown Talent'}
                                        </p>
                                        <p className="text-white/40 text-sm">{talent.location || 'No location'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-bold">
                                            {talent.wallet?.balance?.toLocaleString() || 0} coins
                                        </p>
                                        {(talent.wallet?.escrow_balance || 0) > 0 && (
                                            <p className="text-amber-400 text-sm">
                                                +{talent.wallet?.escrow_balance?.toLocaleString()} escrow
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Pagination */}
                            {talentsPagination.totalItems > 0 && (
                                <Pagination
                                    currentPage={talentsPagination.currentPage}
                                    totalPages={talentsPagination.totalPages}
                                    totalItems={talentsPagination.totalItems}
                                    itemsPerPage={10}
                                    onPageChange={talentsPagination.goToPage}
                                    onItemsPerPageChange={talentsPagination.setItemsPerPage}
                                />
                            )}
                        </>
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <div className="space-y-4">
                    {payoutsPagination.totalItems === 0 ? (
                        <EmptyState
                            icon={searchQuery ? MagnifyingGlass : Money}
                            title={searchQuery ? 'No results found' : 'No payout history yet'}
                            description={
                                searchQuery
                                    ? `No payouts match "${searchQuery}". Try adjusting your search terms.`
                                    : 'No payout transactions have been recorded yet.'
                            }
                            size="md"
                        />
                    ) : (
                        <>
                            {payoutsPagination.currentData.map((payout) => {
                                return (
                                    <div
                                        key={payout.id}
                                        className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                            <Money size={20} className="text-white/60" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium">
                                                {payout.user?.display_name || 'Unknown'}
                                            </p>
                                            <p className="text-white/40 text-sm">{formatDate(payout.created_at)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white font-bold">{Math.abs(payout.coins || payout.amount)} coins</p>
                                            <div className="mt-1 flex justify-end">
                                                <StatusBadge
                                                    status={payout.status as 'pending' | 'approved' | 'rejected' | 'completed' | 'failed'}
                                                    size="sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}

                            {/* Pagination */}
                            {payoutsPagination.totalItems > 0 && (
                                <Pagination
                                    currentPage={payoutsPagination.currentPage}
                                    totalPages={payoutsPagination.totalPages}
                                    totalItems={payoutsPagination.totalItems}
                                    itemsPerPage={10}
                                    onPageChange={payoutsPagination.goToPage}
                                    onItemsPerPageChange={payoutsPagination.setItemsPerPage}
                                />
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowRejectModal(null)}
                    />
                    <div className="relative bg-[#1a1a1a] rounded-2xl p-6 max-w-md w-full border border-white/10">
                        <h3 className="text-xl font-bold text-white mb-2">Reject Withdrawal</h3>
                        <p className="text-white/60 text-sm mb-4">
                            Provide a reason for rejecting this withdrawal request.
                        </p>

                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection..."
                            className="w-full h-24 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531] resize-none mb-4"
                        />

                        <div className="flex gap-3">
                            <Button
                                onClick={() => {
                                    setShowRejectModal(null)
                                    setRejectReason('')
                                }}
                                variant="ghost"
                                className="flex-1 text-white/60 hover:text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => handleReject(showRejectModal)}
                                disabled={processing === showRejectModal || !rejectReason.trim()}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            >
                                {processing === showRejectModal ? (
                                    <SpinnerGap size={18} className="animate-spin" />
                                ) : (
                                    'Reject'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
