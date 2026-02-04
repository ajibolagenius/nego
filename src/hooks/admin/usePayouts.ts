'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface WithdrawalRequest {
    id: string
    talent_id: string
    amount: number
    bank_name: string
    account_number: string
    account_name: string
    status: string
    created_at: string
    talent?: any
}

export function usePayouts(
    initialWithdrawalRequests: WithdrawalRequest[],
    initialPayouts: any[]
) {
    const router = useRouter()
    const supabase = createClient()
    const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>(initialWithdrawalRequests)
    const [payouts, setPayouts] = useState<any[]>(initialPayouts)
    const [processing, setProcessing] = useState<string | null>(null)
    const payoutChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

    // Real-time subscription
    useEffect(() => {
        if (payoutChannelRef.current) {
            supabase.removeChannel(payoutChannelRef.current)
        }

        const channel = supabase
            .channel('admin-payouts')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'withdrawal_requests',
                },
                async () => {
                    const { data: updatedRequests } = await supabase
                        .from('withdrawal_requests')
                        .select(`
              *,
              talent:profiles(id, display_name, avatar_url, username)
            `)
                        .order('created_at', { ascending: false })

                    if (updatedRequests) {
                        setWithdrawalRequests(updatedRequests as WithdrawalRequest[])
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'transactions',
                    filter: 'type=eq.payout',
                },
                async () => {
                    const { data: updatedPayouts } = await supabase
                        .from('transactions')
                        .select(`
              *,
              user:profiles(display_name, avatar_url)
            `)
                        .eq('type', 'payout')
                        .order('created_at', { ascending: false })
                        .limit(50)

                    if (updatedPayouts) {
                        setPayouts(updatedPayouts)
                    }
                }
            )
            .subscribe()

        payoutChannelRef.current = channel

        return () => {
            if (payoutChannelRef.current) {
                supabase.removeChannel(payoutChannelRef.current)
                payoutChannelRef.current = null
            }
        }
    }, [supabase])

    const approveWithdrawal = async (request: WithdrawalRequest) => {
        setProcessing(request.id)
        try {
            // Get current wallet balance
            const { data: walletData, error: walletFetchError } = await supabase
                .from('wallets')
                .select('balance')
                .eq('user_id', request.talent_id)
                .single()

            if (walletFetchError || !walletData) {
                throw new Error('Unable to fetch wallet balance')
            }

            const currentBalance = walletData.balance || 0

            if (currentBalance < request.amount) {
                throw new Error(`Insufficient balance. Current: ${currentBalance.toLocaleString()} coins, requested: ${request.amount.toLocaleString()} coins`)
            }

            const newBalance = currentBalance - request.amount

            // Deduct from wallet first
            const { error: walletError } = await supabase
                .from('wallets')
                .update({ balance: newBalance })
                .eq('user_id', request.talent_id)
                .eq('balance', currentBalance)

            if (walletError) {
                throw new Error('Failed to update wallet balance. Please refresh and try again.')
            }

            // Update withdrawal status
            const { error: updateError } = await supabase
                .from('withdrawal_requests')
                .update({
                    status: 'approved',
                    processed_at: new Date().toISOString()
                })
                .eq('id', request.id)

            if (updateError) {
                // Rollback
                await supabase
                    .from('wallets')
                    .update({ balance: currentBalance })
                    .eq('user_id', request.talent_id)
                throw updateError
            }

            // Create notification
            await supabase.from('notifications').insert({
                user_id: request.talent_id,
                type: 'withdrawal_approved',
                title: 'Withdrawal Approved!',
                message: `Your withdrawal request for ${request.amount.toLocaleString()} coins has been approved.`,
                data: { withdrawal_id: request.id, amount: request.amount }
            })

            toast.success('Withdrawal Approved', {
                description: `Successfully approved withdrawal of ${request.amount.toLocaleString()} coins.`
            })

            router.refresh()
            return { success: true }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to approve withdrawal. Please try again.'
            toast.error('Approval Failed', { description: errorMessage })
            return { success: false, error: errorMessage }
        } finally {
            setProcessing(null)
        }
    }

    const rejectWithdrawal = async (requestId: string, reason: string) => {
        setProcessing(requestId)
        try {
            const request = withdrawalRequests.find(r => r.id === requestId)

            const { error } = await supabase
                .from('withdrawal_requests')
                .update({
                    status: 'rejected',
                    admin_notes: reason || 'Rejected by admin',
                    processed_at: new Date().toISOString()
                })
                .eq('id', requestId)

            if (error) throw error

            if (request) {
                await supabase.from('notifications').insert({
                    user_id: request.talent_id,
                    type: 'withdrawal_rejected',
                    title: 'Withdrawal Declined',
                    message: reason || 'Your withdrawal request has been declined. Please contact support.',
                    data: { withdrawal_id: requestId }
                })
            }

            toast.success('Withdrawal Rejected', {
                description: 'Withdrawal request has been rejected.'
            })

            router.refresh()
            return { success: true }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to reject withdrawal. Please try again.'
            toast.error('Rejection Failed', { description: errorMessage })
            return { success: false, error: errorMessage }
        } finally {
            setProcessing(null)
        }
    }

    return {
        withdrawalRequests,
        payouts,
        processing,
        approveWithdrawal,
        rejectWithdrawal,
    }
}
