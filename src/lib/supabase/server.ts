import { ROLE_PREVIEW_COOKIE, getOverriddenProfile, PreviewRole } from '@/lib/admin/role-preview'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { createApiClient } from '@/lib/supabase/api'

import type { Profile } from '@/types/database'

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
export async function getServerProfile(): Promise<{ profile: Profile | null, user: SupabaseUser | null }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { profile: null, user: null }

    let profileData: Profile | null = null
    
    const { data: fetchedProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (profileError || !fetchedProfile) {
        // Self-healing: profile is missing! Let's create it on-the-fly.
        try {
            console.log(`[getServerProfile] User ${user.email} (${user.id}) is missing a profile. Triggering self-healing...`)
            const apiSupabase = createApiClient()
            const userMetadata = user.user_metadata || {}
            const rawRole = userMetadata.role
            const role = ['client', 'talent', 'admin'].includes(rawRole) ? rawRole : 'client'
            
            const displayName = userMetadata.full_name || userMetadata.name || 'User'
            const username = userMetadata.username || null
            const avatarUrl = userMetadata.avatar_url || userMetadata.picture || null
            const email = user.email || null
            const createdAt = user.created_at
            
            const rawGender = userMetadata.gender
            const gender = ['male', 'female', 'other'].includes(rawGender) ? rawGender : null

            // 1. Insert Profile
            const { data: newProfile, error: pInsertError } = await apiSupabase
                .from('profiles')
                .insert({
                    id: user.id,
                    role,
                    display_name: displayName,
                    username,
                    avatar_url: avatarUrl,
                    email,
                    created_at: createdAt,
                    updated_at: new Date().toISOString(),
                    gender
                })
                .select()
                .single()

            if (!pInsertError && newProfile) {
                profileData = newProfile as Profile

                // 2. Insert Wallet
                await apiSupabase
                    .from('wallets')
                    .insert({
                        user_id: user.id,
                        balance: 0,
                        escrow_balance: 0
                    })

                // 3. Insert Notification Preferences
                await apiSupabase
                    .from('notification_preferences')
                    .insert({
                        user_id: user.id,
                        in_app_enabled: true,
                        push_enabled: true,
                        email_enabled: true,
                        chat_enabled: true
                    })
            } else if (pInsertError) {
                console.error('[getServerProfile] Failed to auto-create profile:', pInsertError)
            }
        } catch (err) {
            console.error('[getServerProfile] Unexpected error during profile self-healing:', err)
        }
    } else {
        profileData = fetchedProfile as Profile
    }

    const cookieStore = await cookies()
    const previewRole = cookieStore.get(ROLE_PREVIEW_COOKIE)?.value as PreviewRole || null
    const profile = getOverriddenProfile(profileData, previewRole)

    return { profile, user }
}
