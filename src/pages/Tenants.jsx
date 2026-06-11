import React, { useState, useEffect } from 'react'
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
import { db } from '../firebase/config'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  MessageCircle,
  X,
  Loader2,
  AlertCircle,
  Users,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

const EMPTY_FORM = {
  name: '',
  phone: '',
  unit: '',
  rentAmount: '',
  dueDate: '',
  paid: false,
}

function TenantModal({ open, onClose, onSave, initial, loading }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...initial } : { ...EMPTY_FORM })
      setError('')
    }
  }, [open, initial])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('Name is required.')
    if (!form.unit.trim()) return setError('Unit number is required.')
    if (!form.rentAmount || isNaN(Number(form.rentAmount))) return setError('Valid rent amount is required.')
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save tenant.')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {initial ? 'Edit Tenant' : 'Add New Tenant'}
          </h2>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g. Ahmed Al Rashidi"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g. 971501234567"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number *</label>
              <input
                name="unit"
                value={form.unit}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. A-101"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rent Amount (AED) *</label>
              <input
                name="rentAmount"
                type="number"
                min="0"
                value={form.rentAmount}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. 3500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              name="dueDate"
              type="date"
              value={form.dueDate}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <input
              id="paid-toggle"
              name="paid"
              type="checkbox"
              checked={form.paid}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="paid-toggle" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
              Mark as Paid
            </label>
            {form.paid && (
              <span className="ml-auto badge-paid">Paid</span>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {initial ? 'Update Tenant' : 'Add Tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Tenants() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTenant, setEditTenant] = useState(null)

  useEffect(() => {
    if (!db) {
      setLoading(false)
      return
    }
    const q = query(collection(db, 'tenants'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTenants(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setError('Failed to load tenants.')
        setLoading(false)
      }
    )
    return unsub
  }, [])

  const filtered = tenants.filter((t) => {
    const matchSearch =
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.unit?.toLowerCase().includes(search.toLowerCase()) ||
      t.phone?.includes(search)
    const matchFilter =
      filter === 'all' ? true : filter === 'paid' ? t.paid : !t.paid
    return matchSearch && matchFilter
  })

  async function handleSave(form) {
    setSaving(true)
    try {
      if (editTenant) {
        const ref = doc(db, 'tenants', editTenant.id)
        await updateDoc(ref, {
          name: form.name.trim(),
          phone: form.phone.trim(),
          unit: form.unit.trim(),
          rentAmount: Number(form.rentAmount),
          dueDate: form.dueDate,
          paid: form.paid,
          updatedAt: serverTimestamp(),
        })
      } else {
        await addDoc(collection(db, 'tenants'), {
          name: form.name.trim(),
          phone: form.phone.trim(),
          unit: form.unit.trim(),
          rentAmount: Number(form.rentAmount),
          dueDate: form.dueDate,
          paid: form.paid,
          createdAt: serverTimestamp(),
        })
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(tenant) {
    if (!window.confirm(`Delete tenant "${tenant.name}"? This cannot be undone.`)) return
    try {
      await deleteDoc(doc(db, 'tenants', tenant.id))
    } catch (err) {
      setError('Failed to delete tenant: ' + err.message)
    }
  }

  function openEdit(tenant) {
    setEditTenant(tenant)
    setModalOpen(true)
  }

  function openAdd() {
    setEditTenant(null)
    setModalOpen(true)
  }

  function buildWhatsAppUrl(tenant) {
    const phone = (tenant.phone || '').replace(/\D/g, '')
    const amount = Number(tenant.rentAmount || 0).toLocaleString()
    const unit = tenant.unit || ''
    const name = tenant.name || ''
    let dateStr = 'N/A'
    try {
      if (tenant.dueDate) dateStr = format(parseISO(tenant.dueDate), 'MMMM d, yyyy')
    } catch {}
    const text = `Dear ${name}, your rent of AED ${amount} for unit ${unit} is due on ${dateStr}. Please arrange payment. Thank you, Ajman Rentals.`
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage all your rental tenants</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <Plus size={18} />
          Add Tenant
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-center text-red-700 text-sm">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {!db && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
          <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">Firebase not configured. Add your credentials to <code className="bg-amber-100 px-1 rounded">.env</code> to enable data storage.</p>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, unit, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'paid', 'unpaid'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-gray-500 mb-4">
        Showing {filtered.length} of {tenants.length} tenants
      </p>

      {/* Tenants Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-1.5" />
                  <div className="h-3 bg-gray-200 rounded w-20" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Users size={48} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-gray-500 font-medium">No tenants found</h3>
          <p className="text-gray-400 text-sm mt-1">
            {search || filter !== 'all' ? 'Try adjusting your search or filter.' : 'Add your first tenant to get started.'}
          </p>
          {!search && filter === 'all' && (
            <button onClick={openAdd} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus size={16} />
              Add First Tenant
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((tenant) => {
            let dueDateDisplay = 'Not set'
            try {
              if (tenant.dueDate) dueDateDisplay = format(parseISO(tenant.dueDate), 'MMM d, yyyy')
            } catch {}
            return (
              <div key={tenant.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-base flex-shrink-0">
                      {tenant.name?.charAt(0).toUpperCase() || 'T'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{tenant.name}</h3>
                      <p className="text-xs text-gray-500">{tenant.phone || 'No phone'}</p>
                    </div>
                  </div>
                  <span className={tenant.paid ? 'badge-paid' : 'badge-unpaid'}>
                    {tenant.paid ? 'Paid' : 'Unpaid'}
                  </span>
                </div>

                <div className="space-y-1.5 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Unit</span>
                    <span className="font-medium text-gray-900">{tenant.unit || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rent</span>
                    <span className="font-medium text-gray-900">AED {Number(tenant.rentAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Due Date</span>
                    <span className="font-medium text-gray-900">{dueDateDisplay}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => openEdit(tenant)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                  >
                    <Edit2 size={13} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(tenant)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                  {tenant.phone && (
                    <a
                      href={buildWhatsAppUrl(tenant)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                    >
                      <MessageCircle size={13} />
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <TenantModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditTenant(null)
        }}
        onSave={handleSave}
        initial={editTenant}
        loading={saving}
      />
    </div>
  )
}
