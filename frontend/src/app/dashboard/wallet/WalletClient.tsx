'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Coin, Plus, ArrowUpRight, ArrowDownLeft, 
  Clock, CheckCircle, XCircle, Sparkle, ShoppingCart,
  Gift, CreditCard, Receipt, CaretRight, Warning,
  Wallet as WalletIcon, TrendUp, TrendDown, Bank, Lightning, Crown
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Profile, Wallet, Transaction } from '@/types/database'
import { COIN_PACKAGES, formatNaira, type CoinPackage } from '@/lib/coinPackages'

// Declare Paystack global type
declare global {
  interface Window {
    PaystackPop: {
      setup: (config: {
        key: string
        email: string
        amount: number
        currency: string
        ref: string
        callback: (response: unknown) => void
        onClose: () => void
      }) => { openIframe: () => void }
    }
  }
}

interface WalletClientProps {
  user: SupabaseUser
  profile: Profile | null
  wallet: Wallet | null
  transactions: Transaction[]
}

const transactionConfig: Record<string, { icon: typeof Coin; color: string; bg: string; label: string }> = {
  purchase: { icon: Plus, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Coin Purchase' },
  booking: { icon: ShoppingCart, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Booking' },
  unlock: { icon: Crown, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Content Unlock' },
  gift: { icon: Gift, color: 'text-pink-400', bg: 'bg-pink-500/10', label: 'Gift' },
  refund: { icon: ArrowDownLeft, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Refund' },
  payout: { icon: Bank, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Payout' },
  withdrawal: { icon: ArrowUpRight, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Withdrawal' },
}

// Payment Modal Component
function PaymentModal({ 
  pkg, 
  email, 
  onClose, 
  onSuccess 
}: { 
  pkg: CoinPackage
  email: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paystackLoaded, setPaystackLoaded] = useState(false)
  
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || ''
  const isPaystackConfigured = publicKey && publicKey !== 'pk_test_your_paystack_public_key'
  
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.PaystackPop) {
      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v1/inline.js'
      script.async = true
      script.onload = () => setPaystackLoaded(true)
      document.body.appendChild(script)
    } else if (typeof window !== 'undefined' && window.PaystackPop) {
      setPaystackLoaded(true)
    }
  }, [])
  
  const handlePayment = async () => {
    if (!paystackLoaded || typeof window === 'undefined' || !window.PaystackPop) {
      setError('Payment system not loaded. Please refresh the page.')
      return
    }
    
    setIsProcessing(true)
    setError(null)
    
    const reference = `nego_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    try {
      const response = await fetch('/api/transactions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id, reference }),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create transaction')
      }
      
      const handler = window.PaystackPop.setup({
        key: publicKey,
        email: email,
        amount: pkg.priceInKobo,
        currency: 'NGN',
        ref: reference,
        callback: () => {
          onSuccess()
        },
        onClose: () => {
          setIsProcessing(false)
        },
      })
      
      handler.openIframe()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed'
      setError(errorMessage)
      setIsProcessing(false)
    }
  }
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#df2531] to-[#9a1b23] flex items-center justify-center">
            <Coin size={28} weight="duotone" className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Buy {pkg.coins.toLocaleString()} Coins</h3>
            <p className="text-white/50 text-sm">{pkg.description}</p>
          </div>
        </div>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <span className="text-white/60">Package</span>
            <span className="text-white font-medium">{pkg.displayName}</span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <span className="text-white/60">Amount</span>
            <span className="text-white font-bold text-lg">{formatNaira(pkg.price)}</span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[#df2531]/10 to-transparent border border-[#df2531]/20">
            <span className="text-white/60">You&apos;ll receive</span>
            <div className="flex items-center gap-2">
              <Coin size={20} className="text-[#df2531]" />
              <span className="text-[#df2531] font-bold text-xl">{pkg.coins.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        {!isPaystackConfigured && (
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
            <Warning size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-400 text-sm font-medium">Paystack Not Configured</p>
              <p className="text-amber-400/70 text-xs mt-1">Add your Paystack API keys to enable payments.</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
            <XCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 border-white/20 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={isProcessing || !isPaystackConfigured}
            className="flex-1 bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              `Pay ${formatNaira(pkg.price)}`
            )}
          </Button>
        </div>
        
        <p className="text-center text-white/30 text-xs mt-4">
          🔒 Secured by Paystack
        </p>
      </div>
    </div>
  )
}

// Success Modal
function SuccessModal({ coins, onClose }: { coins: number; onClose: () => void }) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-[#0a0a0f] border border-white/10 rounded-2xl p-8 w-full max-w-md text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={48} weight="duotone" className="text-green-400" />
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
        <p className="text-white/60 mb-6">
          <span className="text-[#df2531] font-bold">{coins.toLocaleString()}</span> coins have been added to your wallet.
        </p>
        
        <Button onClick={onClose} className="w-full bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold">
          Done
        </Button>
      </div>
    </div>
  )
}

export function WalletClient({ user, profile, wallet, transactions }: WalletClientProps) {
  const router = useRouter()
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [purchasedCoins, setPurchasedCoins] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'buy' | 'history'>('buy')

  useEffect(() => {
    setMounted(true)
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handlePurchaseClick = (pkg: CoinPackage) => {
    setSelectedPackage(pkg)
  }
  
  const handlePaymentSuccess = () => {
    setPurchasedCoins(selectedPackage?.coins || 0)
    setSelectedPackage(null)
    setShowSuccess(true)
  }
  
  const handleSuccessClose = () => {
    setShowSuccess(false)
    router.refresh()
  }

  // Calculate stats
  const totalSpent = transactions
    .filter(t => t.amount < 0 || t.coins < 0)
    .reduce((sum, t) => sum + Math.abs(t.coins || t.amount), 0)
  
  const totalReceived = transactions
    .filter(t => t.amount > 0 || t.coins > 0)
    .reduce((sum, t) => sum + Math.abs(t.coins || t.amount), 0)

  return (
    <>
      <div className="min-h-screen bg-black pt-16 lg:pt-0 pb-20 lg:pb-0">
        {/* Payment Modal */}
        {mounted && selectedPackage && (
          <PaymentModal
            pkg={selectedPackage}
            email={user.email || ''}
            onClose={() => setSelectedPackage(null)}
            onSuccess={handlePaymentSuccess}
          />
        )}
        
        {/* Success Modal */}
        {showSuccess && (
          <SuccessModal coins={purchasedCoins} onClose={handleSuccessClose} />
        )}
        
        {/* Header */}
        <header className="sticky top-16 lg:top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
                <ArrowLeft size={24} />
              </Link>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <WalletIcon size={24} weight="duotone" className="text-[#df2531]" />
                  My Wallet
                </h1>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Balance Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#df2531] via-[#b91c26] to-[#7a1219] p-6 md:p-8">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            <div className="absolute top-4 right-4">
              <Coin size={80} weight="duotone" className="text-white/10" />
            </div>
            
            <div className="relative">
              <p className="text-white/70 text-sm mb-1">Available Balance</p>
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-5xl md:text-6xl font-bold text-white">
                  {(wallet?.balance || 0).toLocaleString()}
                </span>
                <span className="text-white/70 text-xl">coins</span>
              </div>
              
              <div className="flex flex-wrap gap-4">
                {(wallet?.escrow_balance || 0) > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10">
                    <Clock size={14} className="text-white/70" />
                    <span className="text-white/80 text-sm">{wallet?.escrow_balance?.toLocaleString()} in escrow</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <TrendUp size={18} />
                <span className="text-sm">Received</span>
              </div>
              <p className="text-2xl font-bold text-white">{totalReceived.toLocaleString()}</p>
              <p className="text-white/40 text-xs">coins total</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <TrendDown size={18} />
                <span className="text-sm">Spent</span>
              </div>
              <p className="text-2xl font-bold text-white">{totalSpent.toLocaleString()}</p>
              <p className="text-white/40 text-xs">coins total</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
            <button
              onClick={() => setActiveTab('buy')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'buy'
                  ? 'bg-[#df2531] text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Lightning size={18} weight="fill" />
              Buy Coins
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-[#df2531] text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Receipt size={18} />
              History
            </button>
          </div>

          {/* Buy Coins Tab */}
          {activeTab === 'buy' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Select Package</h2>
                <div className="flex items-center gap-2 text-white/40 text-xs">
                  <CreditCard size={14} />
                  <span>Paystack</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {COIN_PACKAGES.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => handlePurchaseClick(pkg)}
                    className={`relative p-5 rounded-2xl border transition-all duration-300 text-left group hover:scale-[1.02] ${
                      pkg.bestValue 
                        ? 'border-green-500/50 bg-green-500/5 hover:border-green-500' 
                        : pkg.popular 
                        ? 'border-[#df2531]/50 bg-[#df2531]/5 hover:border-[#df2531]' 
                        : 'border-white/10 bg-white/5 hover:border-white/30'
                    }`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-2 left-4 px-2 py-0.5 bg-[#df2531] rounded-full">
                        <span className="text-[10px] text-white font-bold uppercase">Popular</span>
                      </div>
                    )}
                    {pkg.bestValue && (
                      <div className="absolute -top-2 left-4 px-2 py-0.5 bg-green-500 rounded-full">
                        <span className="text-[10px] text-white font-bold uppercase">Best Value</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        pkg.bestValue ? 'bg-green-500/20' : pkg.popular ? 'bg-[#df2531]/20' : 'bg-white/10'
                      }`}>
                        <Coin size={20} weight="duotone" className={
                          pkg.bestValue ? 'text-green-400' : pkg.popular ? 'text-[#df2531]' : 'text-white/60'
                        } />
                      </div>
                      <span className="text-white font-bold text-lg">{pkg.coins.toLocaleString()}</span>
                    </div>
                    
                    <p className="text-white font-bold text-xl mb-1">{formatNaira(pkg.price)}</p>
                    <p className="text-white/40 text-xs">{pkg.description}</p>
                    
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <CaretRight size={20} className="text-white/40" />
                    </div>
                  </button>
                ))}
              </div>
              
              <p className="text-center text-white/30 text-xs">
                Payments processed securely. Coins are non-refundable.
              </p>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Transaction History</h2>
              
              {transactions.length === 0 ? (
                <div className="text-center py-16 rounded-2xl bg-white/5 border border-white/10">
                  <Receipt size={48} weight="duotone" className="text-white/20 mx-auto mb-4" />
                  <p className="text-white/50 mb-2">No transactions yet</p>
                  <p className="text-white/30 text-sm">Your transaction history will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((transaction) => {
                    const config = transactionConfig[transaction.type] || transactionConfig.purchase
                    const Icon = config.icon
                    const isCredit = transaction.type === 'purchase' || transaction.type === 'refund' || 
                                    (transaction.type === 'gift' && (transaction.coins || transaction.amount) > 0)
                    const amount = Math.abs(transaction.coins || transaction.amount)
                    
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${config.bg}`}>
                          <Icon size={22} weight="duotone" className={config.color} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium">{config.label}</p>
                          <p className="text-white/40 text-sm truncate">
                            {transaction.description || `#${transaction.id.slice(0, 8)}`}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className={`font-bold ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                            {isCredit ? '+' : '-'}{amount.toLocaleString()}
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
          )}

          {/* Info Section */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <Sparkle size={24} weight="duotone" className="text-[#df2531]" />
              <h3 className="text-white font-bold">How Coins Work</h3>
            </div>
            <ul className="space-y-2 text-white/60 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                Use coins to book services from talented providers
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                Unlock exclusive premium content
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                Send gifts to your favorite talents
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                Coins are held in escrow until service completion
              </li>
            </ul>
          </div>
        </div>
      </div>
      <MobileBottomNav userRole={profile?.role === 'talent' ? 'talent' : 'client'} />
    </>
  )
}
