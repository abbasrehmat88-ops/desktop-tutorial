import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { watchCollection, removeItem } from '../data/db'
import {
  AlertTriangle, Loader2, CheckCircle, Trash2, ShieldCheck, Check,
  Users, KeyRound, Bell, Zap, Building2, Landmark, ArrowRight,
} from 'lucide-react'

// Collections that get wiped. Deposits is DELIBERATELY excluded — that data
// is correct and must be preserved. Financial / Cash Flow totals and the
// Dashboard are CALCULATED from Tenants + Owners, so they have no separate
// records — clearing those two also resets Financial, Dues and the Dashboard.
const TARGETS = [
  { name: 'tenants',    label: 'Tenants & Rent', icon: Users,
    desc: 'All tenants, rooms, rent & payment history. Also clears Dues, Dashboard and the tenant side of Financial.' },
  { name: 'owners',     label: 'Owners',         icon: KeyRound,
    desc: 'All owner records and their payments. Also clears the owner side of Financial.' },
  { name: 'reminders',  label: 'Reminders',      icon: Bell,
    desc: 'All reminders, bills and renewals.' },
  { name: 'fewaBills',  label: 'Cash Flow — FEWA Bills', icon: Zap,
    desc: 'FEWA / utility bills you added on the Cash Flow page.' },
  { name: 'properties', label: 'Properties',     icon: Building2,
    desc: 'Saved property listings.' },
]

