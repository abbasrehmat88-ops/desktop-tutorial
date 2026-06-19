import { useMemo, useState } from 'react'
import {
  Wallet, Zap, Building2, TrendingDown, Calendar, KeyRound, Landmark, Receipt,
} from 'lucide-react'
import cashflowData from '../data/cashflowData.json'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const YEARS = Object.keys(cashflowData.years).sort()

function aed(n) { return 'AED ' + Math.round(Number(n) || 0).toLocaleString() }

export default function CashFlow() {
  const [year, setYear] = useState(YEARS[YEARS.length - 1] || '2026')
  const yd = cashflowData.years[year] || { months: [], perVilla: [], totals: {} }
  const t = yd.totals || {}

  // biggest monthly outflow — for scaling the bars
  const maxMonth = useMemo(
    () => Math.max(1, ...yd.months.map(m => m.total)),
    [yd]
  )
  const perVilla = useMemo(
    () => [...(yd.perVilla || [])]
      .map(v => ({ ...v, total: (v.ejaar || 0) + (v.fewa || 0) }))
      .sort((a, b) => b.total - a.total),
    [yd]
  )

  const cards = [
    { label: 'Ejaar Paid (to owners)', value: t.ejaar, icon: KeyRound, accent: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'FEWA (utilities)',       value: t.fewa,  icon: Zap,      accent: 'text-amber-600',   bg: 'bg-amber-50' },
    { label: 'Other (wifi / bus)',     value: t.other, icon: Receipt,  accent: 'text-charcoal-700',bg: 'bg-gray-100' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title">Cash Flow</h1>
        <span className="gold-rule" />
        <p className="text-sm text-gray-500 mt-3">
          Money going out — ejaar paid to villa owners, FEWA utilities &amp; other costs
        </p>
      </div>

      {/* Year selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {YEARS.map(y => (
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

      {/* Hero — total outflow */}
      <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-charcoal-800 via-charcoal-900 to-charcoal-950 text-cream p-6 sm:p-8 mb-5 shadow-premium border-t border-primary-500/30">
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-primary-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-500/15 ring-1 ring-primary-400/30 flex items-center justify-center flex-shrink-0">
            <TrendingDown size={24} className="text-primary-400" />
          </div>
          <div className="min-w-0">
            <p className="section-label !text-primary-300/80">Total Money Out — {year}</p>
            <p className="font-display text-3xl sm:text-4xl font-bold text-primary-400 mt-1 tabular leading-tight">{aed(t.total)}</p>
            <p className="text-xs text-gray-400 mt-1.5">
              {perVilla.length} villas · ejaar + utilities + other expenses
            </p>
          </div>
        </div>
      </div>

      {/* Breakdown cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 stagger">
        {cards.map(c => {
          const Icon = c.icon
          return (
            <div key={c.label} className="stat-card">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={22} className={c.accent} />
                </div>
                <div className="min-w-0">
                  <p className="section-label">{c.label}</p>
                  <p className="font-display text-2xl font-bold text-charcoal-900 mt-1 tabular leading-tight">{aed(c.value)}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Monthly breakdown */}
      <div className="card overflow-hidden mb-6">
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
            <Calendar size={18} className="text-primary-700" />
          </div>
          <div>
            <h2 className="font-display text-lg text-charcoal-900">Monthly outflow — {year}</h2>
            <span className="gold-rule" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-4 py-3 text-2xs font-bold text-gray-500 uppercase tracking-[0.14em]">Month</th>
                <th className="px-4 py-3 text-2xs font-bold text-gray-500 uppercase tracking-[0.14em] text-right">Ejaar</th>
                <th className="px-4 py-3 text-2xs font-bold text-gray-500 uppercase tracking-[0.14em] text-right">FEWA</th>
                <th className="px-4 py-3 text-2xs font-bold text-gray-500 uppercase tracking-[0.14em] text-right">Other</th>
                <th className="px-4 py-3 text-2xs font-bold text-gray-500 uppercase tracking-[0.14em] text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {yd.months.map(m => (
                <tr key={m.month} className={`odd:bg-white even:bg-gray-50/40 hover:bg-primary-50/40 transition-colors ${m.total === 0 ? 'opacity-40' : ''}`}>
                  <td className="px-4 py-3 font-semibold text-charcoal-900">{MONTHS[m.month - 1]}</td>
                  <td className="px-4 py-3 text-right tabular text-gray-700">{m.ejaar ? m.ejaar.toLocaleString() : '—'}</td>
                  <td className="px-4 py-3 text-right tabular text-amber-700">{m.fewa ? m.fewa.toLocaleString() : '—'}</td>
                  <td className="px-4 py-3 text-right tabular text-gray-500">{m.other ? m.other.toLocaleString() : '—'}</td>
                  <td className="px-4 py-3 text-right tabular font-bold text-charcoal-900">{m.total ? m.total.toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-charcoal-900 text-white">
                <td className="px-4 py-3 text-sm font-semibold">Total {year}</td>
                <td className="px-4 py-3 text-right tabular font-bold text-primary-400">{(t.ejaar || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular font-bold text-primary-400">{(t.fewa || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular font-bold text-primary-400">{(t.other || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular font-bold text-primary-400">{(t.total || 0).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Per-villa breakdown */}
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

      <p className="text-xs text-gray-400 text-center mt-6">
        Imported from your 2024–2026 records. This is the <span className="font-semibold text-charcoal-700">money-out</span> side
        (ejaar + FEWA + other). Tenant rent income lives in the Tenants section.
      </p>
    </div>
  )
}
