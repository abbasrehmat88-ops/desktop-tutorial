import { useMemo, useState } from 'react'
import { Zap, Calendar, Building2, Receipt, Flame } from 'lucide-react'
import businessData from '../data/businessData.json'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const FEWA_KEY = 'Electricity (FEWA)'

const fmt = (n) => (n === null || n === undefined || Number.isNaN(n) ? '—' : Math.round(n).toLocaleString())
const aed = (n) => 'AED ' + Math.round(Number(n) || 0).toLocaleString()
const sumNonNull = (arr) => (arr || []).reduce((s, v) => (v === null || v === undefined ? s : s + v), 0)

const villas = businessData.villas || []

// Every year that has any FEWA data across the portfolio.
const ALL_YEARS = (() => {
  const set = new Set()
  villas.forEach((v) =>
    Object.entries(v.years || {}).forEach(([y, d]) => {
      if (d.expenses?.[FEWA_KEY]) set.add(y)
    })
  )
  return [...set].sort()
})()

export default function FewaBills() {
  const [year, setYear] = useState(ALL_YEARS[ALL_YEARS.length - 1] || '2026')

  // Per-villa FEWA for the selected year, sorted high → low.
  const rows = useMemo(() => {
    return villas
      .map((v) => {
        const fewa = v.years?.[year]?.expenses?.[FEWA_KEY]
        if (!fewa) return null
        const monthly = fewa.monthly || Array(12).fill(null)
        const total = fewa.total != null ? fewa.total : sumNonNull(monthly)
        return { id: v.id, num: v.num, name: v.name, monthly, total }
      })
      .filter(Boolean)
      .sort((a, b) => b.total - a.total)
  }, [year])

  // Column (month) totals across all villas + grand total.
  const monthTotals = useMemo(() => {
    const t = Array(12).fill(0)
    let any = Array(12).fill(false)
    rows.forEach((r) =>
      r.monthly.forEach((v, i) => {
        if (v !== null && v !== undefined) {
          t[i] += v
          any[i] = true
        }
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

  if (ALL_YEARS.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
        <div className="mb-6">
          <h1 className="page-title">FEWA Bills</h1>
          <span className="gold-rule" />
        </div>
        <div className="card p-12 text-center animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-charcoal-900 flex items-center justify-center mx-auto mb-4">
            <Zap size={30} className="text-primary-400" />
          </div>
          <h3 className="font-display text-lg text-charcoal-900">No FEWA data yet</h3>
          <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto">
            FEWA electricity bills will appear here once the property data is imported.
          </p>
        </div>
      </div>
    )
  }

  const cards = [
    { label: `Total FEWA — ${year}`, value: aed(grandTotal), icon: Zap, accent: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Avg per Villa', value: aed(avgPerVilla), icon: Building2, accent: 'text-primary-600', bg: 'bg-primary-50' },
    { label: peakMonth ? `Peak — ${peakMonth.label}` : 'Peak Month', value: peakMonth ? aed(peakMonth.value) : '—', icon: Flame, accent: 'text-rust-600', bg: 'bg-rust-50' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      {/* Header */}
      <div className="mb-6">
        <p className="section-label mb-1">Utilities</p>
        <h1 className="page-title">FEWA Bills</h1>
        <span className="gold-rule" />
        <p className="text-sm text-gray-500 mt-3">
          Federal Electricity &amp; Water Authority charges per villa — full monthly history
        </p>
      </div>

      {/* Year selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {ALL_YEARS.map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            aria-pressed={year === y}
            className={`min-h-[44px] px-6 rounded-2xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 border ${
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
            <p className="text-xs text-gray-400 mt-1.5">{rows.length} villas billed · electricity &amp; water</p>
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

      {/* Per-villa monthly grid */}
      <div className="card overflow-hidden mb-6">
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Calendar size={18} className="text-amber-700" />
          </div>
          <div>
            <h2 className="font-display text-lg text-charcoal-900">Monthly bills by villa — {year}</h2>
            <span className="gold-rule" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-semibold">
              <tr>
                <th className="px-3 py-2.5 text-left whitespace-nowrap sticky left-0 bg-gray-50">Villa</th>
                {MONTHS.map((m) => (
                  <th key={m} className="px-2.5 py-2.5 text-right whitespace-nowrap">{m}</th>
                ))}
                <th className="px-3 py-2.5 text-right whitespace-nowrap">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="px-3 py-2.5 font-medium text-charcoal-900 whitespace-nowrap sticky left-0 bg-white">{r.name}</td>
                  {r.monthly.map((v, j) => (
                    <td key={j} className="px-2.5 py-2.5 text-right tabular text-gray-700">{fmt(v)}</td>
                  ))}
                  <td className="px-3 py-2.5 text-right tabular font-bold text-amber-700">{fmt(r.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-charcoal-900 text-white">
                <td className="px-3 py-3 text-sm font-semibold whitespace-nowrap sticky left-0 bg-charcoal-900">All villas</td>
                {monthTotals.map((v, j) => (
                  <td key={j} className="px-2.5 py-3 text-right tabular font-semibold text-primary-400">{fmt(v)}</td>
                ))}
                <td className="px-3 py-3 text-right tabular font-bold text-primary-400">{fmt(grandTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Per-villa summary (ranked, with bar) */}
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
          {rows.map((r) => {
            const pct = grandTotal ? Math.round((r.total / rows[0].total) * 100) : 0
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

      <p className="text-xs text-gray-400 text-center mt-6">
        FEWA electricity &amp; water charges imported from your 2018–2026 villa records.
      </p>
    </div>
  )
}
