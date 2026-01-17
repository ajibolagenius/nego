// Helper function to generate talent profile URL
// Priority: username (primary) > display_name slug (fallback) > UUID (final fallback)
//
// Note: Both username and display_name slug can work as profile URLs:
// - If username exists: /t/username (primary, recommended)
// - If no username: /t/display-name-slug (fallback)
// - If neither: /talent/{uuid} (legacy fallback)
//
// The /t/[slug] route checks username first, then display_name slug, so both methods work.

export function getTalentUrl(talent: {
    id: string
    username?: string | null
    display_name?: string | null
}): string {
    // Priority 1: Use username if available (primary method)
    if (talent.username) {
        return `/t/${talent.username}`
    }

    // Priority 2: Generate slug from display_name (fallback method)
    if (talent.display_name) {
        const slug = talent.display_name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')

        if (slug) {
            return `/t/${slug}`
        }
    }

    // Priority 3: Fallback to UUID-based URL (legacy method)
    return `/talent/${talent.id}`
}

export function generateSlug(displayName: string): string {
    return displayName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
}
