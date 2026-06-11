import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth, firebaseConfigured } from '../firebase/config'
import { isDemoMode, seedDemoDataIfEmpty } from '../data/db'

const ALLOWED_EMAILS = ['abbasrehmat88@gmail.com', 'father@example.com']
const DEMO_SESSION_KEY = 'ajman_demo_user'

const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Demo mode: restore any saved local session, no Firebase needed.
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
        // Signed in but not allowed — sign them out
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

    // Demo mode: accept any email + any non-empty password, persist locally.
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

  const value = {
    currentUser,
    login,
    logout,
    loading,
    firebaseConfigured,
    isDemoMode,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
