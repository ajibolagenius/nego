import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail, emailTemplates } from '@/lib/email'
import { createApiClient } from '@/lib/supabase/api'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const apiClient = createApiClient()

        // Verify the user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if user is already verified
        if (user.email_confirmed_at) {
            return NextResponse.json({
                error: 'Email is already verified',
                alreadyVerified: true
            }, { status: 400 })
        }

        // Get user profile to check role and get display name
        const { data: profile } = await apiClient
            .from('profiles')
            .select('role, display_name, is_verified')
            .eq('id', user.id)
            .single()

        // Only clients need verification
        if (profile && profile.role !== 'client') {
            return NextResponse.json({
                error: 'Verification is only required for clients',
                notRequired: true
            }, { status: 400 })
        }

        // Generate verification link using Supabase Admin API
        // Use 'invite' type which works for existing users without requiring a password
        // This generates a verification link we can use in our custom email
        const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.vercel.app'}/auth/verify-email`

        let verificationUrl = redirectUrl

        // Try to generate link using Admin API (doesn't send Supabase email automatically)
        try {
            const { data: linkData, error: linkError } = await apiClient.auth.admin.generateLink({
                type: 'invite',
                email: user.email!,
                options: {
                    redirectTo: redirectUrl,
                },
            })

            if (!linkError && linkData?.properties?.action_link) {
                verificationUrl = linkData.properties.action_link
            } else {
                // Fallback: Use resend if generateLink fails
                // This will send Supabase's email (which can be branded in dashboard)
                const { error: resendError } = await supabase.auth.resend({
                    type: 'signup',
                    email: user.email!,
                    options: {
                        emailRedirectTo: redirectUrl,
                    },
                })

                if (resendError) {
                    return NextResponse.json({
                        error: 'Failed to generate verification link. Please try again.',
                        details: resendError.message
                    }, { status: 500 })
                }

                // Note: Supabase email was sent. Brand the template in dashboard to match our design.
                // Our custom email below will also be sent.
            }
        } catch (error) {
            console.error('[Send Verification Email] Error generating link:', error)
            // Fallback to resend
            const { error: resendError } = await supabase.auth.resend({
                type: 'signup',
                email: user.email!,
                options: {
                    emailRedirectTo: redirectUrl,
                },
            })

            if (resendError) {
                return NextResponse.json({
                    error: 'Failed to send verification email. Please try again.',
                    details: resendError.message
                }, { status: 500 })
            }
        }

        // Send our custom verification email using our branded template
        // If generateLink succeeded, we have the actual verification link with token
        // If we used resend fallback, Supabase email was sent (can be branded in dashboard)
        const emailResult = await sendEmail(
            user.email!,
            emailTemplates.verifyEmail(
                profile?.display_name || user.user_metadata?.full_name || 'User',
                verificationUrl
            )
        )

        if (!emailResult.success) {
            console.error('[Send Verification Email] Failed to send custom email:', emailResult.error)
            // If we used generateLink successfully, return error since custom email is primary
            // If we used resend fallback, Supabase email was sent, so return success
            if (verificationUrl === redirectUrl) {
                // We used resend fallback, Supabase email was sent
                return NextResponse.json({
                    success: true,
                    message: 'Verification email sent successfully (via Supabase)',
                    note: 'Custom email failed, but Supabase email was sent'
                })
            } else {
                // We have the link but custom email failed
                return NextResponse.json({
                    error: 'Failed to send verification email. Please try again.',
                    details: emailResult.error
                }, { status: 500 })
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Verification email sent successfully'
        })
    } catch (error) {
        console.error('[Send Verification Email] Unexpected error:', error)
        return NextResponse.json({
            error: 'An unexpected error occurred',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
