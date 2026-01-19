import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, role, displayName, fullName, username } = body

        // Validate required fields
        if (!userId || !role) {
            return NextResponse.json(
                { error: 'Missing required fields: userId and role are required' },
                { status: 400 }
            )
        }

        // Validate role
        if (role !== 'client' && role !== 'talent') {
            return NextResponse.json(
                { error: 'Invalid role. Must be "client" or "talent"' },
                { status: 400 }
            )
        }

        // Use API client (service role) to bypass RLS
        const supabase = createApiClient()

        // Check if profile already exists
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .maybeSingle()

        if (existingProfile) {
            // Profile exists, update username if provided and role is talent
            if (role === 'talent' && username) {
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        username: username.trim().toLowerCase(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', userId)

                if (updateError) {
                    console.error('[Create Profile API] Error updating profile:', updateError)
                    // Continue anyway
                }
            }

            // Check and create wallet if needed
            const { data: existingWallet } = await supabase
                .from('wallets')
                .select('user_id')
                .eq('user_id', userId)
                .maybeSingle()

            if (!existingWallet) {
                const { error: walletError } = await supabase
                    .from('wallets')
                    .insert({
                        user_id: userId,
                        balance: 0,
                        escrow_balance: 0,
                    })

                if (walletError) {
                    console.error('[Create Profile API] Error creating wallet:', walletError)
                    // Continue anyway
                }
            }

            return NextResponse.json({ success: true, message: 'Profile already exists' })
        }

        // Create profile
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                role: role,
                display_name: displayName || fullName || 'User',
                full_name: fullName || displayName || null,
                username: role === 'talent' && username ? username.trim().toLowerCase() : null,
                is_verified: false,
                status: 'offline',
            })

        if (profileError) {
            console.error('[Create Profile API] Error creating profile:', profileError)
            return NextResponse.json(
                { error: 'Failed to create profile', details: profileError.message },
                { status: 500 }
            )
        }

        // Create wallet
        const { error: walletError } = await supabase
            .from('wallets')
            .insert({
                user_id: userId,
                balance: 0,
                escrow_balance: 0,
            })

        if (walletError) {
            console.error('[Create Profile API] Error creating wallet:', walletError)
            // Don't fail the request if wallet creation fails - it can be created later
        }

        return NextResponse.json({ success: true, message: 'Profile and wallet created successfully' })
    } catch (error) {
        console.error('[Create Profile API] Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
