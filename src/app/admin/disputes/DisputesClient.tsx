'use client'

import {
    CheckCircle, XCircle, Clock, ChatCircle, User, Calendar,
    Eye, X
} from '@phosphor-icons/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useMemo, Fragment } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { Dispute, DisputeMessage } from '@/types/database'

interface DisputesClientProps {
    initialDisputes: Dispute[]
}

type DisputeFilter = 'all' | 'open' | 'under_review' | 'resolved' | 'closed'

export function DisputesClient({ initialDisputes }: DisputesClientProps) {
    const router = useRouter()
    const supabase = createClient()
    const [disputes, _setDisputes] = useState<Dispute[]>(initialDisputes)
    const [filter, setFilter] = useState<DisputeFilter>('open')
    const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [resolutionNotes, setResolutionNotes] = useState('')
    const [newMessage, setNewMessage] = useState('')
    const [messages, setMessages] = useState<DisputeMessage[]>([])

    const filteredDisputes = useMemo(() => {
        if (filter === 'all') return disputes
        return disputes.filter(d => d.status === filter)
    }, [disputes, filter])

    const loadMessages = async (disputeId: string) => {
        try {
            const { data } = await supabase
                .from('dispute_messages')
                .select(`
                    *,
                    sender:profiles!dispute_messages_sender_id_fkey(id, display_name, avatar_url, role)
                `)
                .eq('dispute_id', disputeId)
                .order('created_at', { ascending: true })

            if (data) {
                setMessages(data as any)
            }
        } catch (error) {
            console.error('Error loading messages:', error)
        }
    }

    const handleViewDetails = async (dispute: Dispute) => {
        setSelectedDispute(dispute)
        setShowDetailModal(true)
        setResolutionNotes(dispute.resolution_notes || '')
        await loadMessages(dispute.id)
    }

    const handleUpdateStatus = async (disputeId: string, status: Dispute['status'], resolution?: string) => {
        setIsProcessing(true)
        try {
            const { error } = await supabase
                .from('disputes')
                .update({
                    status,
                    resolution: resolution || null,
                    resolution_notes: resolutionNotes || null,
                    resolved_by: status === 'resolved' || status === 'closed' ? (await supabase.auth.getUser()).data.user?.id : null,
                    resolved_at: status === 'resolved' || status === 'closed' ? new Date().toISOString() : null
                })
                .eq('id', disputeId)

            if (error) throw error

            toast.success(`Dispute ${status === 'resolved' ? 'resolved' : 'updated'}`)
            router.refresh()
        } catch (error) {
            console.error('Update error:', error)
            toast.error('Failed to update dispute')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedDispute) return

        setIsProcessing(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            const { error } = await supabase
                .from('dispute_messages')
                .insert({
                    dispute_id: selectedDispute.id,
                    sender_id: user.id,
                    message: newMessage.trim(),
                    is_admin: profile?.role === 'admin'
                })

            if (error) throw error

            setNewMessage('')
            await loadMessages(selectedDispute.id)
            toast.success('Message sent')
        } catch (error) {
            console.error('Send message error:', error)
            toast.error('Failed to send message')
        } finally {
            setIsProcessing(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusColor = (status: Dispute['status']) => {
        switch (status) {
            case 'open':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
            case 'under_review':
                return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            case 'resolved':
                return 'bg-green-500/20 text-green-400 border-green-500/30'
            case 'closed':
                return 'bg-white/10 text-white/60 border-white/10'
            case 'rejected':
                return 'bg-red-500/20 text-red-400 border-red-500/30'
            default:
                return 'bg-white/10 text-white/60 border-white/10'
        }
    }

    return (
        <Fragment>
            <div className="p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Dispute Resolution</h1>
                        <p className="text-white/60">Manage and resolve booking disputes</p>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {[
                            { value: 'open', label: 'Open', count: disputes.filter(d => d.status === 'open').length },
                            { value: 'under_review', label: 'Under Review', count: disputes.filter(d => d.status === 'under_review').length },
                            { value: 'resolved', label: 'Resolved', count: disputes.filter(d => d.status === 'resolved').length },
                            { value: 'closed', label: 'Closed', count: disputes.filter(d => d.status === 'closed').length },
                            { value: 'all', label: 'All', count: disputes.length },
                        ].map(option => (
                            <button
                                key={option.value}
                                onClick={() => setFilter(option.value as DisputeFilter)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === option.value
                                    ? 'bg-[#df2531] text-white'
                                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                                    }`}
                            >
                                {option.label}
                                {option.count > 0 && (
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${filter === option.value ? 'bg-white/20' : 'bg-[#df2531]/20 text-[#df2531]'
                                        }`}>
                                        {option.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Disputes List */}
                    {filteredDisputes.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-white/50 text-lg">No disputes found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredDisputes.map((dispute) => (
                                <div
                                    key={dispute.id}
                                    className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(dispute.status)}`}>
                                                    {dispute.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                                <span className="px-3 py-1 rounded-full text-xs bg-white/10 text-white/60 border border-white/10">
                                                    {dispute.dispute_type.replace('_', ' ')}
                                                </span>
                                            </div>

                                            <h3 className="text-xl font-bold text-white mb-2">{dispute.title}</h3>
                                            <p className="text-white/70 mb-4 line-clamp-2">{dispute.description}</p>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <div className="flex items-center gap-2 text-white/60 text-sm">
                                                    <User size={16} />
                                                    <span>
                                                        Client: <span className="text-white">{dispute.client?.display_name || 'Unknown'}</span>
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-white/60 text-sm">
                                                    <User size={16} />
                                                    <span>
                                                        Talent: <span className="text-white">{dispute.talent?.display_name || 'Unknown'}</span>
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-white/60 text-sm">
                                                    <Calendar size={16} />
                                                    <span>{formatDate(dispute.created_at)}</span>
                                                </div>
                                            </div>

                                            {dispute.booking && (
                                                <div className="text-sm text-white/60">
                                                    Booking ID: <span className="text-white font-mono">{dispute.booking_id?.substring(0, 8)}...</span>
                                                </div>
                                            )}
                                        </div>

                                        <Button
                                            onClick={() => handleViewDetails(dispute)}
                                            variant="outline"
                                            className="ml-4 border-white/10"
                                        >
                                            <Eye size={18} />
                                            View
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedDispute && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">Dispute Details</h2>
                                <button
                                    onClick={() => {
                                        setShowDetailModal(false)
                                        setResolutionNotes('')
                                        setMessages([])
                                    }}
                                    className="text-white/60 hover:text-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Dispute Info */}
                            <div className="bg-white/5 rounded-xl p-6 mb-6 space-y-4">
                                <div>
                                    <h3 className="text-white font-semibold mb-2">Title</h3>
                                    <p className="text-white">{selectedDispute.title}</p>
                                </div>

                                <div>
                                    <h3 className="text-white font-semibold mb-2">Description</h3>
                                    <p className="text-white/80">{selectedDispute.description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-white/60 text-sm mb-1">Type</h3>
                                        <p className="text-white">{selectedDispute.dispute_type.replace('_', ' ')}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-white/60 text-sm mb-1">Status</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border inline-block ${getStatusColor(selectedDispute.status)}`}>
                                            {selectedDispute.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-white/60 text-sm mb-1">Client</h3>
                                        <div className="flex items-center gap-2">
                                            {selectedDispute.client?.avatar_url && (
                                                <Image
                                                    src={selectedDispute.client.avatar_url}
                                                    alt={selectedDispute.client.display_name || 'Client'}
                                                    width={32}
                                                    height={32}
                                                    className="rounded-full"
                                                />
                                            )}
                                            <p className="text-white">{selectedDispute.client?.display_name || 'Unknown'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-white/60 text-sm mb-1">Talent</h3>
                                        <div className="flex items-center gap-2">
                                            {selectedDispute.talent?.avatar_url && (
                                                <Image
                                                    src={selectedDispute.talent.avatar_url}
                                                    alt={selectedDispute.talent.display_name || 'Talent'}
                                                    width={32}
                                                    height={32}
                                                    className="rounded-full"
                                                />
                                            )}
                                            <p className="text-white">{selectedDispute.talent?.display_name || 'Unknown'}</p>
                                        </div>
                                    </div>
                                </div>

                                {selectedDispute.booking && (
                                    <div>
                                        <h3 className="text-white/60 text-sm mb-1">Booking</h3>
                                        <p className="text-white">
                                            {selectedDispute.booking.total_price} coins - {selectedDispute.booking.status}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Messages */}
                            <div className="mb-6">
                                <h3 className="text-white font-semibold mb-4">Messages</h3>
                                <div className="bg-white/5 rounded-xl p-4 space-y-4 max-h-64 overflow-auto mb-4">
                                    {messages.length === 0 ? (
                                        <p className="text-white/50 text-center py-4">No messages yet</p>
                                    ) : (
                                        messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`flex gap-3 ${msg.is_admin ? 'flex-row-reverse' : ''}`}
                                            >
                                                {msg.sender?.avatar_url ? (
                                                    <Image
                                                        src={msg.sender.avatar_url}
                                                        alt={msg.sender.display_name || 'User'}
                                                        width={32}
                                                        height={32}
                                                        className="rounded-full"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                                        <User size={16} className="text-white/40" />
                                                    </div>
                                                )}
                                                <div className={`flex-1 ${msg.is_admin ? 'text-right' : ''}`}>
                                                    <div className={`inline-block p-3 rounded-lg ${msg.is_admin
                                                        ? 'bg-[#df2531]/20 text-white'
                                                        : 'bg-white/5 text-white/80'
                                                        }`}>
                                                        <p className="text-sm">{msg.message}</p>
                                                        <p className={`text-xs mt-1 ${msg.is_admin ? 'text-white/60' : 'text-white/40'
                                                            }`}>
                                                            {formatDate(msg.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50"
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim() || isProcessing}
                                        className="bg-[#df2531] hover:bg-[#df2531]/90"
                                    >
                                        <ChatCircle size={18} />
                                        Send
                                    </Button>
                                </div>
                            </div>

                            {/* Resolution */}
                            <div className="border-t border-white/10 pt-6">
                                <h3 className="text-white font-semibold mb-4">Resolution</h3>
                                <textarea
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                    placeholder="Add resolution notes..."
                                    rows={4}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50 mb-4"
                                />

                                <div className="flex flex-wrap gap-3">
                                    {selectedDispute.status !== 'under_review' && (
                                        <Button
                                            onClick={() => handleUpdateStatus(selectedDispute.id, 'under_review')}
                                            disabled={isProcessing}
                                            variant="outline"
                                            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                                        >
                                            <Clock size={18} />
                                            Mark Under Review
                                        </Button>
                                    )}
                                    {selectedDispute.status !== 'resolved' && (
                                        <Button
                                            onClick={() => handleUpdateStatus(selectedDispute.id, 'resolved', 'Resolved')}
                                            disabled={isProcessing}
                                            className="bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30"
                                        >
                                            <CheckCircle size={18} />
                                            Resolve
                                        </Button>
                                    )}
                                    {selectedDispute.status !== 'closed' && (
                                        <Button
                                            onClick={() => handleUpdateStatus(selectedDispute.id, 'closed', 'Closed')}
                                            disabled={isProcessing}
                                            variant="outline"
                                            className="border-white/10 text-white/60 hover:bg-white/10"
                                        >
                                            <XCircle size={18} />
                                            Close
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Fragment>
    )
}
