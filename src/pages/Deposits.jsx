import React, { useState, useEffect, useMemo } from 'react'
import ReactDOM from 'react-dom'
import { watchCollection, addItem, updateItem, removeItem } from '../data/db'
import depositsSeed from '../data/depositsSeed.json'
import { CANONICAL_VILLAS } from '../data/villas'
import { format, parseISO } from 'date-fns'
import {
  Landmark, Edit2, Check, X, AlertCircle, Search, RotateCcw, Loader2,
  Wallet, Plus, Trash2, Undo2, Download, Home, User, CalendarDays,
} from 'lucide-react'

const BLANK = { room: '', villa: '', client: '', amount: '', date: '', status: 'held', note: '' }

function prettyDate(d) {
  if (!d) return '—'
  try { return format(parseISO(d), 'd MMM yyyy') } catch { return d }
}

export default function Deposits() {
  const [deposits, setDeposits] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('all')   // all | held | returned
  const [busyId, setBusyId]     = useState(null)
  const [importing, setImporting] = useState(false)

  // Add / edit modal
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm]   = useState(BLANK)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    return watchCollection(
      'deposits', 'createdAt', 'desc',
      data => { setDeposits(data); setLoading(false) },
      err  => { console.error(err); setError('Failed to load deposits.'); setLoading(false) }
    )
  }, [])

  const withUs        = useMemo(() => deposits.filter(d => d.status !== 'returned').reduce((s, d) => s + Number(d.amount || 0), 0), [deposits])
  const returnedTotal = useMemo(() => deposits.filter(d => d.status === 'returned').reduce((s, d) => s + Number(d.amount || 0), 0), [deposits])
  const heldCount     = deposits.filter(d => d.status !== 'returned').length
  const returnedCount = deposits.filter(d => d.status === 'returned').length

  const displayed = useMemo(() => {
    let list = deposits
    if (filter === 'held')     list = list.filter(d => d.status !== 'returned')
    if (filter === 'returned') list = list.filter(d => d.status === 'returned')
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(d =>
        d.client?.toLowerCase().includes(q) ||
        String(d.room ?? '').toLowerCase().includes(q) ||
        d.villa?.toLowerCase().includes(q) ||
        d.note?.toLowerCase().includes(q)
      )
    }
    // Held first, then by date (newest first)
    return [...list].sort((a, b) => {
      const sa = a.status === 'returned' ? 1 : 0
      const sb = b.status === 'returned' ? 1 : 0
      if (sa !== sb) return sa - sb
      return String(b.date || '').localeCompare(String(a.date || ''))
    })
  }, [deposits, filter, search])

  // ── Import the records from the uploaded sheet (dedupe by seedKey) ──
  async function importSeed() {
    setError('')
    setImporting(true)
    try {
      const existing = new Set(deposits.map(d => d.seedKey).filter(Boolean))
      let added = 0
      for (const row of depositsSeed) {
        if (existing.has(row.seedKey)) continue
        await addItem('deposits', {
          room: row.room, villa: row.villa, client: row.client,
          amount: Number(row.amount || 0), date: row.date || '',
          status: row.status === 'returned' ? 'returned' : 'held',
          note: row.note || '', seedKey: row.seedKey,
        })
        added++
      }
      if (added === 0) setError('All sheet records are already imported.')
    } catch (e) {
      setError('Import failed: ' + e.message)
    } finally {
      setImporting(false)
    }
  }

  // ── Return / restore ──
  async function toggleReturn(d) {
    const returning = d.status !== 'returned'
    if (returning && !window.confirm(
      `Mark AED ${Number(d.amount).toLocaleString()} deposit for ${d.client} as RETURNED?\n\nIt will be deducted from "Deposit With Us".`
    )) return
    setBusyId(d.id)
    try {
      await updateItem('deposits', d.id, { status: returning ? 'returned' : 'held' })
    } catch (e) {
      setError((returning ? 'Return' : 'Restore') + ' failed: ' + e.message)
    } finally {
      setBusyId(null)
    }
  }

  async function deleteDeposit(d) {
    if (!window.confirm(`Delete deposit record for ${d.client}? This cannot be undone.`)) return
    setBusyId(d.id)
    try {
      await removeItem('deposits', d.id)
    } catch (e) {
      setError('Delete failed: ' + e.message)
    } finally {
      setBusyId(null)
    }
  }

  // ── Add / edit modal ──
  function openAdd() {
    setEditId(null)
    setForm({ ...BLANK, date: new Date().toISOString().slice(0, 10) })
    setModalOpen(true)
  }
  function openEdit(d) {
    setEditId(d.id)
    setForm({
      room: d.room || '', villa: d.villa || '', client: d.client || '',
      amount: d.amount != null ? String(d.amount) : '', date: d.date || '',
      status: d.status === 'returned' ? 'returned' : 'held', note: d.note || '',
    })
    setModalOpen(true)
  }
  function closeModal() { setModalOpen(false); setEditId(null); setForm(BLANK) }

  async function saveForm(e) {
    e?.preventDefault()
    if (!form.client.trim()) return setError('Client name is required.')
    const amount = Number(form.amount)
    if (isNaN(amount) || amount < 0) return setError('Enter a valid amount (0 or more).')
    setSaving(true)
    setError('')
    const payload = {
      room: form.room.trim(), villa: form.villa.trim(), client: form.client.trim(),
      amount, date: form.date, status: form.status === 'returned' ? 'returned' : 'held',
      note: form.note.trim(),
    }
    try {
      if (editId) await updateItem('deposits', editId, payload)
      else        await addItem('deposits', payload)
      closeModal()
    } catch (err) {
      setError('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { key: 'all',      label: 'All',      count: deposits.length },
    { key: 'held',     label: 'With Us',  count: heldCount },
    { key: 'returned', label: 'Returned', count: returnedCount },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Deposits</h1>
          <span className="gold-rule" />
          <p className="text-gray-500 text-sm mt-2">Security deposits held from tenants — track what is with us and what is returned</p>
        </div>
        <button onClick={openAdd} className="btn-primary min-h-[44px] self-start sm:self-auto">
          <Plus size={16} /> Add Deposit
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-rust-50 border border-rust-200 rounded-xl flex gap-2 items-center text-rust-700 text-sm animate-pop">
          <AlertCircle size={16} className="flex-shrink-0" />{error}
          <button onClick={() => setError('')} aria-label="Dismiss error" className="ml-auto p-1 rounded-lg hover:bg-rust-100 transition-colors"><X size={14} /></button>
        </div>
      )}

      {/* ── Hero: Deposit with us right now ── */}
      <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-charcoal-800 via-charcoal-900 to-charcoal-950 text-cream p-6 sm:p-8 mb-5 shadow-premium border-t border-primary-500/30">
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-primary-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-500/15 ring-1 ring-primary-400/30 flex items-center justify-center flex-shrink-0">
            <Landmark size={24} className="text-primary-400" />
          </div>
          <div className="min-w-0">
            <p className="section-label !text-primary-300/80">Deposit With Us Right Now</p>
            {loading
              ? <div className="skeleton h-9 w-40 mt-2 !bg-white/10" />
              : <p className="font-display text-3xl sm:text-4xl font-bold text-primary-400 mt-1 tabular leading-tight">AED {withUs.toLocaleString()}</p>}
            <p className="text-xs text-gray-400 mt-1.5">{heldCount} active deposit{heldCount === 1 ? '' : 's'} in custody</p>
          </div>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 stagger">
        <div className="stat-card">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald2-50 flex items-center justify-center flex-shrink-0">
              <Check size={22} className="text-emerald2-600" />
            </div>
            <div className="min-w-0">
              <p className="section-label">Active Deposits</p>
              <p className="font-display text-2xl font-bold text-charcoal-900 mt-1 tabular leading-tight">{heldCount}</p>
              <p className="text-xs text-gray-400 mt-0.5">Currently held</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rust-50 flex items-center justify-center flex-shrink-0">
              <RotateCcw size={22} className="text-rust-600" />
            </div>
            <div className="min-w-0">
              <p className="section-label">Returned</p>
              <p className="font-display text-2xl font-bold text-rust-600 mt-1 tabular leading-tight">AED {returnedTotal.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-0.5">{returnedCount} deposit{returnedCount === 1 ? '' : 's'} given back</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar: filter tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              aria-pressed={filter === t.key}
              className={`flex items-center gap-1.5 min-h-[40px] px-3 sm:px-4 rounded-lg text-sm font-semibold transition-all ${
                filter === t.key ? 'bg-white text-charcoal-900 shadow-card' : 'text-gray-500 hover:text-charcoal-700'
              }`}
            >
              {t.label}
              <span className={`text-2xs tabular px-1.5 py-0.5 rounded-full ${filter === t.key ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-500'}`}>{t.count}</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs sm:ml-auto">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search client, room, villa…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search deposits"
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="card !p-4 h-24 skeleton" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="card p-12 text-center animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-charcoal-900 flex items-center justify-center mx-auto mb-4">
            <Wallet size={30} className="text-primary-400" />
          </div>
          <h3 className="font-display text-lg text-charcoal-900">
            {deposits.length === 0 ? 'No deposit records yet' : 'No deposits match this view'}
          </h3>
          <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto">
            {deposits.length === 0
              ? 'Import your records from the uploaded sheet, or add a deposit manually.'
              : search ? 'Try a different search term.' : 'Switch filter to see other records.'}
          </p>
          {deposits.length === 0 && (
            <div className="flex flex-wrap gap-2 justify-center mt-5">
              <button onClick={importSeed} disabled={importing} className="btn-primary min-h-[44px] disabled:opacity-60">
                {importing ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                Import {depositsSeed.length} records from sheet
              </button>
              <button onClick={openAdd} className="btn-secondary min-h-[44px]">
                <Plus size={16} /> Add manually
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Import banner when records exist but some seed rows are missing */}
          {deposits.filter(d => d.seedKey).length < depositsSeed.length && (
            <div className="card !p-4 mb-3 flex flex-col sm:flex-row sm:items-center gap-3 bg-primary-50/60 border-primary-100">
              <Download size={18} className="text-primary-700 flex-shrink-0" />
              <p className="text-sm text-charcoal-700 flex-1">Some records from your uploaded sheet are not imported yet.</p>
              <button onClick={importSeed} disabled={importing} className="btn-secondary min-h-[40px] disabled:opacity-60">
                {importing ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                Import sheet records
              </button>
            </div>
          )}

          <div className="space-y-3 stagger">
            {displayed.map(d => {
              const returned = d.status === 'returned'
              return (
                <div key={d.id} className={`card !p-4 transition-shadow duration-200 hover:shadow-lg ${returned ? 'border-l-4 border-l-rust-400 bg-rust-50/30' : ''}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Identity */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-display font-bold text-base flex-shrink-0 shadow-card ${
                        returned ? 'bg-gradient-to-br from-rust-50 to-rust-100 text-rust-500' : 'bg-gradient-to-br from-primary-50 to-primary-100 text-primary-700'
                      }`}>
                        {d.client?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <h3 className={`font-display font-semibold text-[15px] leading-tight truncate ${returned ? 'text-gray-500' : 'text-charcoal-900'}`}>{d.client}</h3>
                        <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="inline-flex items-center gap-1"><Home size={11} /> {d.room || '—'}</span>
                          {d.villa && <span className="inline-flex items-center gap-1"><User size={11} /> {d.villa}</span>}
                          {d.date && <span className="inline-flex items-center gap-1"><CalendarDays size={11} /> {prettyDate(d.date)}</span>}
                        </p>
                        {d.note && <p className="text-2xs text-gray-400 mt-1 truncate max-w-md">{d.note}</p>}
                      </div>
                    </div>

                    {/* Amount + status */}
                    <div className="pl-14 sm:pl-0 sm:text-right sm:min-w-[140px]">
                      <p className={`font-display font-bold text-base tabular leading-tight ${returned ? 'text-rust-500 line-through decoration-rust-300' : 'text-charcoal-900'}`}>
                        AED {Number(d.amount || 0).toLocaleString()}
                      </p>
                      <span className={`mt-1 ${returned ? 'badge-unpaid' : 'badge-paid'}`}>
                        {returned ? <><RotateCcw size={11} /> Returned</> : <><Check size={11} /> With us</>}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pl-14 sm:pl-0 flex-shrink-0">
                      <button
                        onClick={() => openEdit(d)}
                        aria-label={`Edit deposit for ${d.client}`}
                        className="flex items-center gap-1.5 min-h-[44px] px-3 text-xs font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors"
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                      {returned ? (
                        <button
                          onClick={() => toggleReturn(d)}
                          disabled={busyId === d.id}
                          aria-label={`Restore deposit for ${d.client}`}
                          className="flex items-center gap-1.5 min-h-[44px] px-3 text-xs font-bold text-emerald2-700 bg-emerald2-50 hover:bg-emerald2-100 rounded-xl transition-colors disabled:opacity-50"
                        >
                          {busyId === d.id ? <Loader2 size={13} className="animate-spin" /> : <Undo2 size={13} />} Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleReturn(d)}
                          disabled={busyId === d.id}
                          aria-label={`Return deposit for ${d.client}`}
                          className="flex items-center gap-1.5 min-h-[44px] px-3 text-xs font-bold text-rust-600 bg-rust-50 hover:bg-rust-100 rounded-xl transition-colors disabled:opacity-50"
                        >
                          {busyId === d.id ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Return
                        </button>
                      )}
                      <button
                        onClick={() => deleteDeposit(d)}
                        disabled={busyId === d.id}
                        aria-label={`Delete deposit for ${d.client}`}
                        className="flex items-center justify-center min-h-[44px] w-11 text-gray-400 bg-gray-100 hover:bg-rust-50 hover:text-rust-600 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Total footer */}
          <div className="card !p-4 mt-3 flex items-center justify-between gap-3 bg-charcoal-900 text-cream">
            <span className="text-sm font-semibold text-gray-300">Deposit with us ({heldCount} active)</span>
            <span className="font-display text-lg font-bold text-primary-400 tabular">AED {withUs.toLocaleString()}</span>
          </div>
        </>
      )}

      {/* ── Add / Edit modal (portal — iOS Safari overflow fix) ── */}
      {modalOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-charcoal-950/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-card shadow-premium animate-pop max-h-[92vh] overflow-y-auto">
            <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                <Landmark size={20} className="text-primary-700" />
              </div>
              <h2 className="font-display text-lg text-charcoal-900 flex-1">{editId ? 'Edit Deposit' : 'Add Deposit'}</h2>
              <button onClick={closeModal} aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveForm} className="px-6 py-5 space-y-4">
              <div>
                <label className="field-label" htmlFor="dep-client">Client Name *</label>
                <input id="dep-client" type="text" value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} className="input-field" placeholder="e.g. Ibrahim Afghan" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="dep-room">Room #</label>
                  <input id="dep-room" type="text" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} className="input-field" placeholder="R-105" />
                </div>
                <div>
                  <label className="field-label" htmlFor="dep-villa">Villa</label>
                  <select id="dep-villa" value={form.villa} onChange={e => setForm(f => ({ ...f, villa: e.target.value }))} className="input-field">
                    <option value="">— Select villa —</option>
                    {CANONICAL_VILLAS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="dep-amount">Amount (AED)</label>
                  <input id="dep-amount" type="number" min="0" inputMode="numeric" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="input-field tabular" placeholder="1000" />
                </div>
                <div>
                  <label className="field-label" htmlFor="dep-date">Date</label>
                  <input id="dep-date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input-field tabular" />
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="dep-note">Note</label>
                <input id="dep-note" type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className="input-field" placeholder="e.g. w/us, cheque, returned online…" />
              </div>
              <div>
                <span className="field-label">Status</span>
                <div className="flex gap-2 mt-1">
                  <button type="button" onClick={() => setForm(f => ({ ...f, status: 'held' }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl text-sm font-bold transition-all ${form.status !== 'returned' ? 'bg-emerald2-50 text-emerald2-700 ring-2 ring-emerald2-200' : 'bg-gray-100 text-gray-500'}`}>
                    <Check size={15} /> With us
                  </button>
                  <button type="button" onClick={() => setForm(f => ({ ...f, status: 'returned' }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl text-sm font-bold transition-all ${form.status === 'returned' ? 'bg-rust-50 text-rust-600 ring-2 ring-rust-200' : 'bg-gray-100 text-gray-500'}`}>
                    <RotateCcw size={15} /> Returned
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1 min-h-[44px]">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 min-h-[44px] disabled:opacity-60">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {editId ? 'Save' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
