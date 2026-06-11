import React, { useState, useEffect } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import {
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Home,
  AlertCircle,
  Loader2,
  X,
  MapPin,
  DollarSign,
  BedDouble,
} from 'lucide-react'

const AREAS = [
  'Al Nuaimia',
  'Al Rashidiya',
  'Al Jurf',
  'Al Hamidiya',
  'Al Tallah',
  'Ajman Downtown',
  'Al Rawda',
  'Al Mowaihat',
  'Al Rumaila',
  'Other',
]

const BEDROOMS = ['Any', 'Studio', '1 BR', '2 BR', '3 BR', '4 BR', '5+ BR', 'Villa']
const PROPERTY_TYPES = ['Any', 'Apartment', 'Villa', 'Townhouse', 'Studio', 'Penthouse']

const EMPTY_SEARCH = { area: '', minPrice: '', maxPrice: '', bedrooms: 'Any', type: 'Any' }
const EMPTY_LISTING = { area: '', price: '', bedrooms: '2 BR', type: 'Apartment', notes: '', contact: '', link: '' }

function buildBayutUrl(filters) {
  const parts = []
  if (filters.area) parts.push(filters.area.toLowerCase().replace(/\s+/g, '-'))
  const typeMap = { Apartment: 'apartments', Villa: 'villas', Townhouse: 'townhouses', Studio: 'studio-for-rent', Penthouse: 'penthouses', Any: '' }
  const type = typeMap[filters.type] || 'properties'
  const bedMap = { Studio: 'studio', '1 BR': '1', '2 BR': '2', '3 BR': '3', '4 BR': '4', '5+ BR': '5', Villa: '', Any: '' }
  const bed = bedMap[filters.bedrooms] || ''

  let url = 'https://www.bayut.com/to-rent/' + (type || 'properties') + '/ajman/'
  if (parts.length) url += parts.join('-') + '/'
  if (bed && bed !== '') url += bed + '-bedroom/'
  if (filters.minPrice || filters.maxPrice) {
    const min = filters.minPrice || '0'
    const max = filters.maxPrice || '999999'
    url += `price-${min}-${max}/`
  }
  return url
}

function buildDubizzleUrl(filters) {
  const params = new URLSearchParams()
  params.set('location', 'ajman')
  if (filters.area) params.set('neighborhood', filters.area)
  if (filters.minPrice) params.set('price__gte', filters.minPrice)
  if (filters.maxPrice) params.set('price__lte', filters.maxPrice)
  const bedMap = { Studio: '0', '1 BR': '1', '2 BR': '2', '3 BR': '3', '4 BR': '4', '5+ BR': '5' }
  if (filters.bedrooms !== 'Any' && bedMap[filters.bedrooms]) params.set('bedrooms', bedMap[filters.bedrooms])
  return `https://uae.dubizzle.com/rentals/?${params.toString()}`
}

