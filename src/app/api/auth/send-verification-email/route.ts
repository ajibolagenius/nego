import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    console.log('[Send Verification Email] API route called')
    try {
        const supabase = await createClient()
        console.log('[Send Verification Email] Supabase client created')

        // Verify the user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        console.log('[Send Verification Email] User check:', { userId: user?.id, email: user?.email, authError: authError?.message })

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user profile to check role and verification status
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, display_name, is_verified')
            .eq('id', user.id)
            .single()

        console.log('[Send Verification Email] Profile check:', { profile, profileError: profileError?.message })

        // Only send verification emails to clients
        if (profile?.role !== 'client') {
            console.log('[Send Verification Email] Not a client, returning error')
            return NextResponse.json({
                error: 'Email verification is only required for clients'
            }, { status: 400 })
        }

        // Check if account is already verified (based on is_verified in profiles table)
        if (profile?.is_verified === true) {
            console.log('[Send Verification Email] Already verified, returning error')
            return NextResponse.json({
                error: 'Account is already verified'
            }, { status: 400 })
        }

        console.log('[Send Verification Email] Profile validated, proceeding with email send')

        // Get redirect URL
        const origin = process.env.NEXT_PUBLIC_APP_URL ||
            (request.headers.get('origin') || 'https://negoempire.vercel.app')

        const redirectTo = `${origin}/auth/verify-email`

        console.log('[Send Verification Email] Using redirect URL:', redirectTo)

        // Get Supabase admin client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !serviceRoleKey) {
            console.error('[Send Verification Email] Missing Supabase configuration')
            return NextResponse.json({
                error: 'Server configuration error'
            }, { status: 500 })
        }

        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
        const adminSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        // IMPORTANT: Temporarily unconfirm the email so Supabase will send a confirmation email
        // This is necessary because auth.resend() only works for unconfirmed emails
        console.log('[Send Verification Email] Temporarily unconfirming email to enable resend')
        const { error: unconfirmError } = await adminSupabase.auth.admin.updateUserById(
            user.id,
            { email_confirm: false }
        )

        if (unconfirmError) {
            console.error('[Send Verification Email] Failed to unconfirm email:', unconfirmError)
            return NextResponse.json({
                error: 'Failed to prepare email sending. Please try again.',
                details: unconfirmError.message
            }, { status: 500 })
        }

        console.log('[Send Verification Email] Email unconfirmed, now sending verification email')

        // Now use Supabase's resend method - this will send the email via Supabase's email service
        const { data: resendData, error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: user.email!,
            options: {
                emailRedirectTo: redirectTo
            }
        })

        if (resendError) {
            console.error('[Send Verification Email] Resend error:', resendError)

            // Re-confirm the email before returning error
            await adminSupabase.auth.admin.updateUserById(user.id, { email_confirm: true })

            // Check if it's a rate limit error
            const errorMessage = resendError.message || ''
            if (errorMessage.includes('after') && errorMessage.includes('seconds')) {
                const secondsMatch = errorMessage.match(/(\d+)\s+seconds?/i)
                const seconds = secondsMatch ? parseInt(secondsMatch[1]) : 60
                return NextResponse.json({
                    error: `Please wait ${seconds} seconds before requesting another verification email. This is a security measure to prevent spam.`,
                    rateLimited: true,
                    retryAfter: seconds
                }, { status: 429 })
            }

            // Return error - 'signup' is the only valid type for verification emails
            return NextResponse.json({
                error: resendError.message || 'Failed to send verification email. Please check your Supabase email configuration.',
                details: resendError
            }, { status: 500 })
        }

        console.log('[Send Verification Email] Signup resend successful')

        // Note: We don't re-confirm the email here because:
        // 1. The user needs to click the verification link to confirm
        // 2. When they click the link, Supabase will confirm the email automatically
        // 3. Our verify-email route will update is_verified in profiles table

        console.log('[Send Verification Email] Email sent successfully via Supabase')
        return NextResponse.json({
            success: true,
            message: 'Verification email sent successfully. Please check your inbox.'
        })
    } catch (error) {
        console.error('[Send Verification Email] Unexpected error:', error)
        return NextResponse.json({
            error: 'An unexpected error occurred',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
