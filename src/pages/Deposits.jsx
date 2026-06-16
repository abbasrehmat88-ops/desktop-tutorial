import React, { useState, useEffect } from 'react'
import { watchCollection, updateItem } from '../data/db'
import {
  Landmark, Edit2, Check, X, AlertCircle, ChevronDown, ChevronUp,
  Search, RotateCcw, Loader2, Wallet, ListPlus,
} from 'lucide-react'

export default function Deposits() {
  const [tenants, setTenants]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [editId, setEditId]       = useState(null)   // which tenant row is in edit mode
  const [editVal, setEditVal]     = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [search, setSearch]       = useState('')
  const [bulkOpen, setBulkOpen]   = useState(false)
  const [bulkText, setBulkText]   = useState('')
  const [bulkPreview, setBulkPreview] = useState(null)
  const [bulkSaving, setBulkSaving]   = useState(false)

  useEffect(() => {
    return watchCollection(
      'tenants', 'createdAt', 'desc',
      data => { setTenants(data); setLoading(false) },
      err  => { console.error(err); setLoading(false) }
    )
  }, [])

  const totalDeposits   = tenants.reduce((s, t) => s + Number(t.deposit || 0), 0)
  const withDeposit     = tenants.filter(t => t.deposit > 0).length
  const withoutDeposit  = tenants.filter(t => !t.deposit || t.deposit === 0).length

  const displayed = tenants.filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.name?.toLowerCase().includes(q) ||
      String(t.unit ?? '').includes(q) ||
      t.property?.toLowerCase().includes(q)
    )
  })

  async function saveDeposit(tenant) {
    const val = Number(editVal)
    if (isNaN(val) || val < 0) return setError('Enter a valid amount (0 or more).')
    setSaving(true)
    try {
      await updateItem('tenants', tenant.id, { deposit: val })
      setEditId(null)
    } catch (e) {
      setError('Save failed: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function returnDeposit(tenant) {
    if (!tenant.deposit || tenant.deposit === 0) return
    if (!window.confirm(
      `Return AED ${Number(tenant.deposit).toLocaleString()} deposit for ${tenant.name}?\n\nThis will set their deposit to 0 and cannot be undone.`
    )) return
    setSaving(true)
    try {
      await updateItem('tenants', tenant.id, { deposit: 0 })
    } catch (e) {
      setError('Return failed: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  // Parse bulk text and build a preview list of { tenant, newDeposit }
  function parseBulk() {
    setError('')
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean)
    const results = []
    const notFound = []
    for (const line of lines) {
      // Accept: "1: 1000"  or  "Room 1: 1000"  or  "1 - 1000"  or  "1 1000"
      const match = line.match(/^(?:room\s*)?(\w+)\s*[:\-\s]\s*(\d+)/i)
      if (!match) { notFound.push(line); continue }
      const unit = match[1]
      const deposit = Number(match[2])
      const tenant = tenants.find(t => String(t.unit).toLowerCase() === unit.toLowerCase())
      if (!tenant) { notFound.push(`Room ${unit} — not found`); continue }
      results.push({ tenant, newDeposit: deposit })
    }
    setBulkPreview({ results, notFound })
  }

  async function applyBulk() {
    if (!bulkPreview) return
    setBulkSaving(true)
    setError('')
    try {
      for (const { tenant, newDeposit } of bulkPreview.results) {
        await updateItem('tenants', tenant.id, { deposit: newDeposit })
      }
      setBulkPreview(null)
      setBulkText('')
      setBulkOpen(false)
    } catch (e) {
      setError('Bulk save failed: ' + e.message)
    } finally {
      setBulkSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">

      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title">Deposits</h1>
        <span className="gold-rule" />
        <p className="text-gray-500 text-sm mt-2">Security deposits held from all tenants</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-rust-50 border border-rust-200 rounded-xl flex gap-2 items-center text-rust-700 text-sm animate-scale-in">
          <AlertCircle size={16} className="flex-shrink-0" />{error}
          <button onClick={() => setError('')} aria-label="Dismiss error" className="ml-auto p-1 rounded-lg hover:bg-rust-100 transition-colors"><X size={14} /></button>
        </div>
      )}

      {/* Summary cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="stat-card">
              <div className="flex items-start gap-4">
                <div className="skeleton w-12 h-12 rounded-2xl" />
                <div className="flex-1 space-y-2 mt-1">
                  <div className="skeleton h-3 w-24" />
                  <div className="skeleton h-7 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 stagger">
          <div className="stat-card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-charcoal-900 flex items-center justify-center flex-shrink-0">
                <Landmark size={22} className="text-primary-400" />
              </div>
              <div className="min-w-0">
                <p className="section-label">Total Held</p>
                <p className="font-display text-2xl font-bold text-charcoal-900 mt-1 tabular leading-tight">AED {totalDeposits.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-0.5">Security deposits in custody</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald2-50 flex items-center justify-center flex-shrink-0">
                <Check size={22} className="text-emerald2-600" />
              </div>
              <div className="min-w-0">
                <p className="section-label">With Deposit</p>
                <p className="font-display text-2xl font-bold text-charcoal-900 mt-1 tabular leading-tight">{withDeposit}</p>
                <p className="text-xs text-gray-400 mt-0.5">Tenants with deposit recorded</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rust-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={22} className="text-rust-600" />
              </div>
              <div className="min-w-0">
                <p className="section-label">No Deposit</p>
                <p className="font-display text-2xl font-bold text-charcoal-900 mt-1 tabular leading-tight">{withoutDeposit}</p>
                <p className="text-xs text-gray-400 mt-0.5">Deposit not yet recorded</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk import ── */}
      <div className="card mb-6 overflow-hidden !p-0">
        <button
          onClick={() => setBulkOpen(o => !o)}
          aria-expanded={bulkOpen}
          className="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <ListPlus size={20} className="text-primary-700" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg text-charcoal-900 leading-tight">Bulk Set Deposits</h2>
              <p className="text-sm text-gray-500 mt-0.5">Paste deposit amounts for multiple rooms at once</p>
            </div>
          </div>
          {bulkOpen
            ? <ChevronUp size={18} className="text-gray-400 flex-shrink-0" />
            : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />}
        </button>

        {bulkOpen && (
          <div className="px-6 pb-6 border-t border-gray-100 animate-fade-up">
            <p className="text-sm text-gray-500 mt-4 mb-3">
              One room per line, format: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">Room 1: 1000</code> or simply <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">1: 1000</code>
            </p>
            <textarea
              value={bulkText}
              onChange={e => { setBulkText(e.target.value); setBulkPreview(null) }}
              rows={8}
              className="input-field font-mono text-sm resize-y"
              placeholder={"1: 1000\n2: 1500\n3: 1200\n..."}
            />
            <button onClick={parseBulk} className="btn-secondary mt-3">
              Preview Changes
            </button>

            {bulkPreview && (
              <div className="mt-4 space-y-3 animate-fade-up">
                {bulkPreview.notFound.length > 0 && (
                  <div className="p-4 bg-rust-50 border border-rust-100 rounded-xl text-sm text-rust-700">
                    <p className="font-semibold mb-1 flex items-center gap-1.5"><AlertCircle size={14} /> Could not match:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {bulkPreview.notFound.map((x, i) => <li key={i}>{x}</li>)}
                    </ul>
                  </div>
                )}
                {bulkPreview.results.length > 0 && (
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2.5 text-left section-label">Room</th>
                          <th className="px-4 py-2.5 text-left section-label">Tenant</th>
                          <th className="px-4 py-2.5 text-left section-label">Old Deposit</th>
                          <th className="px-4 py-2.5 text-left section-label">New Deposit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {bulkPreview.results.map(({ tenant, newDeposit }) => (
                          <tr key={tenant.id}>
                            <td className="px-4 py-2.5 font-mono text-xs text-gray-500 tabular">{tenant.unit}</td>
                            <td className="px-4 py-2.5 font-medium text-charcoal-900">{tenant.name}</td>
                            <td className="px-4 py-2.5 text-gray-500 tabular">{tenant.deposit ? `AED ${Number(tenant.deposit).toLocaleString()}` : '—'}</td>
                            <td className="px-4 py-2.5 font-semibold text-emerald2-600 tabular">AED {newDeposit.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50">
                      <span className="text-sm text-gray-600">{bulkPreview.results.length} tenants will be updated</span>
                      <button onClick={applyBulk} disabled={bulkSaving} className="btn-primary flex items-center gap-2 min-h-[44px] disabled:opacity-60">
                        {bulkSaving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                        Apply All
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Deposit list ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="font-display text-xl text-charcoal-900 leading-tight">All Tenants — Deposits</h2>
          <span className="gold-rule" />
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search room, name, villa…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search deposits"
            className="input-field pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card !p-4 h-20 skeleton" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="card p-12 text-center animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-charcoal-900 flex items-center justify-center mx-auto mb-4">
            <Wallet size={30} className="text-primary-400" />
          </div>
          <h3 className="font-display text-lg text-charcoal-900">No tenants found</h3>
          <p className="text-gray-400 text-sm mt-1">
            {search ? 'No tenants match your search.' : 'No tenants are recorded yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 stagger">
            {displayed.map(tenant => (
              <div key={tenant.id} className="card !p-4 transition-shadow duration-200 hover:shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Identity */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl flex items-center justify-center text-primary-700 font-display font-bold text-base flex-shrink-0 shadow-card">
                      {tenant.name?.charAt(0).toUpperCase() || 'T'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold text-charcoal-900 text-[15px] leading-tight truncate">{tenant.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        Room {tenant.unit || '—'}{tenant.property ? ` · ${tenant.property}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="pl-14 sm:pl-0 sm:text-right sm:min-w-[140px]">
                    {editId === tenant.id ? (
                      <input
                        type="number"
                        min="0"
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveDeposit(tenant); if (e.key === 'Escape') setEditId(null) }}
                        aria-label={`Deposit amount for ${tenant.name}`}
                        className="input-field py-2 w-32 text-sm tabular"
                        autoFocus
                      />
                    ) : tenant.deposit > 0 ? (
                      <p className="font-display font-bold text-charcoal-900 text-base tabular leading-tight">AED {Number(tenant.deposit).toLocaleString()}</p>
                    ) : (
                      <span className="badge-unpaid">Not set</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pl-14 sm:pl-0 flex-shrink-0">
                    {editId === tenant.id ? (
                      <>
                        <button
                          onClick={() => saveDeposit(tenant)}
                          disabled={saving}
                          aria-label="Save deposit"
                          className="flex items-center justify-center gap-1.5 min-h-[44px] px-4 text-xs font-bold bg-gradient-to-r from-primary-500 to-primary-600 text-charcoal-900 rounded-xl shadow-glow-sm hover:from-primary-400 hover:to-primary-500 transition-all disabled:opacity-60"
                        >
                          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          aria-label="Cancel edit"
                          className="flex items-center justify-center min-h-[44px] w-11 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditId(tenant.id); setEditVal(tenant.deposit ? String(tenant.deposit) : '') }}
                          className="flex items-center gap-1.5 min-h-[44px] px-4 text-xs font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors"
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        {tenant.deposit > 0 && (
                          <button
                            onClick={() => returnDeposit(tenant)}
                            disabled={saving}
                            className="flex items-center gap-1.5 min-h-[44px] px-4 text-xs font-bold text-rust-600 bg-rust-50 hover:bg-rust-100 rounded-xl transition-colors disabled:opacity-50"
                          >
                            <RotateCcw size={13} /> Return
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total footer */}
          <div className="card !p-4 mt-3 flex items-center justify-between gap-3 bg-charcoal-900 text-cream">
            <span className="text-sm font-semibold text-gray-300">Total ({tenants.length} tenants)</span>
            <span className="font-display text-lg font-bold text-primary-400 tabular">AED {totalDeposits.toLocaleString()}</span>
          </div>
        </>
      )}
    </div>
  )
}
