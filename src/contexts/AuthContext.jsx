import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth, firebaseConfigured, allowedEmails } from '../firebase/config'
import { isDemoMode, seedDemoDataIfEmpty } from '../data/db'

const ALLOWED_EMAILS = allowedEmails
const DEMO_SESSION_KEY = 'ajman_demo_user'
const PASSKEY_KEY = 'ajman_passkey_v1'

const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasPasskey, setHasPasskey] = useState(() =>
    !!(typeof window !== 'undefined' && window.PublicKeyCredential && localStorage.getItem(PASSKEY_KEY))
  )

  useEffect(() => {
    if (isDemoMode) {
      seedDemoDataIfEmpty()
      const saved = localStorage.getItem(DEMO_SESSION_KEY)
      if (saved) setCurrentUser({ email: saved, demo: true })
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && ALLOWED_EMAILS.includes(user.email?.toLowerCase())) {
        setCurrentUser(user)
      } else if (user) {
        signOut(auth)
        setCurrentUser(null)
      } else {
        setCurrentUser(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function login(email, password) {
    const normalized = email.trim().toLowerCase()

    if (isDemoMode) {
      if (!password) throw new Error('Please enter a password.')
      localStorage.setItem(DEMO_SESSION_KEY, normalized)
      setCurrentUser({ email: normalized, demo: true })
      return { user: { email: normalized } }
    }

    if (!ALLOWED_EMAILS.includes(normalized)) {
      throw new Error('Access denied. Unauthorized user.')
    }
    return signInWithEmailAndPassword(auth, normalized, password)
  }

  async function logout() {
    if (isDemoMode) {
      localStorage.removeItem(DEMO_SESSION_KEY)
      setCurrentUser(null)
      return
    }
    if (!auth) return
    await signOut(auth)
    setCurrentUser(null)
  }

  // ── Biometric / Passkey ────────────────────────────────────────────────────

  function biometricSupported() {
    return !!(typeof window !== 'undefined' && window.PublicKeyCredential && navigator.credentials)
  }

  async function registerPasskey(email, password) {
    if (!biometricSupported()) {
      throw new Error('Face ID / Fingerprint is not supported on this device or browser.')
    }

    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'Ajman Rentals',
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(email),
          name: email,
          displayName: 'Ajman Family',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
      },
    })

    const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
    const pwBytes = new TextEncoder().encode(password)
    const pwB64 = btoa(String.fromCharCode(...pwBytes))

    localStorage.setItem(PASSKEY_KEY, JSON.stringify({ credentialId, email, pw: pwB64 }))
    setHasPasskey(true)
  }

  async function loginWithPasskey() {
    if (!biometricSupported()) {
      throw new Error('Face ID / Fingerprint is not supported on this device or browser.')
    }

    const stored = localStorage.getItem(PASSKEY_KEY)
    if (!stored) throw new Error('No biometric registered. Please sign in with your password first.')

    const { credentialId, email, pw } = JSON.parse(stored)

    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)

    const rawId = Uint8Array.from(atob(credentialId), c => c.charCodeAt(0))

    await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ type: 'public-key', id: rawId, transports: ['internal'] }],
        userVerification: 'required',
        timeout: 60000,
      },
    })

    const pwBytes = Uint8Array.from(atob(pw), c => c.charCodeAt(0))
    const password = new TextDecoder().decode(pwBytes)
    return login(email, password)
  }

  function clearPasskey() {
    localStorage.removeItem(PASSKEY_KEY)
    setHasPasskey(false)
  }

  const value = {
    currentUser,
    login,
    logout,
    loading,
    firebaseConfigured,
    isDemoMode,
    hasPasskey,
    biometricSupported,
    registerPasskey,
    loginWithPasskey,
    clearPasskey,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
