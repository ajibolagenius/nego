'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeSlash, Envelope, Lock, SpinnerGap, GoogleLogo, XCircle, CheckCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectPath = searchParams.get('redirect') || null
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [emailError, setEmailError] = useState('')
    const [emailValid, setEmailValid] = useState(false)

    // Validate email in real-time
    const validateEmail = useCallback((value: string) => {
        if (!value.trim()) {
            setEmailError('')
            setEmailValid(false)
            return false
        }

        const normalized = value.trim().toLowerCase()
        if (!emailRegex.test(normalized)) {
            setEmailError('Please enter a valid email address')
            setEmailValid(false)
            return false
        }

        setEmailError('')
        setEmailValid(true)
        return true
    }, [])

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setEmail(value)
        validateEmail(value)
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        // Validate email before submission
        const normalizedEmail = email.trim().toLowerCase()
        if (!validateEmail(normalizedEmail)) {
            setLoading(false)
            return
        }

        try {
            const supabase = createClient()
            const { data, error } = await supabase.auth.signInWithPassword({
                email: normalizedEmail,
                password,
            })

            if (error) {
                // Better error messages
                if (error.message.includes('Invalid login credentials') || error.message.includes('Invalid email or password')) {
                    throw new Error('Invalid email or password. Please check your credentials and try again.')
                } else if (error.message.includes('Email not confirmed')) {
                    throw new Error('Please confirm your email address before signing in. Check your inbox for the confirmation link.')
                } else if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
                    throw new Error('Too many login attempts. Please wait a few minutes and try again.')
                }
                throw error
            }

            // Check user role to redirect appropriately
            if (data.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single()

                // Redirect to the original page if redirect parameter exists, otherwise use role-based redirect
                if (redirectPath) {
                    router.push(redirectPath)
                    router.refresh()
                } else if (profile?.role === 'admin') {
                    router.push('/admin')
                    router.refresh()
                } else if (profile?.role === 'talent') {
                    router.push('/dashboard/talent')
                    router.refresh()
                } else {
                    router.push('/dashboard')
                    router.refresh()
                }
            } else {
                router.push(redirectPath || '/dashboard')
                router.refresh()
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred while signing in. Please try again.'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        setLoading(true)
        setError('')
        try {
            const supabase = createClient()

            // Get the correct redirect URL
            // Always use current origin - window.location.origin will be correct in production
            const redirectUrl = `${window.location.origin}/auth/callback`

            console.log('[Google Login] Redirect URL:', redirectUrl)
            console.log('[Google Login] Current origin:', window.location.origin)

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            })
            if (error) throw error
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred while signing in with Google. Please try again.'
            setError(errorMessage)
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-black flex items-center justify-center p-4 pt-20">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#df2531]/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#df2531]/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative w-full max-w-md animate-fade-in-up">
                {/* Logo */}
                <Link href="/" className="flex justify-center mb-8" aria-label="Nego home">
                    <span className="text-3xl logo-font">
                        <span className="text-white">NEGO</span>
                        <span className="text-[#df2531]">.</span>
                    </span>
                </Link>

                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
                        <p className="text-white/50 text-sm">Sign in to continue to Nego</p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3" role="alert">
                            <XCircle size={20} className="shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleLogin} noValidate className="space-y-5">
                        {/* Email */}
                        <div>
                            <label htmlFor="login-email" className="block text-white/70 text-sm mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Envelope className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} aria-hidden="true" />
                                <input
                                    id="login-email"
                                    type="email"
                                    value={email}
                                    onChange={handleEmailChange}
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    required
                                    aria-label="Email address"
                                    aria-invalid={emailError ? 'true' : 'false'}
                                    aria-describedby={emailError ? 'email-error' : undefined}
                                    className={`w-full bg-white/5 border rounded-xl pl-12 pr-12 py-3 text-white placeholder:text-white/30 focus:outline-none transition-colors ${emailError
                                        ? 'border-red-500/50 focus:border-red-500'
                                        : emailValid
                                            ? 'border-green-500/50 focus:border-green-500'
                                            : 'border-white/10 focus:border-[#df2531]/50'
                                        }`}
                                />
                                {emailValid && (
                                    <div className="absolute right-12 top-1/2 -translate-y-1/2">
                                        <CheckCircle size={18} className="text-green-400" aria-hidden="true" />
                                    </div>
                                )}
                                {emailError && (
                                    <div className="absolute right-12 top-1/2 -translate-y-1/2">
                                        <XCircle size={18} className="text-red-400" aria-hidden="true" />
                                    </div>
                                )}
                            </div>
                            {emailError && (
                                <p id="email-error" className="text-red-400 text-xs mt-1" role="alert">
                                    {emailError}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="login-password" className="block text-white/70 text-sm mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} aria-hidden="true" />
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    required
                                    aria-label="Password"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50 transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeSlash size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                                </button>
                            </div>
                        </div>

                        {/* Forgot password */}
                        <div className="text-right">
                            <Link href="/forgot-password" className="text-[#df2531] text-sm hover:underline" aria-label="Forgot password">
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit button */}
                        <Button
                            type="submit"
                            disabled={loading || !emailValid || !password}
                            className="w-full bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
                            aria-label="Sign in"
                        >
                            {loading ? (
                                <>
                                    <SpinnerGap size={20} className="animate-spin mr-2" aria-hidden="true" />
                                    <span className="sr-only">Signing in...</span>
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6" aria-hidden="true">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-white/30 text-sm">or</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Google login */}
                    <Button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
                        aria-label="Continue with Google"
                    >
                        <GoogleLogo size={20} weight="bold" aria-hidden="true" />
                        Continue with Google
                    </Button>

                    {/* Register link */}
                    <p className="text-center text-white/50 text-sm mt-6">
                        Don&apos;t have an account?{' '}
                        <Link href="/register" className="text-[#df2531] hover:underline" aria-label="Sign up">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    )
}
