/**
 * useWallet Hook
 *
 * Provides real-time wallet synchronization across the app.
 * Subscribes to wallet changes and provides manual refresh capability.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Wallet } from '@/types/database'

// Note: We use a separate supabase instance for notifications to avoid circular dependencies
const getSupabaseForNotifications = () => createClient()

interface UseWalletOptions {
    userId: string
    initialWallet?: Wallet | null
    autoRefresh?: boolean
}

interface UseWalletReturn {
    wallet: Wallet | null
    loading: boolean
    error: string | null
    refreshWallet: () => Promise<void>
}

export function useWallet({ userId, initialWallet, autoRefresh = true }: UseWalletOptions): UseWalletReturn {
    // Use ref to store supabase client to avoid recreating on every render
    const supabaseRef = useRef(createClient())
    const supabase = supabaseRef.current
    const [wallet, setWallet] = useState<Wallet | null>(initialWallet || null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const walletChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

    // Fetch wallet function
    const fetchWallet = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const { data, error: fetchError } = await supabase
                .from('wallets')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle()

            if (fetchError) {
                // Only throw if it's not a "no rows" error
                if (fetchError.code !== 'PGRST116') {
                    throw fetchError
                }
                // PGRST116 means no wallet exists, which is fine - we'll create one
            }

            if (data) {
                setWallet(data)
            } else {
                // Wallet doesn't exist - use default wallet
                // Note: Wallets should be created by the handle_new_user() database trigger
                // If it doesn't exist, we'll use a default until it's created server-side
                setWallet({ user_id: userId, balance: 0, escrow_balance: 0 } as Wallet)
            }
        } catch (err) {
            // Only log non-expected errors
            const error = err as { code?: string }
            if (error.code !== 'PGRST116') {
                console.error('[useWallet] Error fetching wallet:', err)
                setError('Failed to load wallet')
            }
            // Set default wallet on error (wallet should be created by database trigger)
            setWallet({ user_id: userId, balance: 0, escrow_balance: 0 } as Wallet)
        } finally {
            setLoading(false)
        }
    }, [supabase, userId])

    // Manual refresh function
    const refreshWallet = useCallback(async () => {
        await fetchWallet()
    }, [fetchWallet])

    // Real-time subscription for wallet updates
    useEffect(() => {
        if (!autoRefresh || !userId) return

        // Cleanup existing channel
        if (walletChannelRef.current) {
            supabase.removeChannel(walletChannelRef.current)
        }

        const walletChannel = supabase
            .channel(`wallet:${userId}`, {
                config: {
                    broadcast: { self: true }
                }
            })
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'wallets',
                    filter: `user_id=eq.${userId}`,
                },
                async (payload) => {
                    console.log('[useWallet] Real-time wallet UPDATE:', payload.new)
                    const updatedWallet = payload.new as Wallet
                    setWallet(updatedWallet)

                    // Check for low balance and create notification if needed
                    // Only notify if balance is below 100 coins and wasn't already low
                    if (updatedWallet.balance < 100 && wallet && wallet.balance >= 100) {
                        // Balance just dropped below threshold
                        const { error: notifError } = await getSupabaseForNotifications().from('notifications').insert({
                            user_id: userId,
                            type: 'low_balance',
                            title: 'Low Balance Warning ⚠️',
                            message: `Your balance is low (${updatedWallet.balance.toLocaleString()} coins). Consider topping up to continue enjoying our services.`,
                            data: {
                                current_balance: updatedWallet.balance,
                                threshold: 100,
                            },
                        })
                        if (notifError) {
                            console.error('[useWallet] Failed to create low balance notification:', notifError)
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'wallets',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    console.log('[useWallet] Real-time wallet INSERT:', payload.new)
                    setWallet(payload.new as Wallet)
                }
            )
            .subscribe((status) => {
                console.log('[useWallet] Wallet channel subscription status:', status)
            })

        walletChannelRef.current = walletChannel

        // Initial fetch if no wallet provided
        if (!initialWallet) {
            fetchWallet()
        }

        return () => {
            console.log('[useWallet] Cleaning up wallet channel')
            if (walletChannelRef.current) {
                supabase.removeChannel(walletChannelRef.current)
                walletChannelRef.current = null
            }
        }
    }, [userId, autoRefresh, initialWallet, fetchWallet])

    return {
        wallet,
        loading,
        error,
        refreshWallet
    }
}
