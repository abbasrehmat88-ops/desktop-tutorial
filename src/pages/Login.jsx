import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, firebaseConfigured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err.message || 'Failed to sign in.'
      if (msg.includes('Access denied')) {
        setError('Access denied. You are not authorized to use this system.')
      } else if (msg.includes('not configured')) {
        setError(msg)
      } else if (
        msg.includes('wrong-password') ||
        msg.includes('user-not-found') ||
        msg.includes('invalid-credential')
      ) {
        setError('Invalid email or password. Please try again.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-charcoal-900 flex items-center justify-center p-4 overflow-hidden">
      {/* Drifting ambient gradient orbs */}
      <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-primary-500/20 blur-[120px] animate-drift" />
      <div className="absolute -bottom-40 -right-32 w-[520px] h-[520px] rounded-full bg-primary-600/15 blur-[140px] animate-drift-slow" />
      <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-charcoal-600/40 blur-[100px] animate-drift-slow" />

      <div className="relative w-full max-w-md animate-scale-in">
        {/* Glass card */}
        <div className="bg-white/[0.06] backdrop-blur-2xl rounded-3xl border border-white/[0.12] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-12 pb-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow rotate-3 hover:rotate-0 transition-transform duration-500">
              <Home size={28} className="text-charcoal-900" />
            </div>
            <p className="text-primary-400 text-[11px] uppercase tracking-[0.3em] mb-3">Estate Management</p>
            <h1 className="font-display text-3xl text-white">Ajman Rentals</h1>
            <p className="text-charcoal-300 text-sm mt-2">Private family property portal</p>
          </div>

          {/* Form */}
          <div className="px-8 pb-10">
            {!firebaseConfigured && (
              <div className="mb-5 p-4 bg-white/[0.05] border border-white/[0.1] rounded-2xl flex gap-3">
                <AlertCircle size={18} className="text-primary-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-charcoal-200">
                  <p className="font-semibold text-white">Demo Mode</p>
                  <p className="mt-1 text-charcoal-300">Sign in with any email and password to preview the app with sample data.</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-5 p-4 bg-rust-600/15 border border-rust-600/30 rounded-2xl flex gap-3 animate-fade-in">
                <AlertCircle size={18} className="text-rust-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-rust-50">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white/[0.06] border border-white/[0.12] rounded-xl text-sm text-white placeholder-charcoal-400 transition-all duration-300 focus:outline-none focus:border-primary-500 focus:bg-white/[0.08] focus:shadow-[0_0_0_3px_rgba(201,161,84,0.15)]"
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white/[0.06] border border-white/[0.12] rounded-xl text-sm text-white placeholder-charcoal-400 transition-all duration-300 focus:outline-none focus:border-primary-500 focus:bg-white/[0.08] focus:shadow-[0_0_0_3px_rgba(201,161,84,0.15)]"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base rounded-xl"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <p className="mt-7 text-center text-xs text-charcoal-400">
              Authorized family members only &bull; Ajman, UAE
            </p>
          </div>
        </div>

        <p className="text-center text-charcoal-400 text-xs mt-6">
          &copy; {new Date().getFullYear()} Ajman Rental Management. All rights reserved.
        </p>
      </div>
    </div>
  )
}
