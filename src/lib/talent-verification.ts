import { createApiClient } from '@/lib/supabase/api'

export const AUTO_VERIFICATION_DISABLED_FLAG = '[auto-verification-disabled]'

export type TalentVerificationRequirement =
    | 'avatar'
    | 'displayName'
    | 'username'
    | 'location'
    | 'bio'
    | 'gender'
    | 'service'
    | 'media'

interface TalentVerificationProfile {
    id: string
    role: string
    is_verified: boolean | null
    avatar_url: string | null
    display_name: string | null
    username: string | null
    location: string | null
    bio: string | null
    gender?: string | null
    admin_notes?: string | null
}

export interface TalentVerificationStatus {
    talentId: string
    isTalent: boolean
    isVerified: boolean
    isComplete: boolean
    activeServiceCount: number
    mediaCount: number
    missingRequirements: TalentVerificationRequirement[]
    autoVerificationLocked: boolean
}

export interface TalentVerificationSyncResult extends TalentVerificationStatus {
    updated: boolean
}

function hasText(value: string | null | undefined): boolean {
    return typeof value === 'string' && value.trim().length > 0
}

export function hasAutoVerificationLock(adminNotes: string | null | undefined): boolean {
    return typeof adminNotes === 'string' && adminNotes.includes(AUTO_VERIFICATION_DISABLED_FLAG)
}

export function stripAutoVerificationLock(adminNotes: string | null | undefined): string | null {
    if (!hasText(adminNotes)) {
        return null
    }

    const cleaned = adminNotes!
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && line !== AUTO_VERIFICATION_DISABLED_FLAG)
        .join('\n')

    return cleaned || null
}

export function addAutoVerificationLock(adminNotes: string | null | undefined): string {
    const cleaned = stripAutoVerificationLock(adminNotes)
    return cleaned ? `${cleaned}\n${AUTO_VERIFICATION_DISABLED_FLAG}` : AUTO_VERIFICATION_DISABLED_FLAG
}

function getMissingRequirements(
    profile: TalentVerificationProfile,
    activeServiceCount: number,
    mediaCount: number
): TalentVerificationRequirement[] {
    const missing: TalentVerificationRequirement[] = []

    if (!hasText(profile.avatar_url)) missing.push('avatar')
    if (!hasText(profile.display_name)) missing.push('displayName')
    if (!hasText(profile.username)) missing.push('username')
    if (!hasText(profile.location)) missing.push('location')
    if (!hasText(profile.bio)) missing.push('bio')
    if (!hasText(profile.gender)) missing.push('gender')
    if (activeServiceCount <= 0) missing.push('service')
    if (mediaCount <= 0) missing.push('media')

    return missing
}

export async function getTalentVerificationStatus(talentId: string): Promise<TalentVerificationStatus> {
    const apiClient = createApiClient()

    const [
        profileResult,
        activeServicesResult,
        mediaResult,
    ] = await Promise.all([
        apiClient
            .from('profiles')
            .select('id, role, is_verified, avatar_url, display_name, username, location, bio, gender, admin_notes')
            .eq('id', talentId)
            .maybeSingle(),
        apiClient
            .from('talent_menus')
            .select('id', { count: 'exact', head: true })
            .eq('talent_id', talentId)
            .eq('is_active', true),
        apiClient
            .from('media')
            .select('id', { count: 'exact', head: true })
            .eq('talent_id', talentId)
            .or('moderation_status.is.null,moderation_status.eq.approved,moderation_status.eq.pending'),
    ])

    if (profileResult.error || !profileResult.data) {
        throw new Error(profileResult.error?.message || 'Talent profile not found')
    }

    const profile = profileResult.data as TalentVerificationProfile
    const activeServiceCount = activeServicesResult.count || 0
    const mediaCount = mediaResult.count || 0

    if (profile.role !== 'talent') {
        return {
            talentId,
            isTalent: false,
            isVerified: profile.is_verified === true,
            isComplete: false,
            activeServiceCount,
            mediaCount,
            missingRequirements: [],
            autoVerificationLocked: hasAutoVerificationLock(profile.admin_notes),
        }
    }

    const missingRequirements = getMissingRequirements(profile, activeServiceCount, mediaCount)

    return {
        talentId,
        isTalent: true,
        isVerified: profile.is_verified === true,
        isComplete: missingRequirements.length === 0,
        activeServiceCount,
        mediaCount,
        missingRequirements,
        autoVerificationLocked: hasAutoVerificationLock(profile.admin_notes),
    }
}

export async function syncTalentAutoVerification(talentId: string): Promise<TalentVerificationSyncResult> {
    const status = await getTalentVerificationStatus(talentId)

    if (!status.isTalent || status.isVerified || !status.isComplete || status.autoVerificationLocked) {
        return {
            ...status,
            updated: false,
        }
    }

    const apiClient = createApiClient()
    const { error } = await apiClient
        .from('profiles')
        .update({
            is_verified: true,
            updated_at: new Date().toISOString(),
        })
        .eq('id', talentId)

    if (error) {
        throw new Error(error.message)
    }

    return {
        ...status,
        isVerified: true,
        updated: true,
    }
}
