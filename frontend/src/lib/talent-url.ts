// Helper function to generate talent profile URL
// Uses username if available, otherwise generates slug from display_name, or falls back to UUID

export function getTalentUrl(talent: { 
  id: string
  username?: string | null
  display_name?: string | null 
}): string {
  // If username exists, use /t/username
  if (talent.username) {
    return `/t/${talent.username}`
  }
  
  // If display_name exists, generate slug
  if (talent.display_name) {
    const slug = talent.display_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    
    if (slug) {
      return `/t/${slug}`
    }
  }
  
  // Fallback to UUID-based URL
  return `/talent/${talent.id}`
}

export function generateSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
