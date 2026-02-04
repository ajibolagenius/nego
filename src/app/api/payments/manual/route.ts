import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { amount, proofUrl, reference } = body

        if (!amount || !proofUrl) {
            return NextResponse.json({ error: 'Amount and proof are required' }, { status: 400 })
        }

        // Insert deposit request
        const { data, error } = await supabase
            .from('deposit_requests')
            .insert({
                user_id: user.id,
                amount,
                proof_url: proofUrl,
                status: 'pending',
                reference: reference || null,
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating deposit request:', error)
            return NextResponse.json({ error: 'Failed to create deposit request' }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('Manual payment error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