export default function ResetData() {
  const [docs, setDocs]       = useState({})   // { collectionName: [ {id}, ... ] }
  const [status, setStatus]   = useState('idle') // idle | clearing | done | error
  const [deleted, setDeleted] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [confirmText, setConfirmText] = useState('')
  // Which sections the user has ticked for deletion (start with none selected).
  const [selected, setSelected] = useState(() => new Set())
  const navigate = useNavigate()

  // Live-watch every target collection so we always show the real current count.
  useEffect(() => {
    const unsubs = TARGETS.map(t =>
      watchCollection(t.name, 'createdAt', 'desc',
        data => setDocs(prev => ({ ...prev, [t.name]: data })),
        ()   => setDocs(prev => ({ ...prev, [t.name]: prev[t.name] || [] })),
      )
    )
    return () => unsubs.forEach(u => u && u())
  }, [])

  function toggle(name) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const counts = TARGETS.map(t => ({ ...t, count: (docs[t.name] || []).length }))
  const selectedTargets = TARGETS.filter(t => selected.has(t.name))
  const total = counts.filter(c => selected.has(c.name)).reduce((s, c) => s + c.count, 0)
  const allSelectable = counts.filter(c => c.count > 0)
  const allSelected = allSelectable.length > 0 && allSelectable.every(c => selected.has(c.name))

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allSelectable.map(c => c.name)))
  }

  const canDelete = confirmText.trim().toUpperCase() === 'DELETE' && total > 0 && selected.size > 0 && status !== 'clearing'

  async function runReset() {
    if (!canDelete) return
    setStatus('clearing')
    setDeleted(0)
    setErrorMsg('')
    let removed = 0
    try {
      for (const t of selectedTargets) {
        const list = [...(docs[t.name] || [])]
        for (const item of list) {
          await removeItem(t.name, item.id)
          removed++
          setDeleted(removed)
        }
      }
      setStatus('done')
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete data.')
      setStatus('error')
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto animate-fade-up">
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title">Reset Data</h1>
        <span className="gold-rule" />
        <p className="text-gray-500 text-sm mt-2">
          Select any sections — or everything — and permanently delete them so you can re-upload a clean set.
          <strong className="text-charcoal-900"> Deposits are never touched.</strong>
        </p>
      </div>

      {/* Deposits-safe banner */}
      <div className="card !p-4 mb-5 flex items-center gap-3 bg-emerald2-50/60 border-emerald2-100">
        <div className="w-10 h-10 rounded-xl bg-emerald2-100 flex items-center justify-center flex-shrink-0">
          <Landmark size={18} className="text-emerald2-700" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-charcoal-900 flex items-center gap-1.5">
            <ShieldCheck size={15} className="text-emerald2-600" /> Deposit section is protected
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Your deposit records stay exactly as they are — this tool does not delete them.</p>
        </div>
      </div>

      {/* Select which sections to delete */}
      <div className="card p-5 sm:p-6 mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="section-label flex items-center gap-1.5 text-rust-600">
            <Trash2 size={13} /> Choose sections to delete
          </p>
          <button
            onClick={toggleAll}
            disabled={allSelectable.length === 0}
            className="text-xs font-semibold text-primary-700 hover:text-primary-800 disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors"
          >
            {allSelected ? 'Clear all' : 'Select all'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4">Tap a section to select it. Only the selected sections will be deleted.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {counts.map(c => {
            const Icon = c.icon
            const isOn = selected.has(c.name)
            const empty = c.count === 0
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => !empty && toggle(c.name)}
                disabled={empty}
                aria-pressed={isOn}
                className={`text-left rounded-2xl border p-3 flex items-start gap-3 transition-all ${
                  empty
                    ? 'border-gray-100 bg-gray-50/50 opacity-50 cursor-not-allowed'
                    : isOn
                    ? 'border-rust-300 bg-rust-50 ring-2 ring-rust-200'
                    : 'border-gray-200 hover:border-rust-200 hover:bg-rust-50/40'
                }`}
              >
                {/* checkbox */}
                <span className={`w-6 h-6 mt-0.5 rounded-lg flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                  isOn ? 'bg-rust-500 border-rust-500 text-white' : 'border-gray-300 bg-white'
                }`}>
                  {isOn && <Check size={15} strokeWidth={3} />}
                </span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isOn ? 'bg-rust-100' : 'bg-gray-100'}`}>
                  <Icon size={18} className={isOn ? 'text-rust-600' : 'text-gray-400'} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-charcoal-900">{c.label}</p>
                    <span className="text-xs font-bold text-rust-600 tabular flex-shrink-0">{c.count}</span>
                  </div>
                  {c.desc && <p className="text-[11px] leading-snug text-gray-500 mt-0.5">{c.desc}</p>}
                </div>
              </button>
            )
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-600">
            Selected to delete{selected.size > 0 ? ` (${selected.size} section${selected.size === 1 ? '' : 's'})` : ''}
          </span>
          <span className="font-display text-2xl font-bold text-rust-600 tabular">{total}</span>
        </div>
      </div>

      {/* Action card */}
      <div className="card p-5 sm:p-6">
        {status === 'idle' && (
          <>
            {selected.size === 0 ? (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <AlertTriangle size={20} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-500">
                  Select at least one section above to delete.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-rust-50 border border-rust-200 mb-5">
                  <AlertTriangle size={20} className="text-rust-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-rust-700">
                    This cannot be undone. <strong>{total} records</strong> from{' '}
                    <strong>{selectedTargets.map(t => t.label).join(', ')}</strong> will be permanently
                    removed from every device. Type <strong>DELETE</strong> below to confirm.
                  </p>
                </div>
                <label className="field-label" htmlFor="confirm">Type DELETE to confirm</label>
                <input
                  id="confirm"
                  type="text"
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  autoComplete="off"
                  autoCapitalize="characters"
                  className="input-field tracking-widest font-bold uppercase mb-4"
                />
                <button
                  onClick={runReset}
                  disabled={!canDelete}
                  className="btn-danger w-full min-h-[48px] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 size={18} />
                  {total > 0 ? `Delete ${total} Selected Record${total === 1 ? '' : 's'}` : 'Selected sections are empty'}
                </button>
              </>
            )}
          </>
        )}

        {status === 'clearing' && (
          <div className="text-center py-4">
            <Loader2 size={40} className="animate-spin text-rust-600 mx-auto mb-4" />
            <p className="text-charcoal-900 font-semibold text-lg">Deleting…</p>
            <p className="text-gray-500 text-sm mt-1">
              <span className="tabular">{deleted}</span> of <span className="tabular">{total}</span> removed
            </p>
            <div className="w-full bg-gray-100 rounded-full h-3 mt-4 overflow-hidden">
              <div className="h-3 bg-gradient-to-r from-rust-500 to-rust-400 rounded-full transition-all duration-300"
                style={{ width: `${total ? (deleted / total) * 100 : 0}%` }} />
            </div>
          </div>
        )}

        {status === 'done' && (
          <div className="rounded-card border border-emerald2-100 bg-emerald2-50 px-6 py-10 text-center animate-scale-in">
            <CheckCircle size={48} className="text-emerald2-600 mx-auto mb-4" />
            <p className="text-charcoal-900 font-bold text-xl font-display">Done</p>
            <p className="text-gray-600 text-sm mt-2 mb-6 max-w-md mx-auto">
              The selected sections have been cleared (deposits kept safe). You can now re-upload your data.
            </p>
            <button onClick={() => navigate('/tenants')} className="btn-primary px-8 py-3 min-h-[44px] mx-auto">
              Go to Tenants <ArrowRight size={18} />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-card border border-rust-100 bg-rust-50 px-6 py-8 text-center animate-pop">
            <AlertTriangle size={40} className="text-rust-600 mx-auto mb-3" />
            <p className="text-charcoal-900 font-semibold">Delete Failed</p>
            <p className="text-rust-600 text-sm mt-1 mb-4">{errorMsg}</p>
            <p className="text-gray-500 text-xs mb-4 max-w-md mx-auto">
              Some records may have been deleted. Make sure you are signed in and online, then run it again.
            </p>
            <button onClick={() => setStatus('idle')} className="btn-primary px-8 py-3 min-h-[44px] mx-auto">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
