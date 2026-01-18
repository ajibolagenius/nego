import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const errorParam = requestUrl.searchParams.get('error')
    const errorDescription = requestUrl.searchParams.get('error_description')

    // Use NEXT_PUBLIC_APP_URL if available, otherwise use request origin
    // This ensures production URLs are used even if request comes from wrong origin
    const origin = process.env.NEXT_PUBLIC_APP_URL
        ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin
        : requestUrl.origin

    console.log('[Auth Callback] Request origin:', requestUrl.origin)
    console.log('[Auth Callback] Using redirect origin:', origin)
    console.log('[Auth Callback] Code:', code ? 'present' : 'missing')
    console.log('[Auth Callback] Error:', errorParam || 'none')

    // Handle OAuth errors
    if (errorParam) {
        console.error('[Auth Callback] OAuth error:', errorParam, errorDescription)
        const errorMessage = errorDescription || errorParam === 'access_denied'
            ? 'Authentication was cancelled. Please try again.'
            : 'Authentication failed. Please try again.'
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMessage)}`)
    }

    if (code) {
        try {
            const supabase = await createClient()

            const { data, error } = await supabase.auth.exchangeCodeForSession(code)

            if (error) {
                console.error('[Auth Callback] Session exchange error:', error)
                return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Failed to complete authentication. Please try again.')}`)
            }

            if (data?.session) {
                // Redirect to the callback page which handles role assignment
                return NextResponse.redirect(`${origin}/auth/callback/complete`)
            }

            // No session after exchange
            console.warn('[Auth Callback] No session after code exchange')
            return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Authentication incomplete. Please try again.')}`)
        } catch (err) {
            console.error('[Auth Callback] Unexpected error:', err)
            return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('An unexpected error occurred. Please try again.')}`)
        }
    }

    // No code provided
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Invalid authentication request. Please try again.')}`)
}
