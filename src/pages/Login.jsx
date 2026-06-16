import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, AlertCircle, Loader2, Fingerprint, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  // 'form' | 'offer-biometric'
  const [step, setStep]         = useState('form')
  const [pendingEmail, setPendingEmail] = useState('')
  const [pendingPwd,   setPendingPwd]   = useState('')
  const [biometricErr, setBiometricErr] = useState('')

  const {
    login, loginWithPasskey, registerPasskey,
    hasPasskey, biometricSupported, firebaseConfigured,
  } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from     = location.state?.from?.pathname || '/dashboard'

  // ── Email / password login ─────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      if (!hasPasskey && biometricSupported()) {
        setPendingEmail(email)
        setPendingPwd(password)
        setStep('offer-biometric')
      } else {
        navigate(from, { replace: true })
      }
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

  // ── Biometric quick login ──────────────────────────────────────────────────
  async function handleBiometricLogin() {
    setBiometricErr('')
    setLoading(true)
    try {
      await loginWithPasskey()
      navigate(from, { replace: true })
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setBiometricErr('Biometric cancelled. Please try again or use your password below.')
      } else {
        setBiometricErr(err.message || 'Biometric login failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Enable biometric (offer step) ─────────────────────────────────────────
  async function handleEnableBiometric() {
    setBiometricErr('')
    setLoading(true)
    try {
      await registerPasskey(pendingEmail, pendingPwd)
      navigate(from, { replace: true })
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setBiometricErr('Setup cancelled. You can enable it next time you sign in.')
      } else {
        setBiometricErr(err.message || 'Could not set up biometric login.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Shared ambient backdrop for both steps
  const AmbientBackdrop = () => (
    <>
      <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-primary-500/20 blur-[120px] animate-drift" />
      <div className="absolute -bottom-40 -right-32 w-[520px] h-[520px] rounded-full bg-primary-600/15 blur-[140px] animate-drift-slow" />
      <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-charcoal-600/40 blur-[100px] animate-drift-slow" />
      {/* Subtle vignette to deepen the charcoal */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(15,17,24,0.55)_100%)]" />
    </>
  )

  const Footer = () => (
    <p className="text-center text-charcoal-400 text-xs mt-6">
      &copy; {new Date().getFullYear()} Rehmat Properties. All rights reserved.
    </p>
  )

  // ── Offer biometric step ───────────────────────────────────────────────────
  if (step === 'offer-biometric') {
    return (
      <div className="relative min-h-screen bg-charcoal-950 flex items-center justify-center p-4 overflow-hidden">
        <AmbientBackdrop />

        <div className="relative w-full max-w-md animate-scale-in">
          <div className="relative bg-white/[0.06] backdrop-blur-2xl rounded-3xl border border-white/[0.12] shadow-premium overflow-hidden">
            {/* Gold top hairline */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-primary-400/60 to-transparent" />

            <div className="px-8 py-12 text-center">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-3xl bg-primary-400/30 blur-xl" />
                <div className="relative w-20 h-20 bg-gradient-to-br from-primary-300 to-primary-600 rounded-3xl flex items-center justify-center shadow-glow">
                  <Fingerprint size={36} className="text-charcoal-900" />
                </div>
              </div>
              <p className="text-primary-400 text-[11px] uppercase tracking-[0.3em] mb-3">Faster Sign In</p>
              <h2 className="font-display text-2xl text-white mb-2">Enable Quick Access</h2>
              <p className="text-charcoal-300 text-sm leading-relaxed mb-8">
                Use Face ID or Fingerprint to sign in instantly — no password needed next time.
              </p>

              {biometricErr && (
                <div className="mb-5 p-4 bg-rust-600/15 border border-rust-600/30 rounded-2xl flex gap-3 text-left animate-fade-in" role="alert">
                  <AlertCircle size={18} className="text-rust-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-rust-50">{biometricErr}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleEnableBiometric}
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base rounded-2xl"
                >
                  {loading ? (
                    <><Loader2 size={18} className="animate-spin" /> Setting up…</>
                  ) : (
                    <><Fingerprint size={20} /> Enable Face ID / Fingerprint</>
                  )}
                </button>
                <button
                  onClick={() => navigate(from, { replace: true })}
                  disabled={loading}
                  className="w-full min-h-[44px] py-3 text-sm text-charcoal-400 hover:text-charcoal-200 transition-colors rounded-xl"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    )
  }

  // ── Main login form ────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen bg-charcoal-950 flex items-center justify-center p-4 overflow-hidden">
      <AmbientBackdrop />

      <div className="relative w-full max-w-md animate-scale-in">
        {/* Glass card */}
        <div className="relative bg-white/[0.06] backdrop-blur-2xl rounded-3xl border border-white/[0.12] shadow-premium overflow-hidden">
          {/* Gold top hairline */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary-400/60 to-transparent" />

          {/* Header — brand lockup */}
          <div className="px-8 pt-12 pb-8 text-center">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-2xl bg-primary-400/25 blur-lg" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-primary-300 to-primary-600 rounded-2xl flex items-center justify-center shadow-glow rotate-3 hover:rotate-0 transition-transform duration-500">
                <Home size={28} className="text-charcoal-900" />
              </div>
            </div>
            <p className="text-primary-400 text-[11px] uppercase tracking-[0.3em] mb-3">Estate Management</p>
            <h1 className="font-display text-[2rem] leading-tight text-white">Rehmat Properties</h1>
            <span className="mx-auto mt-3 block w-12 h-0.5 rounded-full bg-gradient-to-r from-primary-500 to-primary-300" />
            <p className="text-charcoal-300 text-sm mt-3">Private family property portal</p>
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

            {/* ── Biometric quick-login button (hero action) ── */}
            {hasPasskey && (
              <div className="mb-6">
                {biometricErr && (
                  <div className="mb-3 p-3 bg-rust-600/15 border border-rust-600/30 rounded-xl flex gap-2 animate-fade-in" role="alert">
                    <AlertCircle size={16} className="text-rust-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-rust-50">{biometricErr}</p>
                  </div>
                )}
                <button
                  onClick={handleBiometricLogin}
                  disabled={loading}
                  aria-label="Sign in with Face ID or Fingerprint"
                  className="group relative w-full min-h-[44px] flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-primary-400 to-primary-600 hover:from-primary-300 hover:to-primary-500 text-charcoal-900 font-bold text-base rounded-2xl shadow-glow transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal-900"
                >
                  {loading ? (
                    <Loader2 size={22} className="animate-spin" />
                  ) : (
                    <Fingerprint size={22} />
                  )}
                  {loading ? 'Verifying…' : 'Sign in with Face ID / Fingerprint'}
                </button>

                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-white/[0.1]" />
                  <span className="text-xs text-charcoal-400 uppercase tracking-wider">or use password</span>
                  <div className="flex-1 h-px bg-white/[0.1]" />
                </div>
              </div>
            )}

            {error && (
              <div className="mb-5 p-4 bg-rust-600/15 border border-rust-600/30 rounded-2xl flex gap-3 animate-fade-in" role="alert">
                <AlertCircle size={18} className="text-rust-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-rust-50">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="login-email" className="block text-xs font-semibold uppercase tracking-wider text-charcoal-300 mb-2">
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full min-h-[44px] px-4 py-3.5 bg-white/[0.06] border border-white/[0.12] rounded-xl text-sm text-white placeholder-charcoal-400 transition-all duration-300 focus:outline-none focus:border-primary-500 focus:bg-white/[0.08] focus:shadow-[0_0_0_3px_rgba(201,161,84,0.15)]"
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wider text-charcoal-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full min-h-[44px] px-4 py-3.5 pr-12 bg-white/[0.06] border border-white/[0.12] rounded-xl text-sm text-white placeholder-charcoal-400 transition-all duration-300 focus:outline-none focus:border-primary-500 focus:bg-white/[0.08] focus:shadow-[0_0_0_3px_rgba(201,161,84,0.15)]"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                    aria-pressed={showPwd}
                    className="absolute inset-y-0 right-0 flex items-center justify-center w-11 text-charcoal-400 hover:text-primary-300 transition-colors focus:outline-none focus-visible:text-primary-300 rounded-r-xl"
                  >
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
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

            <p className="mt-7 flex items-center justify-center gap-1.5 text-center text-xs text-charcoal-400">
              <ShieldCheck size={13} className="text-primary-400/80" />
              Authorized family members only &bull; Ajman, UAE
            </p>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  )
}
