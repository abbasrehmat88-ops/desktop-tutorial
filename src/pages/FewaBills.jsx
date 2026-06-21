import { useMemo, useState, useEffect } from 'react'
import { Zap, Calendar, Building2, Receipt, Flame, Pencil, Save, RotateCcw, Check, Loader2 } from 'lucide-react'
import businessData from '../data/businessData.json'
import { watchCollection, setDocItem, isDemoMode } from '../data/db'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const FEWA_KEY = 'Electricity (FEWA)'
const LIVE_YEAR = String(new Date().getFullYear())

const fmt = (n) => (n === null || n === undefined || Number.isNaN(n) ? '—' : Math.round(n).toLocaleString())
const aed = (n) => 'AED ' + Math.round(Number(n) || 0).toLocaleString()
const sumNonNull = (arr) => (arr || []).reduce((s, v) => (v === null || v === undefined ? s : s + v), 0)

const VILLAS = businessData.villas || []

export default function FewaBills() {
  const [year, setYear] = useState(LIVE_YEAR)
  const [overrides, setOverrides] = useState([]) // fewaRecords docs
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({}) // { [villaId]: monthly[12] }
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    return watchCollection('fewaRecords', 'updatedAt', 'desc',
      setOverrides, (err) => console.error(err)
    )
  }, [])

  const overrideMap = useMemo(() => {
    const m = {}
    overrides.forEach((o) => { m[o.id] = o })
    return m
  }, [overrides])

  // All years: static JSON + LIVE_YEAR + any override years
  const ALL_YEARS = useMemo(() => {
    const set = new Set([LIVE_YEAR])
    VILLAS.forEach((v) =>
      Object.entries(v.years || {}).forEach(([y, d]) => {
        if (d.expenses?.[FEWA_KEY]) set.add(y)
      })
    )
    overrides.forEach((o) => { if (o.year) set.add(o.year) })
    return [...set].sort()
  }, [overrides])

  // Resolved rows for the selected year
  const rows = useMemo(() => {
    return VILLAS.map((v) => {
      const overrideKey = `${v.id}__fewa__${year}`
      const override = overrideMap[overrideKey]
      const staticFewa = v.years?.[year]?.expenses?.[FEWA_KEY]
      let monthly, isEdited

      if (override) {
        monthly = override.monthly || Array(12).fill(null)
        isEdited = true
      } else if (staticFewa) {
        monthly = staticFewa.monthly || Array(12).fill(null)
        isEdited = false
      } else if (year === LIVE_YEAR) {
        monthly = Array(12).fill(null)
        isEdited = false
      } else {
        return null
      }

      const total = sumNonNull(monthly)
      return { id: v.id, num: v.num, name: v.name, monthly, total, isEdited }
    }).filter(Boolean)
  }, [year, overrideMap])

  const monthTotals = useMemo(() => {
    const t = Array(12).fill(0)
    const any = Array(12).fill(false)
    rows.forEach((r) =>
      r.monthly.forEach((v, i) => {
        if (v !== null && v !== undefined) { t[i] += v; any[i] = true }
      })
    )
    return t.map((v, i) => (any[i] ? v : null))
  }, [rows])

  const grandTotal = useMemo(() => rows.reduce((s, r) => s + r.total, 0), [rows])
  const peakMonth = useMemo(() => {
    let bi = -1, bv = -1
    monthTotals.forEach((v, i) => { if ((v || 0) > bv) { bv = v || 0; bi = i } })
    return bi >= 0 && bv > 0 ? { label: MONTHS[bi], value: bv } : null
  }, [monthTotals])
  const avgPerVilla = rows.length ? grandTotal / rows.length : 0

  function startEdit() {
    const init = {}
    rows.forEach((r) => { init[r.id] = [...r.monthly] })
    setEditData(init)
    setEditMode(true)
  }

  function handleCellChange(villaId, monthIdx, value) {
    setEditData((prev) => {
      const monthly = [...(prev[villaId] || Array(12).fill(null))]
      monthly[monthIdx] = value === '' ? null : Number(value)
      return { ...prev, [villaId]: monthly }
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      await Promise.all(
        VILLAS.map(async (v) => {
          const monthly = editData[v.id]
          if (!monthly) return
          const overrideKey = `${v.id}__fewa__${year}`
          await setDocItem('fewaRecords', overrideKey, {
            villaId: v.id,
            villaName: v.name,
            villaNum: v.num,
            year,
            monthly,
            total: sumNonNull(monthly),
          })
        })
      )
      setEditMode(false)
      setSaveMsg('FEWA bills saved!')
      setTimeout(() => setSaveMsg(''), 3000)
    } catch (err) {
      alert('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const cards = [
    { label: `Total FEWA — ${year}`, value: aed(grandTotal), icon: Zap, accent: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Avg per Villa', value: aed(avgPerVilla), icon: Building2, accent: 'text-primary-600', bg: 'bg-primary-50' },
    { label: peakMonth ? `Peak — ${peakMonth.label}` : 'Peak Month', value: peakMonth ? aed(peakMonth.value) : '—', icon: Flame, accent: 'text-rust-600', bg: 'bg-rust-50' },
  ]

  // Computed edit totals
  const editMonthTotals = useMemo(() => {
    if (!editMode) return []
    const t = Array(12).fill(0)
    VILLAS.forEach((v) => {
      const m = editData[v.id] || []
      m.forEach((v2, i) => { if (v2 !== null) t[i] += v2 })
    })
    return t
  }, [editMode, editData])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="section-label mb-1">Utilities</p>
          <h1 className="page-title">FEWA Bills</h1>
          <span className="gold-rule" />
          <p className="text-sm text-gray-500 mt-3">
            Federal Electricity &amp; Water Authority charges per villa — enter actual bills manually.
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
        {ALL_YEARS.map((y) => (
          <button
            key={y}
            onClick={() => { setYear(y); setEditMode(false) }}
            aria-pressed={year === y}
            className={`min-h-[44px] px-5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 border ${
              year === y
                ? 'bg-charcoal-900 text-primary-400 border-charcoal-900 shadow-card'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-700'
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-charcoal-800 via-charcoal-900 to-charcoal-950 text-cream p-6 sm:p-8 mb-5 shadow-premium border-t border-primary-500/30">
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 ring-1 ring-amber-400/30 flex items-center justify-center flex-shrink-0">
            <Zap size={24} className="text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="section-label !text-primary-300/80">Total FEWA — {year}</p>
            <p className="font-display text-3xl sm:text-4xl font-bold text-amber-400 mt-1 tabular leading-tight">{aed(grandTotal)}</p>
            <p className="text-xs text-gray-400 mt-1.5">{rows.length} villas · electricity &amp; water</p>
          </div>
        </div>
      </div>

      {/* Breakdown cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 stagger">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="stat-card">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={22} className={c.accent} />
                </div>
                <div className="min-w-0">
                  <p className="section-label">{c.label}</p>
                  <p className="font-display text-2xl font-bold text-charcoal-900 mt-1 tabular leading-tight">{c.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Monthly grid */}
      <div className={`card overflow-hidden mb-6 ${editMode ? 'ring-2 ring-amber-400/50' : ''}`}>
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Calendar size={18} className="text-amber-700" />
            </div>
            <div>
              <h2 className="font-display text-lg text-charcoal-900">
                Monthly bills by villa — {year}
                {editMode && <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">editing</span>}
              </h2>
              <span className="gold-rule" />
            </div>
          </div>
          {!editMode ? (
            <button
              onClick={startEdit}
              className="flex items-center gap-1.5 min-h-[40px] px-4 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors flex-shrink-0"
            >
              <Pencil size={13} /> Edit Bills
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
                className="flex items-center gap-1 min-h-[40px] px-4 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save All
              </button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className={`text-gray-500 uppercase text-[10px] font-semibold ${editMode ? 'bg-amber-50' : 'bg-gray-50'}`}>
              <tr>
                <th className={`px-3 py-2.5 text-left whitespace-nowrap sticky left-0 ${editMode ? 'bg-amber-50' : 'bg-gray-50'}`}>Villa</th>
                {MONTHS.map((m) => <th key={m} className="px-2.5 py-2.5 text-right whitespace-nowrap">{m}</th>)}
                <th className="px-3 py-2.5 text-right whitespace-nowrap">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {editMode ? (
                // Edit mode rows
                VILLAS.map((v) => {
                  const monthly = editData[v.id] || Array(12).fill(null)
                  const total = sumNonNull(monthly)
                  return (
                    <tr key={v.id} className="bg-white hover:bg-amber-50/30">
                      <td className="px-3 py-1.5 font-medium text-charcoal-900 whitespace-nowrap sticky left-0 bg-white">{v.name}</td>
                      {monthly.map((val, mi) => (
                        <td key={mi} className="px-1 py-1">
                          <input
                            type="number"
                            min="0"
                            value={val ?? ''}
                            onChange={(e) => handleCellChange(v.id, mi, e.target.value)}
                            placeholder="—"
                            className="w-16 px-1 py-1.5 border border-gray-200 rounded-lg text-xs text-right tabular focus:border-amber-400 focus:outline-none"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-1.5 text-right tabular font-bold text-amber-700 whitespace-nowrap">
                        {total > 0 ? total.toLocaleString() : '—'}
                      </td>
                    </tr>
                  )
                })
              ) : (
                // View mode rows
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-charcoal-900 whitespace-nowrap sticky left-0 bg-white">
                      {r.name}
                      {r.isEdited && <span className="ml-1.5 text-[9px] font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-full uppercase">edited</span>}
                    </td>
                    {r.monthly.map((v, j) => (
                      <td key={j} className="px-2.5 py-2.5 text-right tabular text-gray-700">{fmt(v)}</td>
                    ))}
                    <td className="px-3 py-2.5 text-right tabular font-bold text-amber-700">{fmt(r.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-charcoal-900 text-white">
                <td className="px-3 py-3 text-sm font-semibold whitespace-nowrap sticky left-0 bg-charcoal-900">All villas</td>
                {(editMode ? editMonthTotals : monthTotals).map((v, j) => (
                  <td key={j} className="px-2.5 py-3 text-right tabular font-semibold text-primary-400">
                    {v ? v.toLocaleString() : '—'}
                  </td>
                ))}
                <td className="px-3 py-3 text-right tabular font-bold text-primary-400">
                  {editMode
                    ? editMonthTotals.reduce((s, v) => s + (v || 0), 0).toLocaleString()
                    : fmt(grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Per-villa summary (ranked, with bar) */}
      {!editMode && rows.filter(r => r.total > 0).length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <Receipt size={18} className="text-primary-700" />
            </div>
            <div>
              <h2 className="font-display text-lg text-charcoal-900">Yearly FEWA per villa — {year}</h2>
              <span className="gold-rule" />
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {[...rows].filter(r => r.total > 0).sort((a, b) => b.total - a.total).map((r) => {
              const maxTotal = Math.max(...rows.map(x => x.total), 1)
              const pct = Math.round((r.total / maxTotal) * 100)
              return (
                <div key={r.id} className="px-5 sm:px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50/60 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-charcoal-900 flex items-center justify-center font-display font-bold text-sm shrink-0">
                    {r.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-charcoal-900 text-sm truncate">{r.name}</p>
                      <p className="font-bold text-amber-700 tabular text-sm shrink-0">{aed(r.total)}</p>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-primary-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center mt-6">
        Tap <strong>Edit Bills</strong> to enter actual FEWA amounts for any month and villa. Values are saved and sync across devices.
      </p>
    </div>
  )
}
