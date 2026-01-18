import { NextResponse } from 'next/server'
import { getVapidPublicKey } from '@/lib/push/vapid'

/**
 * GET /api/push/vapid-key
 * Returns the VAPID public key for client-side push subscription
 *
 * Returns 503 (Service Unavailable) if VAPID keys are not configured,
 * which is a non-critical feature.
 */
export async function GET() {
    try {
        const publicKey = getVapidPublicKey()

        if (!publicKey) {
            return NextResponse.json(
                { error: 'VAPID keys are not configured. Push notifications are disabled.' },
                { status: 503 }
            )
        }

        return NextResponse.json({ publicKey })
    } catch (error) {
        // Log error but return 503 (Service Unavailable) instead of 500
        // This indicates the feature is not available, not a server error
        console.warn('[VAPID Key] VAPID keys not configured. Push notifications disabled:', error instanceof Error ? error.message : error)
        return NextResponse.json(
            {
                error: 'Push notifications are not configured',
                message: 'VAPID keys are not set in environment variables. This is optional and does not affect core functionality.'
            },
            { status: 503 }
        )
    }
}
