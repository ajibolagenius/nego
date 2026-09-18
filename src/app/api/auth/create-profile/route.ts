import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { isValidUsername } from '@/lib/talent-url'

// Postgres unique_violation: the profiles_talent_slug_unique index rejected the username.
const USERNAME_TAKEN = '23505'

export async function POST(request: NextRequest) {
    try {
        // Require an authenticated session. The profile is always created for the
        // signed-in user — the userId is taken from the session, never the body,
        // so nobody can create or overwrite profiles / claim usernames for other users.
        const sessionSupabase = await createServerClient()
        const { data: { user }, error: authError } = await sessionSupabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { role, displayName, fullName, username, gender } = body
        const userId = user.id

        // Validate required fields
        if (!role) {
            return NextResponse.json(
                { error: 'Missing required field: role is required' },
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

        // A username becomes the public profile URL, so it has to survive one:
        // spaces, emoji and '@' used to be stored here and left the talent
        // unreachable at /t/[slug].
        const normalizedUsername = typeof username === 'string' ? username.trim().toLowerCase() : ''
        if (role === 'talent' && normalizedUsername && !isValidUsername(normalizedUsername)) {
            return NextResponse.json(
                { error: 'Username must be 3-30 characters, using only lowercase letters, numbers, hyphens and underscores' },
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
            if (role === 'talent' && normalizedUsername) {
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        username: normalizedUsername,
                        gender: gender || null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', userId)

                if (updateError?.code === USERNAME_TAKEN) {
                    return NextResponse.json({ error: 'That username is already taken' }, { status: 409 })
                }

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
                username: role === 'talent' && normalizedUsername ? normalizedUsername : null,
                gender: gender || null,
                is_verified: false,
                status: 'offline',
                email_notifications_enabled: true,
                push_notifications_enabled: true,
            })

        if (profileError?.code === USERNAME_TAKEN) {
            return NextResponse.json({ error: 'That username is already taken' }, { status: 409 })
        }

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
