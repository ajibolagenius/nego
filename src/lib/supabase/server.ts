import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { Profile } from '@/types/database'
import { ROLE_PREVIEW_COOKIE, getOverriddenProfile, PreviewRole } from '@/lib/admin/role-preview'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Centered helper to get the current user's profile with support for admin role preview.
 */
export async function getServerProfile(): Promise<{ profile: Profile | null, user: any }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { profile: null, user: null }

    const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    const cookieStore = await cookies()
    const previewRole = cookieStore.get(ROLE_PREVIEW_COOKIE)?.value as PreviewRole || null
    const profile = getOverriddenProfile(profileData, previewRole)

    return { profile, user }
}
