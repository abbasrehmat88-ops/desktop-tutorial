import { useMemo, useState } from 'react'
import { Users, DoorOpen, History, TrendingUp, ChevronDown } from 'lucide-react'
import businessData from '../data/businessData.json'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const fmt = (n) => (n === null || n === undefined || Number.isNaN(n) ? '—' : Math.round(n).toLocaleString())
const aed = (n) => 'AED ' + Math.round(Number(n) || 0).toLocaleString()
const sumNonNull = (arr) => (arr || []).reduce((s, v) => (v === null || v === undefined ? s : s + v), 0)

const villas = businessData.villas || []

// Every year that has any room/tenant data across the portfolio.
const ALL_YEARS = (() => {
  const set = new Set()
  villas.forEach((v) =>
    Object.entries(v.years || {}).forEach(([y, d]) => {
      if (Array.isArray(d.rooms) && d.rooms.length) set.add(y)
    })
  )
  return [...set].sort()
})()

// A room counts as "occupied" if it has a tenant name or any income.
const isOccupied = (r) =>
  (r.tenant && r.tenant.trim() && !/^vacant|empty|–|-$/i.test(r.tenant.trim())) ||
  sumNonNull(r.monthly) > 0

function VillaBlock({ villa, year, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  const yd = villa.years?.[year]
  const rooms = yd?.rooms || []
  if (!rooms.length) return null

  const occupied = rooms.filter(isOccupied).length
  const income = yd.incomeTotal != null ? yd.incomeTotal : rooms.reduce((s, r) => s + (r.total != null ? r.total : sumNonNull(r.monthly)), 0)

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50/60 transition-colors min-h-[44px]"
      >
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-charcoal-900 flex items-center justify-center font-display font-bold text-sm shrink-0">
          {villa.num}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base text-charcoal-900 truncate">{villa.name}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            <span className="tabular">{occupied}</span>/<span className="tabular">{rooms.length}</span> rooms occupied · {year}
          </p>
        </div>
        <p className="font-bold text-emerald2-600 tabular text-sm shrink-0 hidden sm:block">{aed(income)}</p>
        <ChevronDown size={18} className={`text-gray-400 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="overflow-x-auto border-t border-gray-100 animate-fade-up">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-semibold">
              <tr>
                <th className="px-3 py-2.5 text-left whitespace-nowrap">Room</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap">Tenant</th>
                {MONTHS.map((m) => (
                  <th key={m} className="px-2 py-2.5 text-right whitespace-nowrap">{m}</th>
                ))}
                <th className="px-3 py-2.5 text-right whitespace-nowrap">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rooms.map((r, i) => (
                <tr key={i} className={`hover:bg-primary-50/40 transition-colors ${isOccupied(r) ? '' : 'opacity-50'}`}>
                  <td className="px-3 py-2.5 font-medium text-charcoal-900 whitespace-nowrap">{r.room}</td>
                  <td className="px-3 py-2.5 text-gray-600 max-w-[160px] truncate">{r.tenant || '—'}</td>
                  {(r.monthly || Array(12).fill(null)).map((v, j) => (
                    <td key={j} className="px-2 py-2.5 text-right tabular text-gray-700">{fmt(v)}</td>
                  ))}
                  <td className="px-3 py-2.5 text-right tabular font-semibold text-charcoal-900">
                    {fmt(r.total != null ? r.total : sumNonNull(r.monthly))}
                  </td>
                </tr>
              ))}
              <tr className="bg-primary-50 font-bold text-charcoal-900">
                <td className="px-3 py-2.5" colSpan={2}>Total Income</td>
                {(yd.incomeMonthly || Array(12).fill(null)).map((v, j) => (
                  <td key={j} className="px-2 py-2.5 text-right tabular">{fmt(v)}</td>
                ))}
                <td className="px-3 py-2.5 text-right tabular">{fmt(income)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function TenantHistory() {
  const [year, setYear] = useState(ALL_YEARS[ALL_YEARS.length - 1] || '2026')

  const summary = useMemo(() => {
    let rooms = 0, occupied = 0, income = 0, villasWithData = 0
    villas.forEach((v) => {
      const yd = v.years?.[year]
      if (!yd?.rooms?.length) return
      villasWithData++
      rooms += yd.rooms.length
      occupied += yd.rooms.filter(isOccupied).length
      income += yd.incomeTotal != null ? yd.incomeTotal : yd.rooms.reduce((s, r) => s + (r.total != null ? r.total : sumNonNull(r.monthly)), 0)
    })
    return { rooms, occupied, income, villasWithData }
  }, [year])

  if (ALL_YEARS.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
        <div className="mb-6">
          <h1 className="page-title">Tenant History</h1>
          <span className="gold-rule" />
        </div>
        <div className="card p-12 text-center animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-charcoal-900 flex items-center justify-center mx-auto mb-4">
            <History size={30} className="text-primary-400" />
          </div>
          <h3 className="font-display text-lg text-charcoal-900">No historical data yet</h3>
          <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto">
            Past tenant records will appear here once property data is imported.
          </p>
        </div>
      </div>
    )
  }

  const cards = [
    { label: 'Rooms Occupied', value: `${summary.occupied} / ${summary.rooms}`, icon: DoorOpen, accent: 'text-primary-600', bg: 'bg-primary-50' },
    { label: `Income — ${year}`, value: aed(summary.income), icon: TrendingUp, accent: 'text-emerald2-600', bg: 'bg-emerald2-50' },
    { label: 'Villas with Records', value: String(summary.villasWithData), icon: Users, accent: 'text-charcoal-700', bg: 'bg-gray-100' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      {/* Header */}
      <div className="mb-6">
        <p className="section-label mb-1">Archive</p>
        <h1 className="page-title">Tenant History</h1>
        <span className="gold-rule" />
        <p className="text-sm text-gray-500 mt-3">
          Room-by-room tenant &amp; income records across every villa, 2018–2026
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

      {/* Summary cards */}
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

      {/* Per-villa expandable blocks */}
      <div className="space-y-4">
        {villas.map((v, i) => (
          <VillaBlock key={v.id} villa={v} year={year} defaultOpen={i === 0} />
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center mt-6">
        Historical tenant occupancy &amp; income imported from your 2018–2026 villa records.
        Current live tenants are managed in the <span className="font-semibold text-charcoal-700">Tenants</span> section.
      </p>
    </div>
  )
}
