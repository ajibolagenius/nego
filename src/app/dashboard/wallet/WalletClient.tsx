'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, Coin, Plus, ArrowUpRight, ArrowDownLeft,
    Clock, CheckCircle, XCircle, Sparkle, ShoppingCart,
    Gift, CreditCard, Receipt, CaretRight, Warning,
    Wallet as WalletIcon, TrendUp, TrendDown, Bank, Lightning, Crown,
    MagnifyingGlass, X, SpinnerGap, ArrowsClockwise, Star
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { useWallet } from '@/hooks/useWallet'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Profile, Wallet, Transaction } from '@/types/database'
import { formatNaira, type CoinPackage } from '@/lib/coinPackages'

// Declare Paystack global type
interface PaystackResponse {
    reference: string
    status: string
    transaction: string
}

type PaymentProvider = 'paystack' | 'segpay' | 'nowpayments'

interface PaymentMethod {
    id: PaymentProvider
    name: string
    icon: any
    description: string
    color: string
}

const PAYMENT_METHODS: PaymentMethod[] = [
    {
        id: 'segpay',
        name: 'Credit/Debit Card',
        icon: CreditCard,
        description: 'Pay securely with Card',
        color: 'text-blue-400'
    },
    {
        id: 'nowpayments',
        name: 'Crypto',
        icon: Lightning,
        description: 'Bitcoin, USDT, ETH, etc.',
        color: 'text-amber-400'
    },
    {
        id: 'paystack',
        name: 'Paystack (Legacy)',
        icon: CreditCard,
        description: 'Pay with Card via Paystack',
        color: 'text-green-400'
    }
]

