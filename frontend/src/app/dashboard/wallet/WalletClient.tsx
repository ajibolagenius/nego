'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Coin, Plus, ArrowUpRight, ArrowDownLeft, 
  Clock, CheckCircle, XCircle, Sparkle, ShoppingCart,
  Gift, CreditCard, Receipt, CaretRight, Icon
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Profile, Wallet, Transaction } from '@/types/database'

interface WalletClientProps {
  user: SupabaseUser
  profile: Profile | null
  wallet: Wallet | null
  transactions: Transaction[]
}

// Coin packages for purchase
const coinPackages = [
  {
    id: 'starter',
    name: 'Starter',
    coins: 50,
    price: 5000,
    description: 'Perfect for trying out',
    popular: false,
  },
  {
    id: 'basic',
    name: 'Basic',
    coins: 100,
    price: 9000,
    bonus: 10,
    description: 'Save 10%',
    popular: false,
  },
  {
    id: 'standard',
    name: 'Standard',
    coins: 250,
    price: 20000,
    bonus: 30,
    description: 'Most popular choice',
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    coins: 500,
    price: 35000,
    bonus: 75,
    description: 'Best value',
    popular: false,
  },
]

const transactionIcons: Record<string, Icon> = {
  purchase: Plus,
  booking: ShoppingCart,
  unlock: Gift,
  refund: ArrowDownLeft,
  payout: ArrowUpRight,
}

const transactionColors: Record<string, string> = {
  purchase: 'text-green-400 bg-green-500/10',
  booking: 'text-amber-400 bg-amber-500/10',
  unlock: 'text-purple-400 bg-purple-500/10',
  refund: 'text-blue-400 bg-blue-500/10',
  payout: 'text-red-400 bg-red-500/10',
}

export function WalletClient({ user, profile, wallet, transactions }: WalletClientProps) {
  const router = useRouter()
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handlePurchase = async (packageId: string) => {
    setSelectedPackage(packageId)
    setIsLoading(true)
    
    // TODO: Integrate Paystack payment
    // For now, show a message that payment is coming soon
    setTimeout(() => {
      alert('Paystack payment integration coming soon! Please check back later.')
      setIsLoading(false)
      setSelectedPackage(null)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-black pt-16 lg:pt-0">
      {/* Header */}
      <header className="sticky top-16 lg:top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Wallet</h1>
              <p className="text-white/50 text-sm">Manage your coins</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Balance Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#df2531] to-[#9a1b23] p-6 md:p-8">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Coin size={24} weight="duotone" className="text-white" />
              </div>
              <div>
                <p className="text-white/70 text-sm">Available Balance</p>
                <p className="text-white/50 text-xs">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl md:text-6xl font-bold text-white">
                {wallet?.balance || 0}
              </span>
              <span className="text-white/70 text-lg">coins</span>
            </div>
            
            {(wallet?.escrow_balance || 0) > 0 && (
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Clock size={16} />
                <span>{wallet?.escrow_balance} coins in escrow</span>
              </div>
            )}
          </div>
        </div>

        {/* Buy Coins Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Buy Coins</h2>
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <CreditCard size={16} />
              <span>Secure payment via Paystack</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {coinPackages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handlePurchase(pkg.id)}
                disabled={isLoading}
                className={`relative p-4 rounded-2xl border transition-all duration-300 text-left ${
                  selectedPackage === pkg.id
                    ? 'border-[#df2531] bg-[#df2531]/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                } ${isLoading && selectedPackage === pkg.id ? 'opacity-50' : ''}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#df2531] rounded-full">
                    <span className="text-[10px] text-white font-bold uppercase">Popular</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mb-3">
                  <Coin size={20} weight="duotone" className="text-[#df2531]" />
                  <span className="text-white font-bold">{pkg.coins}</span>
                  {pkg.bonus && (
                    <span className="text-xs text-green-400">+{pkg.bonus}</span>
                  )}
                </div>
                
                <p className="text-white/90 font-bold mb-1">{formatPrice(pkg.price)}</p>
                <p className="text-white/40 text-xs">{pkg.description}</p>
                
                {isLoading && selectedPackage === pkg.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </button>
            ))}
          </div>
          
          <p className="text-center text-white/30 text-xs mt-4">
            Payments processed securely. Coins are non-refundable.
          </p>
        </div>

        {/* Transaction History */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Transaction History</h2>
            <button className="text-[#df2531] text-sm hover:underline flex items-center gap-1">
              View all <CaretRight size={14} />
            </button>
          </div>
          
          {transactions.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-white/5 border border-white/10">
              <Receipt size={48} weight="duotone" className="text-white/20 mx-auto mb-4" />
              <p className="text-white/50 mb-2">No transactions yet</p>
              <p className="text-white/30 text-sm">Your transaction history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => {
                const Icon = transactionIcons[transaction.type] || Receipt
                const colorClass = transactionColors[transaction.type] || 'text-white/50 bg-white/5'
                const isCredit = transaction.amount > 0
                
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                      <Icon size={20} weight="duotone" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium capitalize">
                        {transaction.type.replace('_', ' ')}
                      </p>
                      <p className="text-white/40 text-sm truncate">
                        {transaction.description || `Transaction #${transaction.id.slice(0, 8)}`}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-bold ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                        {isCredit ? '+' : ''}{transaction.amount} coins
                      </p>
                      <p className="text-white/40 text-xs">
                        {formatDate(transaction.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Sparkle size={20} weight="duotone" className="text-[#df2531]" />
              <h3 className="text-white font-medium">How to earn coins</h3>
            </div>
            <ul className="space-y-2 text-white/50 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-400" />
                Purchase coin packages
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-400" />
                Receive refunds from cancelled bookings
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-400" />
                Promotional bonuses (coming soon)
              </li>
            </ul>
          </div>
          
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Coin size={20} weight="duotone" className="text-[#df2531]" />
              <h3 className="text-white font-medium">How to spend coins</h3>
            </div>
            <ul className="space-y-2 text-white/50 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-400" />
                Book talent services
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-400" />
                Unlock premium content
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-400" />
                Tip your favorite talent
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
