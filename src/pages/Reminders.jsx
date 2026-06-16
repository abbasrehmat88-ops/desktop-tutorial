import React, { useState, useEffect } from 'react'
import { watchCollection, addItem, updateItem, removeItem, isDemoMode } from '../data/db'
import {
  Bell,
  Plus,
  Edit2,
  Trash2,
  MessageCircle,
  Mail,
  X,
  AlertCircle,
  Loader2,
  Clock,
} from 'lucide-react'
import { format, parseISO, differenceInDays, isAfter, startOfDay } from 'date-fns'

const REMINDER_TYPES = ['Bill', 'Loan', 'Renewal', 'Other']

const EMPTY_FORM = {
  title: '',
  type: 'Bill',
  dueDate: '',
  amount: '',
  notes: '',
  tenantName: '',
}

function ReminderModal({ open, onClose, onSave, initial, loading }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...initial } : { ...EMPTY_FORM })
      setError('')
    }
  }, [open, initial])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) return setError('Title is required.')
    if (!form.dueDate) return setError('Due date is required.')
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save reminder.')
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,17,24,0.55)' }}
      role="dialog"
      aria-modal="true"
      aria-label={initial ? 'Edit reminder' : 'Add reminder'}
    >
      <div className="bg-white rounded-3xl shadow-premium w-full max-w-md max-h-[92vh] flex flex-col animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <p className="section-label">Reminders</p>
            <h2 className="font-display text-xl text-charcoal-900 leading-tight">
              {initial ? 'Edit Reminder' : 'Add Reminder'}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="p-3 bg-rust-50 border border-rust-100 rounded-xl flex gap-2 items-center text-rust-700 text-sm">
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label htmlFor="rem-title" className="field-label">Title *</label>
            <input
              id="rem-title"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g. DEWA Bill Payment"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="rem-type" className="field-label">Type *</label>
              <select
                id="rem-type"
                name="type"
                value={form.type}
                onChange={handleChange}
                className="input-field"
              >
                {REMINDER_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="rem-due" className="field-label">Due Date *</label>
              <input
                id="rem-due"
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={handleChange}
                className="input-field tabular-nums"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="rem-amount" className="field-label">Amount (AED)</label>
              <input
                id="rem-amount"
                name="amount"
                type="number"
                min="0"
                value={form.amount}
                onChange={handleChange}
                className="input-field tabular-nums"
                placeholder="e.g. 500"
              />
            </div>
            <div>
              <label htmlFor="rem-tenant" className="field-label">Tenant Name</label>
              <input
                id="rem-tenant"
                name="tenantName"
                value={form.tenantName}
                onChange={handleChange}
                className="input-field"
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label htmlFor="rem-notes" className="field-label">Notes</label>
            <textarea
              id="rem-notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="input-field resize-none"
              rows={3}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {initial ? 'Update Reminder' : 'Add Reminder'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}

function getDaysRemaining(dueDate) {
  if (!dueDate) return null
  try {
    const due = startOfDay(parseISO(dueDate))
    const today = startOfDay(new Date())
    return differenceInDays(due, today)
  } catch {
    return null
  }
}

function DaysBadge({ days }) {
  if (days === null) return null
  const base = 'inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ring-1 tabular-nums'
  if (days < 0) {
    return <span className={`${base} bg-gray-100 text-gray-500 ring-gray-200`}>Overdue</span>
  }
  if (days === 0) {
    return <span className={`${base} bg-rust-50 text-rust-600 ring-rust-100`}>Due Today</span>
  }
  if (days <= 2) {
    return <span className={`${base} bg-rust-50 text-rust-600 ring-rust-100`}>{days}d left</span>
  }
  if (days <= 7) {
    return <span className={`${base} bg-primary-50 text-primary-700 ring-primary-100`}>{days}d left</span>
  }
  if (days <= 14) {
    return <span className={`${base} bg-primary-50 text-primary-700 ring-primary-100`}>{days}d left</span>
  }
  return <span className={`${base} bg-emerald2-50 text-emerald2-600 ring-emerald2-100`}>{days}d left</span>
}

const TYPE_COLORS = {
  Bill: 'bg-charcoal-900 text-primary-300',
  Loan: 'bg-primary-50 text-primary-700 ring-1 ring-primary-100',
  Renewal: 'bg-rust-50 text-rust-600 ring-1 ring-rust-100',
  Other: 'bg-gray-100 text-charcoal-600',
}

export default function Reminders() {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editReminder, setEditReminder] = useState(null)

  useEffect(() => {
    return watchCollection(
      'reminders',
      'dueDate',
      'asc',
      (data) => {
        setReminders(data)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setError('Failed to load reminders.')
        setLoading(false)
      }
    )
  }, [])

  const dueWithin7 = reminders.filter((r) => {
    const days = getDaysRemaining(r.dueDate)
    return days !== null && days >= 0 && days <= 7
  })

  async function handleSave(form) {
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        type: form.type,
        dueDate: form.dueDate,
        amount: form.amount ? Number(form.amount) : null,
        notes: form.notes.trim(),
        tenantName: form.tenantName.trim(),
      }
      if (editReminder) {
        await updateItem('reminders', editReminder.id, payload)
      } else {
        await addItem('reminders', payload)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(reminder) {
    if (!window.confirm(`Delete reminder "${reminder.title}"?`)) return
    try {
      await removeItem('reminders', reminder.id)
    } catch (err) {
      setError('Failed to delete: ' + err.message)
    }
  }

  function buildWhatsAppUrl(reminder) {
    const text = `Reminder: ${reminder.title}${reminder.amount ? ` — AED ${Number(reminder.amount).toLocaleString()}` : ''}. Due: ${reminder.dueDate ? format(parseISO(reminder.dueDate), 'MMMM d, yyyy') : 'N/A'}. ${reminder.notes || ''}`
    return `https://wa.me/971544069110?text=${encodeURIComponent(text.trim())}`
  }

  function buildEmailUrl(reminder) {
    const subject = `Reminder: ${reminder.title}`
    const body = `Reminder: ${reminder.title}\nType: ${reminder.type}\nDue Date: ${reminder.dueDate ? format(parseISO(reminder.dueDate), 'MMMM d, yyyy') : 'N/A'}${reminder.amount ? `\nAmount: AED ${Number(reminder.amount).toLocaleString()}` : ''}${reminder.tenantName ? `\nTenant: ${reminder.tenantName}` : ''}${reminder.notes ? `\n\nNotes: ${reminder.notes}` : ''}`
    return `mailto:Abbasrehmat88@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Reminders</h1><span className="gold-rule" />
          <p className="text-gray-500 text-sm mt-0.5">Track bills, loans, and renewal deadlines</p>
        </div>
        <button onClick={() => { setEditReminder(null); setModalOpen(true) }} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <Plus size={18} />
          Add Reminder
        </button>
      </div>

      {/* Alert banner */}
      {dueWithin7.length > 0 && (
        <div className="mb-6 card border-l-4 border-l-rust-500 p-4 bg-rust-50/50 flex gap-3 items-start">
          <span className="w-9 h-9 rounded-xl bg-rust-100 flex items-center justify-center flex-shrink-0">
            <Bell size={18} className="text-rust-600" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-base text-rust-700 leading-tight">
              {dueWithin7.length} reminder{dueWithin7.length > 1 ? 's' : ''} due within 7 days
            </p>
            <p className="text-xs text-rust-600/90 mt-1 leading-relaxed">
              {dueWithin7.map((r) => r.title).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-rust-50 border border-rust-100 rounded-xl flex gap-2 items-center text-rust-700 text-sm">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError('')} aria-label="Dismiss error" className="ml-auto p-1 hover:bg-rust-100 rounded-lg"><X size={14} /></button>
        </div>
      )}

      {isDemoMode && (
        <div className="mb-6 p-4 bg-primary-50/60 border border-primary-100 rounded-xl flex gap-3 items-center">
          <AlertCircle size={18} className="text-primary-600 flex-shrink-0" />
          <p className="text-sm text-charcoal-700">Demo Mode — reminders are saved on this device only.</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5">
              <div className="skeleton h-5 w-3/4 mb-3" />
              <div className="skeleton h-4 w-1/2 mb-2" />
              <div className="skeleton h-4 w-full" />
            </div>
          ))}
        </div>
      ) : reminders.length === 0 ? (
        <div className="card p-12 text-center animate-fade-up">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 ring-1 ring-primary-100 flex items-center justify-center mx-auto mb-4">
            <Bell size={30} className="text-primary-500" />
          </div>
          <h3 className="font-display text-xl text-charcoal-900">No reminders yet</h3>
          <p className="text-gray-500 text-sm mt-1.5 max-w-xs mx-auto">Add reminders for bills, loans, or lease renewals to stay ahead of every deadline.</p>
          <button
            onClick={() => { setEditReminder(null); setModalOpen(true) }}
            className="btn-primary mt-5 inline-flex"
          >
            <Plus size={16} />
            Add First Reminder
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
          {reminders.map((r) => {
            const days = getDaysRemaining(r.dueDate)
            const isUrgent = days !== null && days >= 0 && days <= 2
            let dueDateDisplay = '—'
            try {
              if (r.dueDate) dueDateDisplay = format(parseISO(r.dueDate), 'MMM d, yyyy')
            } catch {}

            return (
              <div key={r.id} className={`card p-5 flex flex-col hover:-translate-y-1 ${isUrgent ? 'ring-1 ring-rust-200' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-base text-charcoal-900 leading-snug truncate">{r.title}</h3>
                    {r.tenantName && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">Tenant: {r.tenantName}</p>
                    )}
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ${TYPE_COLORS[r.type] || TYPE_COLORS.Other}`}>
                    {r.type}
                  </span>
                </div>

                <div className="space-y-2 mb-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <Clock size={13} className="text-primary-600" />
                      Due Date
                    </span>
                    <span className="font-semibold text-charcoal-900 tabular-nums">{dueDateDisplay}</span>
                  </div>
                  {r.amount && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Amount</span>
                      <span className="font-semibold text-charcoal-900 tabular-nums">AED {Number(r.amount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center pt-0.5">
                    <DaysBadge days={days} />
                  </div>
                </div>

                {r.notes && (
                  <p className="text-xs text-charcoal-600 bg-gray-50 ring-1 ring-gray-100 rounded-xl p-2.5 mb-3 line-clamp-2">{r.notes}</p>
                )}

                <div className="flex flex-wrap gap-2 pt-3 mt-auto border-t border-gray-100">
                  <button
                    onClick={() => { setEditReminder(r); setModalOpen(true) }}
                    aria-label={`Edit reminder ${r.title}`}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                  >
                    <Edit2 size={13} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(r)}
                    aria-label={`Delete reminder ${r.title}`}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rust-600 bg-rust-50 hover:bg-rust-100 rounded-lg transition-colors"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                  <a
                    href={buildWhatsAppUrl(r)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Send WhatsApp for ${r.title}`}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald2-700 bg-emerald2-50 hover:bg-emerald2-100 rounded-lg transition-colors"
                  >
                    <MessageCircle size={13} />
                    WhatsApp Us
                  </a>
                  <a
                    href={buildEmailUrl(r)}
                    aria-label={`Send email for ${r.title}`}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-charcoal-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Mail size={13} />
                    Email Us
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ReminderModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditReminder(null) }}
        onSave={handleSave}
        initial={editReminder}
        loading={saving}
      />
    </div>
  )
}
