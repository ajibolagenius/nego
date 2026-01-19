'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeSlash, Envelope, Lock, User, SpinnerGap, GoogleLogo, UserCircle, Briefcase, Check, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

type UserRole = 'client' | 'talent'

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

export default function RegisterPage() {
    const router = useRouter()

    const [step, setStep] = useState(1)
    const [role, setRole] = useState<UserRole>('client')
    const [name, setName] = useState('')
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Validation states
    const [nameError, setNameError] = useState('')
    const [nameValid, setNameValid] = useState(false)
    const [usernameError, setUsernameError] = useState('')
    const [usernameValid, setUsernameValid] = useState(false)
    const [checkingUsername, setCheckingUsername] = useState(false)
    const [emailError, setEmailError] = useState('')
    const [emailValid, setEmailValid] = useState(false)
    const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirements>({
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
    })

    // Validate name
    const validateName = useCallback((value: string) => {
        const trimmed = value.trim()
        if (!trimmed) {
            setNameError('')
            setNameValid(false)
            return false
        }
        if (trimmed.length < 2) {
            setNameError('Name must be at least 2 characters')
            setNameValid(false)
            return false
        }
        if (trimmed.length > 100) {
            setNameError('Name must be 100 characters or less')
            setNameValid(false)
            return false
        }
        setNameError('')
        setNameValid(true)
        return true
    }, [])

    // Validate username (for talents only)
    const validateUsername = useCallback(async (value: string) => {
        const trimmed = value.trim().toLowerCase()

        if (role !== 'talent') {
            setUsernameError('')
            setUsernameValid(true)
            return true
        }

        if (!trimmed) {
            setUsernameError('Username is required for talents')
            setUsernameValid(false)
            return false
        }

        // Username format validation
        if (trimmed.length < 3) {
            setUsernameError('Username must be at least 3 characters')
            setUsernameValid(false)
            return false
        }
        if (trimmed.length > 20) {
            setUsernameError('Username must be 20 characters or less')
            setUsernameValid(false)
            return false
        }
        if (!/^[a-z0-9_-]+$/.test(trimmed)) {
            setUsernameError('Username can only contain lowercase letters, numbers, hyphens, and underscores')
            setUsernameValid(false)
            return false
        }

        // Check if username is available
        setCheckingUsername(true)
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', trimmed)
                .single()

            if (error && error.code !== 'PGRST116') {
                // PGRST116 is "not found" which is what we want
                throw error
            }

            if (data) {
                setUsernameError('This username is already taken')
                setUsernameValid(false)
                return false
            }

            setUsernameError('')
            setUsernameValid(true)
            return true
        } catch (err) {
            console.error('[Register] Error checking username:', err)
            setUsernameError('Failed to check username availability')
            setUsernameValid(false)
            return false
        } finally {
            setCheckingUsername(false)
        }
    }, [role])

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

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setName(value)
        validateName(value)
    }

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        // Only allow lowercase, numbers, hyphens, and underscores
        const sanitized = value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
        setUsername(sanitized)
        if (role === 'talent') {
            validateUsername(sanitized)
        }
    }

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setEmail(value)
        validateEmail(value)
    }

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setPassword(value)
        setPasswordRequirements(checkPasswordStrength(value))
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        // Validate all fields
        const nameValidated = validateName(name)
        const emailValidated = validateEmail(email)
        const passwordStrong = isPasswordStrong(passwordRequirements)
        const usernameValidated = role === 'talent' ? await validateUsername(username) : true

        if (!nameValidated || !emailValidated || !passwordStrong || !usernameValidated) {
            setError('Please fix the errors in the form before submitting')
            setLoading(false)
            return
        }

        try {
            const supabase = createClient()

            // Sign up with role in metadata - DB trigger will handle profile creation
            const { data, error } = await supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password,
                options: {
                    data: {
                        full_name: name.trim(),
                        role: role,
                        username: role === 'talent' ? username.trim().toLowerCase() : null,
                    },
                },
            })

            if (error) {
                // Better error handling
                if (error.message.includes('already registered') || error.message.includes('already exists')) {
                    throw new Error('An account with this email already exists. Please sign in instead.')
                }
                // Check for redirect URL errors
                if (error.message.includes('redirect_to') || error.message.includes('redirect')) {
                    console.error('[Register] Redirect URL error:', error)
                    throw new Error('Registration failed due to configuration error. Please contact support.')
                }
                // Check for database trigger errors
                if (error.message.includes('Database error') || error.status === 500) {
                    console.error('[Register] Database error:', error)
                    throw new Error('Registration failed. Please try again or contact support if the issue persists.')
                }
                throw error
            }

            // Ensure profile exists (fallback if database trigger failed)
            if (data.user) {
                try {
                    // Use API route to create profile/wallet server-side (bypasses RLS)
                    const createProfileResponse = await fetch('/api/auth/create-profile', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            userId: data.user.id,
                            role: role,
                            displayName: name.trim(),
                            fullName: name.trim(),
                            username: role === 'talent' ? username.trim().toLowerCase() : null,
                        }),
                    })

                    if (!createProfileResponse.ok) {
                        const errorData = await createProfileResponse.json().catch(() => ({}))
                        console.error('[Register] Error creating profile via API:', errorData)
                        // Don't throw - user is created, profile can be created later
                    } else {
                        console.log('[Register] Profile and wallet created successfully via API')
                    }
                } catch (err) {
                    console.error('[Register] Error ensuring profile/wallet exists:', err)
                    // Continue anyway - user is created, profile/wallet can be created later
                }
            }

            // Redirect based on session status
            if (data.user && data.session) {
                // User is logged in, redirect to dashboard (role-based routing happens there)
                if (role === 'talent') {
                    router.push('/dashboard/talent')
                    router.refresh()
                } else {
                    router.push('/dashboard')
                    router.refresh()
                }
            } else if (data.user && !data.session) {
                // Email confirmation might be required by Supabase settings
                setError('Account created! Please check your email to confirm, then sign in.')
                setTimeout(() => {
                    router.push('/login')
                }, 2000)
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred while creating your account. Please try again.'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignup = async () => {
        // Store the selected role in localStorage to retrieve after OAuth callback
        localStorage.setItem('pending_oauth_role', role)

        const supabase = createClient()

        // Get the correct redirect URL
        // Always use current origin - window.location.origin will be correct in production
        const redirectUrl = `${window.location.origin}/auth/callback`

        console.log('[Google Signup] Redirect URL:', redirectUrl)
        console.log('[Google Signup] Current origin:', window.location.origin)

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

        if (error) {
            setError(error.message)
        }
    }

    const passwordStrong = isPasswordStrong(passwordRequirements)

    return (
        <main className="min-h-screen bg-black flex items-center justify-center p-4 pt-20">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#df2531]/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-[#df2531]/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <Link href="/" className="flex justify-center mb-8 animate-fade-in-up" aria-label="Nego home">
                    <span className="text-3xl logo-font">
                        <span className="text-white">NEGO</span>
                        <span className="text-[#df2531]">.</span>
                    </span>
                </Link>

                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                    {step === 1 ? (
                        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            {/* Step 1: Choose Role */}
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-white mb-2">Join Nego</h1>
                                <p className="text-white/50 text-sm">Choose how you want to use Nego</p>
                            </div>

                            <div className="space-y-4 mb-8">
                                {/* Client option */}
                                <button
                                    onClick={() => setRole('client')}
                                    className={`w-full p-5 rounded-xl border-2 transition-all duration-300 text-left ${role === 'client'
                                        ? 'border-[#df2531] bg-[#df2531]/10'
                                        : 'border-white/10 bg-white/5 hover:border-white/20'
                                        }`}
                                    aria-label="Select client role"
                                    aria-pressed={role === 'client'}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${role === 'client' ? 'bg-[#df2531]' : 'bg-white/10'
                                            }`}>
                                            <UserCircle size={24} weight="duotone" className="text-white" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-semibold mb-1">I&apos;m a Client</h3>
                                            <p className="text-white/50 text-sm">Browse and book elite talent for events and companionship</p>
                                        </div>
                                    </div>
                                </button>

                                {/* Talent option */}
                                <button
                                    onClick={() => setRole('talent')}
                                    className={`w-full p-5 rounded-xl border-2 transition-all duration-300 text-left ${role === 'talent'
                                        ? 'border-[#df2531] bg-[#df2531]/10'
                                        : 'border-white/10 bg-white/5 hover:border-white/20'
                                        }`}
                                    aria-label="Select talent role"
                                    aria-pressed={role === 'talent'}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${role === 'talent' ? 'bg-[#df2531]' : 'bg-white/10'
                                            }`}>
                                            <Briefcase size={24} weight="duotone" className="text-white" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-semibold mb-1">I&apos;m a Talent</h3>
                                            <p className="text-white/50 text-sm">Create your profile and connect with discerning clients</p>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            <Button
                                onClick={() => setStep(2)}
                                className="w-full bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold py-3 rounded-xl"
                                aria-label="Continue to registration form"
                            >
                                Continue
                            </Button>
                        </div>
                    ) : (
                        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            {/* Step 2: Registration Form */}
                            <div className="text-center mb-8">
                                <button
                                    onClick={() => setStep(1)}
                                    className="text-white/50 text-sm hover:text-white mb-4 flex items-center justify-center gap-1 mx-auto transition-colors"
                                    aria-label="Go back to role selection"
                                >
                                    ← Back
                                </button>
                                <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
                                <p className="text-white/50 text-sm">
                                    Signing up as a {role === 'client' ? 'Client' : 'Talent'}
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
                            <form onSubmit={handleRegister} noValidate className="space-y-5">
                                {/* Name */}
                                <div>
                                    <label htmlFor="register-name" className="block text-white/70 text-sm mb-2">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} aria-hidden="true" />
                                        <input
                                            id="register-name"
                                            type="text"
                                            value={name}
                                            onChange={handleNameChange}
                                            placeholder="John Doe"
                                            autoComplete="name"
                                            required
                                            aria-label="Full name"
                                            aria-invalid={nameError ? 'true' : 'false'}
                                            aria-describedby={nameError ? 'name-error' : undefined}
                                            className={`w-full bg-white/5 border rounded-xl pl-12 pr-12 py-3 text-white placeholder:text-white/30 focus:outline-none transition-colors ${nameError
                                                ? 'border-red-500/50 focus:border-red-500'
                                                : nameValid
                                                    ? 'border-green-500/50 focus:border-green-500'
                                                    : 'border-white/10 focus:border-[#df2531]/50'
                                                }`}
                                        />
                                        {nameValid && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <Check size={18} className="text-green-400" aria-hidden="true" />
                                            </div>
                                        )}
                                        {nameError && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <X size={18} className="text-red-400" aria-hidden="true" />
                                            </div>
                                        )}
                                    </div>
                                    {nameError && (
                                        <p id="name-error" className="text-red-400 text-xs mt-1" role="alert">
                                            {nameError}
                                        </p>
                                    )}
                                    {!nameError && nameValid && (
                                        <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                                            <Check size={14} aria-hidden="true" />
                                            Name looks good
                                        </p>
                                    )}
                                </div>

                                {/* Username (for talents only) */}
                                {role === 'talent' && (
                                    <div>
                                        <label htmlFor="register-username" className="block text-white/70 text-sm mb-2">
                                            Username <span className="text-red-400" aria-label="required">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm" aria-hidden="true">@</span>
                                            <input
                                                id="register-username"
                                                type="text"
                                                value={username}
                                                onChange={handleUsernameChange}
                                                placeholder="your-username"
                                                autoComplete="username"
                                                required
                                                aria-label="Username"
                                                aria-invalid={usernameError ? 'true' : 'false'}
                                                aria-describedby={usernameError ? 'username-error' : 'username-help'}
                                                className={`w-full bg-white/5 border rounded-xl pl-10 pr-12 py-3 text-white placeholder:text-white/30 focus:outline-none transition-colors ${usernameError
                                                    ? 'border-red-500/50 focus:border-red-500'
                                                    : usernameValid
                                                        ? 'border-green-500/50 focus:border-green-500'
                                                        : 'border-white/10 focus:border-[#df2531]/50'
                                                    }`}
                                            />
                                            {checkingUsername && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    <SpinnerGap size={18} className="animate-spin text-white/40" aria-hidden="true" />
                                                </div>
                                            )}
                                            {!checkingUsername && usernameValid && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    <Check size={18} className="text-green-400" aria-hidden="true" />
                                                </div>
                                            )}
                                            {!checkingUsername && usernameError && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    <X size={18} className="text-red-400" aria-hidden="true" />
                                                </div>
                                            )}
                                        </div>
                                        {usernameError && (
                                            <p id="username-error" className="text-red-400 text-xs mt-1" role="alert">
                                                {usernameError}
                                            </p>
                                        )}
                                        {!usernameError && usernameValid && (
                                            <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                                                <Check size={14} aria-hidden="true" />
                                                Username available
                                            </p>
                                        )}
                                        <p id="username-help" className="text-white/40 text-xs mt-1">
                                            3-30 characters, lowercase letters, numbers, hyphens, and underscores only. This will be your profile URL.
                                        </p>
                                    </div>
                                )}

                                {/* Email */}
                                <div>
                                    <label htmlFor="register-email" className="block text-white/70 text-sm mb-2">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Envelope className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} aria-hidden="true" />
                                        <input
                                            id="register-email"
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
                                                <Check size={18} className="text-green-400" aria-hidden="true" />
                                            </div>
                                        )}
                                        {emailError && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <X size={18} className="text-red-400" aria-hidden="true" />
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
                                    <label htmlFor="register-password" className="block text-white/70 text-sm mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} aria-hidden="true" />
                                        <input
                                            id="register-password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={handlePasswordChange}
                                            placeholder="Create a strong password"
                                            autoComplete="new-password"
                                            required
                                            aria-label="Password"
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

                                {/* Terms */}
                                <p className="text-white/40 text-xs">
                                    By creating an account, you agree to our{' '}
                                    <Link href="/terms" className="text-[#df2531] hover:underline">Terms of Service</Link>
                                    {' '}and{' '}
                                    <Link href="/privacy" className="text-[#df2531] hover:underline">Privacy Policy</Link>
                                </p>

                                {/* Submit button */}
                                <Button
                                    type="submit"
                                    disabled={loading || !nameValid || !emailValid || !passwordStrong || (role === 'talent' && !usernameValid) || checkingUsername}
                                    className="w-full bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
                                    aria-label="Create account"
                                >
                                    {loading ? (
                                        <>
                                            <SpinnerGap size={20} className="animate-spin mr-2" aria-hidden="true" />
                                            <span className="sr-only">Creating account...</span>
                                            Creating account...
                                        </>
                                    ) : (
                                        'Create Account'
                                    )}
                                </Button>
                            </form>

                            {/* Divider */}
                            <div className="flex items-center gap-4 my-6" aria-hidden="true">
                                <div className="flex-1 h-px bg-white/10" />
                                <span className="text-white/30 text-sm">or</span>
                                <div className="flex-1 h-px bg-white/10" />
                            </div>

                            {/* Google signup */}
                            <Button
                                type="button"
                                onClick={handleGoogleSignup}
                                disabled={loading}
                                className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
                                aria-label="Continue with Google"
                            >
                                <GoogleLogo size={20} weight="bold" aria-hidden="true" />
                                Continue with Google
                            </Button>
                        </div>
                    )}

                    {/* Login link */}
                    <p className="text-center text-white/50 text-sm mt-6">
                        Already have an account?{' '}
                        <Link href="/login" className="text-[#df2531] hover:underline" aria-label="Sign in">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    )
}
