import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { watchCollection, addItem, updateItem, removeItem, isDemoMode } from '../data/db'
import { format, parseISO } from 'date-fns'
import {
  Plus, Search, Edit2, Trash2, MessageCircle, X, Loader2, AlertCircle, Users,
} from 'lucide-react'

// ── Per-month helpers ───────────────────────────────────────────────────────
// Payments are stored as a map inside each tenant document:
//   payments: { '2026-06': true, '2026-05': false, ... }
// A month with no entry is treated as UNPAID — so every new month every
// tenant automatically resets to unpaid with zero manual work.

function monthKey(d = new Date()) {
  return format(d, 'yyyy-MM')
}

function monthLabel(d = new Date()) {
  return format(d, 'MMMM yyyy')
}

function isPaid(tenant, key = monthKey()) {
  const p = tenant?.payments
  if (p && typeof p === 'object' && key in p) return !!p[key]
  // Fallback for tenants that only have the old `paid` boolean
  return key === monthKey() ? !!tenant?.paid : false
}

// ── Form helpers ────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '', phone: '', unit: '', property: '',
  rentAmount: '', rentSchedule: '', deposit: '', startDate: '', dueDate: '',
}

function toForm(t) {
  if (!t) return { ...EMPTY_FORM }
  return {
    name:         t.name          || '',
    phone:        t.phone         || '',
    unit:         t.unit  != null ? String(t.unit)  : '',
    property:     t.property      || '',
    rentAmount:   t.rentAmount != null ? String(t.rentAmount) : '',
    rentSchedule: t.rentSchedule  || '',
    deposit:      t.deposit       ? String(t.deposit) : '',
    startDate:    t.startDate     || '',
    dueDate:      t.dueDate       || '',
  }
}

// ── Edit / Add modal ────────────────────────────────────────────────────────

