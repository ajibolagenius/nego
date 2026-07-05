import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'

/**
 * Resend delivery webhook — handles bounces/complaints so a permanently
 * undeliverable or complained-about address stops being retried forever.
 * Resend signs webhooks using the Svix scheme: https://resend.com/docs/dashboard/webhooks/verify-webhooks-requests
 */
function verifySvixSignature(secret: string, svixId: string, svixTimestamp: string, body: string, svixSignatureHeader: string): boolean {
    const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
    const signedContent = `${svixId}.${svixTimestamp}.${body}`
    const expectedSignature = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64')

    return svixSignatureHeader
        .split(' ')
        .some((part) => {
            const [, signature] = part.split(',')
            if (!signature) return false
            const a = Buffer.from(signature)
            const b = Buffer.from(expectedSignature)
            return a.length === b.length && crypto.timingSafeEqual(a, b)
        })
}

interface ResendWebhookEvent {
    type: string
    data: {
        to?: string[]
        email_id?: string
    }
}

export async function POST(request: NextRequest) {
    try {
        const bodyText = await request.text()

        const secret = process.env.RESEND_WEBHOOK_SECRET
        const svixId = request.headers.get('svix-id')
        const svixTimestamp = request.headers.get('svix-timestamp')
        const svixSignature = request.headers.get('svix-signature')

        if (!secret || !svixId || !svixTimestamp || !svixSignature) {
            console.warn('[Resend Webhook] Missing signature configuration/headers; ignoring event')
            return NextResponse.json({ status: 'ignored' })
        }

        if (!verifySvixSignature(secret, svixId, svixTimestamp, bodyText, svixSignature)) {
            console.error('[Resend Webhook] Invalid signature')
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
        }

        const event = JSON.parse(bodyText) as ResendWebhookEvent

        if (event.type === 'email.bounced' || event.type === 'email.complained') {
            const recipients = event.data.to || []
            if (recipients.length > 0) {
                const supabase = createApiClient()
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id')
                    .in('email', recipients)

                const userIds = (profiles || []).map((p) => p.id as string)
                if (userIds.length > 0) {
                    await supabase
                        .from('notification_preferences')
                        .update({ email_enabled: false })
                        .in('user_id', userIds)

                    console.warn(`[Resend Webhook] Disabled email notifications for ${userIds.length} user(s) after ${event.type}`, recipients)
                }
            }
        }

        return NextResponse.json({ status: 'ok' })
    } catch (error) {
        console.error('[Resend Webhook] Error processing event:', error)
        // Acknowledge anyway so Resend doesn't retry-storm on a transient parsing issue.
        return NextResponse.json({ status: 'error' })
    }
}
