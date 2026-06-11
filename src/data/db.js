// Unified data layer.
// If Firebase is configured (real .env credentials present) it uses Firestore
// with real-time cross-device sync. Otherwise it falls back to a local
// "Demo Mode" backed by the browser's localStorage so the app is fully
// usable as a prototype on a single device with zero setup.

import { db, firebaseConfigured } from '../firebase/config'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore'

export const isDemoMode = !firebaseConfigured || !db

const PREFIX = 'ajman_'
const SEED_FLAG = 'ajman_seeded_v1'

// ---- local store helpers -------------------------------------------------

const listeners = {} // { collectionName: Set<{cb, field, dir}> }

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function readLocal(name) {
  try {
    return JSON.parse(localStorage.getItem(PREFIX + name) || '[]')
  } catch {
    return []
  }
}

function writeLocal(name, items) {
  localStorage.setItem(PREFIX + name, JSON.stringify(items))
  notify(name)
}

function sortItems(items, field, dir) {
  return [...items].sort((a, b) => {
    const av = a[field] ?? ''
    const bv = b[field] ?? ''
    if (av < bv) return dir === 'desc' ? 1 : -1
    if (av > bv) return dir === 'desc' ? -1 : 1
    return 0
  })
}

function notify(name) {
  const cbs = listeners[name]
  if (!cbs) return
  const items = readLocal(name)
  cbs.forEach((entry) => entry.cb(sortItems(items, entry.field, entry.dir)))
}

// Keep tabs on the same device in sync via the storage event.
if (typeof window !== 'undefined' && isDemoMode) {
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith(PREFIX)) {
      notify(e.key.slice(PREFIX.length))
    }
  })
}

// ---- public API ----------------------------------------------------------

export function watchCollection(name, orderField, orderDir, onData, onError) {
  if (!isDemoMode) {
    const q = query(collection(db, name), orderBy(orderField, orderDir))
    return onSnapshot(
      q,
      (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      onError
    )
  }

  // Demo mode
  const entry = { cb: onData, field: orderField, dir: orderDir }
  if (!listeners[name]) listeners[name] = new Set()
  listeners[name].add(entry)
  onData(sortItems(readLocal(name), orderField, orderDir))
  return () => listeners[name].delete(entry)
}

export async function addItem(name, data) {
  if (!isDemoMode) {
    return addDoc(collection(db, name), { ...data, createdAt: serverTimestamp() })
  }
  const items = readLocal(name)
  const newItem = { id: genId(), ...data, createdAt: Date.now() }
  writeLocal(name, [...items, newItem])
  return newItem
}

export async function updateItem(name, id, data) {
  if (!isDemoMode) {
    return updateDoc(doc(db, name, id), { ...data, updatedAt: serverTimestamp() })
  }
  const items = readLocal(name).map((it) =>
    it.id === id ? { ...it, ...data, updatedAt: Date.now() } : it
  )
  writeLocal(name, items)
}

export async function removeItem(name, id) {
  if (!isDemoMode) {
    return deleteDoc(doc(db, name, id))
  }
  writeLocal(name, readLocal(name).filter((it) => it.id !== id))
}

// ---- demo seed data ------------------------------------------------------

function isoOffset(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function seedDemoDataIfEmpty() {
  if (!isDemoMode) return
  if (localStorage.getItem(SEED_FLAG)) return

  const now = Date.now()

  const tenants = [
    { id: genId(), name: 'Ahmed Al Rashidi', phone: '971501234567', unit: 'A-101', rentAmount: 3500, dueDate: isoOffset(5), paid: false, createdAt: now - 5000 },
    { id: genId(), name: 'Fatima Hassan', phone: '971502345678', unit: 'A-102', rentAmount: 4000, dueDate: isoOffset(-2), paid: true, createdAt: now - 4000 },
    { id: genId(), name: 'Mohammed Saleh', phone: '971503456789', unit: 'B-201', rentAmount: 3000, dueDate: isoOffset(12), paid: false, createdAt: now - 3000 },
    { id: genId(), name: 'Sara Khan', phone: '971504567890', unit: 'B-202', rentAmount: 4500, dueDate: isoOffset(20), paid: true, createdAt: now - 2000 },
  ]

  const reminders = [
    { id: genId(), title: 'DEWA Electricity Bill', type: 'Bill', dueDate: isoOffset(4), amount: 850, notes: 'Building A common area', tenantName: '', tenantPhone: '', remindTenant: false, createdAt: now - 3000 },
    { id: genId(), title: 'Bank Loan Installment', type: 'Loan', dueDate: isoOffset(9), amount: 5200, notes: 'Monthly mortgage payment', tenantName: '', tenantPhone: '', remindTenant: false, createdAt: now - 2000 },
    { id: genId(), title: 'Unit A-102 Contract Renewal', type: 'Renewal', dueDate: isoOffset(25), amount: null, notes: 'Fatima Hassan lease renewal', tenantName: 'Fatima Hassan', tenantPhone: '971502345678', remindTenant: true, createdAt: now - 1000 },
  ]

  const properties = [
    { id: genId(), area: 'Al Nuaimia', price: 32000, bedrooms: '2 BR', type: 'Apartment', contact: 'Agent: 971509998877', link: '', notes: 'Spacious, near corniche, good for families', createdAt: now - 1000 },
  ]

  localStorage.setItem(PREFIX + 'tenants', JSON.stringify(tenants))
  localStorage.setItem(PREFIX + 'reminders', JSON.stringify(reminders))
  localStorage.setItem(PREFIX + 'properties', JSON.stringify(properties))
  localStorage.setItem(SEED_FLAG, '1')
}
