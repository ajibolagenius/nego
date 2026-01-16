'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeSlash, SpinnerGap, CheckCircle, WarningCircle, Check, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

// Password requirements
interface PasswordRequirements {
    minLength: boolean
    hasUppercase: boolean
    hasLowercase: boolean
    hasNumber: boolean
}

const checkPasswordStrength = (password: string): PasswordRequirements => {
    return {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
    }
}

const isPasswordStrong = (requirements: PasswordRequirements): boolean => {
    return Object.values(requirements).every(req => req === true)
}

export default function ResetPasswordPage() {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
    const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirements>({
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
    })

    // Check if user has a valid reset session
    useEffect(() => {
        const checkSession = async () => {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()

            // User should have a session from the reset email link
            setIsValidSession(!!session)
        }
        checkSession()
    }, [])

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setPassword(value)
        setPasswordRequirements(checkPasswordStrength(value))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        const passwordStrong = isPasswordStrong(passwordRequirements)
        if (!passwordStrong) {
            setError('Password does not meet all requirements')
            return
        }

        setLoading(true)
        setError('')

        try {
            const supabase = createClient()
            const { error } = await supabase.auth.updateUser({
                password,
            })

            if (error) throw error

            setSuccess(true)

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/login')
            }, 3000)
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred. Please try again.'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const passwordStrong = isPasswordStrong(passwordRequirements)
    const passwordsMatch = password && confirmPassword && password === confirmPassword
    const passwordsMismatch = password && confirmPassword && password !== confirmPassword

    // Loading state
    if (isValidSession === null) {
        return (
            <main className="min-h-screen bg-black flex items-center justify-center">
                <SpinnerGap size={32} className="text-[#df2531] animate-spin" aria-label="Loading" />
            </main>
        )
    }

    // Invalid session
    if (!isValidSession) {
        return (
            <main className="min-h-screen bg-black flex items-center justify-center p-4 pt-20">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#df2531]/10 rounded-full blur-[150px]" />
                </div>

                <div className="relative w-full max-w-md animate-fade-in-up">
                    <Link href="/" className="flex justify-center mb-8" aria-label="Nego home">
                        <span className="text-3xl logo-font">
                            <span className="text-white">NEGO</span>
                            <span className="text-[#df2531]">.</span>
                        </span>
                    </Link>

                    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 text-center">
                        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
                            <WarningCircle size={32} weight="duotone" className="text-amber-400" aria-hidden="true" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-3">Invalid or Expired Link</h1>
                        <p className="text-white/50 text-sm mb-6 leading-relaxed">
                            This password reset link is invalid or has expired. Please request a new one.
                        </p>
                        <Link
                            href="/forgot-password"
                            className="inline-block w-full bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold py-3 rounded-xl transition-all text-center"
                            aria-label="Request new password reset link"
                        >
                            Request New Link
                        </Link>
                    </div>
                </div>
            </main>
        )
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
                            <h1 className="text-2xl font-bold text-white mb-3">Password Updated!</h1>
                            <p className="text-white/50 text-sm mb-6 leading-relaxed">
                                Your password has been successfully reset. Redirecting you to sign in...
                            </p>
                            <div className="flex items-center justify-center">
                                <SpinnerGap size={20} className="text-[#df2531] animate-spin" aria-label="Redirecting" />
                            </div>
                        </div>
                    ) : (
                        /* Form State */
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
                                <p className="text-white/50 text-sm leading-relaxed">
                                    Enter your new password below
                                </p>
                            </div>

                            {/* Error message */}
                            {error && (
                                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3" role="alert">
                                    <X size={20} className="shrink-0 mt-0.5" aria-hidden="true" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleSubmit} noValidate className="space-y-5">
                                {/* New Password */}
                                <div>
                                    <label htmlFor="reset-password" className="block text-white/70 text-sm mb-2">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} aria-hidden="true" />
                                        <input
                                            id="reset-password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={handlePasswordChange}
                                            placeholder="Create a strong password"
                                            autoComplete="new-password"
                                            required
                                            aria-label="New password"
                                            aria-describedby="password-requirements"
                                            className={`w-full bg-white/5 border rounded-xl pl-12 pr-12 py-3 text-white placeholder:text-white/30 focus:outline-none transition-colors ${password && !passwordStrong
                                                    ? 'border-amber-500/50 focus:border-amber-500'
                                                    : passwordStrong
                                                        ? 'border-green-500/50 focus:border-green-500'
                                                        : 'border-white/10 focus:border-[#df2531]/50'
                                                }`}
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

                                    {/* Password requirements */}
                                    {password && (
                                        <div id="password-requirements" className="mt-2 space-y-1.5">
                                            <p className="text-white/50 text-xs mb-2">Password requirements:</p>
                                            <div className="flex items-center gap-2 text-xs">
                                                {passwordRequirements.minLength ? (
                                                    <Check size={14} className="text-green-400 shrink-0" aria-hidden="true" />
                                                ) : (
                                                    <X size={14} className="text-red-400 shrink-0" aria-hidden="true" />
                                                )}
                                                <span className={passwordRequirements.minLength ? 'text-green-400' : 'text-white/50'}>
                                                    At least 8 characters
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                {passwordRequirements.hasUppercase ? (
                                                    <Check size={14} className="text-green-400 shrink-0" aria-hidden="true" />
                                                ) : (
                                                    <X size={14} className="text-red-400 shrink-0" aria-hidden="true" />
                                                )}
                                                <span className={passwordRequirements.hasUppercase ? 'text-green-400' : 'text-white/50'}>
                                                    One uppercase letter
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                {passwordRequirements.hasLowercase ? (
                                                    <Check size={14} className="text-green-400 shrink-0" aria-hidden="true" />
                                                ) : (
                                                    <X size={14} className="text-red-400 shrink-0" aria-hidden="true" />
                                                )}
                                                <span className={passwordRequirements.hasLowercase ? 'text-green-400' : 'text-white/50'}>
                                                    One lowercase letter
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                {passwordRequirements.hasNumber ? (
                                                    <Check size={14} className="text-green-400 shrink-0" aria-hidden="true" />
                                                ) : (
                                                    <X size={14} className="text-red-400 shrink-0" aria-hidden="true" />
                                                )}
                                                <span className={passwordRequirements.hasNumber ? 'text-green-400' : 'text-white/50'}>
                                                    One number
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label htmlFor="reset-confirm-password" className="block text-white/70 text-sm mb-2">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} aria-hidden="true" />
                                        <input
                                            id="reset-confirm-password"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm your password"
                                            autoComplete="new-password"
                                            required
                                            aria-label="Confirm password"
                                            aria-invalid={passwordsMismatch ? 'true' : 'false'}
                                            aria-describedby={passwordsMismatch ? 'confirm-error' : passwordsMatch ? 'confirm-success' : undefined}
                                            className={`w-full bg-white/5 border rounded-xl pl-12 pr-12 py-3 text-white placeholder:text-white/30 focus:outline-none transition-colors ${passwordsMismatch
                                                    ? 'border-red-500/50 focus:border-red-500'
                                                    : passwordsMatch
                                                        ? 'border-green-500/50 focus:border-green-500'
                                                        : 'border-white/10 focus:border-[#df2531]/50'
                                                }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                        >
                                            {showConfirmPassword ? <EyeSlash size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                                        </button>
                                        {passwordsMatch && (
                                            <div className="absolute right-12 top-1/2 -translate-y-1/2">
                                                <Check size={18} className="text-green-400" aria-hidden="true" />
                                            </div>
                                        )}
                                        {passwordsMismatch && (
                                            <div className="absolute right-12 top-1/2 -translate-y-1/2">
                                                <X size={18} className="text-red-400" aria-hidden="true" />
                                            </div>
                                        )}
                                    </div>
                                    {passwordsMismatch && (
                                        <p id="confirm-error" className="text-red-400 text-xs mt-1 flex items-center gap-1" role="alert">
                                            <X size={14} aria-hidden="true" />
                                            Passwords do not match
                                        </p>
                                    )}
                                    {passwordsMatch && (
                                        <p id="confirm-success" className="text-green-400 text-xs mt-1 flex items-center gap-1">
                                            <Check size={14} aria-hidden="true" />
                                            Passwords match
                                        </p>
                                    )}
                                </div>

                                {/* Submit button */}
                                <Button
                                    type="submit"
                                    disabled={loading || !passwordStrong || !passwordsMatch}
                                    className="w-full bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
                                    aria-label="Update password"
                                >
                                    {loading ? (
                                        <>
                                            <SpinnerGap size={20} className="animate-spin mr-2" aria-hidden="true" />
                                            <span className="sr-only">Updating password...</span>
                                            Updating...
                                        </>
                                    ) : (
                                        'Update Password'
                                    )}
                                </Button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </main>
    )
}
