import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { watchCollection, removeItem } from '../data/db'
import {
  AlertTriangle, Loader2, CheckCircle, Trash2, ShieldCheck,
  Users, KeyRound, Bell, Zap, Building2, Landmark, ArrowRight,
} from 'lucide-react'

// Collections that get wiped. Deposits is DELIBERATELY excluded — that data
// is correct and must be preserved.
const TARGETS = [
  { name: 'tenants',    label: 'Tenants',     icon: Users },
  { name: 'owners',     label: 'Owners',      icon: KeyRound },
  { name: 'reminders',  label: 'Reminders',   icon: Bell },
  { name: 'fewaBills',  label: 'FEWA Bills',  icon: Zap },
  { name: 'properties', label: 'Properties',  icon: Building2 },
]

export default function ResetData() {
  const [docs, setDocs]       = useState({})   // { collectionName: [ {id}, ... ] }
  const [status, setStatus]   = useState('idle') // idle | clearing | done | error
  const [deleted, setDeleted] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [confirmText, setConfirmText] = useState('')
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

  const counts = TARGETS.map(t => ({ ...t, count: (docs[t.name] || []).length }))
  const total  = counts.reduce((s, c) => s + c.count, 0)
  const canDelete = confirmText.trim().toUpperCase() === 'DELETE' && total > 0 && status !== 'clearing'

  async function runReset() {
    if (!canDelete) return
    setStatus('clearing')
    setDeleted(0)
    setErrorMsg('')
    let removed = 0
    try {
      for (const t of TARGETS) {
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
          Permanently delete all records so you can re-upload a clean set.
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

      {/* What will be deleted */}
      <div className="card p-5 sm:p-6 mb-5">
        <p className="section-label mb-3 flex items-center gap-1.5 text-rust-600">
          <Trash2 size={13} /> Will be permanently deleted
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {counts.map(c => {
            const Icon = c.icon
            return (
              <div key={c.name} className="rounded-2xl border border-gray-200 p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rust-50 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-rust-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 truncate">{c.label}</p>
                  <p className="font-display text-xl font-bold text-charcoal-900 tabular leading-tight">{c.count}</p>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-600">Total records to delete</span>
          <span className="font-display text-2xl font-bold text-rust-600 tabular">{total}</span>
        </div>
      </div>

      {/* Action card */}
      <div className="card p-5 sm:p-6">
        {status === 'idle' && (
          <>
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-rust-50 border border-rust-200 mb-5">
              <AlertTriangle size={20} className="text-rust-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rust-700">
                This cannot be undone. All {total} records above will be permanently removed from every device.
                Type <strong>DELETE</strong> below to confirm.
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
              {total > 0 ? `Delete All ${total} Records` : 'Nothing to delete'}
            </button>
            {total === 0 && (
              <p className="text-xs text-gray-400 text-center mt-3">All sections are already empty (deposits excluded).</p>
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
            <p className="text-charcoal-900 font-bold text-xl font-display">All Clear</p>
            <p className="text-gray-600 text-sm mt-2 mb-6 max-w-md mx-auto">
              Every section has been wiped (deposits kept safe). You can now re-upload your data.
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
