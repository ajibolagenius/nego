/**
 * VAPID (Voluntary Application Server Identification) keys for Web Push
 *
 * To generate VAPID keys, run:
 * npx web-push generate-vapid-keys
 *
 * Store these in environment variables:
 * NEXT_PUBLIC_VAPID_PUBLIC_KEY
 * VAPID_PRIVATE_KEY
 */

export function getVapidPublicKey(): string {
    // Client-side: use NEXT_PUBLIC_ variable
    if (typeof window !== 'undefined') {
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!publicKey) {
            throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set in environment variables')
        }
        return publicKey
    }

    // Server-side: can use either
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY

    if (!publicKey) {
        throw new Error('VAPID public key is not set in environment variables')
    }

    return publicKey
}

export function getVapidPrivateKey(): string {
    // Private key should never be accessible client-side
    if (typeof window !== 'undefined') {
        throw new Error('VAPID private key cannot be accessed client-side')
    }

    const privateKey = process.env.VAPID_PRIVATE_KEY

    if (!privateKey) {
        throw new Error('VAPID_PRIVATE_KEY is not set in environment variables')
    }

    return privateKey
}

/**
 * Convert VAPID public key from base64 URL to Uint8Array
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

    const rawData = atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }

    return outputArray
}
