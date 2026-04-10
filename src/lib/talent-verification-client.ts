export interface TalentVerificationSyncResponse {
    updated: boolean
    isComplete: boolean
    isVerified: boolean
    autoVerificationLocked: boolean
    missingRequirements: string[]
    activeServiceCount: number
    mediaCount: number
}

export async function syncTalentVerification(): Promise<TalentVerificationSyncResponse | null> {
    try {
        const response = await fetch('/api/talent/verification/sync', {
            method: 'POST',
        })

        if (!response.ok) {
            if (response.status === 401 || response.status === 403 || response.status === 404) {
                return null
            }

            const payload = await response.json().catch(() => null)
            throw new Error(payload?.error || 'Failed to sync talent verification')
        }

        return response.json()
    } catch (error) {
        console.error('[TalentVerification] Sync error:', error)
        return null
    }
}
