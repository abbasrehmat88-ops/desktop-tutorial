import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { watchCollection, addItem, updateItem, removeItem } from '../data/db'
import { format, addMonths } from 'date-fns'
import {
  Building2, Plus, Edit2, Trash2, Mail, Check, X,
  Loader2, AlertCircle, ChevronDown, ChevronUp,
  Bell, CreditCard, Banknote, Search, Users,
  ChevronLeft, ChevronRight, Phone, StickyNote,
  Calendar, Wallet, Upload,
} from 'lucide-react'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

// ── Due-date helpers ────────────────────────────────────────────────────────

function monthKey(d = new Date()) {
  return format(d, 'yyyy-MM')
}

function isPaid(owner, key = monthKey()) {
  const p = owner?.payments
  if (p && typeof p === 'object' && key in p) return !!p[key]
  return false
}

function getNextDueDate(dueDay) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), Number(dueDay))
  return thisMonth >= today ? thisMonth : addMonths(thisMonth, 1)
}

function daysUntil(dueDay) {
  if (!dueDay) return null
  const next = getNextDueDate(dueDay)
  const today = new Date(); today.setHours(0,0,0,0)
  return Math.round((next - today) / 86400000)
}

function dueDateLabel(dueDay) {
  if (!dueDay) return '—'
  const d = daysUntil(dueDay)
  if (d === 0) return 'Due TODAY'
  if (d === 1) return 'Due TOMORROW'
  if (d <= 7)  return `Due in ${d} days`
  const next = getNextDueDate(dueDay)
  return format(next, 'MMM d')
}

// ── Reminder email (opens Gmail with pre-filled draft) ──────────────────────

