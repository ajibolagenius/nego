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

// Usernames are free text: some contain spaces, emoji or '@', which do not
// survive a round trip through the URL. Everything that builds or resolves a
// profile URL must agree on this one key.
export function talentSlug(talent: TalentRef): string {
    if (talent.username && /^[a-z0-9_-]+$/.test(talent.username)) {
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

export function generateSlug(displayName: string): string {
    return displayName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
}
