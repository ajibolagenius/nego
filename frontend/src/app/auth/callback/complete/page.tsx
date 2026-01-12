'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SpinnerGap } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Completing sign in...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient()
        
        // Get the current session (Supabase handles the code exchange automatically)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) throw sessionError
        
        if (session?.user) {
          setStatus('Setting up your account...')
          
          // Check if there's a pending role from OAuth signup
          const pendingRole = localStorage.getItem('pending_oauth_role')
          
          if (pendingRole) {
            // Update the user's profile with the selected role
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ 
                role: pendingRole,
                display_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
                avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture
              })
              .eq('id', session.user.id)
            
            if (updateError) {
              console.error('Failed to update profile:', updateError)
            }
            
            // Clean up
            localStorage.removeItem('pending_oauth_role')
            
            // Redirect based on role
            if (pendingRole === 'talent') {
              router.push('/dashboard/talent')
            } else {
              router.push('/dashboard')
            }
          } else {
            // Existing user - fetch their role and redirect appropriately
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .single()
            
            if (profile?.role === 'admin') {
              router.push('/admin')
            } else if (profile?.role === 'talent') {
              router.push('/dashboard/talent')
            } else {
              router.push('/dashboard')
            }
          }
        } else {
          // No session, redirect to login
          router.push('/login')
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
      }
    }

    // Small delay to ensure Supabase has processed the auth
    const timer = setTimeout(handleCallback, 500)
    return () => clearTimeout(timer)
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
