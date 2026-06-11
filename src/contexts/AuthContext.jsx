import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth, firebaseConfigured } from '../firebase/config'

const ALLOWED_EMAILS = ['abbasrehmat88@gmail.com', 'father@example.com']

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
    if (!firebaseConfigured || !auth) {
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
    if (!firebaseConfigured || !auth) {
      throw new Error('Firebase is not configured. Please add your Firebase credentials to the .env file.')
    }
    if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
      throw new Error('Access denied. Unauthorized user.')
    }
    const result = await signInWithEmailAndPassword(auth, email, password)
    return result
  }

  async function logout() {
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
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
