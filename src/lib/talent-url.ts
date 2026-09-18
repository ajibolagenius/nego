// Helper function to generate talent profile URL
// Priority: username (primary) > display_name slug (fallback) > UUID (final fallback)
//
// Note: Both username and display_name slug can work as profile URLs:
// - If username exists: /t/username (primary, recommended)
// - If no username: /t/display-name-slug (fallback)
// - If neither: /talent/{uuid} (legacy fallback)
//
// The /t/[slug] route checks username first, then a persisted slug, then display_name slug.

type TalentRef = {
    id: string
    username?: string | null
    display_name?: string | null
}

// A username is usable as the URL as typed only if it survives a round trip and
// carries at least one alphanumeric: '---' slugifies to nothing, so Postgres
// indexes it as NULL, and keeping it here would put a key outside the reach of
// profiles_talent_slug_unique.
const URL_SAFE_USERNAME = /^(?=[a-z0-9_-]*[a-z0-9])[a-z0-9_-]+$/

// Usernames are free text: some contain spaces, emoji or '@', which do not
// survive a round trip through the URL. Everything that builds or resolves a
// profile URL must agree on this one key.
export function talentSlug(talent: TalentRef): string {
    if (talent.username && URL_SAFE_USERNAME.test(talent.username)) {
        return talent.username
    }

    // Priority 2: slugified username, then slugified display_name
    const fromUsername = talent.username ? generateSlug(talent.username) : ''
    if (fromUsername) {
        return fromUsername
    }

    const fromDisplayName = talent.display_name ? generateSlug(talent.display_name) : ''
    if (fromDisplayName) {
        return fromDisplayName
    }

    // Priority 3: UUID (legacy method)
    return talent.id
}

export function getTalentUrl(talent: TalentRef): string {
    const slug = talentSlug(talent)
    return slug === talent.id ? `/talent/${talent.id}` : `/t/${slug}`
}

// A username is only ever stored if it can be the URL as typed. Enforced at
// every write path and by the profiles_talent_slug_unique index in Postgres.
export const USERNAME_PATTERN = /^(?=[a-z0-9_-]*[a-z0-9])[a-z0-9_-]{3,30}$/

export function isValidUsername(username: string): boolean {
    return USERNAME_PATTERN.test(username)
}

export function generateSlug(displayName: string): string {
    return displayName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
}
