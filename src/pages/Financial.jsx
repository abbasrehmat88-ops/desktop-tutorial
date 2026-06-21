import React, { useState, useMemo } from 'react'
import {
  DollarSign, Zap, Building2, MoreHorizontal, TrendingUp, TrendingDown,
  ChevronLeft, ChevronRight, BarChart3, TableProperties, Wallet, ArrowRight,
  Calendar,
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
  const v = Number(n) || 0
  return `AED ${v.toLocaleString('en-AE', { maximumFractionDigits: 0 })}`
}
function fmtShort(n) {
  const v = Number(n) || 0
  return v.toLocaleString('en-AE', { maximumFractionDigits: 0 })
}
function fmtDate(s) {
  if (!s) return ''
  const d = new Date(s)
  if (isNaN(d)) return ''
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}
function initials(name) {
  return (name || '?').trim().charAt(0).toUpperCase()
}

// ── Summary Card ─────────────────────────────────────────────────────────────
function SummaryCard({ icon: Icon, label, value, sub, iconClass, glow }) {
  return (
    <div
      className="rounded-2xl p-4 sm:p-5 flex items-start gap-3.5"
      style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconClass}`}
        style={{ boxShadow: glow }}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.16em] text-charcoal-500 font-bold mb-1">{label}</p>
        <p className="text-lg sm:text-xl font-bold text-white tabular-nums leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-charcoal-500 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

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

export default function Financial() {
  const availableYears = useMemo(() => Object.keys(financialData).sort().reverse(), [])
  const [year, setYear] = useState(availableYears[0] || '2026')
  const [viewMode, setViewMode] = useState('monthly')

  const yearData = financialData[year] || {}
  const availableMonths = useMemo(
    () => Object.keys(yearData).map(Number).sort((a, b) => a - b),
    [yearData]
  )

  const [month, setMonth] = useState(availableMonths[availableMonths.length - 1])

  React.useEffect(() => {
    const months = Object.keys(financialData[year] || {}).map(Number).sort((a, b) => a - b)
    setMonth(months[months.length - 1])
  }, [year])

  const entries = useMemo(() => yearData[String(month)] || [], [yearData, month])

  const totals = useMemo(() => entries.reduce(
    (a, e) => ({
      incoming: a.incoming + e.incoming,
      fewa: a.fewa + e.fewa,
      ejaar: a.ejaar + e.ejaar,
      others: a.others + e.others,
    }),
    { incoming: 0, fewa: 0, ejaar: 0, others: 0 }
  ), [entries])

  const totalOut = totals.fewa + totals.ejaar + totals.others
  const netProfit = totals.incoming - totalOut

  const yearChart = useMemo(() => availableMonths.map(m => {
    const me = yearData[String(m)] || []
    const incoming = me.reduce((s, e) => s + e.incoming, 0)
    const out = me.reduce((s, e) => s + e.fewa + e.ejaar + e.others, 0)
    return {
      name: MONTH_SHORT[m],
      incoming,
      net: incoming - out,
      fewa: me.reduce((s, e) => s + e.fewa, 0),
      ejaar: me.reduce((s, e) => s + e.ejaar, 0),
      others: me.reduce((s, e) => s + e.others, 0),
    }
  }), [yearData, availableMonths])

  const yearTotals = useMemo(() => yearChart.reduce(
    (a, m) => ({
      incoming: a.incoming + m.incoming,
      fewa: a.fewa + m.fewa,
      ejaar: a.ejaar + m.ejaar,
      others: a.others + m.others,
      net: a.net + m.net,
    }),
    { incoming: 0, fewa: 0, ejaar: 0, others: 0, net: 0 }
  ), [yearChart])

  const monthIdx = availableMonths.indexOf(month)
  const prevMonth = monthIdx > 0 ? availableMonths[monthIdx - 1] : null
  const nextMonth = monthIdx < availableMonths.length - 1 ? availableMonths[monthIdx + 1] : null

  const prevEntries = prevMonth ? (yearData[String(prevMonth)] || []) : []
  const prevTotal = prevEntries.reduce((s, e) => s + e.incoming, 0)
  const momChange = prevTotal ? ((totals.incoming - prevTotal) / prevTotal * 100) : null

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-white leading-tight">Financial Overview</h1>
          <p className="text-charcoal-400 text-sm mt-1">Income, expenses & owner payments · All Villas</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl overflow-hidden border border-white/[0.08] p-0.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {[
              { id: 'monthly', icon: TableProperties, label: 'Monthly' },
              { id: 'yearly', icon: BarChart3, label: 'Yearly' },
            ].map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setViewMode(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  viewMode === id ? 'bg-primary-400/20 text-primary-300' : 'text-charcoal-400 hover:text-white'
                }`}>
                <Icon size={13} />{label}
              </button>
            ))}
          </div>
          <div className="flex rounded-xl overflow-hidden border border-white/[0.08] p-0.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {availableYears.map(y => (
              <button key={y} onClick={() => setYear(y)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  year === y ? 'bg-primary-400/20 text-primary-300 ring-1 ring-primary-400/30' : 'text-charcoal-400 hover:text-white'
                }`}>
                {y}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MONTHLY VIEW ── */}
      {viewMode === 'monthly' && (
        <>
          {/* Month nav */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
            <button onClick={() => prevMonth && setMonth(prevMonth)} disabled={!prevMonth}
              className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center text-charcoal-400 hover:text-white hover:bg-white/[0.07] disabled:opacity-30 transition-all">
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-1.5 flex-1">
              {availableMonths.map(m => (
                <button key={m} onClick={() => setMonth(m)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    m === month ? 'bg-primary-400/20 text-primary-300 ring-1 ring-primary-400/30'
                      : 'text-charcoal-400 hover:bg-white/[0.06] hover:text-white border border-white/[0.06]'
                  }`} style={{ minWidth: 44 }}>
                  {MONTH_SHORT[m]}
                </button>
              ))}
            </div>
            <button onClick={() => nextMonth && setMonth(nextMonth)} disabled={!nextMonth}
              className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center text-charcoal-400 hover:text-white hover:bg-white/[0.07] disabled:opacity-30 transition-all">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Month title + MoM */}
          <div className="flex items-center flex-wrap gap-3 mb-5">
            <h2 className="text-lg font-bold text-white">{MONTH_LABELS[month]} {year}</h2>
            <span className="text-xs text-charcoal-500">{entries.length} properties</span>
            {momChange !== null && (
              <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                momChange >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rust-500/15 text-rust-400'
              }`}>
                {momChange >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {momChange >= 0 ? '+' : ''}{momChange.toFixed(1)}% vs {MONTH_SHORT[prevMonth]}
              </span>
            )}
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-7">
            <SummaryCard icon={DollarSign} label="Income (Rent)" value={fmt(totals.incoming)}
              iconClass="bg-primary-400/15 text-primary-400" glow="0 0 16px rgba(201,161,84,0.2)" />
            <SummaryCard icon={Building2} label="Paid to Owners" value={fmt(totals.ejaar)} sub="Ejaar"
              iconClass="bg-blue-500/15 text-blue-400" glow="0 0 16px rgba(59,130,246,0.15)" />
            <SummaryCard icon={Zap} label="FEWA Bills" value={fmt(totals.fewa)}
              iconClass="bg-amber-500/15 text-amber-400" glow="0 0 16px rgba(251,191,36,0.15)" />
            <SummaryCard icon={MoreHorizontal} label="Other Expense" value={fmt(totals.others)}
              iconClass="bg-charcoal-500/30 text-charcoal-300" glow="none" />
            <SummaryCard icon={Wallet} label="Net Profit" value={fmt(netProfit)}
              sub={`Income − ${fmtShort(totalOut)} out`}
              iconClass={netProfit >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rust-500/15 text-rust-400'}
              glow={netProfit >= 0 ? '0 0 16px rgba(16,185,129,0.18)' : '0 0 16px rgba(179,87,63,0.18)'} />
          </div>

          {/* Villa cards/table */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Villa Breakdown</h3>
                <p className="text-[11px] text-charcoal-500 mt-0.5">{MONTH_LABELS[month]} {year} · income, expenses & owner payment per villa</p>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <th className="px-5 py-3 text-left text-[10px] uppercase tracking-[0.14em] text-charcoal-500 font-bold">Villa / Owner</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.14em] text-charcoal-500 font-bold">Income</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.14em] text-blue-400/70 font-bold">To Owner</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.14em] text-charcoal-500 font-bold">FEWA</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.14em] text-charcoal-500 font-bold">Others</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.14em] text-charcoal-500 font-bold">Net</th>
                    <th className="px-5 py-3 text-left text-[10px] uppercase tracking-[0.14em] text-charcoal-500 font-bold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => {
                    const out = e.fewa + e.ejaar + e.others
                    const net = e.incoming - out
                    return (
                      <tr key={i} className="border-t border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold text-primary-400"
                              style={{ background: 'rgba(201,161,84,0.12)', border: '1px solid rgba(201,161,84,0.18)' }}>
                              {initials(e.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-white text-sm leading-tight">{e.villa} · {e.name}</p>
                              <p className="text-[11px] text-charcoal-500 mt-0.5 truncate">{e.owner}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="text-primary-300 font-semibold tabular-nums">{fmtShort(e.incoming)}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {e.ejaar > 0 ? (
                            <div>
                              <span className="text-blue-400 font-semibold tabular-nums">{fmtShort(e.ejaar)}</span>
                              {e.ejaarDate && <p className="text-[10px] text-charcoal-600 mt-0.5">{fmtDate(e.ejaarDate)}</p>}
                            </div>
                          ) : <span className="text-charcoal-600">—</span>}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {e.fewa > 0 ? <span className="text-amber-400 font-medium tabular-nums">{fmtShort(e.fewa)}</span> : <span className="text-charcoal-600">—</span>}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {e.others > 0 ? <span className="text-charcoal-300 font-medium tabular-nums">{fmtShort(e.others)}</span> : <span className="text-charcoal-600">—</span>}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className={`font-bold tabular-nums ${net >= 0 ? 'text-emerald-400' : 'text-rust-400'}`}>
                            {net >= 0 ? '+' : ''}{fmtShort(net)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {e.details ? <span className="text-charcoal-400 text-xs">{e.details}</span> : <span className="text-charcoal-600">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'rgba(201,161,84,0.06)', borderTop: '1px solid rgba(201,161,84,0.15)' }}>
                    <td className="px-5 py-3.5"><span className="text-[10px] uppercase tracking-wider font-bold text-primary-400">Total</span></td>
                    <td className="px-4 py-3.5 text-right"><span className="text-primary-300 font-bold tabular-nums">{fmtShort(totals.incoming)}</span></td>
                    <td className="px-4 py-3.5 text-right"><span className="text-blue-400 font-bold tabular-nums">{fmtShort(totals.ejaar)}</span></td>
                    <td className="px-4 py-3.5 text-right"><span className="text-amber-400 font-bold tabular-nums">{fmtShort(totals.fewa)}</span></td>
                    <td className="px-4 py-3.5 text-right"><span className="text-charcoal-300 font-bold tabular-nums">{fmtShort(totals.others)}</span></td>
                    <td className="px-4 py-3.5 text-right"><span className={`font-bold tabular-nums ${netProfit >= 0 ? 'text-emerald-400' : 'text-rust-400'}`}>{netProfit >= 0 ? '+' : ''}{fmtShort(netProfit)}</span></td>
                    <td className="px-5 py-3.5" />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-white/[0.05]">
              {entries.map((e, i) => {
                const out = e.fewa + e.ejaar + e.others
                const net = e.incoming - out
                return (
                  <div key={i} className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold text-primary-400"
                        style={{ background: 'rgba(201,161,84,0.12)', border: '1px solid rgba(201,161,84,0.18)' }}>
                        {initials(e.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white text-sm leading-tight">{e.villa} · {e.name}</p>
                        <p className="text-[11px] text-charcoal-500 mt-0.5 truncate">{e.owner}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold tabular-nums text-sm ${net >= 0 ? 'text-emerald-400' : 'text-rust-400'}`}>{net >= 0 ? '+' : ''}{fmtShort(net)}</p>
                        <p className="text-[9px] uppercase tracking-wider text-charcoal-600">Net</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="rounded-lg py-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <p className="text-primary-300 font-semibold text-xs tabular-nums">{fmtShort(e.incoming)}</p>
                        <p className="text-[9px] text-charcoal-600 mt-0.5">Income</p>
                      </div>
                      <div className="rounded-lg py-2" style={{ background: 'rgba(59,130,246,0.08)' }}>
                        <p className="text-blue-400 font-semibold text-xs tabular-nums">{e.ejaar > 0 ? fmtShort(e.ejaar) : '—'}</p>
                        <p className="text-[9px] text-charcoal-600 mt-0.5">Owner</p>
                      </div>
                      <div className="rounded-lg py-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <p className="text-amber-400 font-semibold text-xs tabular-nums">{e.fewa > 0 ? fmtShort(e.fewa) : '—'}</p>
                        <p className="text-[9px] text-charcoal-600 mt-0.5">FEWA</p>
                      </div>
                      <div className="rounded-lg py-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <p className="text-charcoal-300 font-semibold text-xs tabular-nums">{e.others > 0 ? fmtShort(e.others) : '—'}</p>
                        <p className="text-[9px] text-charcoal-600 mt-0.5">Others</p>
                      </div>
                    </div>
                    {e.details && (
                      <p className="text-[11px] text-charcoal-400 mt-2.5 flex items-center gap-1.5">
                        <ArrowRight size={11} className="text-charcoal-600" />{e.details}
                        {e.ejaarDate && <span className="text-charcoal-600 ml-1 flex items-center gap-1"><Calendar size={9} />{fmtDate(e.ejaarDate)}</span>}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* ── YEARLY VIEW ── */}
      {viewMode === 'yearly' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-7">
            <SummaryCard icon={DollarSign} label={`${year} Income`} value={fmt(yearTotals.incoming)}
              iconClass="bg-primary-400/15 text-primary-400" glow="0 0 16px rgba(201,161,84,0.2)" />
            <SummaryCard icon={Building2} label="Paid to Owners" value={fmt(yearTotals.ejaar)}
              iconClass="bg-blue-500/15 text-blue-400" glow="0 0 16px rgba(59,130,246,0.15)" />
            <SummaryCard icon={Zap} label="Total FEWA" value={fmt(yearTotals.fewa)}
              iconClass="bg-amber-500/15 text-amber-400" glow="0 0 16px rgba(251,191,36,0.15)" />
            <SummaryCard icon={MoreHorizontal} label="Other Expense" value={fmt(yearTotals.others)}
              iconClass="bg-charcoal-500/30 text-charcoal-300" glow="none" />
            <SummaryCard icon={Wallet} label="Net Profit" value={fmt(yearTotals.net)}
              iconClass={yearTotals.net >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rust-500/15 text-rust-400'}
              glow={yearTotals.net >= 0 ? '0 0 16px rgba(16,185,129,0.18)' : '0 0 16px rgba(179,87,63,0.18)'} />
          </div>

          <div className="rounded-2xl p-5 mb-6"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h3 className="text-sm font-semibold text-white mb-1">Income vs Net Profit · {year}</h3>
            <p className="text-[11px] text-charcoal-500 mb-5">{availableMonths.length} months with data</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={yearChart} barSize={16} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="incoming" name="Income" fill="#c9a154" radius={[3,3,0,0]} />
                <Bar dataKey="net" name="Net Profit" radius={[3,3,0,0]}>
                  {yearChart.map((d, i) => <Cell key={i} fill={d.net >= 0 ? '#34d399' : '#b3573f'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Monthly Breakdown · {year}</h3>
              <p className="text-[11px] text-charcoal-500 mt-0.5">Tap a row to see villa detail</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <th className="px-5 py-3 text-left text-[10px] uppercase tracking-[0.14em] text-charcoal-500 font-bold">Month</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.14em] text-charcoal-500 font-bold">Income</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.14em] text-blue-400/70 font-bold">To Owners</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.14em] text-charcoal-500 font-bold">FEWA</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.14em] text-charcoal-500 font-bold">Others</th>
                    <th className="px-5 py-3 text-right text-[10px] uppercase tracking-[0.14em] text-charcoal-500 font-bold">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {yearChart.map((m, i) => {
                    const mNum = availableMonths[i]
                    return (
                      <tr key={mNum} onClick={() => { setMonth(mNum); setViewMode('monthly') }}
                        className="border-t border-white/[0.04] hover:bg-white/[0.04] transition-colors cursor-pointer">
                        <td className="px-5 py-3.5"><span className="text-white font-semibold">{MONTH_LABELS[mNum]}</span></td>
                        <td className="px-4 py-3.5 text-right"><span className="text-primary-300 font-semibold tabular-nums">{fmtShort(m.incoming)}</span></td>
                        <td className="px-4 py-3.5 text-right"><span className="text-blue-400 tabular-nums">{m.ejaar > 0 ? fmtShort(m.ejaar) : '—'}</span></td>
                        <td className="px-4 py-3.5 text-right"><span className="text-amber-400 tabular-nums">{m.fewa > 0 ? fmtShort(m.fewa) : '—'}</span></td>
                        <td className="px-4 py-3.5 text-right"><span className="text-charcoal-300 tabular-nums">{m.others > 0 ? fmtShort(m.others) : '—'}</span></td>
                        <td className="px-5 py-3.5 text-right"><span className={`font-semibold tabular-nums ${m.net >= 0 ? 'text-emerald-400' : 'text-rust-400'}`}>{m.net >= 0 ? '+' : ''}{fmtShort(m.net)}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'rgba(201,161,84,0.06)', borderTop: '1px solid rgba(201,161,84,0.15)' }}>
                    <td className="px-5 py-3.5"><span className="text-[10px] uppercase tracking-wider font-bold text-primary-400">Total {year}</span></td>
                    <td className="px-4 py-3.5 text-right"><span className="text-primary-300 font-bold tabular-nums">{fmtShort(yearTotals.incoming)}</span></td>
                    <td className="px-4 py-3.5 text-right"><span className="text-blue-400 font-bold tabular-nums">{fmtShort(yearTotals.ejaar)}</span></td>
                    <td className="px-4 py-3.5 text-right"><span className="text-amber-400 font-bold tabular-nums">{fmtShort(yearTotals.fewa)}</span></td>
                    <td className="px-4 py-3.5 text-right"><span className="text-charcoal-300 font-bold tabular-nums">{fmtShort(yearTotals.others)}</span></td>
                    <td className="px-5 py-3.5 text-right"><span className={`font-bold tabular-nums ${yearTotals.net >= 0 ? 'text-emerald-400' : 'text-rust-400'}`}>{yearTotals.net >= 0 ? '+' : ''}{fmtShort(yearTotals.net)}</span></td>
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
