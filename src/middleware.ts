import { NextResponse, type NextRequest } from 'next/server'
import { shouldHandleSession, updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Check hidden page authentication
  if (request.nextUrl.pathname.startsWith('/hidden/talents')) {
    const hiddenAuth = request.cookies.get('hidden_auth')?.value
    if (hiddenAuth !== 'acce$$ed') {
      return NextResponse.redirect(new URL('/hidden', request.url))
    }
  }

  if (!shouldHandleSession(request)) {
    return NextResponse.next()
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/portal/:path*',
    '/wallet/:path*',
    '/bookings/:path*',
    '/admin/:path*',
    '/login',
    '/register',
    '/hidden/talents/:path*',
  ],
}
