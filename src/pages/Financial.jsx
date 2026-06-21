import React, { useState, useMemo } from 'react'
import {
  DollarSign, Zap, Building2, MoreHorizontal, TrendingUp, TrendingDown,
  ChevronLeft, ChevronRight, BarChart3, TableProperties,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import rawData from '../data/financialData.json'

const financialData = rawData.data

const MONTH_LABELS = {
  1:'January',2:'February',3:'March',4:'April',5:'May',6:'June',
  7:'July',8:'August',9:'September',10:'October',11:'November',12:'December',
}
const MONTH_SHORT = {
  1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',
  7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec',
}

function fmt(n) {
  if (!n) return 'AED 0'
  return `AED ${Number(n).toLocaleString('en-AE', { maximumFractionDigits: 0 })}`
}
function fmtShort(n) {
  if (!n) return '0'
  return Number(n).toLocaleString('en-AE', { maximumFractionDigits: 0 })
}

// ── Summary Card ─────────────────────────────────────────────────────────────
function SummaryCard({ icon: Icon, label, value, iconClass, glowColor }) {
  return (
    <div
      className="rounded-2xl p-5 flex items-start gap-4"
      style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconClass}`}
        style={{ boxShadow: glowColor }}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.18em] text-charcoal-500 font-bold mb-1">{label}</p>
        <p className="text-xl font-bold text-white tabular-nums leading-tight">{value}</p>
      </div>
    </div>
  )
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-4 py-3 text-sm"
      style={{ background: '#1a1d27', border: '1px solid rgba(201,161,84,0.25)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <p className="text-white font-semibold mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.fill }} />
          <span className="text-charcoal-400 capitalize">{p.name}:</span>
          <span className="text-white font-medium tabular-nums ml-1">AED {Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Financial() {
  const availableYears = useMemo(() => Object.keys(financialData).sort().reverse(), [])
  const [year, setYear] = useState(availableYears[0] || '2026')
  const [viewMode, setViewMode] = useState('monthly') // 'monthly' | 'yearly'

  const yearData = financialData[year] || {}
  const availableMonths = useMemo(
    () => Object.keys(yearData).map(Number).sort((a, b) => a - b),
    [yearData]
  )

  const latestMonth = availableMonths[availableMonths.length - 1]
  const [month, setMonth] = useState(latestMonth)

  // When year changes, reset to latest month in that year
  React.useEffect(() => {
    const months = Object.keys(financialData[year] || {}).map(Number).sort((a, b) => a - b)
    setMonth(months[months.length - 1])
  }, [year])

  const entries = useMemo(() => yearData[String(month)] || [], [yearData, month])

  const totals = useMemo(() => {
    return entries.reduce(
      (acc, e) => ({
        incoming: acc.incoming + e.incoming,
        fewa: acc.fewa + e.fewa,
        ejaar: acc.ejaar + e.ejaar,
        others: acc.others + e.others,
      }),
      { incoming: 0, fewa: 0, ejaar: 0, others: 0 }
    )
  }, [entries])

  // Year overview: monthly totals for chart
  const yearChart = useMemo(() => {
    return availableMonths.map(m => {
      const monthEntries = yearData[String(m)] || []
      return {
        name: MONTH_SHORT[m],
        incoming: monthEntries.reduce((s, e) => s + e.incoming, 0),
        fewa: monthEntries.reduce((s, e) => s + e.fewa, 0),
        ejaar: monthEntries.reduce((s, e) => s + e.ejaar, 0),
        others: monthEntries.reduce((s, e) => s + e.others, 0),
      }
    })
  }, [yearData, availableMonths])

  const yearTotals = useMemo(() => {
    return yearChart.reduce(
      (acc, m) => ({
        incoming: acc.incoming + m.incoming,
        fewa: acc.fewa + m.fewa,
        ejaar: acc.ejaar + m.ejaar,
        others: acc.others + m.others,
      }),
      { incoming: 0, fewa: 0, ejaar: 0, others: 0 }
    )
  }, [yearChart])

  const monthIdx = availableMonths.indexOf(month)
  const prevMonth = monthIdx > 0 ? availableMonths[monthIdx - 1] : null
  const nextMonth = monthIdx < availableMonths.length - 1 ? availableMonths[monthIdx + 1] : null

  // MoM change
  const prevEntries = prevMonth ? (yearData[String(prevMonth)] || []) : []
  const prevTotal = prevEntries.reduce((s, e) => s + e.incoming, 0)
  const momChange = prevTotal ? ((totals.incoming - prevTotal) / prevTotal * 100) : null

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-white leading-tight">Financial Overview</h1>
          <p className="text-charcoal-400 text-sm mt-1">Monthly income & expense data · All Villas</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex rounded-xl overflow-hidden border border-white/[0.08] p-0.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {[
              { id: 'monthly', icon: TableProperties, label: 'Monthly' },
              { id: 'yearly', icon: BarChart3, label: 'Yearly' },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  viewMode === id
                    ? 'bg-primary-400/20 text-primary-300'
                    : 'text-charcoal-400 hover:text-white'
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
          {/* Year selector */}
          <div className="flex rounded-xl overflow-hidden border border-white/[0.08] p-0.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {availableYears.map(y => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  year === y
                    ? 'bg-primary-400/20 text-primary-300 ring-1 ring-primary-400/30'
                    : 'text-charcoal-400 hover:text-white'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MONTHLY VIEW ── */}
      {viewMode === 'monthly' && (
        <>
          {/* Month navigation */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
            <button
              onClick={() => prevMonth && setMonth(prevMonth)}
              disabled={!prevMonth}
              className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center text-charcoal-400 hover:text-white hover:bg-white/[0.07] disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-1.5 flex-1">
              {availableMonths.map(m => (
                <button
                  key={m}
                  onClick={() => setMonth(m)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    m === month
                      ? 'bg-primary-400/20 text-primary-300 ring-1 ring-primary-400/30'
                      : 'text-charcoal-400 hover:bg-white/[0.06] hover:text-white border border-white/[0.06]'
                  }`}
                  style={{ minWidth: 44 }}
                >
                  {MONTH_SHORT[m]}
                </button>
              ))}
            </div>
            <button
              onClick={() => nextMonth && setMonth(nextMonth)}
              disabled={!nextMonth}
              className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center text-charcoal-400 hover:text-white hover:bg-white/[0.07] disabled:opacity-30 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Month title + MoM */}
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-lg font-bold text-white">{MONTH_LABELS[month]} {year}</h2>
            {momChange !== null && (
              <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                momChange >= 0
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-rust-500/15 text-rust-400'
              }`}>
                {momChange >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {momChange >= 0 ? '+' : ''}{momChange.toFixed(1)}% vs {MONTH_SHORT[prevMonth]}
              </span>
            )}
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
            <SummaryCard
              icon={DollarSign}
              label="Total Incoming"
              value={fmt(totals.incoming)}
              iconClass="bg-primary-400/15 text-primary-400"
              glowColor="0 0 16px rgba(201,161,84,0.2)"
            />
            <SummaryCard
              icon={Zap}
              label="FEWA Bills"
              value={fmt(totals.fewa)}
              iconClass="bg-amber-500/15 text-amber-400"
              glowColor="0 0 16px rgba(251,191,36,0.15)"
            />
            <SummaryCard
              icon={Building2}
              label="Ejaar"
              value={fmt(totals.ejaar)}
              iconClass="bg-blue-500/15 text-blue-400"
              glowColor="0 0 16px rgba(59,130,246,0.15)"
            />
            <SummaryCard
              icon={MoreHorizontal}
              label="Other Expenses"
              value={fmt(totals.others)}
              iconClass="bg-charcoal-500/30 text-charcoal-300"
              glowColor="none"
            />
          </div>

          {/* Villa table */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Villa Breakdown · {MONTH_LABELS[month]} {year}</h3>
              <p className="text-[11px] text-charcoal-500 mt-0.5">{entries.length} properties</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <th className="px-5 py-3 text-left text-[10px] uppercase tracking-[0.15em] text-charcoal-500 font-bold">Villa</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] text-charcoal-500 font-bold">Incoming</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] text-charcoal-500 font-bold">FEWA</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] text-charcoal-500 font-bold">Ejaar</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] text-charcoal-500 font-bold">Others</th>
                    <th className="px-5 py-3 text-left text-[10px] uppercase tracking-[0.15em] text-charcoal-500 font-bold hidden sm:table-cell">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, idx) => {
                    const outgoing = e.fewa + e.ejaar + e.others
                    const net = e.incoming - outgoing
                    return (
                      <tr
                        key={idx}
                        className="border-t border-white/[0.04] hover:bg-white/[0.03] transition-colors group"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-primary-400"
                              style={{ background: 'rgba(201,161,84,0.12)' }}>
                              {e.villa.replace(/^v\d+\s*/i,'').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-white text-sm leading-tight">{e.villa}</p>
                              <p className={`text-[10px] font-medium mt-0.5 tabular-nums ${
                                net >= 0 ? 'text-emerald-400/80' : 'text-rust-400/80'
                              }`}>
                                Net: AED {net >= 0 ? '+' : ''}{Number(net).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="text-primary-300 font-semibold tabular-nums">{fmtShort(e.incoming)}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {e.fewa > 0
                            ? <span className="text-amber-400 font-medium tabular-nums">{fmtShort(e.fewa)}</span>
                            : <span className="text-charcoal-600">—</span>
                          }
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {e.ejaar > 0
                            ? <span className="text-blue-400 font-medium tabular-nums">{fmtShort(e.ejaar)}</span>
                            : <span className="text-charcoal-600">—</span>
                          }
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {e.others > 0
                            ? <span className="text-charcoal-300 font-medium tabular-nums">{fmtShort(e.others)}</span>
                            : <span className="text-charcoal-600">—</span>
                          }
                        </td>
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          {e.details
                            ? <span className="text-charcoal-400 text-xs">{e.details}</span>
                            : <span className="text-charcoal-600">—</span>
                          }
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'rgba(201,161,84,0.06)', borderTop: '1px solid rgba(201,161,84,0.15)' }}>
                    <td className="px-5 py-3.5">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-primary-400">Total</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-primary-300 font-bold tabular-nums">{fmtShort(totals.incoming)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-amber-400 font-bold tabular-nums">{fmtShort(totals.fewa)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-blue-400 font-bold tabular-nums">{fmtShort(totals.ejaar)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-charcoal-300 font-bold tabular-nums">{fmtShort(totals.others)}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── YEARLY VIEW ── */}
      {viewMode === 'yearly' && (
        <>
          {/* Year summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
            <SummaryCard
              icon={DollarSign}
              label={`${year} Total Incoming`}
              value={fmt(yearTotals.incoming)}
              iconClass="bg-primary-400/15 text-primary-400"
              glowColor="0 0 16px rgba(201,161,84,0.2)"
            />
            <SummaryCard
              icon={Zap}
              label="Total FEWA"
              value={fmt(yearTotals.fewa)}
              iconClass="bg-amber-500/15 text-amber-400"
              glowColor="0 0 16px rgba(251,191,36,0.15)"
            />
            <SummaryCard
              icon={Building2}
              label="Total Ejaar"
              value={fmt(yearTotals.ejaar)}
              iconClass="bg-blue-500/15 text-blue-400"
              glowColor="0 0 16px rgba(59,130,246,0.15)"
            />
            <SummaryCard
              icon={MoreHorizontal}
              label="Total Others"
              value={fmt(yearTotals.others)}
              iconClass="bg-charcoal-500/30 text-charcoal-300"
              glowColor="none"
            />
          </div>

          {/* Monthly bar chart */}
          <div
            className="rounded-2xl p-5 mb-6"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <h3 className="text-sm font-semibold text-white mb-1">Monthly Incoming · {year}</h3>
            <p className="text-[11px] text-charcoal-500 mb-5">{availableMonths.length} months with data</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={yearChart} barSize={20} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="incoming" name="Incoming" fill="#c9a154" radius={[4,4,0,0]}>
                  {yearChart.map((_, i) => (
                    <Cell key={i} fill={i === yearChart.length - 1 ? '#e8c07a' : '#c9a154'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly summary table */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Monthly Breakdown · {year}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <th className="px-5 py-3 text-left text-[10px] uppercase tracking-[0.15em] text-charcoal-500 font-bold">Month</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] text-charcoal-500 font-bold">Villas</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] text-charcoal-500 font-bold">Incoming</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] text-charcoal-500 font-bold">FEWA</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] text-charcoal-500 font-bold">Ejaar</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] text-charcoal-500 font-bold">Others</th>
                    <th className="px-5 py-3 text-right text-[10px] uppercase tracking-[0.15em] text-charcoal-500 font-bold">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {availableMonths.map(m => {
                    const mEntries = yearData[String(m)] || []
                    const mIn = mEntries.reduce((s, e) => s + e.incoming, 0)
                    const mFewa = mEntries.reduce((s, e) => s + e.fewa, 0)
                    const mEjaar = mEntries.reduce((s, e) => s + e.ejaar, 0)
                    const mOthers = mEntries.reduce((s, e) => s + e.others, 0)
                    const mNet = mIn - mFewa - mEjaar - mOthers
                    return (
                      <tr
                        key={m}
                        className="border-t border-white/[0.04] hover:bg-white/[0.03] transition-colors cursor-pointer"
                        onClick={() => { setMonth(m); setViewMode('monthly') }}
                      >
                        <td className="px-5 py-3.5">
                          <span className="text-white font-semibold">{MONTH_LABELS[m]}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="text-charcoal-400 tabular-nums">{mEntries.length}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="text-primary-300 font-semibold tabular-nums">{fmtShort(mIn)}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="text-amber-400 tabular-nums">{mFewa > 0 ? fmtShort(mFewa) : '—'}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="text-blue-400 tabular-nums">{mEjaar > 0 ? fmtShort(mEjaar) : '—'}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="text-charcoal-300 tabular-nums">{mOthers > 0 ? fmtShort(mOthers) : '—'}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={`font-semibold tabular-nums text-sm ${mNet >= 0 ? 'text-emerald-400' : 'text-rust-400'}`}>
                            {mNet >= 0 ? '+' : ''}{fmtShort(mNet)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'rgba(201,161,84,0.06)', borderTop: '1px solid rgba(201,161,84,0.15)' }}>
                    <td className="px-5 py-3.5">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-primary-400">Total {year}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-charcoal-400 font-bold tabular-nums">{availableMonths.length}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-primary-300 font-bold tabular-nums">{fmtShort(yearTotals.incoming)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-amber-400 font-bold tabular-nums">{fmtShort(yearTotals.fewa)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-blue-400 font-bold tabular-nums">{fmtShort(yearTotals.ejaar)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-charcoal-300 font-bold tabular-nums">{fmtShort(yearTotals.others)}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {(() => {
                        const tn = yearTotals.incoming - yearTotals.fewa - yearTotals.ejaar - yearTotals.others
                        return (
                          <span className={`font-bold tabular-nums ${tn >= 0 ? 'text-emerald-400' : 'text-rust-400'}`}>
                            {tn >= 0 ? '+' : ''}{fmtShort(tn)}
                          </span>
                        )
                      })()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
