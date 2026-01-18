import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail, emailTemplates } from '@/lib/email'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        // Verify the user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if email is already confirmed
        if (user.email_confirmed_at) {
            return NextResponse.json({
                error: 'Email is already verified'
            }, { status: 400 })
        }

        // Get user profile to check role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, display_name')
            .eq('id', user.id)
            .single()

        // Only send verification emails to clients
        if (profile?.role !== 'client') {
            return NextResponse.json({
                error: 'Email verification is only required for clients'
            }, { status: 400 })
        }

        const origin = process.env.NEXT_PUBLIC_APP_URL ||
            (request.headers.get('origin') || 'https://negoempire.vercel.app')

        // Use Supabase Admin API to generate verification link
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json({
                error: 'Server configuration error'
            }, { status: 500 })
        }

        // Use Supabase Admin API to generate OTP for email verification
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
        const adminSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        // Use Supabase Admin API to generate a signup link for email verification
        // Even though user exists, we use signup type with a temporary password to generate the verification token
        // The password won't be used since we're just getting the verification link
        const tempPassword = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`

        const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
            type: 'signup',
            email: user.email!,
            password: tempPassword,
            options: {
                redirectTo: `${origin}/auth/verify-email`
            }
        })

        if (linkError || !linkData) {
            console.error('[Send Verification Email] Link generation error:', linkError)
            return NextResponse.json({
                error: 'Failed to generate verification link. Please try again.'
            }, { status: 500 })
        }

        // Extract verification URL from the generated link
        // The action_link contains the full Supabase verification URL
        let verificationUrl = `${origin}/auth/verify-email`

        if (linkData.properties?.action_link) {
            // The action_link goes to Supabase's verification endpoint, then redirects to our callback
            // We can use it directly, or extract the token
            try {
                const actionLinkUrl = new URL(linkData.properties.action_link)
                const token = actionLinkUrl.searchParams.get('token') || actionLinkUrl.searchParams.get('token_hash')

                if (token) {
                    verificationUrl = `${origin}/auth/verify-email?token_hash=${token}&type=signup`
                } else {
                    // Use action_link - it will handle verification and redirect to our callback
                    verificationUrl = linkData.properties.action_link
                }
            } catch {
                // If URL parsing fails, use hashed_token if available
                if (linkData.properties?.hashed_token) {
                    verificationUrl = `${origin}/auth/verify-email?token_hash=${linkData.properties.hashed_token}&type=signup`
                }
            }
        } else if (linkData.properties?.hashed_token) {
            verificationUrl = `${origin}/auth/verify-email?token_hash=${linkData.properties.hashed_token}&type=signup`
        }

        // Send our custom email template via Resend
        const emailResult = await sendEmail(
            user.email!,
            emailTemplates.verifyEmail(
                profile.display_name || user.user_metadata?.full_name || 'User',
                verificationUrl
            )
        )

        if (!emailResult.success) {
            console.error('[Send Verification Email] Email send error:', emailResult.error)
            return NextResponse.json({
                error: 'Failed to send verification email. Please try again.'
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: 'Verification email sent successfully'
        })
    } catch (error) {
        console.error('[Send Verification Email] Unexpected error:', error)
        return NextResponse.json({
            error: 'An unexpected error occurred'
        }, { status: 500 })
    }
}
