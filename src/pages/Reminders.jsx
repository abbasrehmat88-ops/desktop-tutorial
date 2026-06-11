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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {initial ? 'Edit Reminder' : 'Add Reminder'}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
              <input
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (AED)</label>
              <input
                name="amount"
                type="number"
                min="0"
                value={form.amount}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. 500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Name</label>
              <input
                name="tenantName"
                value={form.tenantName}
                onChange={handleChange}
                className="input-field"
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
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
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {initial ? 'Update Reminder' : 'Add Reminder'}
            </button>
          </div>
        </form>
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
  if (days < 0) {
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">Overdue</span>
  }
  if (days === 0) {
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">Due Today</span>
  }
  if (days <= 7) {
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">{days}d left</span>
  }
  if (days <= 14) {
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">{days}d left</span>
  }
  return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">{days}d left</span>
}

const TYPE_COLORS = {
  Bill: 'bg-blue-100 text-blue-700',
  Loan: 'bg-purple-100 text-purple-700',
  Renewal: 'bg-orange-100 text-orange-700',
  Other: 'bg-gray-100 text-gray-700',
}

export default function Reminders() {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editReminder, setEditReminder] = useState(null)

  useEffect(() => {
    if (!db) {
      setLoading(false)
      return
    }
    const q = query(collection(db, 'reminders'), orderBy('dueDate', 'asc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setReminders(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setError('Failed to load reminders.')
        setLoading(false)
      }
    )
    return unsub
  }, [])

  const dueWithin7 = reminders.filter((r) => {
    const days = getDaysRemaining(r.dueDate)
    return days !== null && days >= 0 && days <= 7
  })

  async function handleSave(form) {
    setSaving(true)
    try {
      if (editReminder) {
        await updateDoc(doc(db, 'reminders', editReminder.id), {
          title: form.title.trim(),
          type: form.type,
          dueDate: form.dueDate,
          amount: form.amount ? Number(form.amount) : null,
          notes: form.notes.trim(),
          tenantName: form.tenantName.trim(),
          updatedAt: serverTimestamp(),
        })
      } else {
        await addDoc(collection(db, 'reminders'), {
          title: form.title.trim(),
          type: form.type,
          dueDate: form.dueDate,
          amount: form.amount ? Number(form.amount) : null,
          notes: form.notes.trim(),
          tenantName: form.tenantName.trim(),
          createdAt: serverTimestamp(),
        })
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(reminder) {
    if (!window.confirm(`Delete reminder "${reminder.title}"?`)) return
    try {
      await deleteDoc(doc(db, 'reminders', reminder.id))
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track bills, loans, and renewal deadlines</p>
        </div>
        <button onClick={() => { setEditReminder(null); setModalOpen(true) }} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <Plus size={18} />
          Add Reminder
        </button>
      </div>

      {/* Alert banner */}
      {dueWithin7.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 text-sm">
              {dueWithin7.length} reminder{dueWithin7.length > 1 ? 's' : ''} due within 7 days!
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              {dueWithin7.map((r) => r.title).join(', ')}
            </p>
          </div>
        </div>
      )}

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
          <p className="text-sm text-amber-800">Firebase not configured. Add your credentials to store reminders.</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : reminders.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell size={48} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-gray-500 font-medium">No reminders yet</h3>
          <p className="text-gray-400 text-sm mt-1">Add reminders for bills, loans, or lease renewals.</p>
          <button
            onClick={() => { setEditReminder(null); setModalOpen(true) }}
            className="btn-primary mt-4 inline-flex items-center gap-2"
          >
            <Plus size={16} />
            Add First Reminder
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {reminders.map((r) => {
            const days = getDaysRemaining(r.dueDate)
            let dueDateDisplay = '—'
            try {
              if (r.dueDate) dueDateDisplay = format(parseISO(r.dueDate), 'MMM d, yyyy')
            } catch {}

            return (
              <div key={r.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug">{r.title}</h3>
                    {r.tenantName && (
                      <p className="text-xs text-gray-500 mt-0.5">Tenant: {r.tenantName}</p>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${TYPE_COLORS[r.type] || TYPE_COLORS.Other}`}>
                    {r.type}
                  </span>
                </div>

                <div className="space-y-1.5 mb-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <Clock size={12} />
                      Due Date
                    </span>
                    <span className="font-medium text-gray-900">{dueDateDisplay}</span>
                  </div>
                  {r.amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Amount</span>
                      <span className="font-medium text-gray-900">AED {Number(r.amount).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mb-3">
                  <DaysBadge days={days} />
                </div>

                {r.notes && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2.5 mb-3 line-clamp-2">{r.notes}</p>
                )}

                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => { setEditReminder(r); setModalOpen(true) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                  >
                    <Edit2 size={12} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(r)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                  <a
                    href={buildWhatsAppUrl(r)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <MessageCircle size={12} />
                    WhatsApp Us
                  </a>
                  <a
                    href={buildEmailUrl(r)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Mail size={12} />
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
