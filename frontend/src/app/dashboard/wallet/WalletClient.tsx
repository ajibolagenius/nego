'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Coin, Plus, ArrowUpRight, ArrowDownLeft, 
  Clock, CheckCircle, XCircle, Sparkle, ShoppingCart,
  Gift, CreditCard, Receipt, CaretRight, Icon, Warning
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
        callback: (response: any) => void
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

// Payment Modal Component - Client only due to react-paystack
function PaymentModalInner({ 
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
  
  // Load Paystack script
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
      // Create transaction record first
      const response = await fetch('/api/transactions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg.id,
          reference,
        }),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create transaction')
      }
      
      // Initialize Paystack payment using inline JS
      const handler = window.PaystackPop.setup({
        key: publicKey,
        email: email,
        amount: pkg.priceInKobo,
        currency: 'NGN',
        ref: reference,
        callback: (response: any) => {
          console.log('Payment successful:', response)
          onSuccess()
        },
        onClose: () => {
          setIsProcessing(false)
        },
      })
      
      handler.openIframe()
    } catch (err: any) {
      console.error('Payment error:', err)
      setError(err.message || 'Payment failed')
      setIsProcessing(false)
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-white mb-4">Confirm Purchase</h3>
        
        <div className="bg-white/5 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/60">Package</span>
            <span className="text-white font-medium">{pkg.displayName}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/60">Amount</span>
            <span className="text-white font-bold">{formatNaira(pkg.price)}</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <span className="text-white/60">You'll receive</span>
            <span className="text-[#df2531] font-bold text-lg">{pkg.coins.toLocaleString()} coins</span>
          </div>
        </div>
        
        {!isPaystackConfigured && (
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
            <Warning size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-400 text-sm font-medium">Paystack Not Configured</p>
              <p className="text-amber-400/70 text-xs mt-1">
                Please add your Paystack API keys to enable payments.
              </p>
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
            className="flex-1 bg-[#df2531] hover:bg-[#df2531]/90 text-white"
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
          Secured by Paystack. Your card details are never stored.
        </p>
      </div>
    </div>
  )
}

// Wrapper to ensure PaymentModal only renders on client
function PaymentModal(props: { 
  pkg: CoinPackage
  email: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) return null
  
  return <PaymentModalInner {...props} />
}

// Success Modal Component
function SuccessModal({ coins, onClose }: { coins: number; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] border border-white/10 rounded-3xl p-8 w-full max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={48} weight="duotone" className="text-green-400" />
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
        <p className="text-white/60 mb-6">
          {coins.toLocaleString()} coins have been added to your wallet.
        </p>
        
        <Button
          onClick={onClose}
          className="w-full bg-[#df2531] hover:bg-[#df2531]/90 text-white"
        >
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  return (
    <>
    <div className="min-h-screen bg-black pt-16 lg:pt-0 pb-20 lg:pb-0">
      {/* Payment Modal */}
      {selectedPackage && (
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
                {wallet?.balance?.toLocaleString() || 0}
              </span>
              <span className="text-white/70 text-lg">coins</span>
            </div>
            
            {(wallet?.escrow_balance || 0) > 0 && (
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Clock size={16} />
                <span>{wallet?.escrow_balance?.toLocaleString()} coins in escrow</span>
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
            {COIN_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handlePurchaseClick(pkg)}
                className={`relative p-4 rounded-2xl border transition-all duration-300 text-left
                  border-white/10 bg-white/5 hover:border-[#df2531]/50 hover:bg-white/10
                `}
              >
                {pkg.popular && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#df2531] rounded-full">
                    <span className="text-[10px] text-white font-bold uppercase">Popular</span>
                  </div>
                )}
                {pkg.bestValue && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-green-500 rounded-full">
                    <span className="text-[10px] text-white font-bold uppercase">Best Value</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mb-3">
                  <Coin size={20} weight="duotone" className="text-[#df2531]" />
                  <span className="text-white font-bold">{pkg.coins.toLocaleString()}</span>
                </div>
                
                <p className="text-white/90 font-bold mb-1">{formatNaira(pkg.price)}</p>
                <p className="text-white/40 text-xs">{pkg.description}</p>
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
                const isCredit = transaction.type === 'purchase' || transaction.type === 'refund'
                
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
                        {isCredit ? '+' : '-'}{Math.abs(transaction.coins || transaction.amount)} coins
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
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#df2531]/10 flex items-center justify-center">
                <Sparkle size={20} weight="duotone" className="text-[#df2531]" />
              </div>
              <h3 className="text-white font-medium">How Coins Work</h3>
            </div>
            <p className="text-white/50 text-sm">
              Use coins to book services from talented providers. Coins are held in escrow until the service is completed.
            </p>
          </div>
          
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle size={20} weight="duotone" className="text-green-400" />
              </div>
              <h3 className="text-white font-medium">Secure & Protected</h3>
            </div>
            <p className="text-white/50 text-sm">
              All payments are processed securely through Paystack. Your coins are protected in our system.
            </p>
          </div>
        </div>
      </div>
    </div>
    <MobileBottomNav userRole={profile?.role === 'talent' ? 'talent' : 'client'} />
    </>
  )
}
