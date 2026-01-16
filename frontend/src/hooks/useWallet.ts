/**
 * useWallet Hook
 *
 * Provides real-time wallet synchronization across the app.
 * Subscribes to wallet changes and provides manual refresh capability.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Wallet } from '@/types/database'

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
    const supabase = createClient()
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
                .single()

            if (fetchError) throw fetchError

            if (data) {
                setWallet(data)
            } else {
                // Wallet doesn't exist, create it
                const { data: newWallet, error: createError } = await supabase
                    .from('wallets')
                    .insert({ user_id: userId, balance: 0, escrow_balance: 0 })
                    .select()
                    .single()

                if (createError) throw createError
                if (newWallet) setWallet(newWallet)
            }
        } catch (err) {
            console.error('[useWallet] Error fetching wallet:', err)
            setError('Failed to load wallet')
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
                (payload) => {
                    console.log('[useWallet] Real-time wallet UPDATE:', payload.new)
                    setWallet(payload.new as Wallet)
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
    }, [userId, autoRefresh, supabase, initialWallet, fetchWallet])

    return {
        wallet,
        loading,
        error,
        refreshWallet
    }
}
