import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { watchCollection, addItem, updateItem, removeItem, isDemoMode } from '../data/db'
import { format, parseISO } from 'date-fns'
import {
  Plus, Search, Edit2, Trash2, MessageCircle, X, Loader2, AlertCircle, Users, Check,
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
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-up"
      style={{ backgroundColor: 'rgba(26,26,29,0.6)', backdropFilter: 'blur(2px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-cream rounded-t-3xl sm:rounded-3xl shadow-premium w-full max-w-md max-h-[94vh] sm:max-h-[92vh] flex flex-col animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 bg-charcoal-900 flex-shrink-0">
          <div>
            <span className="section-label text-primary-400">Tenant</span>
            <h2 className="font-display text-xl text-white leading-tight">
              {initial ? 'Edit Tenant' : 'Add New Tenant'}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close dialog"
            className="p-2.5 -mr-1 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X size={20} />
          </button>
          <span className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-primary-500 via-primary-400 to-transparent" />
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          <form id="tenant-form" onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
            {error && (
              <div className="p-3 bg-rust-50 border border-rust-200 rounded-xl flex gap-2 items-center text-rust-700 text-sm animate-pop">
                <AlertCircle size={15} className="flex-shrink-0" />{error}
              </div>
            )}

            <div>
              <label className="field-label">Full Name *</label>
              <input name="name" value={form.name} onChange={handleChange}
                className="input-field" placeholder="e.g. Ahmed Al Rashidi" required />
            </div>

            <div>
              <label className="field-label">Phone Number</label>
              <input name="phone" value={form.phone} onChange={handleChange}
                className="input-field" placeholder="e.g. 971501234567" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Room Number *</label>
                <input name="unit" value={form.unit} onChange={handleChange}
                  className="input-field" placeholder="e.g. 21" required />
              </div>
              <div>
                <label className="field-label">Rent (AED) *</label>
                <input name="rentAmount" type="number" min="0" value={form.rentAmount}
                  onChange={handleChange} className="input-field tabular" placeholder="e.g. 1500" required />
              </div>
            </div>

            <div>
              <label className="field-label">Property / Villa</label>
              <input name="property" value={form.property} onChange={handleChange}
                className="input-field" placeholder="e.g. Adil Villa 8" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Rent Date</label>
                <input name="rentSchedule" value={form.rentSchedule} onChange={handleChange}
                  className="input-field" placeholder="e.g. 1 To 5" />
              </div>
              <div>
                <label className="field-label">Deposit (AED)</label>
                <input name="deposit" type="number" min="0" value={form.deposit}
                  onChange={handleChange} className="input-field tabular" placeholder="e.g. 1000" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Start Date</label>
                <input name="startDate" type="date" value={form.startDate}
                  onChange={handleChange} className="input-field" />
                <p className="text-[11px] text-gray-400 mt-1">When tenant joined</p>
              </div>
              <div>
                <label className="field-label">Due Date</label>
                <input name="dueDate" type="date" value={form.dueDate}
                  onChange={handleChange} className="input-field" />
              </div>
            </div>
          </form>
        </div>

        {/* Sticky footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-cream flex-shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" form="tenant-form" disabled={saving}
            className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {initial ? 'Update Tenant' : 'Add Tenant'}
          </button>
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
  const [partialId,  setPartialId]  = useState(null)  // tenant.id currently editing partial
  const [partialAmt, setPartialAmt] = useState('')

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

  async function savePartial(tenant) {
    const val = Number(partialAmt)
    if (isNaN(val) || val < 0) return
    const existing = (tenant.partialPayments && typeof tenant.partialPayments === 'object')
      ? tenant.partialPayments : {}
    try {
      await updateItem('tenants', tenant.id, {
        partialPayments: { ...existing, [MONTH]: val },
      })
    } catch (err) {
      setError('Could not save partial payment: ' + err.message)
    }
    setPartialId(null)
    setPartialAmt('')
  }

  async function clearPartial(tenant) {
    const existing = (tenant.partialPayments && typeof tenant.partialPayments === 'object')
      ? tenant.partialPayments : {}
    const updated = { ...existing }
    delete updated[MONTH]
    try {
      await updateItem('tenants', tenant.id, { partialPayments: updated })
    } catch (err) {
      setError('Could not clear partial payment: ' + err.message)
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
    const text = `Dear ${tenant.name}, your rent of AED ${amount} for room ${tenant.unit} is due${dateStr ? ' on ' + dateStr : ''}. Please arrange payment. Thank you, Rehmat Properties.`
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
        <div className="mb-4 p-4 bg-rust-50 border border-rust-200 rounded-xl flex gap-2 items-center text-rust-700 text-sm animate-pop">
          <AlertCircle size={16} />{error}
          <button onClick={() => setError('')} aria-label="Dismiss error" className="ml-auto p-1"><X size={14} /></button>
        </div>
      )}

      {isDemoMode && (
        <div className="mb-6 p-4 bg-primary-50/60 border border-primary-200 rounded-xl flex gap-3">
          <AlertCircle size={18} className="text-primary-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">Demo Mode — changes saved on this device only.</p>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" placeholder="Search by name, room, villa…"
            value={search} onChange={e => setSearch(e.target.value)}
            aria-label="Search tenants"
            className="input-field pl-10" />
        </div>
        <div className="flex gap-2 p-1 bg-white border border-gray-200 rounded-2xl shadow-card">
          {['all', 'paid', 'unpaid'].map(f => (
            <button key={f} onClick={() => setFilterAndUrl(f)}
              aria-pressed={filter === f}
              className={`flex-1 sm:flex-none min-h-[44px] px-4 rounded-xl text-sm font-semibold capitalize transition-all duration-200 ${
                filter === f
                  ? f === 'paid'   ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-charcoal-900 shadow-glow-sm'
                  : f === 'unpaid' ? 'bg-rust-600 text-white shadow-card'
                  :                  'bg-charcoal-900 text-primary-400 shadow-card'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <p className="section-label mb-4">
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
        <div className="card p-12 text-center animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <Users size={30} className="text-primary-400" />
          </div>
          <h3 className="font-display text-lg text-charcoal-900">No tenants found</h3>
          <p className="text-gray-400 text-sm mt-1">
            {search || filter !== 'all'
              ? 'Try adjusting your search or filter.'
              : 'Add your first tenant to get started.'}
          </p>
          {!search && filter === 'all' && (
            <button onClick={openAdd} className="btn-primary mt-5 inline-flex items-center gap-2">
              <Plus size={16} /> Add First Tenant
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
          {filtered.map(tenant => {
            const paidNow    = isPaid(tenant, MONTH)
            const partialPaid = !paidNow ? (tenant.partialPayments?.[MONTH] ?? 0) : 0
            const remaining   = partialPaid > 0 ? Math.max(0, Number(tenant.rentAmount || 0) - partialPaid) : 0
            const pct         = partialPaid > 0 && tenant.rentAmount
              ? Math.min(100, Math.round((partialPaid / Number(tenant.rentAmount)) * 100)) : 0

            let startDateStr = ''
            try { if (tenant.startDate) startDateStr = format(parseISO(tenant.startDate), 'MMM d, yyyy') } catch {}
            let dueDateStr = ''
            try { if (tenant.dueDate) dueDateStr = format(parseISO(tenant.dueDate), 'MMM d, yyyy') } catch {}

            return (
              <div key={tenant.id} className={`card p-5 flex flex-col transition-shadow duration-200 hover:shadow-lg ${partialPaid > 0 && !paidNow ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-cream' : ''}`}>
                {/* Name row */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center text-primary-700 font-display font-bold text-lg flex-shrink-0 shadow-card">
                      {tenant.name?.charAt(0).toUpperCase() || 'T'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold text-charcoal-900 text-[15px] leading-tight truncate">{tenant.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{tenant.phone || 'No phone'}</p>
                    </div>
                  </div>
                  {/* Month status badge */}
                  <span className={`flex-shrink-0 ${
                    paidNow ? 'badge-paid' : partialPaid > 0 ? 'badge-partial' : 'badge-unpaid'
                  }`}>
                    {paidNow ? 'Paid' : partialPaid > 0 ? 'Partial' : 'Unpaid'}
                  </span>
                </div>

                {/* Meta chips */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="chip">Room {tenant.unit || '—'}</span>
                  {tenant.property && <span className="chip">{tenant.property}</span>}
                  {tenant.rentSchedule && <span className="chip">Rent {tenant.rentSchedule}</span>}
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between items-baseline">
                    <span className="text-gray-500">Rent</span>
                    <span className="font-display font-bold text-charcoal-900 tabular text-base">AED {Number(tenant.rentAmount || 0).toLocaleString()}</span>
                  </div>
                  {!!tenant.deposit && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Deposit</span>
                      <span className="font-medium text-gray-900 tabular">AED {Number(tenant.deposit).toLocaleString()}</span>
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

                <div className="mt-auto">
                {/* ── PAID / UNPAID buttons ── */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    onClick={() => togglePaid(tenant, true)}
                    aria-pressed={paidNow}
                    className={`min-h-[44px] rounded-xl text-sm font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-1.5 ${
                      paidNow
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-charcoal-900 shadow-glow-sm'
                        : 'bg-gray-100 text-gray-400 hover:bg-primary-50 hover:text-primary-700'
                    }`}
                  >
                    <Check size={15} /> Paid
                  </button>
                  <button
                    onClick={() => togglePaid(tenant, false)}
                    aria-pressed={!paidNow}
                    className={`min-h-[44px] rounded-xl text-sm font-bold tracking-wide transition-all duration-200 ${
                      !paidNow
                        ? 'bg-rust-600 text-white shadow-card'
                        : 'bg-gray-100 text-gray-400 hover:bg-rust-50 hover:text-rust-600'
                    }`}
                  >
                    Unpaid
                  </button>
                </div>

                {/* ── PARTIAL PAYMENT section ── */}
                {!paidNow && (
                  <div className="mb-3">
                    {partialId === tenant.id ? (
                      /* ── inline edit mode ── */
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 animate-pop">
                        <p className="text-xs font-semibold text-amber-700 mb-2">
                          Partial payment — Rent is AED {Number(tenant.rentAmount || 0).toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 flex-shrink-0">AED</span>
                          <input
                            type="number"
                            min="0"
                            max={tenant.rentAmount}
                            value={partialAmt}
                            onChange={e => setPartialAmt(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') savePartial(tenant)
                              if (e.key === 'Escape') { setPartialId(null); setPartialAmt('') }
                            }}
                            className="input-field py-2 text-sm flex-1 tabular"
                            placeholder="Amount paid"
                            aria-label="Partial amount paid"
                            autoFocus
                          />
                          <button onClick={() => savePartial(tenant)} aria-label="Save partial payment"
                            className="min-w-[40px] min-h-[40px] flex items-center justify-center bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex-shrink-0">
                            <Check size={16} />
                          </button>
                          <button onClick={() => { setPartialId(null); setPartialAmt('') }} aria-label="Cancel partial payment"
                            className="min-w-[40px] min-h-[40px] flex items-center justify-center bg-white text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
                            <X size={16} />
                          </button>
                        </div>
                        {partialAmt && !isNaN(Number(partialAmt)) && Number(partialAmt) > 0 && (
                          <p className="text-xs text-rust-600 font-semibold mt-2 tabular">
                            Remaining: AED {Math.max(0, Number(tenant.rentAmount || 0) - Number(partialAmt)).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ) : partialPaid > 0 ? (
                      /* ── partial amount recorded ── */
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-amber-700 tabular">
                            AED {Number(partialPaid).toLocaleString()} paid
                          </span>
                          <span className="text-xs font-semibold text-rust-600 tabular">
                            AED {Number(remaining).toLocaleString()} remaining
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="h-2 bg-amber-200 rounded-full overflow-hidden mb-2.5">
                          <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => { setPartialId(tenant.id); setPartialAmt(String(partialPaid)) }}
                            className="flex-1 text-xs font-semibold py-2 text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors">
                            Edit Amount
                          </button>
                          <button
                            onClick={() => clearPartial(tenant)}
                            aria-label="Clear partial payment"
                            className="px-3 py-2 text-xs text-gray-400 hover:text-rust-600 hover:bg-rust-50 rounded-lg transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ── no partial recorded yet ── */
                      <button
                        onClick={() => { setPartialId(tenant.id); setPartialAmt('') }}
                        className="w-full min-h-[44px] text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors">
                        ½ Partial Payment
                      </button>
                    )}
                  </div>
                )}

                {/* Action row */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button onClick={() => openEdit(tenant)} aria-label={`Edit ${tenant.name}`}
                    className="flex-1 flex items-center justify-center gap-1.5 min-h-[40px] px-3 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors">
                    <Edit2 size={13} /> Edit
                  </button>
                  <button onClick={() => handleDelete(tenant)} aria-label={`Delete ${tenant.name}`}
                    className="flex-1 flex items-center justify-center gap-1.5 min-h-[40px] px-3 text-xs font-semibold text-rust-700 bg-rust-50 hover:bg-rust-100 rounded-lg transition-colors">
                    <Trash2 size={13} /> Delete
                  </button>
                  {tenant.phone && (
                    <a href={buildWhatsApp(tenant)} target="_blank" rel="noopener noreferrer"
                      aria-label={`Send WhatsApp reminder to ${tenant.name}`}
                      className="flex-1 flex items-center justify-center gap-1.5 min-h-[40px] px-3 text-xs font-semibold text-emerald2-700 bg-emerald2-50 hover:bg-emerald2-100 rounded-lg transition-colors">
                      <MessageCircle size={13} /> WhatsApp
                    </a>
                  )}
                </div>
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
