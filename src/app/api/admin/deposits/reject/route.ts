import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
        const { requestId, reason } = body

        if (!requestId) {
            return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
        }

        // Update request status to rejected
        const { error } = await supabase
            .from('deposit_requests')
            .update({
                status: 'rejected',
                admin_notes: reason || 'Rejected by admin',
                updated_at: new Date().toISOString()
            })
            .eq('id', requestId)
            .eq('status', 'pending') // Only reject pending requests

        if (error) {
            return NextResponse.json({ error: 'Failed to reject request' }, { status: 500 })
        }

        // Get request details to notify user
        const { data: requestData } = await supabase
            .from('deposit_requests')
            .select('user_id, amount')
            .eq('id', requestId)
            .single()

        if (requestData) {
            // Send Notification
            await supabase.from('notifications').insert({
                user_id: requestData.user_id,
                type: 'purchase_failed', // Reusing similar type
                title: 'Deposit Rejected ❌',
                message: `Your deposit of ₦${requestData.amount.toLocaleString()} was rejected. Reason: ${reason || 'Admin decision'}.`,
                data: {
                    request_id: requestId,
                    reason: reason
                }
            })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Admin rejection error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
