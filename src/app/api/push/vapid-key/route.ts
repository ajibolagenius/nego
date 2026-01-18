import { NextResponse } from 'next/server'
import { getVapidPublicKey } from '@/lib/push/vapid'

/**
 * GET /api/push/vapid-key
 * Returns the VAPID public key for client-side push subscription
 */
export async function GET() {
    try {
        const publicKey = getVapidPublicKey()

        return NextResponse.json({ publicKey })
    } catch (error) {
        console.error('[VAPID Key] Error:', error)
        return NextResponse.json(
            { error: 'VAPID key not configured' },
            { status: 500 }
        )
    }
}
