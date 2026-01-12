import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redirect to the callback page which handles role assignment
      return NextResponse.redirect(`${origin}/auth/callback/complete`)
    }
  }

  // Return to login on error
  return NextResponse.redirect(`${origin}/login?error=auth_error`)
}
