import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId, role, fullName } = await request.json()
    
    console.log('[API] Updating profile:', { userId, role, fullName })
    
    // Use service role key to bypass RLS
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return [] },
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
      console.error('[API] Error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    
    console.log('[API] Success:', data)
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[API] Exception:', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
