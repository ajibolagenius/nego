'use server'

import { createClient } from '@/lib/supabase/server'

export async function updateProfileRole(userId: string, role: 'client' | 'talent', fullName: string) {
  const supabase = await createClient()
  
  // Use service role key for this operation to bypass RLS
  const { error } = await supabase
    .from('profiles')
    .update({ 
      role: role,
      full_name: fullName,
      display_name: fullName 
    })
    .eq('id', userId)
  
  if (error) {
    console.error('Error updating profile role:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}
