import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCoinPackageById } from '@/lib/coinPackages'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { packageId, reference } = body

    // Validate package
    const coinPackage = getCoinPackageById(packageId)
    if (!coinPackage) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 })
    }

    // Check if reference already exists
    const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('reference', reference)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Duplicate reference' }, { status: 400 })
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
      console.error('[Create Transaction] Error:', insertError)
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      transaction,
      amount: coinPackage.priceInKobo, // Amount in kobo for Paystack
    })
  } catch (error) {
    console.error('[Create Transaction] Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