function AddListingModal({ open, onClose, onSave, saving }) {
  const [form, setForm] = useState({ ...EMPTY_LISTING })
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) { setForm({ ...EMPTY_LISTING }); setError('') }
  }, [open])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.area.trim()) return setError('Area is required.')
    if (!form.price) return setError('Price is required.')
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save listing.')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Add Manual Listing</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-center text-red-700 text-sm">
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area *</label>
              <select name="area" value={form.area} onChange={handleChange} className="input-field" required>
                <option value="">Select area</option>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price / Year (AED) *</label>
              <input name="price" type="number" min="0" value={form.price} onChange={handleChange} className="input-field" placeholder="e.g. 30000" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
              <select name="bedrooms" value={form.bedrooms} onChange={handleChange} className="input-field">
                {BEDROOMS.filter(b => b !== 'Any').map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select name="type" value={form.type} onChange={handleChange} className="input-field">
                {PROPERTY_TYPES.filter(t => t !== 'Any').map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info</label>
            <input name="contact" value={form.contact} onChange={handleChange} className="input-field" placeholder="Agent name / phone" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Listing URL (optional)</label>
            <input name="link" value={form.link} onChange={handleChange} className="input-field" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className="input-field resize-none" placeholder="Any details about the property..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}
              Add Listing
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Properties() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState({ ...EMPTY_SEARCH })
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (!db) { setLoading(false); return }
    const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setListings(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setError('Failed to load listings.')
        setLoading(false)
      }
    )
    return unsub
  }, [])

  async function handleSave(form) {
    setSaving(true)
    try {
      await addDoc(collection(db, 'properties'), {
        area: form.area.trim(),
        price: Number(form.price),
        bedrooms: form.bedrooms,
        type: form.type,
        contact: form.contact.trim(),
        link: form.link.trim(),
        notes: form.notes.trim(),
        createdAt: serverTimestamp(),
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(listing) {
    if (!window.confirm(`Delete listing in "${listing.area}"?`)) return
    try {
      await deleteDoc(doc(db, 'properties', listing.id))
    } catch (err) {
      setError('Failed to delete: ' + err.message)
    }
  }

  function handleSearchChange(e) {
    const { name, value } = e.target
    setSearch((prev) => ({ ...prev, [name]: value }))
  }

  const filtered = listings.filter((l) => {
    if (search.area && l.area !== search.area) return false
    if (search.minPrice && Number(l.price) < Number(search.minPrice)) return false
    if (search.maxPrice && Number(l.price) > Number(search.maxPrice)) return false
    if (search.bedrooms !== 'Any' && l.bedrooms !== search.bedrooms) return false
    if (search.type !== 'Any' && l.type !== search.type) return false
    return true
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Research</h1>
          <p className="text-gray-500 text-sm mt-0.5">Search for new rental properties in Ajman</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus size={18} />
          Add Manual Listing
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-center text-red-700 text-sm">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Search Panel */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Search size={17} className="text-primary-600" />
          Search Listings Online
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Area</label>
            <select name="area" value={search.area} onChange={handleSearchChange} className="input-field text-sm">
              <option value="">Any Area</option>
              {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Min Price (AED)</label>
            <input name="minPrice" type="number" min="0" value={search.minPrice} onChange={handleSearchChange} className="input-field text-sm" placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Max Price (AED)</label>
            <input name="maxPrice" type="number" min="0" value={search.maxPrice} onChange={handleSearchChange} className="input-field text-sm" placeholder="Any" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Bedrooms</label>
            <select name="bedrooms" value={search.bedrooms} onChange={handleSearchChange} className="input-field text-sm">
              {BEDROOMS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select name="type" value={search.type} onChange={handleSearchChange} className="input-field text-sm">
              {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href={buildBayutUrl(search)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <ExternalLink size={15} />
            Search on Bayut
          </a>
          <a
            href={buildDubizzleUrl(search)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <ExternalLink size={15} />
            Search on Dubizzle
          </a>
          <button
            onClick={() => setSearch({ ...EMPTY_SEARCH })}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <X size={15} />
            Clear
          </button>
        </div>
      </div>

      {/* Manual Listings */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">
          Manual Listings
          <span className="ml-2 text-sm font-normal text-gray-400">
            {filtered.length} of {listings.length}
          </span>
        </h2>
      </div>

      {!db && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
          <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">Firebase not configured. Add your credentials to enable property listings.</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-32 mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Home size={48} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-gray-500 font-medium">No manual listings yet</h3>
          <p className="text-gray-400 text-sm mt-1">
            {listings.length > 0 ? 'No listings match your filters.' : 'Add a property listing manually or search online above.'}
          </p>
          {listings.length === 0 && (
            <button onClick={() => setModalOpen(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus size={16} />
              Add First Listing
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((listing) => (
            <div key={listing.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Home size={17} className="text-primary-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{listing.area}</h3>
                    <p className="text-xs text-gray-500">{listing.type}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(listing)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign size={14} className="text-green-600 flex-shrink-0" />
                  <span className="font-semibold text-gray-900">AED {Number(listing.price || 0).toLocaleString()}</span>
                  <span className="text-gray-400 text-xs">/ year</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <BedDouble size={14} className="text-gray-400 flex-shrink-0" />
                  <span>{listing.bedrooms}</span>
                </div>
                {listing.contact && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{listing.contact}</span>
                  </div>
                )}
                {listing.notes && (
                  <p className="text-xs text-gray-400 line-clamp-2">{listing.notes}</p>
                )}
              </div>

              {listing.link && (
                <a
                  href={listing.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                >
                  <ExternalLink size={13} />
                  View Listing
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <AddListingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  )
}
