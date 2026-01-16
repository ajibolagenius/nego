import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCoinPackageById } from '@/lib/coinPackages'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in to continue.' }, { status: 401 })
        }

        const body = await request.json()
        const { packageId, reference } = body

        // Validate input
        if (!packageId || !reference) {
            return NextResponse.json({ success: false, error: 'Missing required fields: packageId and reference are required' }, { status: 400 })
        }

        // Validate package
        const coinPackage = getCoinPackageById(packageId)
        if (!coinPackage) {
            return NextResponse.json({ success: false, error: 'Invalid package selected. Please choose a valid coin package.' }, { status: 400 })
        }

        // Check if reference already exists
        const { data: existing } = await supabase
            .from('transactions')
            .select('id')
            .eq('reference', reference)
            .single()

        if (existing) {
            return NextResponse.json({ success: false, error: 'This transaction has already been processed. Please contact support if you believe this is an error.' }, { status: 400 })
        }

        // Create transaction record
        const { data: transaction, error: insertError } = await supabase
            .from('transactions')
            .insert({
                user_id: user.id,
                reference,
                amount: coinPackage.price,
                coins: coinPackage.coins,
                type: 'purchase',
                status: 'pending',
                description: `Purchase ${coinPackage.displayName}`,
            })
            .select()
            .single()

        if (insertError) {
            console.error('[Create Transaction] Database error:', insertError)
            return NextResponse.json({
                success: false,
                error: 'Failed to create transaction. Please try again or contact support.'
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            transaction,
            amount: coinPackage.priceInKobo, // Amount in kobo for Paystack
        })
    } catch (error) {
        console.error('[Create Transaction] Unexpected error:', error)
        const errorMessage = process.env.NODE_ENV === 'development'
            ? (error instanceof Error ? error.message : 'Server error')
            : 'An unexpected error occurred. Please try again or contact support.'

        return NextResponse.json({
            success: false,
            error: errorMessage
        }, { status: 500 })
    }
}
