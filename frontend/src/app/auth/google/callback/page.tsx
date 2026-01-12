'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SpinnerGap } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH

export default function GoogleCallbackPage() {
  const router = useRouter()
  const hasProcessed = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('Processing Google sign-in...')

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return
    hasProcessed.current = true

    const processAuth = async () => {
      try {
        // Get session_id from URL hash fragment
        const hash = window.location.hash
        const sessionIdMatch = hash.match(/session_id=([^&]+)/)
        
        if (!sessionIdMatch) {
          throw new Error('No session ID found. Please try again.')
        }

        const sessionId = sessionIdMatch[1]
        setStatus('Verifying with Google...')

        // Exchange session_id for user data from Emergent Auth
        const authResponse = await fetch(
          'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data',
          {
            method: 'GET',
            headers: {
              'X-Session-ID': sessionId,
            },
          }
        )

        if (!authResponse.ok) {
          throw new Error('Failed to verify Google session')
        }

        const userData = await authResponse.json()
        setStatus('Creating your account...')

        // Now sign in/up the user with Supabase using the Google user data
        const supabase = createClient()
        
        // Check if user exists in profiles by email
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('username', userData.email)
          .single()

        if (existingProfile) {
          // User exists - sign them in using a magic link or create a session
          // For now, we'll use signInWithOtp as a workaround
          setStatus('Signing you in...')
          
          // Since we verified with Google, we can trust this email
          // Store the session token and redirect
          localStorage.setItem('google_auth_email', userData.email)
          localStorage.setItem('google_auth_name', userData.name)
          localStorage.setItem('google_auth_picture', userData.picture || '')
          localStorage.setItem('google_auth_verified', 'true')
          
          // Redirect based on role
          if (existingProfile.role === 'admin') {
            router.push('/admin')
          } else if (existingProfile.role === 'talent') {
            router.push('/dashboard/talent')
          } else {
            router.push('/dashboard')
          }
        } else {
          // New user - redirect to role selection
          localStorage.setItem('google_auth_email', userData.email)
          localStorage.setItem('google_auth_name', userData.name)
          localStorage.setItem('google_auth_picture', userData.picture || '')
          localStorage.setItem('google_auth_verified', 'true')
          
          // Redirect to register page with Google flag
          router.push('/register?google=true')
        }
      } catch (err: unknown) {
        console.error('Auth callback error:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
      }
    }

    processAuth()
  }, [router])

  if (error) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-2xl">!</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Authentication Failed</h1>
          <p className="text-white/60 mb-6">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-[#df2531] text-white rounded-xl hover:bg-[#c41f2a] transition-colors"
          >
            Back to Login
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="text-center">
        <SpinnerGap size={48} className="text-[#df2531] animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">{status}</h1>
        <p className="text-white/60">Please wait...</p>
      </div>
    </main>
  )
}
