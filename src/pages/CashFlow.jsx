import { useMemo, useState, useEffect } from 'react'
import {
  Wallet, Zap, Building2, TrendingDown, Calendar, KeyRound, Landmark, Receipt,
  Pencil, Save, RotateCcw, Loader2, Check, Plus, Trash2,
} from 'lucide-react'
import cashflowData from '../data/cashflowData.json'
import { watchCollection, setDocItem, isDemoMode } from '../data/db'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const LIVE_YEAR = String(new Date().getFullYear())

function aed(n) { return 'AED ' + Math.round(Number(n) || 0).toLocaleString() }
function fmt(n) { return (n === null || n === undefined || isNaN(n)) ? '—' : Math.round(n).toLocaleString() }

const STATIC_YEARS = Object.keys(cashflowData.years || {}).sort()

function blankMonth(month) {
  return { month, ejaar: 0, fewa: 0, other: 0, incoming: 0, total: 0 }
}

function calcTotal(m) {
  return (Number(m.ejaar) || 0) + (Number(m.fewa) || 0) + (Number(m.other) || 0)
}

export default function CashFlow() {
  const [year, setYear] = useState(LIVE_YEAR)
  const [overrides, setOverrides] = useState([]) // cashflowManual docs
  const [editMode, setEditMode] = useState(false)
  const [editMonths, setEditMonths] = useState([]) // array of 12 month objects
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    return watchCollection('cashflowManual', 'updatedAt', 'desc',
      setOverrides, (err) => console.error(err)
    )
  }, [])

  const overrideMap = useMemo(() => {
    const m = {}
    overrides.forEach((o) => { m[o.id] = o })
    return m
  }, [overrides])

  const ALL_YEARS = useMemo(() => {
    const set = new Set([LIVE_YEAR, ...STATIC_YEARS])
    overrides.forEach((o) => { if (o.year) set.add(o.year) })
    return [...set].sort()
  }, [overrides])

  // Resolve data for selected year: Firestore override first, then static JSON
  const yd = useMemo(() => {
    const override = overrideMap[`cashflow__${year}`]
    if (override) return override
    return cashflowData.years?.[year] || { months: [], perVilla: [], totals: {} }
  }, [year, overrideMap])

  const isEdited = !!overrideMap[`cashflow__${year}`]
  const t = yd.totals || {}

  const maxMonth = useMemo(
    () => Math.max(1, ...(yd.months || []).map(m => m.total || calcTotal(m))),
    [yd]
  )
  const perVilla = useMemo(
    () => [...(yd.perVilla || [])]
      .map(v => ({ ...v, total: (v.ejaar || 0) + (v.fewa || 0) }))
      .sort((a, b) => b.total - a.total),
    [yd]
  )

  function startEdit() {
    const existing = (yd.months || []).reduce((acc, m) => { acc[m.month] = { ...m }; return acc }, {})
    const rows = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1
      return existing[m] ? { ...existing[m] } : blankMonth(m)
    })
    setEditMonths(rows)
    setEditMode(true)
  }

  function handleCellChange(monthIdx, field, value) {
    setEditMonths((prev) => {
      const next = [...prev]
      next[monthIdx] = {
        ...next[monthIdx],
        [field]: value === '' ? 0 : Number(value),
      }
      next[monthIdx].total = calcTotal(next[monthIdx])
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const months = editMonths.map((m) => ({ ...m, total: calcTotal(m) }))
      const totals = {
        ejaar:    months.reduce((s, m) => s + (m.ejaar || 0), 0),
        fewa:     months.reduce((s, m) => s + (m.fewa || 0), 0),
        other:    months.reduce((s, m) => s + (m.other || 0), 0),
        incoming: months.reduce((s, m) => s + (m.incoming || 0), 0),
        total:    months.reduce((s, m) => s + calcTotal(m), 0),
      }
      await setDocItem('cashflowManual', `cashflow__${year}`, {
        year,
        months,
        perVilla: yd.perVilla || [],
        totals,
      })
      setEditMode(false)
      setSaveMsg('Cash flow saved!')
      setTimeout(() => setSaveMsg(''), 3000)
    } catch (err) {
      alert('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const cards = [
    { label: 'Ejaar Paid (to owners)', value: t.ejaar, icon: KeyRound, accent: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'FEWA (utilities)',       value: t.fewa,  icon: Zap,      accent: 'text-amber-600',   bg: 'bg-amber-50' },
    { label: 'Other (wifi / bus)',     value: t.other, icon: Receipt,  accent: 'text-charcoal-700', bg: 'bg-gray-100' },
  ]

  // Computed totals in edit mode
  const editTotals = useMemo(() => {
    if (!editMode) return {}
    return {
      ejaar:    editMonths.reduce((s, m) => s + (m.ejaar || 0), 0),
      fewa:     editMonths.reduce((s, m) => s + (m.fewa || 0), 0),
      other:    editMonths.reduce((s, m) => s + (m.other || 0), 0),
      incoming: editMonths.reduce((s, m) => s + (m.incoming || 0), 0),
      total:    editMonths.reduce((s, m) => s + calcTotal(m), 0),
    }
  }, [editMode, editMonths])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Cash Flow</h1>
          <span className="gold-rule" />
          <p className="text-sm text-gray-500 mt-3">
            Money going out — ejaar paid to owners, FEWA, &amp; other costs. Enter values manually per month.
            {isDemoMode && ' (Demo mode)'}
          </p>
        </div>
        {saveMsg && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald2-50 text-emerald2-700 text-sm font-semibold animate-pop">
            <Check size={15} /> {saveMsg}
          </div>
        )}
      </div>

      {/* Year selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {ALL_YEARS.map(y => (
          <button
            key={y}
            onClick={() => { setYear(y); setEditMode(false) }}
            aria-pressed={year === y}
            className={`min-h-[44px] px-6 rounded-2xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 border ${
              year === y
                ? 'bg-charcoal-900 text-primary-400 border-charcoal-900 shadow-card'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-700'
            }`}
          >
            {y}{isEdited && y === year ? ' · edited' : ''}
          </button>
        ))}
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-charcoal-800 via-charcoal-900 to-charcoal-950 text-cream p-6 sm:p-8 mb-5 shadow-premium border-t border-primary-500/30">
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-primary-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-500/15 ring-1 ring-primary-400/30 flex items-center justify-center flex-shrink-0">
            <TrendingDown size={24} className="text-primary-400" />
          </div>
          <div className="min-w-0">
            <p className="section-label !text-primary-300/80">Total Money Out — {year}</p>
            <p className="font-display text-3xl sm:text-4xl font-bold text-primary-400 mt-1 tabular leading-tight">
              {aed(editMode ? editTotals.total : (t.total || 0))}
            </p>
            <p className="text-xs text-gray-400 mt-1.5">
              ejaar + FEWA + other expenses
              {isEdited && <span className="ml-2 text-primary-400">· manually entered</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Breakdown cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 stagger">
        {cards.map(c => {
          const Icon = c.icon
          const val = editMode ? editTotals[c.label.includes('Ejaar') ? 'ejaar' : c.label.includes('FEWA') ? 'fewa' : 'other'] : c.value
          return (
            <div key={c.label} className="stat-card">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={22} className={c.accent} />
                </div>
                <div className="min-w-0">
                  <p className="section-label">{c.label}</p>
                  <p className="font-display text-2xl font-bold text-charcoal-900 mt-1 tabular leading-tight">{aed(val)}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Monthly breakdown — editable */}
      <div className={`card overflow-hidden mb-6 ${editMode ? 'ring-2 ring-primary-400/50' : ''}`}>
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <Calendar size={18} className="text-primary-700" />
            </div>
            <div>
              <h2 className="font-display text-lg text-charcoal-900">
                Monthly outflow — {year}
                {editMode && <span className="ml-2 text-xs font-normal text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">editing</span>}
              </h2>
              <span className="gold-rule" />
            </div>
          </div>
          {!editMode ? (
            <button
              onClick={startEdit}
              className="flex items-center gap-1.5 min-h-[40px] px-4 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-xl transition-colors flex-shrink-0"
            >
              <Pencil size={13} /> Edit Outflows
            </button>
          ) : (
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setEditMode(false)}
                className="flex items-center gap-1 min-h-[40px] px-3 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <RotateCcw size={12} /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 min-h-[40px] px-4 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
              </button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b border-gray-200 text-left ${editMode ? 'bg-primary-50' : 'bg-gray-50'}`}>
                <th className="px-4 py-3 text-2xs font-bold text-gray-500 uppercase tracking-[0.14em]">Month</th>
                <th className="px-4 py-3 text-2xs font-bold text-gray-500 uppercase tracking-[0.14em] text-right">Ejaar</th>
                <th className="px-4 py-3 text-2xs font-bold text-gray-500 uppercase tracking-[0.14em] text-right">FEWA</th>
                <th className="px-4 py-3 text-2xs font-bold text-gray-500 uppercase tracking-[0.14em] text-right">Other</th>
                <th className="px-4 py-3 text-2xs font-bold text-gray-500 uppercase tracking-[0.14em] text-right">Incoming</th>
                <th className="px-4 py-3 text-2xs font-bold text-gray-500 uppercase tracking-[0.14em] text-right">Total Out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {editMode ? (
                editMonths.map((m, mi) => (
                  <tr key={m.month} className="odd:bg-white even:bg-gray-50/40">
                    <td className="px-4 py-2 font-semibold text-charcoal-900">{MONTHS[m.month - 1]}</td>
                    {['ejaar', 'fewa', 'other', 'incoming'].map((field) => (
                      <td key={field} className="px-2 py-1.5 text-right">
                        <input
                          type="number"
                          min="0"
                          value={m[field] || ''}
                          onChange={(e) => handleCellChange(mi, field, e.target.value)}
                          placeholder="0"
                          className={`w-24 px-2 py-1.5 border rounded-lg text-xs text-right tabular focus:outline-none ${
                            field === 'ejaar' ? 'border-primary-200 focus:border-primary-400' :
                            field === 'fewa'  ? 'border-amber-200 focus:border-amber-400' :
                            field === 'incoming' ? 'border-emerald2-200 focus:border-emerald2-400' :
                            'border-gray-200 focus:border-gray-400'
                          }`}
                        />
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right tabular font-bold text-charcoal-900">
                      {calcTotal(m) > 0 ? calcTotal(m).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                (yd.months || []).map(m => (
                  <tr key={m.month} className={`odd:bg-white even:bg-gray-50/40 hover:bg-primary-50/40 transition-colors ${(m.total || calcTotal(m)) === 0 ? 'opacity-40' : ''}`}>
                    <td className="px-4 py-3 font-semibold text-charcoal-900">{MONTHS[m.month - 1]}</td>
                    <td className="px-4 py-3 text-right tabular text-gray-700">{m.ejaar ? m.ejaar.toLocaleString() : '—'}</td>
                    <td className="px-4 py-3 text-right tabular text-amber-700">{m.fewa ? m.fewa.toLocaleString() : '—'}</td>
                    <td className="px-4 py-3 text-right tabular text-gray-500">{m.other ? m.other.toLocaleString() : '—'}</td>
                    <td className="px-4 py-3 text-right tabular text-emerald2-700">{m.incoming ? m.incoming.toLocaleString() : '—'}</td>
                    <td className="px-4 py-3 text-right tabular font-bold text-charcoal-900">{(m.total || calcTotal(m)) ? (m.total || calcTotal(m)).toLocaleString() : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-charcoal-900 text-white">
                <td className="px-4 py-3 text-sm font-semibold">Total {year}</td>
                {editMode ? (
                  <>
                    <td className="px-4 py-3 text-right tabular font-bold text-primary-400">{(editTotals.ejaar || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular font-bold text-primary-400">{(editTotals.fewa || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular font-bold text-primary-400">{(editTotals.other || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular font-bold text-emerald2-400">{(editTotals.incoming || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular font-bold text-primary-400">{(editTotals.total || 0).toLocaleString()}</td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-right tabular font-bold text-primary-400">{(t.ejaar || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular font-bold text-primary-400">{(t.fewa || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular font-bold text-primary-400">{(t.other || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular font-bold text-emerald2-400">{(t.incoming || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular font-bold text-primary-400">{(t.total || 0).toLocaleString()}</td>
                  </>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Per-villa breakdown (outgoing only) */}
      {perVilla.length > 0 && !editMode && (
        <div className="card overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <Building2 size={18} className="text-primary-700" />
            </div>
            <div>
              <h2 className="font-display text-lg text-charcoal-900">Per villa — {year}</h2>
              <span className="gold-rule" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-4 py-3 text-2xs font-bold text-gray-500 uppercase tracking-[0.14em]">Villa</th>
                  <th className="px-4 py-3 text-2xs font-bold text-gray-500 uppercase tracking-[0.14em] text-right">Ejaar (year)</th>
                  <th className="px-4 py-3 text-2xs font-bold text-gray-500 uppercase tracking-[0.14em] text-right">FEWA (year)</th>
                  <th className="px-4 py-3 text-2xs font-bold text-gray-500 uppercase tracking-[0.14em] text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {perVilla.map(v => (
                  <tr key={v.villa} className="odd:bg-white even:bg-gray-50/40 hover:bg-primary-50/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-charcoal-900">{v.villa}</td>
                    <td className="px-4 py-3 text-right tabular text-gray-700">{v.ejaar ? v.ejaar.toLocaleString() : '—'}</td>
                    <td className="px-4 py-3 text-right tabular text-amber-700">{v.fewa ? v.fewa.toLocaleString() : '—'}</td>
                    <td className="px-4 py-3 text-right tabular font-bold text-charcoal-900">{v.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center mt-6">
        Tap <strong>Edit Outflows</strong> to enter monthly costs manually. Values are saved to Firestore and override the imported data.
      </p>
    </div>
  )
}
