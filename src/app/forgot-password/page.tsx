'use client'

import { Envelope, SpinnerGap, CheckCircle, ArrowLeft, XCircle } from '@phosphor-icons/react'
import Link from 'next/link'
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [emailError, setEmailError] = useState('')
    const [emailValid, setEmailValid] = useState(false)

    // Validate email
    const validateEmail = useCallback((value: string) => {
        const normalized = value.trim().toLowerCase()
        if (!normalized) {
            setEmailError('')
            setEmailValid(false)
            return false
        }
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

    const handleSubmit = async (e: React.FormEvent) => {
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
            const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
                redirectTo: `${window.location.origin}/reset-password`,
            })

            if (error) {
                // Better error handling
                if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
                    throw new Error('Too many requests. Please wait a few minutes and try again.')
                }
                throw error
            }

            setSuccess(true)
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred. Please try again.'
            setError(errorMessage)
        } finally {
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
                    {success ? (
                        /* Success State */
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                                <CheckCircle size={32} weight="duotone" className="text-green-400" aria-hidden="true" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-3">Check Your Email</h1>
                            <p className="text-white/50 text-sm mb-2 leading-relaxed">
                                We&apos;ve sent a password reset link to <span className="text-white font-medium">{email}</span>.
                            </p>
                            <p className="text-white/40 text-xs mb-4">
                                Click the link in the email to reset your password. The link will expire in 1 hour.
                            </p>
                            <p className="text-white/30 text-xs mb-6">
                                Didn&apos;t receive the email? Check your spam folder or try again.
                            </p>
                            <div className="space-y-3">
                                <Button
                                    onClick={() => {
                                        setSuccess(false)
                                        setEmail('')
                                        setEmailValid(false)
                                        setEmailError('')
                                    }}
                                    className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 py-3 rounded-xl"
                                    aria-label="Try another email"
                                >
                                    Try Another Email
                                </Button>
                                <Link
                                    href="/login"
                                    className="block w-full text-center text-[#df2531] hover:underline text-sm py-2 transition-colors"
                                    aria-label="Back to sign in"
                                >
                                    Back to Sign In
                                </Link>
                            </div>
                        </div>
                    ) : (
                        /* Form State */
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-white mb-2">Forgot Password?</h1>
                                <p className="text-white/50 text-sm leading-relaxed">
                                    Enter your email address and we&apos;ll send you a link to reset your password.
                                </p>
                            </div>

                            {/* Error message */}
                            {error && (
                                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3" role="alert">
                                    <XCircle size={20} className="shrink-0 mt-0.5" aria-hidden="true" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleSubmit} noValidate className="space-y-5">
                                {/* Email */}
                                <div>
                                    <label htmlFor="forgot-email" className="block text-white/70 text-sm mb-2">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Envelope className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} aria-hidden="true" />
                                        <input
                                            id="forgot-email"
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
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <CheckCircle size={18} className="text-green-400" aria-hidden="true" />
                                            </div>
                                        )}
                                        {emailError && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
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

                                {/* Submit button */}
                                <Button
                                    type="submit"
                                    disabled={loading || !emailValid}
                                    className="w-full bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
                                    aria-label="Send reset link"
                                >
                                    {loading ? (
                                        <>
                                            <SpinnerGap size={20} className="animate-spin mr-2" aria-hidden="true" />
                                            <span className="sr-only">Sending reset link...</span>
                                            Sending...
                                        </>
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </Button>
                            </form>

                            {/* Back to login */}
                            <Link
                                href="/login"
                                className="flex items-center justify-center gap-2 text-white/50 hover:text-white text-sm mt-6 transition-colors"
                                aria-label="Back to sign in"
                            >
                                <ArrowLeft size={16} aria-hidden="true" />
                                Back to Sign In
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </main>
    )
}
