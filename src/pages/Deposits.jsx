import React, { useState, useEffect } from 'react'
import { watchCollection, updateItem } from '../data/db'
import { Landmark, Edit2, Check, X, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

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
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto animate-fade-up">

      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title">Deposits</h1>
        <span className="gold-rule" />
        <p className="text-gray-500 text-sm mt-2">Security deposits held from all tenants</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-2 items-center text-red-700 text-sm">
          <AlertCircle size={16} />{error}
          <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Summary cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-2xl" />
                <div className="flex-1 space-y-2 mt-1">
                  <div className="h-3 bg-gray-200 rounded w-24" />
                  <div className="h-7 bg-gray-200 rounded w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 stagger">
          <div className="stat-card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-charcoal-900 flex items-center justify-center flex-shrink-0">
                <Landmark size={22} className="text-primary-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Held</p>
                <p className="text-2xl font-bold text-charcoal-900 mt-1">AED {totalDeposits.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-0.5">Security deposits in custody</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald2-50 flex items-center justify-center flex-shrink-0">
                <Check size={22} className="text-emerald2-600" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">With Deposit</p>
                <p className="text-2xl font-bold text-charcoal-900 mt-1">{withDeposit}</p>
                <p className="text-xs text-gray-400 mt-0.5">Tenants with deposit recorded</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rust-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={22} className="text-rust-600" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">No Deposit</p>
                <p className="text-2xl font-bold text-charcoal-900 mt-1">{withoutDeposit}</p>
                <p className="text-xs text-gray-400 mt-0.5">Deposit not yet recorded</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk import ── */}
      <div className="card mb-6 overflow-hidden">
        <button
          onClick={() => setBulkOpen(o => !o)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="text-left">
            <h2 className="font-display text-lg text-charcoal-900">Bulk Set Deposits</h2>
            <p className="text-sm text-gray-500 mt-0.5">Paste deposit amounts for multiple rooms at once</p>
          </div>
          {bulkOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </button>

        {bulkOpen && (
          <div className="px-6 pb-6 border-t border-gray-100">
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
              <div className="mt-4 space-y-3">
                {bulkPreview.notFound.length > 0 && (
                  <div className="p-3 bg-rust-50 border border-rust-100 rounded-xl text-sm text-rust-700">
                    <p className="font-semibold mb-1">Could not match:</p>
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
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Room</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Tenant</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Old Deposit</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">New Deposit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {bulkPreview.results.map(({ tenant, newDeposit }) => (
                          <tr key={tenant.id}>
                            <td className="px-4 py-2 font-mono text-xs text-gray-500">{tenant.unit}</td>
                            <td className="px-4 py-2 font-medium text-charcoal-900">{tenant.name}</td>
                            <td className="px-4 py-2 text-gray-500">{tenant.deposit ? `AED ${Number(tenant.deposit).toLocaleString()}` : '—'}</td>
                            <td className="px-4 py-2 font-semibold text-emerald2-600">AED {newDeposit.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                      <span className="text-sm text-gray-600">{bulkPreview.results.length} tenants will be updated</span>
                      <button onClick={applyBulk} disabled={bulkSaving} className="btn-primary flex items-center gap-2">
                        {bulkSaving ? <span className="animate-spin">⏳</span> : <Check size={15} />}
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
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl text-charcoal-900">All Tenants — Deposits</h2>
            <span className="gold-rule" />
          </div>
          <input
            type="text"
            placeholder="Search room, name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field w-44 py-2 text-sm"
          />
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Room</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tenant</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Villa</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deposit (AED)</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayed.map(tenant => (
                  <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-gray-500 font-semibold">{tenant.unit}</td>
                    <td className="px-5 py-3 font-medium text-charcoal-900">{tenant.name}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs hidden sm:table-cell">{tenant.property || '—'}</td>
                    <td className="px-5 py-3">
                      {editId === tenant.id ? (
                        <input
                          type="number"
                          min="0"
                          value={editVal}
                          onChange={e => setEditVal(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveDeposit(tenant); if (e.key === 'Escape') setEditId(null) }}
                          className="input-field py-1.5 w-28 text-sm"
                          autoFocus
                        />
                      ) : (
                        <span className={tenant.deposit > 0
                          ? 'font-semibold text-charcoal-900'
                          : 'text-gray-400 italic'}>
                          {tenant.deposit > 0 ? Number(tenant.deposit).toLocaleString() : 'Not set'}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {editId === tenant.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => saveDeposit(tenant)}
                            disabled={saving}
                            className="p-1.5 bg-emerald2-50 text-emerald2-600 rounded-lg hover:bg-emerald2-600 hover:text-white transition-colors"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setEditId(null)}
                            className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditId(tenant.id); setEditVal(tenant.deposit ? String(tenant.deposit) : '') }}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td colSpan={3} className="px-5 py-3 text-sm font-semibold text-gray-700">
                    Total ({tenants.length} tenants)
                  </td>
                  <td className="px-5 py-3 text-sm font-bold text-charcoal-900">
                    {totalDeposits.toLocaleString()}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
