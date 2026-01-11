'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function updateProfileRole(userId: string, role: 'client' | 'talent', fullName: string) {
  console.log('[updateProfileRole] Starting update for:', { userId, role, fullName })
  
  // Use service role key to bypass RLS for this critical operation
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    }
  )
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ 
      role: role,
      full_name: fullName,
      display_name: fullName 
    })
    .eq('id', userId)
    .select()
  
  if (error) {
    console.error('[updateProfileRole] Error:', error)
    return { success: false, error: error.message }
  }
  
  console.log('[updateProfileRole] Success:', data)
  return { success: true }
}