function buildReminderMailto(owner) {
  const next = owner.dueDay ? getNextDueDate(owner.dueDay) : null
  const dueDateStr = next ? format(next, 'MMMM d, yyyy') : 'upcoming date'
  const method = owner.paymentMethod === 'check'
    ? `Cheque${owner.bankName ? ` (${owner.bankName})` : ''}${owner.checkDetails ? ' — ' + owner.checkDetails : ''}`
    : 'Cash'

  const subject = `Rent Payment Reminder — ${owner.property || owner.name}`
  const body = [
    `This is a reminder that rent payment is due soon:`,
    ``,
    `Owner      : ${owner.name}`,
    `Property   : ${owner.property || '—'}`,
    `Amount     : AED ${Number(owner.rentAmount || 0).toLocaleString()}`,
    `Due Date   : ${dueDateStr}`,
    `Payment    : ${method}`,
    owner.phone ? `Phone      : ${owner.phone}` : '',
    owner.notes ? `Notes      : ${owner.notes}` : '',
    ``,
    `Rehmat Properties`,
  ].filter(l => l !== undefined).join('\n')

  return `mailto:abbasrehmat88@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

// ── Form helpers ────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '', property: '', phone: '',
  rentAmount: '', dueDay: '',
  paymentMethod: 'cash', bankName: '', checkDetails: '',
  notes: '',
}

function toForm(o) {
  if (!o) return { ...EMPTY_FORM }
  return {
    name:          o.name          || '',
    property:      o.property      || '',
    phone:         o.phone         || '',
    rentAmount:    o.rentAmount != null ? String(o.rentAmount) : '',
    dueDay:        o.dueDay        ? String(o.dueDay) : '',
    paymentMethod: o.paymentMethod || 'cash',
    bankName:      o.bankName      || '',
    checkDetails:  o.checkDetails  || '',
    notes:         o.notes         || '',
  }
}

// ── Add / Edit modal ────────────────────────────────────────────────────────

function OwnerModal({ open, onClose, onSave, initial, saving }) {
  const [form, setForm] = useState(() => toForm(initial))
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) { setForm(toForm(initial)); setError('') }
  }, [open]) // eslint-disable-line

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim())    return setError('Owner name is required.')
    if (!form.rentAmount || isNaN(Number(form.rentAmount)))
      return setError('Valid rent amount is required.')
    if (form.dueDay && (Number(form.dueDay) < 1 || Number(form.dueDay) > 28))
      return setError('Due day must be between 1 and 28.')
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save.')
    }
  }

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
    >
      <div className="bg-white rounded-card shadow-premium w-full max-w-md max-h-[92vh] flex flex-col animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-charcoal-900 flex items-center justify-center flex-shrink-0">
              <Building2 size={18} className="text-primary-400" />
            </div>
            <h2 className="font-display text-xl text-charcoal-900">
              {initial ? 'Edit Owner' : 'Add Owner'}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close dialog"
            className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {error && (
              <div className="p-3 bg-rust-50 border border-rust-100 rounded-xl flex gap-2 items-center text-rust-700 text-sm">
                <AlertCircle size={15} className="flex-shrink-0" />{error}
              </div>
            )}

            <div>
              <label className="field-label">Owner Name *</label>
              <input name="name" value={form.name} onChange={handleChange}
                className="input-field" placeholder="e.g. Ahmad Al Mazrouei" required />
            </div>

            <div>
              <label className="field-label">Property / Villa</label>
              <input name="property" value={form.property} onChange={handleChange}
                className="input-field" placeholder="e.g. Adil Villa 8" />
            </div>

            <div>
              <label className="field-label">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange}
                className="input-field" placeholder="e.g. 971501234567" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Rent Amount (AED) *</label>
                <input name="rentAmount" type="number" min="0" value={form.rentAmount}
                  onChange={handleChange} className="input-field tabular" placeholder="e.g. 5000" required />
              </div>
              <div>
                <label className="field-label">Due Day of Month</label>
                <input name="dueDay" type="number" min="1" max="28" value={form.dueDay}
                  onChange={handleChange} className="input-field tabular" placeholder="e.g. 15" />
                <p className="text-[11px] text-gray-400 mt-1">Day 1–28 each month</p>
              </div>
            </div>

            {/* Payment method */}
            <div>
              <label className="field-label">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {['cash', 'check'].map(m => (
                  <button key={m} type="button"
                    onClick={() => setForm(prev => ({ ...prev, paymentMethod: m }))}
                    className={`flex items-center justify-center gap-2 min-h-[44px] rounded-xl text-sm font-semibold border-2 transition-all duration-200 capitalize ${
                      form.paymentMethod === m
                        ? m === 'cash'
                          ? 'border-emerald2-500 bg-emerald2-50 text-emerald2-700'
                          : 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}>
                    {m === 'cash' ? <Banknote size={15} /> : <CreditCard size={15} />}
                    {m === 'cash' ? 'Cash' : 'Cheque'}
                  </button>
                ))}
              </div>
            </div>

            {form.paymentMethod === 'check' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Bank Name</label>
                  <input name="bankName" value={form.bankName} onChange={handleChange}
                    className="input-field" placeholder="e.g. Emirates NBD" />
                </div>
                <div>
                  <label className="field-label">Cheque Details</label>
                  <input name="checkDetails" value={form.checkDetails} onChange={handleChange}
                    className="input-field" placeholder="e.g. #001234" />
                </div>
              </div>
            )}

            <div>
              <label className="field-label">Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange}
                className="input-field resize-none" rows={2} placeholder="Any additional notes…" />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving}
                className="btn-primary flex-1">
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                {initial ? 'Update Owner' : 'Add Owner'}
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

