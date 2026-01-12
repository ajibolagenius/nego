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
        setStatus('Checking your account...')

        const supabase = createClient()
        
        // Check if user exists in profiles by email
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('username', userData.email)
          .single()

        // Store Google auth data
        localStorage.setItem('google_auth_email', userData.email)
        localStorage.setItem('google_auth_name', userData.name)
        localStorage.setItem('google_auth_picture', userData.picture || '')
        localStorage.setItem('google_auth_verified', 'true')

        if (existingProfile) {
          // User exists - they need to sign in with their password
          // Or we could implement passwordless login here
          setStatus('Signing you in...')
          
          // Redirect based on role
          if (existingProfile.role === 'admin') {
            router.push('/admin')
          } else if (existingProfile.role === 'talent') {
            router.push('/dashboard/talent')
          } else {
            router.push('/dashboard')
          }
        } else {
          // New user - check if they came from registration with a pending role
          const pendingRole = localStorage.getItem('google_auth_pending_role')
          
          if (pendingRole) {
            // They selected a role before Google auth, go to step 2 of registration
            localStorage.removeItem('google_auth_pending_role')
          }
          
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
