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
  ArrowRight
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import type { Profile, Wallet as WalletType, Transaction } from '@/types/database'

interface TalentWithWallet extends Profile {
  wallet: WalletType | null
}

interface PayoutTransaction extends Transaction {
  user: {
    display_name: string | null
    avatar_url: string | null
  } | null
}

interface PayoutsClientProps {
  talents: TalentWithWallet[]
  payouts: PayoutTransaction[]
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-amber-500/10 text-amber-400', icon: Clock },
  completed: { label: 'Completed', color: 'bg-green-500/10 text-green-400', icon: CheckCircle },
  failed: { label: 'Failed', color: 'bg-red-500/10 text-red-400', icon: XCircle },
}

export function PayoutsClient({ talents, payouts }: PayoutsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'balances' | 'history'>('balances')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate totals
  const totalBalance = talents.reduce((sum, t) => sum + (t.wallet?.balance || 0), 0)
  const totalEscrow = talents.reduce((sum, t) => sum + (t.wallet?.escrow_balance || 0), 0)
  const pendingPayouts = payouts.filter((p) => p.status === 'pending')

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Payouts</h1>
        <p className="text-white/60">Manage talent earnings and process withdrawals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Wallet size={20} className="text-green-400" />
            </div>
            <p className="text-white/60 text-sm">Total Talent Balances</p>
          </div>
          <p className="text-2xl font-bold text-white">{totalBalance.toLocaleString()} coins</p>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock size={20} className="text-amber-400" />
            </div>
            <p className="text-white/60 text-sm">In Escrow</p>
          </div>
          <p className="text-2xl font-bold text-white">{totalEscrow.toLocaleString()} coins</p>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Money size={20} className="text-blue-400" />
            </div>
            <p className="text-white/60 text-sm">Pending Payouts</p>
          </div>
          <p className="text-2xl font-bold text-white">{pendingPayouts.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
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
          Payout History
        </button>
      </div>

      {/* Content */}
      {activeTab === 'balances' ? (
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
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10"
              >
                {/* Avatar */}
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

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {talent.display_name || 'Unknown Talent'}
                  </p>
                  <p className="text-white/40 text-sm">{talent.location || 'No location'}</p>
                </div>

                {/* Balance */}
                <div className="text-right">
                  <p className="text-white font-bold">
                    {talent.wallet?.balance?.toLocaleString() || 0} coins
                  </p>
                  {(talent.wallet?.escrow_balance || 0) > 0 && (
                    <p className="text-amber-400 text-sm">
                      +{talent.wallet?.escrow_balance?.toLocaleString()} in escrow
                    </p>
                  )}
                </div>

                {/* Action */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(talent.wallet?.balance || 0) === 0}
                  className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
                >
                  <Bank size={16} className="mr-1" />
                  Payout
                </Button>
              </div>
            ))
          )}
        </div>
      ) : (
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
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <Money size={20} className="text-white/60" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">
                      {payout.user?.display_name || 'Unknown'}
                    </p>
                    <p className="text-white/40 text-sm">{formatDate(payout.created_at)}</p>
                  </div>

                  {/* Amount */}
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
    </div>
  )
}
