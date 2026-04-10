import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/dashboard', '/portal', '/wallet', '/bookings', '/admin']
const AUTH_PATHS = ['/login', '/register']

export function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some(path => pathname.startsWith(path))
}

export function isAuthPath(pathname: string) {
  return AUTH_PATHS.some(path => pathname.startsWith(path))
}

export function shouldHandleSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  return (
    request.nextUrl.searchParams.has('code') ||
    isProtectedPath(pathname) ||
    isAuthPath(pathname)
  )
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isProtectedRoute = isProtectedPath(pathname)
  const isAuthRoute = isAuthPath(pathname)

  // Handle auth code in URL (from OAuth or email links)
  const code = request.nextUrl.searchParams.get('code')
  if (code && !pathname.startsWith('/auth/callback')) {
    // Redirect to auth callback to handle the code
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    if (!url.searchParams.has('next')) {
      url.searchParams.set('next', pathname)
    }
    return NextResponse.redirect(url)
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  // Check for environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase environment variables are missing in middleware')
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
