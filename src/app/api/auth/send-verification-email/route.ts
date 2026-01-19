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

        // Get user profile to check role and verification status
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, display_name, is_verified')
            .eq('id', user.id)
            .single()

        // Only send verification emails to clients
        if (profile?.role !== 'client') {
            return NextResponse.json({
                error: 'Email verification is only required for clients'
            }, { status: 400 })
        }

        // Check if account is already verified (based on is_verified in profiles table, not Supabase email confirmation)
        if (profile?.is_verified === true) {
            return NextResponse.json({
                error: 'Account is already verified'
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

        // Use Supabase Admin API to generate verification link for existing user
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
        const adminSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        // For existing users, try magiclink first (works for existing users)
        let linkData
        let linkError

        const { data: magicLinkData, error: magicLinkError } = await adminSupabase.auth.admin.generateLink({
            type: 'magiclink',
            email: user.email!,
            options: {
                redirectTo: `${origin}/auth/verify-email`
            }
        })

        if (magicLinkError || !magicLinkData) {
            console.error('[Send Verification Email] Magiclink generation error:', magicLinkError)
            linkError = magicLinkError
            linkData = null
            // If magiclink fails, try with recovery type as fallback
            const { data: recoveryLinkData, error: recoveryError } = await adminSupabase.auth.admin.generateLink({
                type: 'recovery',
                email: user.email!,
                options: {
                    redirectTo: `${origin}/auth/verify-email`
                }
            })

            if (recoveryError || !recoveryLinkData) {
                console.error('[Send Verification Email] Recovery link generation also failed:', recoveryError)
                return NextResponse.json({
                    error: 'Failed to generate verification link. Please try again.'
                }, { status: 500 })
            }

            // Use recovery link data
            const actionLink = recoveryLinkData.properties?.action_link
            if (actionLink) {
                try {
                    const actionLinkUrl = new URL(actionLink)
                    const token = actionLinkUrl.searchParams.get('token') || actionLinkUrl.searchParams.get('token_hash')
                    const verificationUrl = token
                        ? `${origin}/auth/verify-email?token_hash=${token}&type=recovery`
                        : actionLink

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
                } catch (urlError) {
                    console.error('[Send Verification Email] URL parsing error:', urlError)
                    return NextResponse.json({
                        error: 'Failed to generate verification link. Please try again.'
                    }, { status: 500 })
                }
            }

            // If no action_link, try hashed_token
            if (recoveryLinkData.properties?.hashed_token) {
                const verificationUrl = `${origin}/auth/verify-email?token_hash=${recoveryLinkData.properties.hashed_token}&type=recovery`

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
            }

            return NextResponse.json({
                error: 'Failed to generate verification link. Please try again.'
            }, { status: 500 })
        }

        // If magiclink succeeded, use that data
        if (magicLinkData && !linkError) {
            linkData = magicLinkData
        }

        // Extract verification URL from the generated link (magiclink succeeded)
        let verificationUrl = `${origin}/auth/verify-email`

        if (linkData?.properties?.action_link) {
            try {
                const actionLinkUrl = new URL(linkData.properties.action_link)
                const token = actionLinkUrl.searchParams.get('token') || actionLinkUrl.searchParams.get('token_hash')

                if (token) {
                    verificationUrl = `${origin}/auth/verify-email?token_hash=${token}&type=magiclink`
                } else {
                    // Use action_link - it will handle verification and redirect to our callback
                    verificationUrl = linkData.properties.action_link
                }
            } catch {
                // If URL parsing fails, use hashed_token if available
                if (linkData?.properties?.hashed_token) {
                    verificationUrl = `${origin}/auth/verify-email?token_hash=${linkData.properties.hashed_token}&type=magiclink`
                }
            }
        } else if (linkData?.properties?.hashed_token) {
            verificationUrl = `${origin}/auth/verify-email?token_hash=${linkData.properties.hashed_token}&type=magiclink`
        }

        // Ensure we have linkData before proceeding
        if (!linkData) {
            return NextResponse.json({
                error: 'Failed to generate verification link. Please try again.'
            }, { status: 500 })
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
