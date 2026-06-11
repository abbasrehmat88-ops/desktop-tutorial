import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { firebaseConfig as fileConfig, allowedEmails as fileAllowedEmails } from './firebaseCredentials'

// Environment variables (if provided at build time) take priority over the
// committed credentials file. This keeps local/CI overrides possible while
// letting the simple "paste into firebaseCredentials.js" flow just work.
const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Merge: use an env value when present, otherwise fall back to the file value.
const firebaseConfig = Object.fromEntries(
  Object.keys(fileConfig).map((key) => [key, envConfig[key] || fileConfig[key]])
)

// Considered "configured" only when every value is filled in with something
// real — i.e. no leftover "PASTE_..." placeholders and nothing empty.
function isRealValue(v) {
  return typeof v === 'string' && v.length > 0 && !v.includes('PASTE_')
}

export const firebaseConfigured = Object.values(firebaseConfig).every(isRealValue)

// Emails permitted to sign in (also drops any unfilled placeholder).
export const allowedEmails = fileAllowedEmails
  .map((e) => e.trim().toLowerCase())
  .filter((e) => e && !e.includes('paste_'))

let app = null
let auth = null
let db = null

if (firebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
  } catch (error) {
    console.error('Firebase initialization error:', error)
  }
}

export { auth, db }
export default app