function TenantModal({ open, onClose, onSave, initial, saving }) {
  // ← KEY FIX: initialise useState with the CORRECT values immediately,
  //   not with EMPTY_FORM.  This is the lazy-initialiser form of useState —
  //   it runs once when the component mounts, at which point `initial` is
  //   already the tenant we want to edit (because the parent changes `key`
  //   when switching tenants, forcing a fresh mount with the right props).
  const [form, setForm] = useState(() => toForm(initial))
  const [error, setError] = useState('')

  // Extra safety: if the modal is re-opened (open goes false → true) without
  // the component being re-mounted, re-load the initial values.
  useEffect(() => {
    if (open) {
      setForm(toForm(initial))
      setError('')
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim())    return setError('Name is required.')
    if (!form.unit.trim())    return setError('Room number is required.')
    if (!form.rentAmount || isNaN(Number(form.rentAmount)))
      return setError('Valid rent amount is required.')
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save tenant.')
    }
  }

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {initial ? 'Edit Tenant' : 'Add New Tenant'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-center text-red-700 text-sm">
                <AlertCircle size={15} className="flex-shrink-0" />{error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input name="name" value={form.name} onChange={handleChange}
                className="input-field" placeholder="e.g. Ahmed Al Rashidi" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input name="phone" value={form.phone} onChange={handleChange}
                className="input-field" placeholder="e.g. 971501234567" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Number *</label>
                <input name="unit" value={form.unit} onChange={handleChange}
                  className="input-field" placeholder="e.g. 21" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rent (AED) *</label>
                <input name="rentAmount" type="number" min="0" value={form.rentAmount}
                  onChange={handleChange} className="input-field" placeholder="e.g. 1500" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property / Villa</label>
              <input name="property" value={form.property} onChange={handleChange}
                className="input-field" placeholder="e.g. Adil Villa 8" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rent Date</label>
                <input name="rentSchedule" value={form.rentSchedule} onChange={handleChange}
                  className="input-field" placeholder="e.g. 1 To 5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deposit (AED)</label>
                <input name="deposit" type="number" min="0" value={form.deposit}
                  onChange={handleChange} className="input-field" placeholder="e.g. 1000" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input name="startDate" type="date" value={form.startDate}
                  onChange={handleChange} className="input-field" />
                <p className="text-[11px] text-gray-400 mt-1">When tenant joined</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input name="dueDate" type="date" value={form.dueDate}
                  onChange={handleChange} className="input-field" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                {initial ? 'Update Tenant' : 'Add Tenant'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function Tenants() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tenants, setTenants]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving,  setSaving]    = useState(false)
  const [error,   setError]     = useState('')
  const [search,  setSearch]    = useState('')
  const [filter,  setFilter]    = useState(() => {
    const f = searchParams.get('filter')
    return (f === 'paid' || f === 'unpaid') ? f : 'all'
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [editTenant, setEditTenant] = useState(null)

  function setFilterAndUrl(f) {
    setFilter(f)
    const next = new URLSearchParams(searchParams)
    if (f === 'all') {
      next.delete('filter')
    } else {
      next.set('filter', f)
    }
    setSearchParams(next, { replace: true })
  }

  const MONTH = monthKey()
  const MONTH_LABEL = monthLabel()

  useEffect(() => {
    return watchCollection('tenants', 'createdAt', 'desc',
      data => { setTenants(data); setLoading(false) },
      err  => { console.error(err); setError('Failed to load tenants.'); setLoading(false) }
    )
  }, [])

  const filtered = tenants.filter(t => {
    const q = search.toLowerCase()
    const matchSearch =
      t.name?.toLowerCase().includes(q) ||
      String(t.unit ?? '').toLowerCase().includes(q) ||
      t.property?.toLowerCase().includes(q) ||
      t.phone?.includes(search)
    const paidNow = isPaid(t, MONTH)
    const matchFilter =
      filter === 'paid'   ?  paidNow :
      filter === 'unpaid' ? !paidNow : true
    return matchSearch && matchFilter
  })

  async function handleSave(form) {
    setSaving(true)
    try {
      const payload = {
        name:         form.name.trim(),
        phone:        form.phone.trim(),
        unit:         form.unit.trim(),
        property:     form.property.trim(),
        rentAmount:   Number(form.rentAmount),
        rentSchedule: form.rentSchedule.trim(),
        deposit:      form.deposit ? Number(form.deposit) : 0,
        startDate:    form.startDate || '',
        dueDate:      form.dueDate   || '',
      }
      if (editTenant) {
        await updateItem('tenants', editTenant.id, payload)
      } else {
        await addItem('tenants', { ...payload, payments: {} })
      }
    } finally {
      setSaving(false)
    }
  }

  async function togglePaid(tenant, value) {
    const currentPayments = (tenant.payments && typeof tenant.payments === 'object')
      ? tenant.payments : {}
    try {
      await updateItem('tenants', tenant.id, {
        payments: { ...currentPayments, [MONTH]: value },
        paid: value, // keep old field in sync for Financial fallback
      })
    } catch (err) {
      setError('Could not update payment status: ' + err.message)
    }
  }

  async function handleDelete(tenant) {
    if (!window.confirm(`Delete "${tenant.name}"? This cannot be undone.`)) return
    try { await removeItem('tenants', tenant.id) }
    catch (err) { setError('Failed to delete: ' + err.message) }
  }

  function openEdit(tenant) {
    setEditTenant(tenant)
    setModalOpen(true)
  }
  function openAdd() {
    setEditTenant(null)
    setModalOpen(true)
  }

  function buildWhatsApp(tenant) {
    const phone = (tenant.phone || '').replace(/\D/g, '')
    const amount = Number(tenant.rentAmount || 0).toLocaleString()
    const dateStr = tenant.rentSchedule
      ? `the ${tenant.rentSchedule} of this month`
      : tenant.dueDate ? format(parseISO(tenant.dueDate), 'MMMM d, yyyy') : ''
    const text = `Dear ${tenant.name}, your rent of AED ${amount} for room ${tenant.unit} is due${dateStr ? ' on ' + dateStr : ''}. Please arrange payment. Thank you, Ajman Rentals.`
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  }

  const paidCount   = tenants.filter(t =>  isPaid(t, MONTH)).length
  const unpaidCount = tenants.filter(t => !isPaid(t, MONTH)).length

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Tenants</h1>
          <span className="gold-rule" />
          <p className="text-gray-500 text-sm mt-1">
            {MONTH_LABEL} — <span className="text-emerald2-600 font-semibold">{paidCount} paid</span>
            {' · '}
            <span className="text-rust-600 font-semibold">{unpaidCount} unpaid</span>
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <Plus size={18} /> Add Tenant
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-center text-red-700 text-sm">
          <AlertCircle size={16} />{error}
          <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {isDemoMode && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg flex gap-3">
          <AlertCircle size={18} className="text-primary-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">Demo Mode — changes saved on this device only.</p>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name, room, villa…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pl-9" />
        </div>
        <div className="flex gap-2">
          {['all', 'paid', 'unpaid'].map(f => (
            <button key={f} onClick={() => setFilterAndUrl(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all duration-200 ${
                filter === f
                  ? f === 'paid'   ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-charcoal-900 shadow-glow'
                  : f === 'unpaid' ? 'bg-rust-600 text-white'
                  :                  'bg-charcoal-900 text-primary-400'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-4">
        Showing {filtered.length} of {tenants.length} tenants
      </p>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32" />
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
            {search || filter !== 'all'
              ? 'Try adjusting your search or filter.'
              : 'Add your first tenant to get started.'}
          </p>
          {!search && filter === 'all' && (
            <button onClick={openAdd} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus size={16} /> Add First Tenant
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
          {filtered.map(tenant => {
            const paidNow = isPaid(tenant, MONTH)
            let startDateStr = ''
            try { if (tenant.startDate) startDateStr = format(parseISO(tenant.startDate), 'MMM d, yyyy') } catch {}
            let dueDateStr = ''
            try { if (tenant.dueDate) dueDateStr = format(parseISO(tenant.dueDate), 'MMM d, yyyy') } catch {}

            return (
              <div key={tenant.id} className="card p-5">
                {/* Name row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-base flex-shrink-0">
                      {tenant.name?.charAt(0).toUpperCase() || 'T'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight">{tenant.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{tenant.phone || 'No phone'}</p>
                    </div>
                  </div>
                  {/* Month label badge */}
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    paidNow
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-rust-50 text-rust-600'
                  }`}>
                    {paidNow ? 'Paid' : 'Unpaid'}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1.5 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Room</span>
                    <span className="font-medium text-gray-900">{tenant.unit || '—'}</span>
                  </div>
                  {tenant.property && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Villa</span>
                      <span className="font-medium text-gray-900 text-right max-w-[55%] leading-tight">{tenant.property}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rent</span>
                    <span className="font-semibold text-gray-900">AED {Number(tenant.rentAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rent Date</span>
                    <span className="font-semibold text-primary-700">{tenant.rentSchedule || '—'}</span>
                  </div>
                  {!!tenant.deposit && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Deposit</span>
                      <span className="font-medium text-gray-900">AED {Number(tenant.deposit).toLocaleString()}</span>
                    </div>
                  )}
                  {startDateStr && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Since</span>
                      <span className="font-medium text-gray-900">{startDateStr}</span>
                    </div>
                  )}
                  {dueDateStr && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Due</span>
                      <span className="font-medium text-gray-900">{dueDateStr}</span>
                    </div>
                  )}
                </div>

                {/* ── PAID / UNPAID buttons ── */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() => togglePaid(tenant, true)}
                    className={`py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 ${
                      paidNow
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-charcoal-900 shadow-glow'
                        : 'bg-gray-100 text-gray-400 hover:bg-primary-50 hover:text-primary-700'
                    }`}
                  >
                    ✓ Paid
                  </button>
                  <button
                    onClick={() => togglePaid(tenant, false)}
                    className={`py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 ${
                      !paidNow
                        ? 'bg-rust-600 text-white'
                        : 'bg-gray-100 text-gray-400 hover:bg-rust-50 hover:text-rust-600'
                    }`}
                  >
                    Unpaid
                  </button>
                </div>

                {/* Action row */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button onClick={() => openEdit(tenant)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors">
                    <Edit2 size={13} /> Edit
                  </button>
                  <button onClick={() => handleDelete(tenant)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                    <Trash2 size={13} /> Delete
                  </button>
                  {tenant.phone && (
                    <a href={buildWhatsApp(tenant)} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                      <MessageCircle size={13} /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal — key forces a fresh mount (and fresh useState) for each tenant */}
      <TenantModal
        key={editTenant ? editTenant.id : '__new__'}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTenant(null) }}
        onSave={handleSave}
        initial={editTenant}
        saving={saving}
      />
    </div>
  )
}
