'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeSlash, Envelope, Lock, User, SpinnerGap, GoogleLogo, UserCircle, Briefcase } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

type UserRole = 'client' | 'talent'

export default function RegisterPage() {
  const router = useRouter()
  
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<UserRole>('client')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      
      // Sign up with role in metadata - DB trigger will handle profile creation
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: role,
            avatar_url: googlePicture || null,
          },
        },
      })

      if (error) throw error

      // Clean up Google auth data
      if (isGoogleAuth) {
        localStorage.removeItem('google_auth_email')
        localStorage.removeItem('google_auth_name')
        localStorage.removeItem('google_auth_picture')
        localStorage.removeItem('google_auth_verified')
      }

      // Redirect based on session status
      if (data.user && data.session) {
        // User is logged in, redirect to dashboard (role-based routing happens there)
        if (role === 'talent') {
          window.location.href = '/dashboard/talent'
        } else {
          window.location.href = '/dashboard'
        }
      } else if (data.user && !data.session) {
        // Email confirmation might be required
        setError('Account created! Please check your email to confirm, then sign in.')
        router.push('/login')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    // Store the selected role in localStorage to retrieve after OAuth callback
    localStorage.setItem('pending_oauth_role', role)
    
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) {
      setError(error.message)
    }
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4 pt-20">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#df2531]/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-[#df2531]/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex justify-center mb-8">
          <span className="text-3xl logo-font">
            <span className="text-white">NEGO</span>
            <span className="text-[#df2531]">.</span>
          </span>
        </Link>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
          {step === 1 ? (
            <>
              {/* Step 1: Choose Role */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Join Nego</h1>
                <p className="text-white/50 text-sm">Choose how you want to use Nego</p>
              </div>

              <div className="space-y-4 mb-8">
                {/* Client option */}
                <button
                  onClick={() => setRole('client')}
                  className={`w-full p-5 rounded-xl border-2 transition-all duration-300 text-left ${
                    role === 'client'
                      ? 'border-[#df2531] bg-[#df2531]/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      role === 'client' ? 'bg-[#df2531]' : 'bg-white/10'
                    }`}>
                      <UserCircle size={24} weight="duotone" className="text-white" />
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
                  className={`w-full p-5 rounded-xl border-2 transition-all duration-300 text-left ${
                    role === 'talent'
                      ? 'border-[#df2531] bg-[#df2531]/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      role === 'talent' ? 'bg-[#df2531]' : 'bg-white/10'
                    }`}>
                      <Briefcase size={24} weight="duotone" className="text-white" />
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
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              {/* Step 2: Registration Form */}
              <div className="text-center mb-8">
                <button
                  onClick={() => setStep(1)}
                  className="text-white/50 text-sm hover:text-white mb-4 flex items-center justify-center gap-1 mx-auto"
                >
                  ← Back
                </button>
                <h1 className="text-2xl font-bold text-white mb-2">
                  {isGoogleAuth ? 'Complete Your Profile' : 'Create Account'}
                </h1>
                <p className="text-white/50 text-sm">
                  Signing up as a {role === 'client' ? 'Client' : 'Talent'}
                </p>
              </div>

              {/* Google Auth Badge */}
              {isGoogleAuth && googleEmail && (
                <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                  {googlePicture ? (
                    <img src={googlePicture} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle size={20} className="text-green-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-green-400 text-sm font-medium">Google verified</p>
                    <p className="text-white/60 text-xs">{googleEmail}</p>
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleRegister} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-white/70 text-sm mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-white/70 text-sm mb-2">Email</label>
                  <div className="relative">
                    <Envelope className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => !isGoogleAuth && setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      readOnly={isGoogleAuth}
                      className={`w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50 transition-colors ${isGoogleAuth ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  {isGoogleAuth && (
                    <p className="text-white/40 text-xs mt-1">Email verified by Google</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    {isGoogleAuth ? 'Create a Password' : 'Password'}
                  </label>
                  <p className="text-white/40 text-xs mb-2">
                    {isGoogleAuth ? 'This lets you sign in with email too' : ''}
                  </p>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      required
                      minLength={6}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
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
                  disabled={loading}
                  className="w-full bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? (
                    <SpinnerGap size={20} className="animate-spin" />
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
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
              >
                <GoogleLogo size={20} weight="bold" />
                Continue with Google
              </Button>
            </>
          )}

          {/* Login link */}
          <p className="text-center text-white/50 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#df2531] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
