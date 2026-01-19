import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail, emailTemplates } from '@/lib/email'

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

        // Check if account is already verified (based on is_verified in profiles table, not Supabase email confirmation)
        if (profile?.is_verified === true) {
            console.log('[Send Verification Email] Already verified, returning error')
            return NextResponse.json({
                error: 'Account is already verified'
            }, { status: 400 })
        }

        console.log('[Send Verification Email] Profile validated, proceeding with link generation')

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

        // Use Supabase Admin API to generate verification link
        // This works regardless of "Confirm email" setting
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
        const adminSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        let linkData: any = null
        let linkType: 'signup' | 'magiclink' | 'recovery' = 'signup'
        let linkError: any = null

        // Try signup link first (generates verification token even for existing users)
        console.log('[Send Verification Email] Attempting to generate signup link for:', user.email)

        const { data: signupLinkData, error: signupLinkError } = await adminSupabase.auth.admin.generateLink({
            type: 'signup',
            email: user.email!,
            password: `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            options: {
                redirectTo: `${origin}/auth/verify-email`
            }
        })

        if (signupLinkError || !signupLinkData) {
            console.error('[Send Verification Email] Signup link generation error:', signupLinkError)

            // Check if it's a rate limit error
            const errorMessage = signupLinkError?.message || ''
            if (errorMessage.includes('after') && errorMessage.includes('seconds')) {
                const secondsMatch = errorMessage.match(/(\d+)\s+seconds?/i)
                const seconds = secondsMatch ? parseInt(secondsMatch[1]) : 60
                return NextResponse.json({
                    error: `Please wait ${seconds} seconds before requesting another verification email. This is a security measure to prevent spam.`,
                    rateLimited: true,
                    retryAfter: seconds
                }, { status: 429 })
            }

            // Try magiclink as fallback
            console.log('[Send Verification Email] Signup link failed, trying magiclink')
            const { data: magicLinkData, error: magicLinkError } = await adminSupabase.auth.admin.generateLink({
                type: 'magiclink',
                email: user.email!,
                options: {
                    redirectTo: `${origin}/auth/verify-email`
                }
            })

            if (magicLinkError || !magicLinkData) {
                console.error('[Send Verification Email] Magiclink generation error:', magicLinkError)

                // Check if it's a rate limit error
                const magicErrorMessage = magicLinkError?.message || ''
                if (magicErrorMessage.includes('after') && magicErrorMessage.includes('seconds')) {
                    const secondsMatch = magicErrorMessage.match(/(\d+)\s+seconds?/i)
                    const seconds = secondsMatch ? parseInt(secondsMatch[1]) : 60
                    return NextResponse.json({
                        error: `Please wait ${seconds} seconds before requesting another verification email. This is a security measure to prevent spam.`,
                        rateLimited: true,
                        retryAfter: seconds
                    }, { status: 429 })
                }

                // Try recovery as last resort
                console.log('[Send Verification Email] Magiclink failed, trying recovery')
                const { data: recoveryLinkData, error: recoveryError } = await adminSupabase.auth.admin.generateLink({
                    type: 'recovery',
                    email: user.email!,
                    options: {
                        redirectTo: `${origin}/auth/verify-email`
                    }
                })

                if (recoveryError || !recoveryLinkData) {
                    console.error('[Send Verification Email] Recovery link generation also failed:', recoveryError)

                    // Check if it's a rate limit error
                    const recoveryErrorMessage = recoveryError?.message || ''
                    if (recoveryErrorMessage.includes('after') && recoveryErrorMessage.includes('seconds')) {
                        const secondsMatch = recoveryErrorMessage.match(/(\d+)\s+seconds?/i)
                        const seconds = secondsMatch ? parseInt(secondsMatch[1]) : 60
                        return NextResponse.json({
                            error: `Please wait ${seconds} seconds before requesting another verification email. This is a security measure to prevent spam.`,
                            rateLimited: true,
                            retryAfter: seconds
                        }, { status: 429 })
                    }

                    return NextResponse.json({
                        error: recoveryError?.message || 'Failed to generate verification link. Please try again later.',
                        details: recoveryError
                    }, { status: 500 })
                }

                linkData = recoveryLinkData
                linkType = 'recovery'
                console.log('[Send Verification Email] Recovery link generated successfully')
            } else {
                linkData = magicLinkData
                linkType = 'magiclink'
                console.log('[Send Verification Email] Magiclink generated successfully')
            }
        } else {
            linkData = signupLinkData
            linkType = 'signup'
            console.log('[Send Verification Email] Signup link generated successfully')
        }

        // Extract verification URL from the generated link
        let verificationUrl = `${origin}/auth/verify-email`

        if (linkData?.properties?.action_link) {
            try {
                const actionLinkUrl = new URL(linkData.properties.action_link)
                const token = actionLinkUrl.searchParams.get('token') || actionLinkUrl.searchParams.get('token_hash')

                if (token) {
                    verificationUrl = `${origin}/auth/verify-email?token_hash=${token}&type=${linkType}`
                } else {
                    // Use action_link directly - it will handle verification and redirect to our callback
                    verificationUrl = linkData.properties.action_link
                }
            } catch (urlError) {
                console.error('[Send Verification Email] URL parsing error:', urlError)
                // If URL parsing fails, use hashed_token if available
                if (linkData?.properties?.hashed_token) {
                    verificationUrl = `${origin}/auth/verify-email?token_hash=${linkData.properties.hashed_token}&type=${linkType}`
                }
            }
        } else if (linkData?.properties?.hashed_token) {
            verificationUrl = `${origin}/auth/verify-email?token_hash=${linkData.properties.hashed_token}&type=${linkType}`
        }

        // Send our custom email template via Resend
        console.log('[Send Verification Email] Sending email to:', user.email)
        console.log('[Send Verification Email] Verification URL:', verificationUrl)
        console.log('[Send Verification Email] Link type:', linkType)

        const emailResult = await sendEmail(
            user.email!,
            emailTemplates.verifyEmail(
                profile.display_name || user.user_metadata?.full_name || 'User',
                verificationUrl
            )
        )

        console.log('[Send Verification Email] Email result:', emailResult)

        if (!emailResult.success) {
            console.error('[Send Verification Email] Email send error:', emailResult.error)
            return NextResponse.json({
                error: emailResult.error || 'Failed to send verification email. Please check your Resend API configuration.',
                details: emailResult
            }, { status: 500 })
        }

        console.log('[Send Verification Email] Email sent successfully')
        console.log('[Send Verification Email] Returning success response')
        return NextResponse.json({
            success: true,
            message: 'Verification email sent successfully. Please check your inbox.',
            emailSent: true,
            verificationUrl: verificationUrl.substring(0, 50) + '...' // Log first 50 chars for debugging
        })
    } catch (error) {
        console.error('[Send Verification Email] Unexpected error:', error)
        return NextResponse.json({
            error: 'An unexpected error occurred',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
