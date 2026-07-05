import { NextResponse } from 'next/server'
import { sendEmail, emailTemplates } from '@/lib/email'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        // This endpoint can send an arbitrary templated email to an arbitrary
        // address, so it's restricted to admins/internal callers only — it
        // must never be reachable by an ordinary authenticated user, or any
        // logged-in account could relay email to any inbox.
        const internalSecret = process.env.NOTIFICATION_DISPATCH_SECRET
        const headerSecret = request.headers.get('x-notification-secret')
        const isInternalRequest = Boolean(
            internalSecret &&
            internalSecret.length > 0 &&
            headerSecret &&
            headerSecret.length === internalSecret.length &&
            headerSecret === internalSecret
        )

        const supabase = await createClient()

        if (!isInternalRequest) {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role !== 'admin') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
        }

        const body = await request.json()
        const { type, to, data } = body

        let template
        let recipientEmail = to

        switch (type) {
            case 'welcome':
                recipientEmail = data.email
                template = emailTemplates.welcome(data.name, data.role)
                break

            case 'new_booking':
                recipientEmail = data.talentEmail
                template = emailTemplates.newBooking(
                    data.talentName,
                    data.clientName,
                    data.bookingAmount,
                    data.bookingId
                )
                break

            case 'booking_update':
                recipientEmail = data.clientEmail
                template = emailTemplates.bookingUpdate(
                    data.clientName,
                    data.talentName,
                    data.status,
                    data.bookingId
                )
                break

            case 'review_received':
                recipientEmail = to
                template = emailTemplates.reviewReceived(
                    data.talentName,
                    data.clientName,
                    data.rating,
                    data.comment
                )
                break

            case 'admin_digest':
                recipientEmail = to
                template = emailTemplates.adminDigest(data)
                break

            case 'verify_email':
                recipientEmail = data.email
                template = emailTemplates.verifyEmail(data.name, data.verificationUrl)
                break

            case 'email_verified':
                recipientEmail = data.email
                template = emailTemplates.emailVerified(data.name)
                break

            default:
                return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
        }

        if (!recipientEmail) {
            return NextResponse.json({ error: 'No recipient email provided' }, { status: 400 })
        }

        const result = await sendEmail(recipientEmail, template)

        if (result.success) {
            return NextResponse.json({ success: true, message: 'Email sent successfully' })
        } else {
            return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 })
        }
    } catch (error) {
        console.error('Email API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
