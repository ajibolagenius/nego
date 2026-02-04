import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const token = requestUrl.searchParams.get('token')
    const tokenHash = requestUrl.searchParams.get('token_hash')
    const code = requestUrl.searchParams.get('code')
    const type = requestUrl.searchParams.get('type') // 'signup', 'email_change', or 'recovery'

    // Use NEXT_PUBLIC_APP_URL if available, otherwise use request origin
    const origin = process.env.NEXT_PUBLIC_APP_URL
        ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin
        : requestUrl.origin

    if (!token && !tokenHash && !code) {
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Invalid verification link. Please request a new one.')}`)
    }

    try {
        const supabase = await createClient()
        const apiClient = createApiClient()

        let user

        // Handle verification via code (session exchange) - preferred method
        if (code) {
            const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

            if (sessionError) {
                console.error('[Verify Email] Session exchange error:', sessionError)
                return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Verification link is invalid or has expired. Please request a new one.')}`)
            }

            if (!sessionData?.user) {
                return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Verification failed. Please try again.')}`)
            }

            user = sessionData.user
        } else if (token || tokenHash) {
            // Handle verification via token (OTP verification)
            // Use token_hash if available (from generateLink), otherwise use token
            const tokenToUse = tokenHash || token

            if (!tokenToUse) {
                return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Invalid verification link. Please request a new one.')}`)
            }

            const otpType = type === 'email_change' ? 'email_change'
                : type === 'recovery' ? 'recovery'
                    : type === 'magiclink' ? 'magiclink'
                        : 'signup'

            const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
                token_hash: tokenToUse,
                type: otpType,
            })

            if (verifyError) {
                console.error('[Verify Email] Verification error:', verifyError)
                return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Verification link is invalid or has expired. Please request a new one.')}`)
            }

            if (!verifyData?.user) {
                return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Verification failed. Please try again.')}`)
            }

            user = verifyData.user
        } else {
            return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Invalid verification link. Please request a new one.')}`)
        }

        // Get user profile to check role
        const { data: profile, error: profileError } = await apiClient
            .from('profiles')
            .select('id, role, display_name, is_verified, email')
            .eq('id', user.id)
            .single()

        if (profileError) {
            console.error('[Verify Email] Profile fetch error:', profileError)
            // Continue anyway - profile might be created by trigger
        }

        // If user is a client and not yet verified, update is_verified
        if (profile && profile.role === 'client' && !profile.is_verified) {
            const { error: updateError } = await apiClient
                .from('profiles')
                .update({
                    is_verified: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)

            if (updateError) {
                console.error('[Verify Email] Failed to update is_verified:', updateError)
                // Continue anyway - verification was successful, just DB update failed
            } else {
                console.log('[Verify Email] Successfully updated is_verified for client:', user.id)
            }
        }

        // Redirect to dashboard with success message
        console.log('[Verify Email] Redirecting to dashboard')
        return NextResponse.redirect(`${origin}/dashboard?verified=true`)
    } catch (err) {
        console.error('[Verify Email] Unexpected error:', err)
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('An unexpected error occurred during verification. Please try again.')}`)
    }
}
