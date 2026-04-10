import { Profile } from '@/types/database'

export const ROLE_PREVIEW_COOKIE = 'nego_role_preview'

export type PreviewRole = 'admin' | 'talent' | 'client' | 'guest'

/**
 * Gets the overridden profile based on the requested preview role.
 * Only applies if the actual user is an admin.
 */
export function getOverriddenProfile(
    actualProfile: Profile | null,
    previewRole: PreviewRole | null
): Profile | null {
    if (!actualProfile || actualProfile.role !== 'admin' || !previewRole || previewRole === 'admin') {
        return actualProfile
    }

    if (previewRole === 'guest') {
        return null
    }

    // Return a modified profile with the overridden role
    return {
        ...actualProfile,
        role: previewRole as 'talent' | 'client',
        // Override verification status if needed for previewing
        is_verified: true 
    }
}
