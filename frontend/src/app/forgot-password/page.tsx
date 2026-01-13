'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Envelope, SpinnerGap, CheckCircle, ArrowLeft } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error
      
      setSuccess(true)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
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
          {success ? (
            /* Success State */
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} weight="fill" className="text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Check Your Email</h1>
              <p className="text-white/50 text-sm mb-6">
                We've sent a password reset link to <span className="text-white">{email}</span>. 
                Click the link in the email to reset your password.
              </p>
              <p className="text-white/30 text-xs mb-6">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => setSuccess(false)}
                  className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 py-3 rounded-xl"
                >
                  Try Another Email
                </Button>
                <Link
                  href="/login"
                  className="block w-full text-center text-[#df2531] hover:underline text-sm py-2"
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
                <p className="text-white/50 text-sm">
                  Enter your email and we'll send you a reset link
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label className="block text-white/70 text-sm mb-2">Email</label>
                  <div className="relative">
                    <Envelope className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? (
                    <SpinnerGap size={20} className="animate-spin" />
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>

              {/* Back to login */}
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-white/50 hover:text-white text-sm mt-6 transition-colors"
              >
                <ArrowLeft size={16} />
                Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
