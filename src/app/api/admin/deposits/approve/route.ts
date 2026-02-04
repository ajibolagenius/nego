import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        // Check Auth & Admin Role
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { requestId } = body

        if (!requestId) {
            return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
        }

        // Get the request
        const { data: depositRequest, error: fetchError } = await supabase
            .from('deposit_requests')
            .select('*')
            .eq('id', requestId)
            .single()

        if (fetchError || !depositRequest) {
            return NextResponse.json({ error: 'Deposit request not found' }, { status: 404 })
        }

        if (depositRequest.status !== 'pending') {
            return NextResponse.json({ error: 'Request is not pending' }, { status: 400 })
        }

        // 1. Update request status to approved
        const { error: updateError } = await supabase
            .from('deposit_requests')
            .update({ status: 'approved', admin_notes: 'Approved by admin', updated_at: new Date().toISOString() })
            .eq('id', requestId)

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update request status' }, { status: 500 })
        }

        // 2. Credit User Wallet
        // We use the rpc call if available, or fetch-and-update. 
        // Best practice is RPC for atomicity, but standard update is acceptable for MVP if RPC missing.
        // Let's try to get the current wallet first.
        const { data: wallet } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', depositRequest.user_id)
            .single()

        const coinsToAdd = Math.floor(depositRequest.amount / 10) // 1 coin = 10 Naira as per WalletClient
        const newBalance = (wallet?.balance || 0) + coinsToAdd

        const { error: walletError } = await supabase
            .from('wallets')
            .upsert({
                user_id: depositRequest.user_id,
                balance: newBalance,
                updated_at: new Date().toISOString()
            })

        if (walletError) {
            console.error('Error crediting wallet:', walletError)
            // Revert status update (manual rollback since no transaction)
            await supabase.from('deposit_requests').update({ status: 'pending' }).eq('id', requestId)
            return NextResponse.json({ error: 'Failed to credit wallet' }, { status: 500 })
        }

        // 3. Create Transaction Record
        await supabase
            .from('transactions')
            .insert({
                user_id: depositRequest.user_id,
                amount: coinsToAdd,
                type: 'purchase',
                reference_id: requestId,
                description: `Manual Deposit: ${depositRequest.reference || 'Bank Transfer'}`,
                created_at: new Date().toISOString()
            })

        // 4. Send Notification
        await supabase.from('notifications').insert({
            user_id: depositRequest.user_id,
            type: 'purchase_success', // Reusing existing type if possible
            title: 'Deposit Approved ✅',
            message: `Your deposit of ₦${depositRequest.amount.toLocaleString()} has been approved. ${coinsToAdd.toLocaleString()} coins added.`,
            data: {
                request_id: requestId,
                amount: coinsToAdd
            }
        })

        return NextResponse.json({ success: true, coinsAdded: coinsToAdd })

    } catch (error) {
        console.error('Admin approval error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
