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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-scale-in">
        {/* Card */}
        <div className="bg-white rounded-card border border-gray-300 shadow-float overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center border-b border-gray-200">
            <div className="w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-5">
              <Home size={26} className="text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Ajman Rental Management</h1>
            <p className="text-gray-600 text-sm mt-1.5">Family Property Management System</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            {!firebaseConfigured && (
              <div className="mb-5 p-4 bg-gray-50 border border-gray-200 rounded-lg flex gap-3">
                <AlertCircle size={18} className="text-primary-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <p className="font-semibold text-gray-900">Demo Mode</p>
                  <p className="mt-1">Sign in with any email and password to preview the app with sample data. Connect Firebase later for real-time sync across phones.</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-5 p-4 bg-primary-50 border border-primary-200 rounded-lg flex gap-3 animate-fade-in">
                <AlertCircle size={18} className="text-primary-700 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-primary-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base"
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

            <p className="mt-6 text-center text-xs text-gray-500">
              Authorized family members only &bull; Ajman, UAE
            </p>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-5">
          &copy; {new Date().getFullYear()} Ajman Rental Management. All rights reserved.
        </p>
      </div>
    </div>
  )
}
