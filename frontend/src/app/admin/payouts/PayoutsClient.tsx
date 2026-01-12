'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Money,
  User,
  CheckCircle,
  Clock,
  XCircle,
  Bank,
  Wallet,
  ArrowRight,
  SpinnerGap,
  Warning
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Wallet as WalletType, Transaction, WithdrawalRequest } from '@/types/database'

interface TalentWithWallet extends Profile {
  wallet: WalletType | null
}

interface PayoutTransaction extends Transaction {
  user: {
    display_name: string | null
    avatar_url: string | null
  } | null
}

interface WithdrawalWithTalent extends WithdrawalRequest {
  talent: {
    id: string
    display_name: string | null
    avatar_url: string | null
    username: string | null
  } | null
}

interface PayoutsClientProps {
  talents: TalentWithWallet[]
  payouts: PayoutTransaction[]
  withdrawalRequests: WithdrawalWithTalent[]
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-amber-500/10 text-amber-400', icon: Clock },
  approved: { label: 'Approved', color: 'bg-blue-500/10 text-blue-400', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-green-500/10 text-green-400', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-500/10 text-red-400', icon: XCircle },
  failed: { label: 'Failed', color: 'bg-red-500/10 text-red-400', icon: XCircle },
}

export function PayoutsClient({ talents, payouts, withdrawalRequests }: PayoutsClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'requests' | 'balances' | 'history'>('requests')
  const [processing, setProcessing] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

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

  // Handle approve withdrawal
  const handleApprove = async (request: WithdrawalWithTalent) => {
    setProcessing(request.id)
    try {
      // Update withdrawal status to approved
      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({ 
          status: 'approved',
          processed_at: new Date().toISOString()
        })
        .eq('id', request.id)

      if (updateError) throw updateError

      // Deduct from wallet
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ 
          balance: (request.talent ? await getWalletBalance(request.talent.id) : 0) - request.amount 
        })
        .eq('user_id', request.talent_id)

      // Create notification for talent
      await supabase
        .from('notifications')
        .insert({
          user_id: request.talent_id,
          type: 'withdrawal_approved',
          title: 'Withdrawal Approved!',
          message: `Your withdrawal request for ${request.amount.toLocaleString()} coins has been approved and is being processed.`,
          data: { withdrawal_id: request.id, amount: request.amount }
        })

      router.refresh()
    } catch (error) {
      console.error('Error approving withdrawal:', error)
      alert('Failed to approve withdrawal')
    } finally {
      setProcessing(null)
    }
  }

  const getWalletBalance = async (userId: string): Promise<number> => {
    const { data } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single()
    return data?.balance || 0
  }

  // Handle reject withdrawal
  const handleReject = async (requestId: string) => {
    setProcessing(requestId)
    try {
      const request = withdrawalRequests.find(r => r.id === requestId)
      
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({ 
          status: 'rejected',
          admin_notes: rejectReason || 'Rejected by admin',
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) throw error

      // Create notification for talent
      if (request) {
        await supabase
          .from('notifications')
          .insert({
            user_id: request.talent_id,
            type: 'withdrawal_rejected',
            title: 'Withdrawal Declined',
            message: rejectReason || 'Your withdrawal request has been declined. Please contact support for more information.',
            data: { withdrawal_id: requestId }
          })
      }

      setShowRejectModal(null)
      setRejectReason('')
      router.refresh()
    } catch (error) {
      console.error('Error rejecting withdrawal:', error)
      alert('Failed to reject withdrawal')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Payouts</h1>
        <p className="text-white/60">Manage talent earnings and process withdrawals</p>
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

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors relative ${
            activeTab === 'requests'
              ? 'bg-[#df2531] text-white'
              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
          }`}
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
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'balances'
              ? 'bg-[#df2531] text-white'
              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
          }`}
        >
          Talent Balances
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'history'
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
          {withdrawalRequests.length === 0 ? (
            <div className="text-center py-16 rounded-2xl bg-white/5 border border-white/10">
              <Money size={48} weight="duotone" className="text-white/20 mx-auto mb-4" />
              <p className="text-white/50">No withdrawal requests</p>
            </div>
          ) : (
            withdrawalRequests.map((request) => {
              const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending
              const StatusIcon = status.icon
              const isPending = request.status === 'pending'

              return (
                <div
                  key={request.id}
                  className={`p-4 sm:p-6 rounded-2xl border transition-colors ${
                    isPending ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white/5 border-white/10'
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
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs mt-2 ${status.color}`}>
                        <StatusIcon size={12} weight="fill" />
                        {status.label}
                      </span>
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
            })
          )}
        </div>
      )}

      {activeTab === 'balances' && (
        <div className="space-y-4">
          {talents.length === 0 ? (
            <div className="text-center py-16 rounded-2xl bg-white/5 border border-white/10">
              <User size={48} weight="duotone" className="text-white/20 mx-auto mb-4" />
              <p className="text-white/50">No talents registered yet</p>
            </div>
          ) : (
            talents.map((talent) => (
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
            ))
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {payouts.length === 0 ? (
            <div className="text-center py-16 rounded-2xl bg-white/5 border border-white/10">
              <Money size={48} weight="duotone" className="text-white/20 mx-auto mb-4" />
              <p className="text-white/50">No payout history yet</p>
            </div>
          ) : (
            payouts.map((payout) => {
              const status = statusConfig[payout.status as keyof typeof statusConfig] || statusConfig.pending
              const StatusIcon = status.icon

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
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${status.color}`}>
                      <StatusIcon size={12} weight="fill" />
                      {status.label}
                    </span>
                  </div>
                </div>
              )
            })
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
                onClick={() => setShowRejectModal(null)}
                variant="ghost"
                className="flex-1 text-white/60 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleReject(showRejectModal)}
                disabled={processing === showRejectModal}
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