declare global {
    interface Window {
        PaystackPop: {
            setup: (config: {
                key: string
                email: string
                amount: number
                currency: string
                ref: string
                callback: (response: PaystackResponse) => void
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
    coinPackages: CoinPackage[]
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
    userId,
    onClose,
    onSuccess
}: {
    pkg: CoinPackage
    email: string
    userId: string
    onClose: () => void
    onSuccess: () => void
}) {
    const supabase = createClient()
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [paystackLoaded, setPaystackLoaded] = useState(false)

    const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('segpay')

    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || ''
    const isPaystackConfigured = publicKey && publicKey !== 'pk_test_your_paystack_public_key'

    // Hide Paystack if not configured or preferred
    const availableMethods = PAYMENT_METHODS.filter(m => {
        if (m.id === 'paystack' && !isPaystackConfigured) return false
        return true
    })

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
        if ((selectedProvider === 'paystack') && (!paystackLoaded || typeof window === 'undefined' || !window.PaystackPop)) {
            setError('Payment system not loaded. Please refresh the page.')
            return
        }

        setIsProcessing(true)
        setError(null)

        try {
            const response = await fetch('/api/payments/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    packageId: pkg.id,
                    provider: selectedProvider,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to initiate payment')
            }

            const data = await response.json()
            const { reference, provider, url } = data

            // Handle Segpay / NOWPayments Redirects
            if (provider === 'segpay' || provider === 'nowpayments') {
                if (url) {
                    window.location.href = url
                    return
                } else {
                    throw new Error('Payment URL not found')
                }
            }

            // Handle Paystack SDK
            if (provider === 'paystack') {
                // Define callback functions
                const paymentCallback = (response: PaystackResponse) => {
                    console.log('[PaymentModal] Paystack callback:', response)

                    const verifyPayment = async () => {
                        try {
                            const refToUse = response.reference || reference
                            const verifyResponse = await fetch('/api/transactions/verify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ reference: refToUse }),
                            })

                            if (!verifyResponse.ok) {
                                const errorData = await verifyResponse.json()
                                console.error('[PaymentModal] Verification error:', errorData)
                                if (verifyResponse.status === 409 || errorData.alreadyCompleted) {
                                    onSuccess()
                                    return
                                }
                                // Even if verification fails visually, polling might catch it later
                                // But usually better to just close and let user check history
                                onSuccess()
                                return
                            }

                            // Successful verification
                            onSuccess()
                        } catch (err) {
                            console.error('[PaymentModal] Verification error:', err)
                            onSuccess()
                        }
                    }

                    verifyPayment()
                }

                const closeCallback = () => {
                    setIsProcessing(false)
                }

                const handler = window.PaystackPop.setup({
                    key: publicKey,
                    email: email,
                    amount: pkg.priceInKobo,
                    currency: 'NGN',
                    ref: reference,
                    callback: paymentCallback,
                    onClose: closeCallback,
                })

                handler.openIframe()
            }

        } catch (err: unknown) {
            console.error('Payment error:', err)
            const errorMessage = err instanceof Error ? err.message : 'Payment failed'
            setError(errorMessage)
            setIsProcessing(false)

            // Create failure notification
            try {
                await supabase.from('notifications').insert({
                    user_id: userId,
                    type: 'purchase_failed',
                    title: 'Purchase Failed ❌',
                    message: `Your purchase attempt failed: ${errorMessage}. Please try again.`,
                    data: {
                        package_id: pkg.id,
                        package_name: pkg.displayName,
                        error: errorMessage,
                    },
                })
            } catch (notifError) {
                console.error('[PaymentModal] Failed to create failure notification:', notifError)
            }
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
        >
            <div
                className="bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#df2531] to-[#9a1b23] flex items-center justify-center">
                        <Coin size={28} weight="duotone" className="text-white" aria-hidden="true" />
                    </div>
                    <div>
                        <h3 id="payment-modal-title" className="text-xl font-bold text-white">Buy {pkg.coins.toLocaleString()} Coins</h3>
                        <p className="text-white/50 text-sm">{pkg.description}</p>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                        <span className="text-white/60">Amount</span>
                        <span className="text-white font-bold text-lg">{formatNaira(pkg.price)}</span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-white/60 text-sm pl-1">Select Payment Method</label>
                        <div className="grid gap-2">
                            {availableMethods.map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => setSelectedProvider(method.id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedProvider === method.id
                                        ? 'bg-white/10 border-[#df2531]'
                                        : 'bg-white/5 border-transparent hover:bg-white/10'
                                        }`}
                                >
                                    <div className={`p-2 rounded-lg bg-white/5 ${method.color}`}>
                                        <method.icon size={20} weight="duotone" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <div className="text-white font-medium text-sm">{method.name}</div>
                                        <div className="text-white/40 text-xs">{method.description}</div>
                                    </div>
                                    {selectedProvider === method.id && (
                                        <div className="w-4 h-4 rounded-full bg-[#df2531] border-2 border-[#df2531] flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4" role="alert">
                        <XCircle size={20} className="text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isProcessing}
                        className="flex-1 border-white/20 text-white hover:bg-white/10"
                        aria-label="Cancel payment"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="flex-1 bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold"
                        aria-label={`Pay ${formatNaira(pkg.price)}`}
                    >
                        {isProcessing ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                                <span>Processing...</span>
                            </div>
                        ) : (
                            `Pay ${formatNaira(pkg.price)}`
                        )}
                    </Button>
                </div>

                <p className="text-center text-white/30 text-xs mt-4">
                    🔒 Secured by {availableMethods.find(m => m.id === selectedProvider)?.name}
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
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-modal-title"
        >
            <div
                className="bg-[#0a0a0f] border border-white/10 rounded-2xl p-8 w-full max-w-md text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={48} weight="duotone" className="text-green-400" aria-hidden="true" />
                </div>

                <h3 id="success-modal-title" className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
                <p className="text-white/60 mb-6" role="status" aria-live="polite">
                    <span className="text-[#df2531] font-bold">{coins.toLocaleString()}</span> coins have been added to your wallet.
                </p>

                <Button onClick={onClose} className="w-full bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold" aria-label="Close success modal">
                    Done
                </Button>
            </div>
        </div>
    )
}

export function WalletClient({ user, profile, wallet: initialWallet, transactions: initialTransactions, coinPackages: initialCoinPackages }: WalletClientProps) {
    const router = useRouter()
    const supabase = createClient()
    const [coinPackages, setCoinPackages] = useState<CoinPackage[]>(initialCoinPackages)
    const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null)
    const [showSuccess, setShowSuccess] = useState(false)
    const [purchasedCoins, setPurchasedCoins] = useState(0)
    const [mounted, setMounted] = useState(false)
    const [activeTab, setActiveTab] = useState<'buy' | 'history'>('buy')
    const [searchQuery, setSearchQuery] = useState('')
    // Real-time wallet synchronization
    const { wallet, refreshWallet, loading: walletLoading } = useWallet({ userId: user.id, initialWallet })
    const [refreshing, setRefreshing] = useState(false)

    // State for transactions (updated via real-time)
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)

    // Channel ref for transactions subscription
    const transactionsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Refresh coin packages periodically to get latest from database
    useEffect(() => {
        const refreshPackages = async () => {
            const { data, error } = await supabase
                .from('coin_packages')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true })

            if (!error && data) {
                // Transform to CoinPackage format
                const transformed = data.map((pkg: any) => ({
                    id: pkg.id,
                    coins: pkg.coins,
                    price: pkg.price,
                    priceInKobo: pkg.price_in_kobo,
                    displayName: pkg.display_name,
                    description: pkg.description || '',
                    popular: pkg.popular || false,
                    bestValue: pkg.best_value || false,
                    isNew: pkg.is_new || false,
                    isRecommended: pkg.is_recommended || false,
                    is_active: pkg.is_active,
                    display_order: pkg.display_order
                }))
                setCoinPackages(transformed)
            }
        }

        // Refresh on mount and every 30 seconds
        refreshPackages()
        const interval = setInterval(refreshPackages, 30000)
        return () => clearInterval(interval)
    }, [supabase])

    // Manual refresh function (includes transactions)
    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        try {
            // Refresh wallet via hook
            await refreshWallet()

            // Fetch latest transactions
            const { data: transactionsData, error: transactionsError } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50)

            if (!transactionsError && transactionsData) {
                setTransactions(transactionsData)
            }
        } catch (err) {
            console.error('[Wallet] Error refreshing:', err)
        } finally {
            setRefreshing(false)
        }
    }, [supabase, user.id, refreshWallet])

    // Real-time subscription for transaction updates
    useEffect(() => {
        const transactionsChannel = supabase
            .channel('transactions:user', {
                config: {
                    broadcast: { self: true }
                }
            })
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'transactions',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    console.log('[Real-time] Transaction INSERT received:', payload.new)
                    setTransactions(prev => {
                        // Check for duplicates
                        if (prev.find(t => t.id === payload.new.id)) {
                            return prev
                        }
                        // Add new transaction at the beginning and limit to 50
                        const updated = [payload.new as Transaction, ...prev]
                        return updated.slice(0, 50)
                    })
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'transactions',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    console.log('[Real-time] Transaction UPDATE received:', payload.new)
                    const updatedTransaction = payload.new as Transaction
                    setTransactions(prev => prev.map(t =>
                        t.id === updatedTransaction.id ? { ...t, ...updatedTransaction } as Transaction : t
                    ))

                    // If transaction status changed to 'completed', refresh wallet
                    // This handles Paystack webhook updates and external payments
                    if (updatedTransaction.status === 'completed' && updatedTransaction.type === 'purchase') {
                        console.log('[Real-time] Purchase transaction completed, refreshing wallet...', updatedTransaction)
                        // Small delay to ensure database has updated wallet
                        setTimeout(() => {
                            refreshWallet()
                        }, 500)
                    }
                }
            )
            .subscribe((status) => {
                console.log('[Real-time] Transactions channel subscription status:', status)
            })

        transactionsChannelRef.current = transactionsChannel

        return () => {
            console.log('[Real-time] Cleaning up transactions channel')
            if (transactionsChannelRef.current) {
                supabase.removeChannel(transactionsChannelRef.current)
                transactionsChannelRef.current = null
            }
        }
    }, [user.id, supabase])

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

    const handlePurchaseClick = (pkg: CoinPackage) => {
        setSelectedPackage(pkg)
    }

    const handlePaymentSuccess = async () => {
        setPurchasedCoins(selectedPackage?.coins || 0)
        setSelectedPackage(null)
        setShowSuccess(true)

        // Refresh wallet immediately
        await refreshWallet()

        // Poll for wallet update (verification/webhook processing can take 2-5 seconds)
        // The real-time subscription should handle this, but polling ensures we get the update
        let attempts = 0
        const maxAttempts = 15 // 15 attempts over 7.5 seconds
        const pollInterval = setInterval(async () => {
            attempts++
            await refreshWallet()

            // Stop polling after max attempts
            if (attempts >= maxAttempts) {
                clearInterval(pollInterval)
            }
        }, 500) // Check every 500ms

        // Cleanup after max time (7.5 seconds)
        setTimeout(() => {
            clearInterval(pollInterval)
            refreshWallet() // Final refresh
        }, 7500)
    }

    const handleSuccessClose = () => {
        setShowSuccess(false)
        router.refresh()
    }

    const clearSearch = () => {
        setSearchQuery('')
    }

    // Memoized stats
    const totalSpent = useMemo(() =>
        transactions
            .filter(t => t.amount < 0 || t.coins < 0)
            .reduce((sum, t) => sum + Math.abs(t.coins || t.amount), 0),
        [transactions]
    )

    const totalReceived = useMemo(() =>
        transactions
            .filter(t => t.amount > 0 || t.coins > 0)
            .reduce((sum, t) => sum + Math.abs(t.coins || t.amount), 0),
        [transactions]
    )

    // Memoized filtered transactions
    const filteredTransactions = useMemo(() => {
        if (!searchQuery.trim()) {
            return transactions
        }

        const query = searchQuery.toLowerCase()
        return transactions.filter(transaction => {
            // Search by description
            if (transaction.description?.toLowerCase().includes(query)) {
                return true
            }
            // Search by type
            if (transaction.type?.toLowerCase().includes(query)) {
                return true
            }
            // Search by ID
            if (transaction.id.toLowerCase().includes(query)) {
                return true
            }
            return false
        })
    }, [transactions, searchQuery])

    return (
        <>
            <div className="min-h-screen bg-black pt-16 lg:pt-0 pb-20 lg:pb-0">
                {/* Payment Modal */}
                {mounted && selectedPackage && (
                    <PaymentModal
                        pkg={selectedPackage}
                        email={user.email || ''}
                        userId={user.id}
                        onClose={() => setSelectedPackage(null)}
                        onSuccess={handlePaymentSuccess}
                    />
                )}

                {/* Success Modal */}
                {showSuccess && (
                    <SuccessModal coins={purchasedCoins} onClose={handleSuccessClose} />
                )}

                {/* Header */}
                <header className="fixed lg:sticky top-[64px] lg:top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 border-t-0">
                    <div className="max-w-4xl mx-auto px-4 py-4">
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
                                    <WalletIcon size={24} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                                    My Wallet
                                </h1>
                                <p className="text-white/50 text-sm mt-1">
                                    Manage your coins and view transaction history
                                </p>
                            </div>
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing || walletLoading}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors disabled:opacity-50"
                                aria-label="Refresh wallet"
                                title="Refresh wallet balance"
                            >
                                {refreshing ? (
                                    <>
                                        <ArrowsClockwise size={20} className="animate-spin" aria-hidden="true" />
                                        <span className="sr-only">Refreshing...</span>
                                    </>
                                ) : (
                                    <>
                                        <ArrowsClockwise size={20} aria-hidden="true" />
                                        <span className="sr-only">Refresh</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </header>

                <div className="max-w-4xl mx-auto px-4 py-6 pt-[128px] lg:pt-6 space-y-6">
                    {/* Search Bar - Only show in history tab */}
                    {activeTab === 'history' && transactions.length > 0 && (
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
                                placeholder="Search transactions by description, type, or ID..."
                                autoComplete="off"
                                aria-label="Search transactions"
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
                    {/* Balance Card */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#df2531] via-[#b91c26] to-[#7a1219] p-6 md:p-8">
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" aria-hidden="true" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" aria-hidden="true" />
                        <div className="absolute top-4 right-4" aria-hidden="true">
                            <Coin size={80} weight="duotone" className="text-white/10" />
                        </div>

                        <div className="relative">
                            <p className="text-white/70 text-sm mb-1">Available Balance</p>
                            <div className="flex items-baseline gap-3 mb-2">
                                <span className="text-5xl md:text-6xl font-bold text-white">
                                    {(wallet?.balance || 0).toLocaleString()}
                                </span>
                                <span className="text-white/70 text-xl">coins</span>
                            </div>
                            <p className="text-white/50 text-sm mb-4">
                                ≈ {formatNaira((wallet?.balance || 0) * 10)} (1 coin = ₦10)
                            </p>

                            <div className="flex flex-wrap gap-4">
                                {(wallet?.escrow_balance || 0) > 0 && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10">
                                        <Clock size={14} className="text-white/70" aria-hidden="true" />
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
                                <TrendUp size={18} aria-hidden="true" />
                                <span className="text-sm font-medium">Total Received</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{totalReceived.toLocaleString()}</p>
                            <p className="text-white/40 text-xs">coins total</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 text-red-400 mb-2">
                                <TrendDown size={18} aria-hidden="true" />
                                <span className="text-sm font-medium">Total Spent</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{totalSpent.toLocaleString()}</p>
                            <p className="text-white/40 text-xs">coins total</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 p-1 bg-white/5 rounded-xl" role="tablist">
                        <button
                            onClick={() => setActiveTab('buy')}
                            role="tab"
                            aria-pressed={activeTab === 'buy'}
                            aria-label="Buy coins tab"
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${activeTab === 'buy'
                                ? 'bg-[#df2531] text-white'
                                : 'text-white/60 hover:text-white'
                                }`}
                        >
                            <Lightning size={18} weight="fill" aria-hidden="true" />
                            Buy Coins
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            role="tab"
                            aria-pressed={activeTab === 'history'}
                            aria-label="Transaction history tab"
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${activeTab === 'history'
                                ? 'bg-[#df2531] text-white'
                                : 'text-white/60 hover:text-white'
                                }`}
                        >
                            <Receipt size={18} aria-hidden="true" />
                            History
                        </button>
                    </div>

                    {/* Buy Coins Tab */}
                    {activeTab === 'buy' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white">Select Package</h2>
                                <div className="flex items-center gap-2 text-white/40 text-xs">
                                    <CreditCard size={14} aria-hidden="true" />
                                    <span>Paystack</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {coinPackages.map((pkg) => (
                                    <button
                                        key={pkg.id}
                                        onClick={() => handlePurchaseClick(pkg)}
                                        aria-label={`Buy ${pkg.coins.toLocaleString()} coins for ${formatNaira(pkg.price)}`}
                                        className={`relative p-5 rounded-2xl border transition-all duration-300 text-left group hover:scale-[1.02] ${pkg.bestValue
                                            ? 'border-green-500/50 bg-green-500/5 hover:border-green-500'
                                            : pkg.popular
                                                ? 'border-[#df2531]/50 bg-[#df2531]/5 hover:border-[#df2531]'
                                                : 'border-white/10 bg-white/5 hover:border-white/30'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                {pkg.popular && (
                                                    <span className="px-2 py-1 bg-[#df2531]/20 text-[#df2531] text-xs rounded-full border border-[#df2531]/30 flex items-center gap-1">
                                                        <Star size={12} weight="fill" />
                                                        Popular
                                                    </span>
                                                )}
                                                {pkg.bestValue && (
                                                    <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/30 flex items-center gap-1">
                                                        <Crown size={12} weight="fill" />
                                                        Best Value
                                                    </span>
                                                )}
                                                {pkg.isNew && (
                                                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30 flex items-center gap-1">
                                                        <Sparkle size={12} weight="fill" />
                                                        New
                                                    </span>
                                                )}
                                                {pkg.isRecommended && (
                                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30 flex items-center gap-1">
                                                        <CheckCircle size={12} weight="fill" />
                                                        Recommended
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mb-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pkg.bestValue ? 'bg-green-500/20' : pkg.popular ? 'bg-[#df2531]/20' : 'bg-white/10'
                                                }`}>
                                                <Coin size={20} weight="duotone" className={
                                                    pkg.bestValue ? 'text-green-400' : pkg.popular ? 'text-[#df2531]' : 'text-white/60'
                                                } aria-hidden="true" />
                                            </div>
                                            <span className="text-white font-bold text-lg">{pkg.coins.toLocaleString()}</span>
                                        </div>

                                        <p className="text-white font-bold text-xl mb-1">{formatNaira(pkg.price)}</p>
                                        <p className="text-white/40 text-xs">{pkg.description}</p>

                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">
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

                            {filteredTransactions.length === 0 ? (
                                <div className="text-center py-16 rounded-2xl bg-white/5 border border-white/10">
                                    {searchQuery ? (
                                        <>
                                            <MagnifyingGlass size={48} weight="duotone" className="text-white/20 mx-auto mb-4" aria-hidden="true" />
                                            <p className="text-white/50 font-medium mb-2">No results found</p>
                                            <p className="text-white/30 text-sm mb-4">
                                                No transactions match your search. Try a different term or clear your search.
                                            </p>
                                            <button
                                                onClick={clearSearch}
                                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                                                aria-label="Clear search to show all transactions"
                                            >
                                                <X size={18} aria-hidden="true" />
                                                Clear Search
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Receipt size={48} weight="duotone" className="text-white/20 mx-auto mb-4" aria-hidden="true" />
                                            <p className="text-white/50 font-medium mb-2">No transactions yet</p>
                                            <p className="text-white/30 text-sm">Your transaction history will appear here</p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredTransactions.map((transaction) => {
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
                                                    <Icon size={22} weight="duotone" className={config.color} aria-hidden="true" />
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
                            <Sparkle size={24} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                            <h3 className="text-white font-bold">How Coins Work</h3>
                        </div>
                        <ul className="space-y-2 text-white/60 text-sm">
                            <li className="flex items-center gap-2">
                                <CheckCircle size={14} className="text-green-400 shrink-0" aria-hidden="true" />
                                Use coins to book services from talented providers
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle size={14} className="text-green-400 shrink-0" aria-hidden="true" />
                                Unlock exclusive premium content
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle size={14} className="text-green-400 shrink-0" aria-hidden="true" />
                                Send gifts to your favorite talents
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle size={14} className="text-green-400 shrink-0" aria-hidden="true" />
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
