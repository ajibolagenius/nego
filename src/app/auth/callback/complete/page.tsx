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

                setStatus('Loading your profile...')

                // Get the current session (Supabase handles the code exchange automatically)
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()

                if (sessionError) {
                    console.error('[Auth Callback] Session error:', sessionError)
                    throw new Error('Failed to retrieve session. Please try signing in again.')
                }

                if (!session?.user) {
                    // No session, redirect to login
                    router.push('/login?error=' + encodeURIComponent('No active session found. Please sign in again.'))
                    return
                }

                setStatus('Setting up your account...')

                // Check if there's a pending role from OAuth signup
                const pendingRole = localStorage.getItem('pending_oauth_role')

                if (pendingRole) {
                    // Validate role
                    if (pendingRole !== 'client' && pendingRole !== 'talent') {
                        console.error('[Auth Callback] Invalid role:', pendingRole)
                        localStorage.removeItem('pending_oauth_role')
                        throw new Error('Invalid account type. Please try again.')
                    }

                    // Check if profile exists
                    const { data: existingProfile } = await supabase
                        .from('profiles')
                        .select('id, role')
                        .eq('id', session.user.id)
                        .single()

                    if (existingProfile) {
                        // Profile exists, update it
                        const { error: updateError } = await supabase
                            .from('profiles')
                            .update({
                                role: pendingRole,
                                display_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || existingProfile.role,
                                username: session.user.user_metadata?.username || null,
                                avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', session.user.id)

                        if (updateError) {
                            console.error('[Auth Callback] Profile update error:', updateError)
                            // Continue anyway, role might already be set
                        }
                    } else {
                        // Profile doesn't exist, create it (fallback)
                        const { error: createError } = await supabase
                            .from('profiles')
                            .insert({
                                id: session.user.id,
                                role: pendingRole,
                                display_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User',
                                username: session.user.user_metadata?.username || null,
                                avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
                                email: session.user.email || ''
                            })

                        if (createError) {
                            console.error('[Auth Callback] Profile creation error:', createError)
                            // Continue anyway, might be created by trigger
                        }
                    }

                    // Clean up
                    localStorage.removeItem('pending_oauth_role')

                    setStatus('Redirecting...')

                    // Redirect to dashboard (role-based routing handled by dashboard/middleware)
                    router.push('/dashboard')
                    router.refresh()
                } else {
                    // Existing user - fetch their role and redirect appropriately
                    setStatus('Loading your profile...')

                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', session.user.id)
                        .single()

                    if (profileError) {
                        console.error('[Auth Callback] Profile fetch error:', profileError)
                        // Profile might not exist, create it with default role
                        const { error: createError } = await supabase
                            .from('profiles')
                            .insert({
                                id: session.user.id,
                                role: 'client',
                                display_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User',
                                avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null,
                                email: session.user.email || ''
                            })

                        if (createError) {
                            console.error('[Auth Callback] Profile creation fallback error:', createError)
                        }

                        setStatus('Redirecting...')
                        router.push('/dashboard')
                        router.refresh()
                        return
                    }

                    setStatus('Redirecting...')

                    // Redirect to dashboard (role-based routing handled by dashboard/middleware)
                    router.push('/dashboard')
                    router.refresh()
                }
            } catch (err) {
                console.error('[Auth Callback] Error:', err)
                const errorMessage = err instanceof Error ? err.message : 'Authentication failed. Please try again.'
                setError(errorMessage)

                // Auto-redirect to login on critical errors after 3 seconds
                setTimeout(() => {
                    router.push('/login?error=' + encodeURIComponent(errorMessage))
                }, 3000)
            }
        }

        // Small delay to ensure Supabase has processed the auth
        const timer = setTimeout(handleCallback, 500)
        return () => clearTimeout(timer)
    }, [router])

    if (error) {
        return (
            <main className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="text-center animate-fade-in-up max-w-md">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                        <span className="text-red-400 text-2xl font-bold">!</span>
                    </div>
                    <h1 className="text-xl font-bold text-white mb-2">Authentication Failed</h1>
                    <p className="text-white/60 mb-2 leading-relaxed">{error}</p>
                    <p className="text-white/40 text-sm mb-6">Redirecting to login page...</p>
                    <button
                        onClick={() => router.push('/login')}
                        className="px-6 py-3 bg-[#df2531] text-white rounded-xl hover:bg-[#c41f2a] transition-colors font-medium"
                        aria-label="Go to login page"
                    >
                        Go to Login
                    </button>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="text-center animate-fade-in-up">
                <SpinnerGap size={48} weight="duotone" className="text-[#df2531] animate-spin mx-auto mb-4" aria-label="Loading" />
                <h1 className="text-xl font-bold text-white mb-2">{status}</h1>
                <p className="text-white/60 text-sm">Please wait while we set up your account...</p>
            </div>
        </main>
    )
}
