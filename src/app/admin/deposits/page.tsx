'use client'

import {
    Bank, CheckCircle, XCircle, Clock, MagnifyingGlass,
    ArrowUpRight, ArrowsClockwise, ImageSquare, CalendarBlank
} from '@phosphor-icons/react'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface DepositRequest {
    id: string
    user_id: string
    amount: number
    proof_url: string
    status: 'pending' | 'approved' | 'rejected'
    reference: string | null
    admin_notes: string | null
    created_at: string
    profiles: {
        email: string
        full_name: string
        username: string
        avatar_url: string
    }
}

export default function DepositsPage() {
    const supabase = createClient()
    const [deposits, setDeposits] = useState<DepositRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [reviewModalOpen, setReviewModalOpen] = useState(false)
    const [selectedDeposit, setSelectedDeposit] = useState<DepositRequest | null>(null)
    const [rejectReason, setRejectReason] = useState('')
    const [lightboxImage, setLightboxImage] = useState<string | null>(null)

    useEffect(() => {
        fetchDeposits()

        // Real-time subscription
        const channel = supabase
            .channel('deposit_requests_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'deposit_requests'
            }, () => {
                fetchDeposits()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchDeposits = async () => {
        try {
            const { data, error } = await supabase
                .from('deposit_requests')
                .select(`
                    *,
                    profiles (
                        email,
                        full_name,
                        username,
                        avatar_url
                    )
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setDeposits(data || [])
        } catch (error) {
            console.error('Error fetching deposits:', error)
            toast.error('Failed to load deposits')
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (deposit: DepositRequest) => {
        if (!confirm(`Are you sure you want to approve this deposit of ₦${deposit.amount.toLocaleString()}?`)) return

        setProcessingId(deposit.id)
        try {
            const response = await fetch('/api/admin/deposits/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: deposit.id }),
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Failed to approve')

            toast.success('Deposit approved and wallet credited')
            setReviewModalOpen(false)
        } catch (error: any) {
            console.error('Approval error:', error)
            toast.error(error.message)
        } finally {
            setProcessingId(null)
        }
    }

    const handleReject = async () => {
        if (!selectedDeposit || !rejectReason.trim()) {
            toast.error('Please provide a reason for rejection')
            return
        }

        setProcessingId(selectedDeposit.id)
        try {
            const response = await fetch('/api/admin/deposits/reject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestId: selectedDeposit.id,
                    reason: rejectReason
                }),
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Failed to reject')

            toast.success('Deposit rejected')
            setReviewModalOpen(false)
            setRejectReason('')
        } catch (error: any) {
            console.error('Rejection error:', error)
            toast.error(error.message)
        } finally {
            setProcessingId(null)
        }
    }

    const openReview = (deposit: DepositRequest) => {
        setSelectedDeposit(deposit)
        setReviewModalOpen(true)
        setRejectReason('')
    }

    const filteredDeposits = deposits.filter(d =>
        filter === 'all' ? true : d.status === filter
    )

    const formatNaira = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0
        }).format(amount)
    }

    return (
        <div className="p-4 lg:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Bank size={32} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                        Deposit Requests
                    </h1>
                    <p className="text-white/50 text-sm mt-1">
                        Manage manual bank transfer confirmations
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setLoading(true)
                            fetchDeposits()
                        }}
                        className="p-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl transition-colors"
                        title="Refresh list"
                    >
                        <ArrowsClockwise size={20} className={loading ? 'animate-spin' : ''} />
                    </button>

                    <div className="flex bg-white/5 p-1 rounded-xl">
                        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f
                                    ? 'bg-[#df2531] text-white shadow-lg'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-white/70">
                        <thead className="bg-white/5 text-white font-medium uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Proof</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-4">
                                            <div className="h-4 bg-white/5 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredDeposits.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                                        <div className="flex flex-col items-center gap-2">
                                            <MagnifyingGlass size={32} weight="duotone" />
                                            <p>No deposits found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredDeposits.map((deposit) => (
                                    <tr key={deposit.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#df2531] to-[#9a1b23] flex items-center justify-center text-white font-bold text-xs">
                                                    {(deposit.profiles?.email && deposit.profiles.email.length > 0) ? deposit.profiles.email.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <div>
                                                    <div className="text-white font-medium">
                                                        {deposit.profiles?.full_name || 'Unknown'}
                                                    </div>
                                                    <div className="text-xs text-white/40">
                                                        @{deposit.profiles?.username || 'user'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-white font-bold">
                                            {formatNaira(deposit.amount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setLightboxImage(deposit.proof_url)}
                                                className="inline-flex items-center gap-1 text-[#df2531] hover:underline text-xs bg-[#df2531]/10 px-2 py-1 rounded-md border border-[#df2531]/20"
                                            >
                                                <ImageSquare size={14} weight="duotone" />
                                                View Proof
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-xs">
                                                <CalendarBlank size={14} className="text-white/40" />
                                                {new Date(deposit.created_at).toLocaleDateString()}
                                                <span className="text-white/30">
                                                    {new Date(deposit.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${deposit.status === 'approved'
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                : deposit.status === 'rejected'
                                                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                }`}>
                                                {deposit.status === 'approved' && <CheckCircle size={12} weight="fill" />}
                                                {deposit.status === 'rejected' && <XCircle size={12} weight="fill" />}
                                                {deposit.status === 'pending' && <Clock size={12} weight="fill" />}
                                                {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {deposit.status === 'pending' ? (
                                                <button
                                                    onClick={() => openReview(deposit)}
                                                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors font-medium"
                                                >
                                                    Review
                                                </button>
                                            ) : (
                                                <span className="text-white/30 text-xs italic">
                                                    {deposit.admin_notes || 'Processed'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Review Modal */}
            {reviewModalOpen && selectedDeposit && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setReviewModalOpen(false)}
                >
                    <div
                        className="bg-[#0a0a0f] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Review Deposit Request</h2>
                            <button onClick={() => setReviewModalOpen(false)} className="text-white/40 hover:text-white">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row h-[500px]">
                            {/* Proof Preview */}
                            <div className="w-full md:w-1/2 bg-black/50 p-4 border-b md:border-b-0 md:border-r border-white/10 flex items-center justify-center relative group">
                                <div className="relative w-full h-full min-h-[200px] rounded-lg overflow-hidden border border-white/10">
                                    <Image
                                        src={selectedDeposit.proof_url}
                                        alt="Proof of payment"
                                        fill
                                        className="object-contain"
                                        unoptimized
                                    />
                                    <button
                                        onClick={() => setLightboxImage(selectedDeposit.proof_url)}
                                        className="absolute bottom-4 right-4 bg-black/80 hover:bg-[#df2531] text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                                        title="Open full size"
                                    >
                                        <ArrowUpRight size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Details & Actions */}
                            <div className="w-full md:w-1/2 p-6 flex flex-col h-full overflow-y-auto">
                                <div className="space-y-4 flex-1">
                                    <div>
                                        <label className="text-xs text-white/40 uppercase font-bold tracking-wider">User</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-6 h-6 rounded-full bg-[#df2531] flex items-center justify-center text-xs font-bold text-white">
                                                {(selectedDeposit.profiles?.email && selectedDeposit.profiles.email.length > 0) ? selectedDeposit.profiles.email.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <p className="text-white font-medium">{selectedDeposit.profiles?.full_name || 'Unknown'}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-white/40 uppercase font-bold tracking-wider">Amount Declared</label>
                                        <p className="text-2xl font-bold text-white mt-1">{formatNaira(selectedDeposit.amount)}</p>
                                        <p className="text-xs text-[#df2531]">
                                            Last 10 transactions average: ₦0 (New user protection check recommended)
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-xs text-white/40 uppercase font-bold tracking-wider">Estimated Coins</label>
                                        <div className="flex items-center gap-2 mt-1 text-green-400 font-bold">
                                            <Coin size={16} weight="fill" />
                                            {Math.floor(selectedDeposit.amount / 10).toLocaleString()} coins
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/10">
                                        <label className="block text-xs text-white/40 uppercase font-bold tracking-wider mb-2">Rejection Reason</label>
                                        <textarea
                                            value={rejectReason}
                                            onChange={(e) => setRejectReason(e.target.value)}
                                            placeholder="Required only if rejecting..."
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-[#df2531] focus:outline-none min-h-[80px]"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
                                    <button
                                        onClick={handleReject}
                                        disabled={processingId === selectedDeposit.id || !rejectReason.trim()}
                                        className="flex-1 py-3 rounded-xl border border-red-500/50 text-red-400 font-bold hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleApprove(selectedDeposit)}
                                        disabled={processingId === selectedDeposit.id}
                                        className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {processingId === selectedDeposit.id ? 'Processing...' : 'Approve & Credit'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox Modal */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
                    onClick={() => setLightboxImage(null)}
                >
                    <button
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors"
                    >
                        <XCircle size={40} weight="fill" />
                    </button>
                    <div className="relative w-full h-full max-w-5xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <Image
                            src={lightboxImage}
                            alt="Proof of payment full size"
                            fill
                            className="object-contain"
                            unoptimized
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

function Coin({ size, weight: _weight, className }: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 256 256" className={className}>
            <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z"></path>
        </svg>
    )
}