export default function Owners() {
  const [owners, setOwners]   = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [search,  setSearch]  = useState('')
  const [tab, setTab]         = useState('owners') // 'owners' | 'yearly'
  const [yearlyYear, setYearlyYear] = useState(new Date().getFullYear())
  const [expandedMonth, setExpandedMonth] = useState(null)
  const [modalOpen, setModalOpen]   = useState(false)
  const [editOwner, setEditOwner]   = useState(null)
  const [bulkOpen, setBulkOpen]     = useState(false)
  const [bulkText, setBulkText]     = useState('')
  const [bulkPreview, setBulkPreview] = useState(null)
  const [bulkSaving, setBulkSaving]   = useState(false)

  const MONTH = monthKey()

  useEffect(() => {
    return watchCollection('owners', 'createdAt', 'desc',
      data => { setOwners(data); setLoading(false) },
      err  => { console.error(err); setError('Failed to load owners.'); setLoading(false) }
    )
  }, [])

  const upcoming = owners.filter(o => {
    if (!o.dueDay) return false
    const d = daysUntil(o.dueDay)
    return d !== null && d <= 7 && !isPaid(o, MONTH)
  }).sort((a, b) => daysUntil(a.dueDay) - daysUntil(b.dueDay))

  const displayed = owners.filter(o => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      o.name?.toLowerCase().includes(q) ||
      o.property?.toLowerCase().includes(q) ||
      o.phone?.includes(search)
    )
  })

  const totalMonthly = owners.reduce((s, o) => s + Number(o.rentAmount || 0), 0)
  const paidCount    = owners.filter(o =>  isPaid(o, MONTH)).length
  const unpaidCount  = owners.filter(o => !isPaid(o, MONTH)).length

  async function handleSave(form) {
    setSaving(true)
    try {
      const payload = {
        name:          form.name.trim(),
        property:      form.property.trim(),
        phone:         form.phone.trim(),
        rentAmount:    Number(form.rentAmount),
        dueDay:        form.dueDay ? Number(form.dueDay) : null,
        paymentMethod: form.paymentMethod,
        bankName:      form.bankName.trim(),
        checkDetails:  form.checkDetails.trim(),
        notes:         form.notes.trim(),
      }
      if (editOwner) {
        await updateItem('owners', editOwner.id, payload)
      } else {
        await addItem('owners', { ...payload, payments: {} })
      }
    } finally {
      setSaving(false)
    }
  }

  async function togglePaid(owner, value) {
    const currentPayments = (owner.payments && typeof owner.payments === 'object')
      ? owner.payments : {}
    try {
      await updateItem('owners', owner.id, {
        payments: { ...currentPayments, [MONTH]: value },
      })
    } catch (err) {
      setError('Could not update: ' + err.message)
    }
  }

  async function handleDelete(owner) {
    if (!window.confirm(`Delete owner "${owner.name}"? This cannot be undone.`)) return
    try { await removeItem('owners', owner.id) }
    catch (err) { setError('Failed to delete: ' + err.message) }
  }

  // ── Bulk import ──────────────────────────────────────────────────────────

  function parseBulk() {
    setError('')
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean)
    const results = []
    const errors  = []

    for (const line of lines) {
      // Accept comma or pipe separated:
      // Name, Property, Amount, DueDay, cash/check, BankName, CheckDetails
      const parts = line.split(/[,|]/).map(p => p.trim())
      if (parts.length < 3) { errors.push(`Skipped: "${line}" (need at least Name, Property, Amount)`); continue }

      const [name, property, amountStr, dueDayStr, methodStr, bankName, checkDetails] = parts
      const rentAmount = Number(amountStr)
      const dueDay     = dueDayStr ? Number(dueDayStr) : null

      if (!name) { errors.push(`Skipped: "${line}" (no name)`); continue }
      if (isNaN(rentAmount)) { errors.push(`Skipped: "${line}" (invalid amount)`); continue }

      const paymentMethod = (methodStr || '').toLowerCase().includes('check') ? 'check' : 'cash'

      results.push({
        name: name.trim(),
        property: (property || '').trim(),
        rentAmount,
        dueDay: dueDay && dueDay >= 1 && dueDay <= 28 ? dueDay : null,
        paymentMethod,
        bankName: (bankName || '').trim(),
        checkDetails: (checkDetails || '').trim(),
        phone: '', notes: '', payments: {},
      })
    }

    setBulkPreview({ results, errors })
  }

  async function applyBulk() {
    if (!bulkPreview?.results?.length) return
    setBulkSaving(true)
    setError('')
    try {
      for (const owner of bulkPreview.results) {
        await addItem('owners', owner)
      }
      setBulkPreview(null)
      setBulkText('')
      setBulkOpen(false)
    } catch (e) {
      setError('Bulk import failed: ' + e.message)
    } finally {
      setBulkSaving(false)
    }
  }

  const MONTH_LABEL = format(new Date(), 'MMMM yyyy')

  // ── Yearly tab data ─────────────────────────────────────────────────────────
  const yearlyRows = MONTH_NAMES.map((name, idx) => {
    const key = `${yearlyYear}-${String(idx + 1).padStart(2, '0')}`
    const totalAmt  = owners.reduce((s, o) => s + Number(o.rentAmount || 0), 0)
    const paidAmt   = owners.filter(o => isPaid(o, key)).reduce((s, o) => s + Number(o.rentAmount || 0), 0)
    const paidOwners   = owners.filter(o => isPaid(o, key))
    const unpaidOwners = owners.filter(o => !isPaid(o, key))
    const pct = totalAmt > 0 ? Math.round((paidAmt / totalAmt) * 100) : 0
    const isCurrentMonth = key === MONTH
    const isPast = new Date(yearlyYear, idx, 1) < new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    return { name, key, totalAmt, paidAmt, pct, paidOwners, unpaidOwners, isCurrentMonth, isPast }
  })
  const yearlyTotalExpected    = owners.reduce((s, o) => s + Number(o.rentAmount || 0), 0) * 12
  const yearlyTotalPaid        = yearlyRows.reduce((s, r) => s + r.paidAmt, 0)
  const yearlyTotalPaidMonths  = yearlyRows.reduce((s, r) => s + r.paidOwners.length, 0)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Owners</h1>
          <span className="gold-rule" />
          <p className="text-gray-500 text-sm mt-2">
            {MONTH_LABEL} — <span className="text-emerald2-600 font-semibold tabular">{paidCount} paid</span>
            {' · '}
            <span className="text-rust-600 font-semibold tabular">{unpaidCount} unpaid</span>
          </p>
        </div>
        <button onClick={() => { setEditOwner(null); setModalOpen(true) }}
          className="btn-primary self-start sm:self-auto">
          <Plus size={18} /> Add Owner
        </button>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-2 mb-6">
        {[{id:'owners',label:'Owners'},{id:'yearly',label:'Yearly Schedule'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`px-6 min-h-[44px] rounded-full text-sm font-semibold transition-all duration-300 ${
              tab === t.id
                ? 'bg-charcoal-900 text-primary-400 shadow-card'
                : 'bg-white text-gray-600 border border-gray-300 hover:border-primary-500 hover:text-primary-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-rust-50 border border-rust-100 rounded-xl flex gap-2 items-center text-rust-700 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />{error}
          <button onClick={() => setError('')} aria-label="Dismiss error"
            className="ml-auto w-11 h-11 flex items-center justify-center rounded-lg hover:bg-rust-100 transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── YEARLY SCHEDULE TAB ── */}
      {tab === 'yearly' && (
        <div>
          {/* Year selector */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button onClick={() => setYearlyYear(y => y - 1)} aria-label="Previous year"
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-gray-200 hover:border-primary-400 transition-colors">
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
            <span className="font-display text-3xl font-bold text-charcoal-900 min-w-[5rem] text-center tabular">{yearlyYear}</span>
            <button onClick={() => setYearlyYear(y => y + 1)} aria-label="Next year"
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-gray-200 hover:border-primary-400 transition-colors">
              <ChevronRight size={18} className="text-gray-600" />
            </button>
          </div>

          {/* Summary cards */}
          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 stagger">
              <div className="stat-card">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-charcoal-900 flex items-center justify-center flex-shrink-0">
                    <Building2 size={22} className="text-primary-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="section-label">Total Expected</p>
                    <p className="font-display text-2xl font-bold text-charcoal-900 mt-1 tabular leading-tight">AED {yearlyTotalExpected.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{yearlyYear} annual outgoing</p>
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald2-50 flex items-center justify-center flex-shrink-0">
                    <Check size={22} className="text-emerald2-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="section-label">Total Paid Months</p>
                    <p className="font-display text-2xl font-bold text-charcoal-900 mt-1 tabular leading-tight">{yearlyTotalPaidMonths}</p>
                    <p className="text-xs text-gray-400 mt-0.5">of {owners.length * 12} owner-months</p>
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rust-50 flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={22} className="text-rust-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="section-label">Outstanding</p>
                    <p className="font-display text-2xl font-bold text-charcoal-900 mt-1 tabular leading-tight">AED {(yearlyTotalExpected - yearlyTotalPaid).toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Remaining to pay</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 12-month grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(12)].map((_,i) => <div key={i} className="card !p-4 skeleton h-28" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 stagger">
              {yearlyRows.map((row) => {
                const isExpanded = expandedMonth === row.key
                const allPaid    = row.pct === 100 && owners.length > 0
                const hasIssue   = row.isPast && row.pct < 100 && owners.length > 0

                return (
                  <div key={row.key}
                    className={`card overflow-hidden cursor-pointer transition-all duration-200 ${
                      row.isCurrentMonth ? 'ring-2 ring-primary-400' :
                      allPaid ? 'ring-1 ring-emerald2-300' :
                      hasIssue ? 'ring-1 ring-rust-300' : ''
                    }`}
                    onClick={() => setExpandedMonth(isExpanded ? null : row.key)}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-display font-semibold text-sm text-charcoal-900">{row.name}</span>
                        {allPaid
                          ? <Check size={16} className="text-emerald2-600" />
                          : hasIssue
                            ? <AlertCircle size={16} className="text-rust-500" />
                            : row.isCurrentMonth
                              ? <Bell size={16} className="text-primary-500" />
                              : null
                        }
                      </div>
                      <p className="font-display text-lg font-bold text-charcoal-900 tabular">
                        AED {row.totalAmt.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 tabular">
                        {row.paidOwners.length} paid · {row.unpaidOwners.length} unpaid
                      </p>
                      {/* Progress bar */}
                      <div className="mt-2.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            allPaid ? 'bg-emerald2-500' :
                            hasIssue ? 'bg-rust-500' : 'bg-primary-500'
                          }`}
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1 text-right tabular">{row.pct}%</p>
                    </div>

                    {/* Expanded owner list */}
                    {isExpanded && owners.length > 0 && (
                      <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-1.5">
                        {owners.map(o => {
                          const paid = isPaid(o, row.key)
                          return (
                            <div key={o.id} className="flex items-center justify-between text-sm">
                              <div className="min-w-0">
                                <span className="font-medium text-gray-900 truncate block">{o.name}</span>
                                <span className="text-xs text-gray-400">{o.property}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                <span className="text-xs font-semibold text-gray-700 tabular">
                                  AED {Number(o.rentAmount || 0).toLocaleString()}
                                </span>
                                <span className={paid ? 'badge-paid' : 'badge-unpaid'}>
                                  {paid ? <Check size={11} /> : <X size={11} />}
                                  {paid ? 'Paid' : 'Unpaid'}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── OWNERS TAB (existing content wrapped) ── */}
      {tab === 'owners' && <>

      {/* ── Upcoming reminders ── */}
      {upcoming.length > 0 && (
        <div className="mb-6 card !p-0 border-l-4 border-l-rust-500 overflow-hidden">
          <div className="px-5 py-4 bg-rust-50/60">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-rust-100 flex items-center justify-center flex-shrink-0">
                <Bell size={16} className="text-rust-600" />
              </div>
              <h2 className="font-display text-base text-rust-700 font-semibold">
                Payments Due Within 7 Days
              </h2>
            </div>
            <div className="space-y-2 stagger">
              {upcoming.map(owner => {
                const d = daysUntil(owner.dueDay)
                const next = getNextDueDate(owner.dueDay)
                return (
                  <div key={owner.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white rounded-xl px-4 py-3 border border-rust-100">
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full tabular ${
                        d === 0 ? 'bg-rust-100 text-rust-700' :
                        d <= 3  ? 'bg-rust-100 text-rust-700' :
                                  'bg-amber-100 text-amber-700'
                      }`}>
                        <AlertCircle size={11} />
                        {d === 0 ? 'TODAY' : d === 1 ? 'TOMORROW' : `${d} DAYS`}
                      </span>
                      <span className="font-semibold text-gray-900 text-sm">{owner.name}</span>
                      <span className="text-gray-500 text-sm">{owner.property}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold text-charcoal-900 tabular">
                        AED {Number(owner.rentAmount || 0).toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-400 tabular">
                        {format(next, 'MMM d')} · {owner.paymentMethod === 'check'
                          ? `Cheque${owner.bankName ? ' · ' + owner.bankName : ''}`
                          : 'Cash'}
                      </span>
                      <a href={buildReminderMailto(owner)}
                        className="inline-flex items-center gap-1.5 min-h-[44px] px-4 text-xs font-semibold bg-rust-600 text-white rounded-xl hover:bg-rust-700 transition-colors">
                        <Mail size={13} /> Send Email
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 stagger">
          <div className="stat-card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-charcoal-900 flex items-center justify-center flex-shrink-0">
                <Building2 size={22} className="text-primary-400" />
              </div>
              <div className="min-w-0">
                <p className="section-label">Total Owners</p>
                <p className="font-display text-2xl font-bold text-charcoal-900 mt-1 tabular leading-tight">{owners.length}</p>
                <p className="text-xs text-gray-400 mt-0.5">Property owners</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                <Banknote size={22} className="text-primary-600" />
              </div>
              <div className="min-w-0">
                <p className="section-label">Monthly Outgoing</p>
                <p className="font-display text-2xl font-bold text-charcoal-900 mt-1 tabular leading-tight">AED {totalMonthly.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-0.5">Total rent payable</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Bell size={22} className="text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="section-label">Due This Week</p>
                <p className="font-display text-2xl font-bold text-charcoal-900 mt-1 tabular leading-tight">{upcoming.length}</p>
                <p className="text-xs text-gray-400 mt-0.5">Payments in next 7 days</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk import ── */}
      <div className="card !p-0 mb-6 overflow-hidden">
        <button
          onClick={() => setBulkOpen(o => !o)}
          className="w-full flex items-center justify-between gap-3 px-6 py-4 min-h-[44px] hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <Upload size={18} className="text-primary-600" />
            </div>
            <div>
              <h2 className="font-display text-lg text-charcoal-900">Bulk Import Owners</h2>
              <p className="text-sm text-gray-500 mt-0.5">Paste multiple owners at once from a spreadsheet</p>
            </div>
          </div>
          {bulkOpen ? <ChevronUp size={18} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />}
        </button>

        {bulkOpen && (
          <div className="px-6 pb-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 mt-4 mb-2">
              One owner per line — comma separated:
            </p>
            <code className="block text-xs bg-gray-100 rounded-lg px-3 py-2 mb-3 text-gray-600">
              Name, Property, Amount, DueDay, cash/check, BankName<br/>
              Ahmad Al Mazrouei, Villa 8, 5000, 15, check, Emirates NBD<br/>
              Salem Al Rashidi, Villa 12, 3500, 1, cash
            </code>
            <textarea
              value={bulkText}
              onChange={e => { setBulkText(e.target.value); setBulkPreview(null) }}
              rows={8}
              className="input-field font-mono text-sm resize-y"
              placeholder="Paste owner data here…"
            />
            <button onClick={parseBulk} className="btn-secondary mt-3">
              Preview Import
            </button>

            {bulkPreview && (
              <div className="mt-4 space-y-3">
                {bulkPreview.errors?.length > 0 && (
                  <div className="p-3 bg-rust-50 border border-rust-100 rounded-xl text-sm text-rust-700">
                    <p className="font-semibold mb-1">Skipped lines:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {bulkPreview.errors.map((x, i) => <li key={i}>{x}</li>)}
                    </ul>
                  </div>
                )}
                {bulkPreview.results.length > 0 && (
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Owner</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Property</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Due</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Method</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {bulkPreview.results.map((o, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2 font-medium text-charcoal-900">{o.name}</td>
                            <td className="px-4 py-2 text-gray-600">{o.property || '—'}</td>
                            <td className="px-4 py-2 font-semibold text-emerald2-600 tabular">AED {o.rentAmount.toLocaleString()}</td>
                            <td className="px-4 py-2 text-gray-500 tabular">{o.dueDay ? `Day ${o.dueDay}` : '—'}</td>
                            <td className="px-4 py-2 capitalize text-gray-600">
                              {o.paymentMethod === 'check' ? `Cheque${o.bankName ? ' · ' + o.bankName : ''}` : 'Cash'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                      <span className="text-sm text-gray-600"><span className="tabular font-semibold">{bulkPreview.results.length}</span> owners will be added</span>
                      <button onClick={applyBulk} disabled={bulkSaving} className="btn-primary">
                        {bulkSaving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                        Import All
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Owners list ── */}
      <div className="mb-4 relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input type="text" placeholder="Search owner, property…"
          value={search} onChange={e => setSearch(e.target.value)}
          aria-label="Search owners"
          className="input-field pl-10" />
      </div>

      <p className="section-label mb-4">
        Showing <span className="tabular">{displayed.length}</span> of <span className="tabular">{owners.length}</span> owners
      </p>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card !p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 skeleton rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 skeleton w-32" />
                  <div className="h-3 skeleton w-20" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 skeleton w-full" />
                <div className="h-3 skeleton w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="card !p-12 text-center animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <Users size={30} className="text-primary-500" />
          </div>
          <h3 className="font-display text-xl text-charcoal-900">No owners found</h3>
          <p className="text-gray-500 text-sm mt-1.5">
            {search ? 'Try adjusting your search.' : 'Add your first property owner to get started.'}
          </p>
          {!search && (
            <button onClick={() => { setEditOwner(null); setModalOpen(true) }}
              className="btn-primary mt-5">
              <Plus size={16} /> Add First Owner
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
          {displayed.map(owner => {
            const paidNow = isPaid(owner, MONTH)
            const days = owner.dueDay ? daysUntil(owner.dueDay) : null
            const isUrgent = days !== null && days <= 7 && !paidNow

            return (
              <div key={owner.id} className={`card !p-5 transition-shadow duration-200 hover:shadow-lg ${isUrgent ? 'ring-2 ring-rust-400 ring-offset-1' : ''}`}>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-display font-bold text-base flex-shrink-0 ${
                      owner.paymentMethod === 'check'
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-emerald2-50 text-emerald2-700'
                    }`}>
                      {owner.name?.charAt(0).toUpperCase() || 'O'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">{owner.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{owner.property || 'No property'}</p>
                    </div>
                  </div>
                  <span className={`flex-shrink-0 ${paidNow ? 'badge-paid' : 'badge-unpaid'}`}>
                    {paidNow ? <Check size={11} /> : <X size={11} />}
                    {paidNow ? 'Paid' : 'Unpaid'}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1.5 mb-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 flex items-center gap-1.5"><Wallet size={13} className="text-gray-400" /> Rent</span>
                    <span className="font-semibold text-gray-900 tabular">AED {Number(owner.rentAmount || 0).toLocaleString()}</span>
                  </div>
                  {owner.dueDay && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 flex items-center gap-1.5"><Calendar size={13} className="text-gray-400" /> Due</span>
                      <span className={`font-semibold flex items-center gap-1 ${isUrgent ? 'text-rust-600' : 'text-primary-700'}`}>
                        {isUrgent && <AlertCircle size={13} />}{dueDateLabel(owner.dueDay)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      {owner.paymentMethod === 'check'
                        ? <CreditCard size={13} className="text-gray-400" />
                        : <Banknote size={13} className="text-gray-400" />} Payment
                    </span>
                    <span className="font-medium text-gray-900 flex items-center gap-1">
                      {owner.paymentMethod === 'check'
                        ? <><CreditCard size={12} className="text-primary-500" /> Cheque</>
                        : <><Banknote size={12} className="text-emerald2-600" /> Cash</>
                      }
                    </span>
                  </div>
                  {owner.bankName && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 flex items-center gap-1.5"><Building2 size={13} className="text-gray-400" /> Bank</span>
                      <span className="font-medium text-gray-900">{owner.bankName}</span>
                    </div>
                  )}
                  {owner.checkDetails && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 flex items-center gap-1.5"><CreditCard size={13} className="text-gray-400" /> Cheque</span>
                      <span className="font-medium text-gray-900">{owner.checkDetails}</span>
                    </div>
                  )}
                  {owner.phone && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 flex items-center gap-1.5"><Phone size={13} className="text-gray-400" /> Phone</span>
                      <span className="font-medium text-gray-900 tabular">{owner.phone}</span>
                    </div>
                  )}
                  {owner.notes && (
                    <div className="pt-1 flex gap-1.5">
                      <StickyNote size={13} className="text-gray-300 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-400 italic leading-relaxed">{owner.notes}</p>
                    </div>
                  )}
                </div>

                {/* Paid / Unpaid buttons */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() => togglePaid(owner, true)}
                    aria-label="Mark as paid"
                    aria-pressed={paidNow}
                    className={`min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 ${
                      paidNow
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-charcoal-900 shadow-glow'
                        : 'bg-gray-100 text-gray-400 hover:bg-primary-50 hover:text-primary-700'
                    }`}
                  >
                    <Check size={15} /> Paid
                  </button>
                  <button
                    onClick={() => togglePaid(owner, false)}
                    aria-label="Mark as unpaid"
                    aria-pressed={!paidNow}
                    className={`min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 ${
                      !paidNow
                        ? 'bg-rust-600 text-white'
                        : 'bg-gray-100 text-gray-400 hover:bg-rust-50 hover:text-rust-600'
                    }`}
                  >
                    <X size={15} /> Unpaid
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button onClick={() => { setEditOwner(owner); setModalOpen(true) }}
                    aria-label={`Edit ${owner.name}`}
                    className="flex-1 flex items-center justify-center gap-1.5 min-h-[44px] px-3 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors">
                    <Edit2 size={13} /> Edit
                  </button>
                  <a href={buildReminderMailto(owner)}
                    aria-label={`Email reminder to ${owner.name}`}
                    className="flex-1 flex items-center justify-center gap-1.5 min-h-[44px] px-3 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors">
                    <Mail size={13} /> Email
                  </a>
                  <button onClick={() => handleDelete(owner)}
                    aria-label={`Delete ${owner.name}`}
                    className="flex-1 flex items-center justify-center gap-1.5 min-h-[44px] px-3 text-xs font-medium text-rust-700 bg-rust-50 hover:bg-rust-100 rounded-xl transition-colors">
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      </> /* end owners tab */}

      <OwnerModal
        key={editOwner ? editOwner.id : '__new__'}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditOwner(null) }}
        onSave={handleSave}
        initial={editOwner}
        saving={saving}
      />
    </div>
  )
}
