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
        const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.vercel.app'}/auth/verify-email`

        // Use Admin API to generate verification link (this doesn't send email automatically)
        const { data: linkData, error: linkError } = await apiClient.auth.admin.generateLink({
            type: 'signup',
            email: user.email!,
            options: {
                redirectTo: redirectUrl,
            },
        })

        if (linkError || !linkData?.properties?.action_link) {
            console.error('[Send Verification Email] Failed to generate verification link:', linkError)
            return NextResponse.json({
                error: 'Failed to generate verification link. Please try again.',
                details: linkError?.message
            }, { status: 500 })
        }

        const verificationUrl = linkData.properties.action_link

        // Send ONLY our custom verification email (not Supabase's default)
        const emailResult = await sendEmail(
            user.email!,
            emailTemplates.verifyEmail(
                profile?.display_name || user.user_metadata?.full_name || 'User',
                verificationUrl
            )
        )

        if (!emailResult.success) {
            console.error('[Send Verification Email] Failed to send custom email:', emailResult.error)
            return NextResponse.json({
                error: 'Failed to send verification email. Please try again.',
                details: emailResult.error
            }, { status: 500 })
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
