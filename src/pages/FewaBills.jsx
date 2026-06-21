import { useMemo, useState, useEffect } from 'react'
import {
  Zap, Calendar, Building2, Receipt, Flame, Pencil, Save,
  RotateCcw, Check, Loader2, TrendingUp, TrendingDown, Minus,
  BarChart2, ChevronDown, ChevronUp,
} from 'lucide-react'
import businessData from '../data/businessData.json'
import { watchCollection, setDocItem, isDemoMode } from '../data/db'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const FEWA_KEY = 'Electricity (FEWA)'
const LIVE_YEAR = String(new Date().getFullYear())
const VILLAS = businessData.villas || []

const fmt = (n) => (n === null || n === undefined || Number.isNaN(n) ? '—' : Math.round(n).toLocaleString())
const aed = (n) => 'AED ' + Math.round(Number(n) || 0).toLocaleString()
const sumNonNull = (arr) => (arr || []).reduce((s, v) => (v === null || v === undefined ? s : s + v), 0)

// Summer months (Jun-Sep) tend to be highest due to AC usage
const MONTH_SEASON = [0, 0, 0, 1, 1, 2, 2, 2, 2, 1, 0, 0] // 0=cool,1=warm,2=peak

export default function FewaBills() {
  const [year, setYear] = useState(LIVE_YEAR)
  const [overrides, setOverrides] = useState([])
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [showAllYears, setShowAllYears] = useState(false)

  useEffect(() => {
    return watchCollection('fewaRecords', 'updatedAt', 'desc', setOverrides, (err) => console.error(err))
  }, [])

  const overrideMap = useMemo(() => {
    const m = {}
    overrides.forEach((o) => { m[o.id] = o })
    return m
  }, [overrides])

  // All years with FEWA data across all villas
  const ALL_YEARS = useMemo(() => {
    const set = new Set([LIVE_YEAR])
    VILLAS.forEach((v) =>
      Object.entries(v.years || {}).forEach(([y, d]) => {
        if (d.expenses?.[FEWA_KEY]?.total) set.add(y)
      })
    )
    overrides.forEach((o) => { if (o.year) set.add(o.year) })
    return [...set].sort()
  }, [overrides])

  // Yearly grand totals for year selector badges
  const yearTotals = useMemo(() => {
    const map = {}
    ALL_YEARS.forEach((y) => {
      let total = 0
      VILLAS.forEach((v) => {
        const ok = `${v.id}__fewa__${y}`
        const ov = overrideMap[ok]
        const fewa = ov ? ov : v.years?.[y]?.expenses?.[FEWA_KEY]
        total += sumNonNull(fewa?.monthly)
      })
      map[y] = total
    })
    return map
  }, [ALL_YEARS, overrideMap])

  // Resolved rows for selected year
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

  const peakMonthIdx = useMemo(() => {
    let bi = -1, bv = -1
    monthTotals.forEach((v, i) => { if ((v || 0) > bv) { bv = v || 0; bi = i } })
    return bi >= 0 && bv > 0 ? bi : -1
  }, [monthTotals])

  const topVilla = useMemo(() => {
    const active = rows.filter((r) => r.total > 0)
    return active.length ? active.reduce((a, b) => (b.total > a.total ? b : a)) : null
  }, [rows])

  const avgPerVilla = rows.filter((r) => r.total > 0).length
    ? grandTotal / rows.filter((r) => r.total > 0).length
    : 0

  // Year-over-year change
  const prevYear = String(Number(year) - 1)
  const prevTotal = useMemo(() => {
    let t = 0
    VILLAS.forEach((v) => {
      const ok = `${v.id}__fewa__${prevYear}`
      const ov = overrideMap[ok]
      const fewa = ov ? ov : v.years?.[prevYear]?.expenses?.[FEWA_KEY]
      t += sumNonNull(fewa?.monthly)
    })
    return t
  }, [prevYear, overrideMap])

  const yoyChange = prevTotal > 0 ? ((grandTotal - prevTotal) / prevTotal) * 100 : null

  // All-years matrix for the overview table
  const allYearsMatrix = useMemo(() => {
    return VILLAS.map((v) => {
      const byYear = {}
      ALL_YEARS.forEach((y) => {
        const ok = `${v.id}__fewa__${y}`
        const ov = overrideMap[ok]
        const fewa = ov ? ov : v.years?.[y]?.expenses?.[FEWA_KEY]
        byYear[y] = fewa ? sumNonNull(fewa.monthly) : null
      })
      const grandSum = Object.values(byYear).reduce((s, v) => s + (v || 0), 0)
      return { id: v.id, num: v.num, name: v.name, byYear, grandSum }
    }).filter((r) => r.grandSum > 0)
  }, [ALL_YEARS, overrideMap])

  // Edit mode helpers
  const editMonthTotals = useMemo(() => {
    if (!editMode) return []
    const t = Array(12).fill(0)
    VILLAS.forEach((v) => {
      const m = editData[v.id] || []
      m.forEach((v2, i) => { if (v2 !== null && v2 !== undefined) t[i] += Number(v2) || 0 })
    })
    return t
  }, [editMode, editData])

  function startEdit() {
    const init = {}
    rows.forEach((r) => { init[r.id] = [...r.monthly] })
    VILLAS.forEach((v) => { if (!init[v.id]) init[v.id] = Array(12).fill(null) })
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
          const hasData = monthly.some((x) => x !== null && x !== undefined && x !== 0)
          if (!hasData) return
          const overrideKey = `${v.id}__fewa__${year}`
          await setDocItem('fewaRecords', overrideKey, {
            villaId: v.id, villaName: v.name, villaNum: v.num,
            year, monthly, total: sumNonNull(monthly),
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

  const maxMonthTotal = Math.max(...monthTotals.filter(Boolean), 1)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="section-label mb-1">Utilities</p>
          <h1 className="page-title">FEWA Bills</h1>
          <span className="gold-rule" />
          <p className="text-sm text-gray-500 mt-3">
            Federal Electricity &amp; Water Authority charges per villa — all years from Excel data.
            {isDemoMode && ' (Demo mode)'}
          </p>
        </div>
        {saveMsg && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold animate-pop">
            <Check size={15} /> {saveMsg}
          </div>
        )}
      </div>

      {/* Year selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {ALL_YEARS.map((y) => {
          const tot = yearTotals[y] || 0
          const isActive = year === y
          return (
            <button
              key={y}
              onClick={() => { setYear(y); setEditMode(false) }}
              aria-pressed={isActive}
              className={`min-h-[44px] px-4 rounded-2xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 border flex flex-col items-center ${
                isActive
                  ? 'bg-charcoal-900 text-primary-400 border-charcoal-900 shadow-card'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-700'
              }`}
            >
              <span>{y}</span>
              {tot > 0 && (
                <span className={`text-[10px] font-medium mt-0.5 ${isActive ? 'text-primary-300/70' : 'text-gray-400'}`}>
                  {(tot / 1000).toFixed(0)}k
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-charcoal-800 via-charcoal-900 to-charcoal-950 text-cream p-6 sm:p-8 mb-5 shadow-premium border-t border-primary-500/30">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-6 bottom-0 w-32 h-32 rounded-full bg-primary-400/5 blur-2xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 ring-1 ring-amber-400/30 flex items-center justify-center flex-shrink-0">
              <Zap size={24} className="text-amber-400" />
            </div>
            <div>
              <p className="section-label !text-primary-300/80">Total FEWA — {year}</p>
              <p className="font-display text-3xl sm:text-4xl font-bold text-amber-400 mt-1 tabular leading-tight">{aed(grandTotal)}</p>
              <p className="text-xs text-gray-400 mt-1.5">
                {rows.filter((r) => r.total > 0).length} villas · electricity &amp; water
              </p>
            </div>
          </div>
          {yoyChange !== null && (
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl backdrop-blur-sm ${
              yoyChange > 0 ? 'bg-red-500/15 text-red-300' : yoyChange < 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-gray-500/15 text-gray-300'
            }`}>
              {yoyChange > 5 ? <TrendingUp size={16} /> : yoyChange < -5 ? <TrendingDown size={16} /> : <Minus size={16} />}
              <div>
                <p className="text-xs font-semibold">{yoyChange > 0 ? '+' : ''}{yoyChange.toFixed(1)}% vs {prevYear}</p>
                <p className="text-[10px] opacity-70">year-over-year</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 stagger">
        <div className="stat-card">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Zap size={18} className="text-amber-700" />
            </div>
            <div className="min-w-0">
              <p className="section-label">Yearly Total</p>
              <p className="font-display text-xl font-bold text-charcoal-900 mt-0.5 tabular leading-tight">{aed(grandTotal)}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{year}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <Building2 size={18} className="text-primary-700" />
            </div>
            <div className="min-w-0">
              <p className="section-label">Avg / Villa</p>
              <p className="font-display text-xl font-bold text-charcoal-900 mt-0.5 tabular leading-tight">{aed(avgPerVilla)}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{rows.filter((r) => r.total > 0).length} active</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rust-50 flex items-center justify-center flex-shrink-0">
              <Flame size={18} className="text-rust-600" />
            </div>
            <div className="min-w-0">
              <p className="section-label">Peak Month</p>
              <p className="font-display text-xl font-bold text-charcoal-900 mt-0.5 tabular leading-tight">
                {peakMonthIdx >= 0 ? MONTHS[peakMonthIdx] : '—'}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {peakMonthIdx >= 0 ? aed(monthTotals[peakMonthIdx]) : '—'}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <BarChart2 size={18} className="text-amber-700" />
            </div>
            <div className="min-w-0">
              <p className="section-label">Highest Villa</p>
              <p className="font-display text-xl font-bold text-charcoal-900 mt-0.5 tabular leading-tight truncate">
                {topVilla ? topVilla.name : '—'}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">{topVilla ? aed(topVilla.total) : '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly bar overview */}
      <div className="card p-5 sm:p-6 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <BarChart2 size={17} className="text-amber-700" />
          </div>
          <div>
            <h2 className="font-display text-base text-charcoal-900">Monthly Pattern — {year}</h2>
            <span className="gold-rule" />
          </div>
        </div>
        <div className="flex items-end gap-1.5 h-20">
          {MONTHS.map((m, i) => {
            const v = monthTotals[i] || 0
            const pct = maxMonthTotal > 0 ? (v / maxMonthTotal) * 100 : 0
            const isPeak = i === peakMonthIdx && v > 0
            const season = MONTH_SEASON[i]
            const barColor = isPeak
              ? 'bg-amber-500'
              : season === 2 ? 'bg-amber-400/70' : season === 1 ? 'bg-primary-400/60' : 'bg-gray-300'
            return (
              <div key={m} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end" style={{ height: '60px' }}>
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ${barColor}`}
                    style={{ height: `${Math.max(pct, v > 0 ? 4 : 0)}%` }}
                  />
                </div>
                <span className={`text-[9px] font-medium ${isPeak ? 'text-amber-700 font-bold' : 'text-gray-400'}`}>{m}</span>
              </div>
            )
          })}
        </div>
        {peakMonthIdx >= 0 && (
          <p className="text-xs text-gray-400 mt-3 text-center">
            Peak: <span className="font-semibold text-amber-700">{MONTHS[peakMonthIdx]} — {aed(monthTotals[peakMonthIdx])}</span>
            {' · '}Summer months (Jun–Sep) typically highest due to cooling demand
          </p>
        )}
      </div>

      {/* Monthly grid table */}
      <div className={`card overflow-hidden mb-6 ${editMode ? 'ring-2 ring-amber-400/50' : ''}`}>
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Calendar size={18} className="text-amber-700" />
            </div>
            <div>
              <h2 className="font-display text-lg text-charcoal-900">
                Monthly Bills by Villa — {year}
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
                <th className={`px-3 py-2.5 text-left whitespace-nowrap sticky left-0 z-10 ${editMode ? 'bg-amber-50' : 'bg-gray-50'}`}>
                  Villa
                </th>
                {MONTHS.map((m, i) => (
                  <th
                    key={m}
                    className={`px-2.5 py-2.5 text-right whitespace-nowrap ${
                      !editMode && i === peakMonthIdx ? 'text-amber-700 bg-amber-50/60' : ''
                    }`}
                  >
                    {m}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-right whitespace-nowrap">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {editMode
                ? VILLAS.map((v) => {
                    const monthly = editData[v.id] || Array(12).fill(null)
                    const total = sumNonNull(monthly)
                    return (
                      <tr key={v.id} className="bg-white hover:bg-amber-50/30">
                        <td className="px-3 py-1.5 font-medium text-charcoal-900 whitespace-nowrap sticky left-0 bg-white z-10">
                          {v.name}
                        </td>
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
                : rows.map((r) => (
                    <tr key={r.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-charcoal-900 whitespace-nowrap sticky left-0 bg-white z-10">
                        {r.name}
                        {r.isEdited && (
                          <span className="ml-1.5 text-[9px] font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-full uppercase">
                            edited
                          </span>
                        )}
                      </td>
                      {r.monthly.map((v, j) => (
                        <td
                          key={j}
                          className={`px-2.5 py-2.5 text-right tabular ${
                            j === peakMonthIdx && v ? 'text-amber-700 font-semibold bg-amber-50/40' : 'text-gray-700'
                          }`}
                        >
                          {fmt(v)}
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-right tabular font-bold text-amber-700">{fmt(r.total)}</td>
                    </tr>
                  ))}
            </tbody>
            <tfoot>
              <tr className="bg-charcoal-900 text-white">
                <td className="px-3 py-3 text-sm font-semibold whitespace-nowrap sticky left-0 bg-charcoal-900 z-10">
                  All villas
                </td>
                {(editMode ? editMonthTotals : monthTotals).map((v, j) => (
                  <td key={j} className={`px-2.5 py-3 text-right tabular font-semibold ${
                    !editMode && j === peakMonthIdx && v ? 'text-amber-400' : 'text-primary-400'
                  }`}>
                    {v ? v.toLocaleString() : '—'}
                  </td>
                ))}
                <td className="px-3 py-3 text-right tabular font-bold text-amber-400">
                  {editMode
                    ? editMonthTotals.reduce((s, v) => s + (v || 0), 0).toLocaleString()
                    : fmt(grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Per-villa ranked summary */}
      {!editMode && rows.filter((r) => r.total > 0).length > 0 && (
        <div className="card overflow-hidden mb-5">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <Receipt size={18} className="text-primary-700" />
            </div>
            <div>
              <h2 className="font-display text-lg text-charcoal-900">Yearly FEWA per Villa — {year}</h2>
              <span className="gold-rule" />
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {[...rows]
              .filter((r) => r.total > 0)
              .sort((a, b) => b.total - a.total)
              .map((r, rank) => {
                const maxTotal = Math.max(...rows.map((x) => x.total), 1)
                const pct = Math.round((r.total / maxTotal) * 100)
                const isTop = rank === 0
                return (
                  <div
                    key={r.id}
                    className={`px-5 sm:px-6 py-3.5 flex items-center gap-4 transition-colors ${
                      isTop ? 'bg-amber-50/40 hover:bg-amber-50/60' : 'hover:bg-gray-50/60'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-display font-bold text-sm shrink-0 ${
                      isTop
                        ? 'bg-gradient-to-br from-amber-400 to-primary-500 text-charcoal-900'
                        : 'bg-gradient-to-br from-primary-400/70 to-primary-600/70 text-charcoal-900'
                    }`}>
                      {rank + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <p className={`font-medium text-sm truncate ${isTop ? 'text-charcoal-900' : 'text-charcoal-700'}`}>
                          {r.name}
                          {isTop && (
                            <span className="ml-2 text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full uppercase">
                              highest
                            </span>
                          )}
                        </p>
                        <p className={`font-bold tabular text-sm shrink-0 ${isTop ? 'text-amber-700' : 'text-gray-700'}`}>
                          {aed(r.total)}
                        </p>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isTop
                              ? 'bg-gradient-to-r from-amber-500 to-primary-400'
                              : 'bg-gradient-to-r from-primary-400/70 to-primary-300/50'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {aed(r.total / 12)} avg/month · {pct}% of max
                      </p>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* All-years overview table */}
      <div className="card overflow-hidden">
        <button
          onClick={() => setShowAllYears(!showAllYears)}
          className="w-full px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3 hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-charcoal-50 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={18} className="text-charcoal-600" />
            </div>
            <div className="text-left">
              <h2 className="font-display text-lg text-charcoal-900">All-Years FEWA Summary</h2>
              <span className="gold-rule" />
            </div>
          </div>
          {showAllYears ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </button>

        {showAllYears && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-charcoal-900 text-white">
                <tr>
                  <th className="px-3 py-3 text-left whitespace-nowrap sticky left-0 bg-charcoal-900 z-10 text-gray-300 uppercase text-[10px]">
                    Villa
                  </th>
                  {ALL_YEARS.map((y) => (
                    <th
                      key={y}
                      className={`px-3 py-3 text-right whitespace-nowrap text-[10px] uppercase ${
                        y === year ? 'text-amber-400' : 'text-gray-300'
                      }`}
                    >
                      {y}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right whitespace-nowrap text-[10px] uppercase text-primary-400">
                    Grand Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allYearsMatrix.map((v) => (
                  <tr key={v.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-charcoal-900 whitespace-nowrap sticky left-0 bg-white z-10">
                      {v.name}
                    </td>
                    {ALL_YEARS.map((y) => (
                      <td
                        key={y}
                        className={`px-3 py-2.5 text-right tabular ${
                          y === year
                            ? 'text-amber-700 font-semibold bg-amber-50/30'
                            : v.byYear[y]
                            ? 'text-gray-700'
                            : 'text-gray-200'
                        }`}
                      >
                        {v.byYear[y] ? Math.round(v.byYear[y]).toLocaleString() : '—'}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-right tabular font-bold text-primary-700">
                      {Math.round(v.grandSum).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-charcoal-900 text-white">
                  <td className="px-3 py-3 text-sm font-semibold whitespace-nowrap sticky left-0 bg-charcoal-900 z-10">
                    All villas
                  </td>
                  {ALL_YEARS.map((y) => {
                    const tot = yearTotals[y] || 0
                    return (
                      <td
                        key={y}
                        className={`px-3 py-3 text-right tabular font-semibold ${
                          y === year ? 'text-amber-400' : 'text-primary-400'
                        }`}
                      >
                        {tot ? Math.round(tot).toLocaleString() : '—'}
                      </td>
                    )
                  })}
                  <td className="px-3 py-3 text-right tabular font-bold text-amber-400">
                    {Math.round(
                      allYearsMatrix.reduce((s, v) => s + v.grandSum, 0)
                    ).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        {!showAllYears && (
          <p className="text-xs text-gray-400 text-center py-3">
            Click to expand all-years comparison ({ALL_YEARS.length} years, {allYearsMatrix.length} villas)
          </p>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center mt-6">
        Tap <strong>Edit Bills</strong> to update FEWA amounts. Values sync across devices in real-time.
      </p>
    </div>
  )
}
