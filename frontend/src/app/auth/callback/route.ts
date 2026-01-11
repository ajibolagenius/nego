import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const role = requestUrl.searchParams.get('role')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // If role was passed (from OAuth signup), update the profile
      if (role) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('profiles')
            .update({ role })
            .eq('id', user.id)
        }
      }
      
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Return to home on error
  return NextResponse.redirect(`${origin}/login?error=auth_error`)
}
