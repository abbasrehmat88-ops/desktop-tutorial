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
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-700 to-primary-600 px-8 py-8 text-center">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Home size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Ajman Rental Management</h1>
            <p className="text-primary-200 text-sm mt-1">Family Property Management System</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            {!firebaseConfigured && (
              <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
                <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold">Firebase not configured</p>
                  <p className="mt-1">Copy <code className="bg-amber-100 px-1 rounded">.env.example</code> to <code className="bg-amber-100 px-1 rounded">.env</code> and add your Firebase credentials to enable authentication.</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
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
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
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

            <p className="mt-6 text-center text-xs text-gray-400">
              Authorized family members only &bull; Ajman, UAE
            </p>
          </div>
        </div>

        <p className="text-center text-primary-300 text-xs mt-4">
          &copy; {new Date().getFullYear()} Ajman Rental Management. All rights reserved.
        </p>
      </div>
    </div>
  )
}
