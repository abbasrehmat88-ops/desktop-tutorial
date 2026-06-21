import React, { useState, useMemo } from 'react'
import {
  DollarSign, Zap, Building2, MoreHorizontal, TrendingUp, TrendingDown,
  ChevronLeft, ChevronRight, BarChart3, TableProperties, Wallet, Calendar,
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
function SummaryCard({ icon: Icon, label, value, sub, iconClass }) {
  return (
    <div className="stat-card !p-4 sm:!p-5">
      <div className="flex items-start gap-3.5">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconClass}`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="section-label">{label}</p>
          <p className="text-lg sm:text-xl font-bold text-charcoal-900 mt-1 tabular-nums leading-tight">{value}</p>
          {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-4 py-3 text-sm bg-white shadow-premium border border-gray-200">
      <p className="text-charcoal-900 font-semibold mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.fill }} />
          <span className="text-gray-500 capitalize">{p.name}:</span>
          <span className="text-charcoal-900 font-medium tabular-nums ml-1">AED {Number(p.value).toLocaleString()}</span>
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

  const segBtn = (active) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
      active ? 'bg-charcoal-900 text-primary-400 shadow-card' : 'text-gray-500 hover:text-charcoal-900'
    }`

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
        <div>
          <p className="section-label mb-1">Finance</p>
          <h1 className="page-title">Financial Overview</h1>
          <span className="gold-rule" />
          <p className="text-sm text-gray-500 mt-3">Income, expenses &amp; owner payments · All Villas</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-2xl overflow-hidden border border-gray-200 bg-white p-1 shadow-card">
            <button onClick={() => setViewMode('monthly')} className={segBtn(viewMode === 'monthly')}>
              <TableProperties size={14} /> Monthly
            </button>
            <button onClick={() => setViewMode('yearly')} className={segBtn(viewMode === 'yearly')}>
              <BarChart3 size={14} /> Yearly
            </button>
          </div>
          <div className="flex rounded-2xl overflow-hidden border border-gray-200 bg-white p-1 shadow-card">
            {availableYears.map(y => (
              <button key={y} onClick={() => setYear(y)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
                  year === y ? 'bg-charcoal-900 text-primary-400 shadow-card' : 'text-gray-500 hover:text-charcoal-900'
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
              className="w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center text-gray-500 bg-white border border-gray-200 hover:text-charcoal-900 hover:border-primary-300 disabled:opacity-30 transition-all">
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-1.5 flex-1">
              {availableMonths.map(m => (
                <button key={m} onClick={() => setMonth(m)}
                  className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] border ${
                    m === month ? 'bg-charcoal-900 text-primary-400 border-charcoal-900 shadow-card'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-primary-300 hover:text-primary-700'
                  }`} style={{ minWidth: 46 }}>
                  {MONTH_SHORT[m]}
                </button>
              ))}
            </div>
            <button onClick={() => nextMonth && setMonth(nextMonth)} disabled={!nextMonth}
              className="w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center text-gray-500 bg-white border border-gray-200 hover:text-charcoal-900 hover:border-primary-300 disabled:opacity-30 transition-all">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Month title + MoM */}
          <div className="flex items-center flex-wrap gap-3 mb-5">
            <h2 className="text-xl font-bold text-charcoal-900">{MONTH_LABELS[month]} {year}</h2>
            <span className="chip">{entries.length} properties</span>
            {momChange !== null && (
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                momChange >= 0 ? 'bg-emerald2-50 text-emerald2-600 ring-1 ring-emerald2-100' : 'bg-rust-50 text-rust-600 ring-1 ring-rust-100'
              }`}>
                {momChange >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {momChange >= 0 ? '+' : ''}{momChange.toFixed(1)}% vs {MONTH_SHORT[prevMonth]}
              </span>
            )}
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-7">
            <SummaryCard icon={DollarSign} label="Income (Rent)" value={fmt(totals.incoming)}
              iconClass="bg-primary-50 text-primary-600" />
            <SummaryCard icon={Building2} label="Paid to Owners" value={fmt(totals.ejaar)} sub="Ejaar"
              iconClass="bg-blue-50 text-blue-600" />
            <SummaryCard icon={Zap} label="FEWA Bills" value={fmt(totals.fewa)}
              iconClass="bg-amber-50 text-amber-600" />
            <SummaryCard icon={MoreHorizontal} label="Other Expense" value={fmt(totals.others)}
              iconClass="bg-gray-100 text-gray-600" />
            <SummaryCard icon={Wallet} label="Net Profit" value={fmt(netProfit)}
              sub={`Income − ${fmtShort(totalOut)} out`}
              iconClass={netProfit >= 0 ? 'bg-emerald2-50 text-emerald2-600' : 'bg-rust-50 text-rust-600'} />
          </div>

          {/* Villa breakdown */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200/80">
              <h3 className="text-sm font-bold text-charcoal-900">Villa Breakdown</h3>
              <p className="text-xs text-gray-500 mt-0.5">{MONTH_LABELS[month]} {year} · income, expenses &amp; owner payment per villa</p>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="px-5 py-3 text-left text-2xs uppercase tracking-[0.14em] text-gray-500 font-bold">Villa / Owner</th>
                    <th className="px-4 py-3 text-right text-2xs uppercase tracking-[0.14em] text-gray-500 font-bold">Income</th>
                    <th className="px-4 py-3 text-right text-2xs uppercase tracking-[0.14em] text-blue-600 font-bold">To Owner</th>
                    <th className="px-4 py-3 text-right text-2xs uppercase tracking-[0.14em] text-gray-500 font-bold">FEWA</th>
                    <th className="px-4 py-3 text-right text-2xs uppercase tracking-[0.14em] text-gray-500 font-bold">Others</th>
                    <th className="px-4 py-3 text-right text-2xs uppercase tracking-[0.14em] text-gray-500 font-bold">Net</th>
                    <th className="px-5 py-3 text-left text-2xs uppercase tracking-[0.14em] text-gray-500 font-bold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => {
                    const net = e.incoming - (e.fewa + e.ejaar + e.others)
                    return (
                      <tr key={i} className="border-t border-gray-100 hover:bg-primary-50/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold text-primary-700 bg-primary-50 ring-1 ring-primary-100">
                              {initials(e.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-charcoal-900 text-sm leading-tight">{e.villa} · {e.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5 truncate">{e.owner}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right"><span className="text-charcoal-900 font-bold tabular-nums">{fmtShort(e.incoming)}</span></td>
                        <td className="px-4 py-3.5 text-right">
                          {e.ejaar > 0 ? (
                            <div>
                              <span className="text-blue-600 font-bold tabular-nums">{fmtShort(e.ejaar)}</span>
                              {e.ejaarDate && <p className="text-[10px] text-gray-400 mt-0.5">{fmtDate(e.ejaarDate)}</p>}
                            </div>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3.5 text-right">{e.fewa > 0 ? <span className="text-amber-600 font-semibold tabular-nums">{fmtShort(e.fewa)}</span> : <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3.5 text-right">{e.others > 0 ? <span className="text-gray-600 font-semibold tabular-nums">{fmtShort(e.others)}</span> : <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3.5 text-right"><span className={`font-bold tabular-nums ${net >= 0 ? 'text-emerald2-600' : 'text-rust-600'}`}>{net >= 0 ? '+' : ''}{fmtShort(net)}</span></td>
                        <td className="px-5 py-3.5">{e.details ? <span className="text-gray-500 text-xs">{e.details}</span> : <span className="text-gray-300">—</span>}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-charcoal-900 text-cream">
                    <td className="px-5 py-3.5"><span className="text-2xs uppercase tracking-wider font-bold text-primary-400">Total</span></td>
                    <td className="px-4 py-3.5 text-right"><span className="font-bold tabular-nums text-cream">{fmtShort(totals.incoming)}</span></td>
                    <td className="px-4 py-3.5 text-right"><span className="font-bold tabular-nums text-blue-300">{fmtShort(totals.ejaar)}</span></td>
                    <td className="px-4 py-3.5 text-right"><span className="font-bold tabular-nums text-amber-300">{fmtShort(totals.fewa)}</span></td>
                    <td className="px-4 py-3.5 text-right"><span className="font-bold tabular-nums text-gray-300">{fmtShort(totals.others)}</span></td>
                    <td className="px-4 py-3.5 text-right"><span className={`font-bold tabular-nums ${netProfit >= 0 ? 'text-emerald-400' : 'text-rust-300'}`}>{netProfit >= 0 ? '+' : ''}{fmtShort(netProfit)}</span></td>
                    <td className="px-5 py-3.5" />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {entries.map((e, i) => {
                const net = e.incoming - (e.fewa + e.ejaar + e.others)
                return (
                  <div key={i} className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold text-primary-700 bg-primary-50 ring-1 ring-primary-100">
                        {initials(e.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-charcoal-900 text-sm leading-tight">{e.villa} · {e.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{e.owner}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold tabular-nums text-sm ${net >= 0 ? 'text-emerald2-600' : 'text-rust-600'}`}>{net >= 0 ? '+' : ''}{fmtShort(net)}</p>
                        <p className="text-[9px] uppercase tracking-wider text-gray-400">Net</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="rounded-lg py-2 bg-primary-50/60">
                        <p className="text-charcoal-900 font-bold text-xs tabular-nums">{fmtShort(e.incoming)}</p>
                        <p className="text-[9px] text-gray-500 mt-0.5">Income</p>
                      </div>
                      <div className="rounded-lg py-2 bg-blue-50">
                        <p className="text-blue-600 font-bold text-xs tabular-nums">{e.ejaar > 0 ? fmtShort(e.ejaar) : '—'}</p>
                        <p className="text-[9px] text-gray-500 mt-0.5">Owner</p>
                      </div>
                      <div className="rounded-lg py-2 bg-amber-50">
                        <p className="text-amber-600 font-bold text-xs tabular-nums">{e.fewa > 0 ? fmtShort(e.fewa) : '—'}</p>
                        <p className="text-[9px] text-gray-500 mt-0.5">FEWA</p>
                      </div>
                      <div className="rounded-lg py-2 bg-gray-100">
                        <p className="text-gray-700 font-bold text-xs tabular-nums">{e.others > 0 ? fmtShort(e.others) : '—'}</p>
                        <p className="text-[9px] text-gray-500 mt-0.5">Others</p>
                      </div>
                    </div>
                    {(e.details || e.ejaarDate) && (
                      <p className="text-[11px] text-gray-500 mt-2.5 flex items-center gap-2 flex-wrap">
                        {e.details && <span>{e.details}</span>}
                        {e.ejaarDate && <span className="text-gray-400 inline-flex items-center gap-1"><Calendar size={9} />{fmtDate(e.ejaarDate)}</span>}
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
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-7">
            <SummaryCard icon={DollarSign} label={`${year} Income`} value={fmt(yearTotals.incoming)}
              iconClass="bg-primary-50 text-primary-600" />
            <SummaryCard icon={Building2} label="Paid to Owners" value={fmt(yearTotals.ejaar)}
              iconClass="bg-blue-50 text-blue-600" />
            <SummaryCard icon={Zap} label="Total FEWA" value={fmt(yearTotals.fewa)}
              iconClass="bg-amber-50 text-amber-600" />
            <SummaryCard icon={MoreHorizontal} label="Other Expense" value={fmt(yearTotals.others)}
              iconClass="bg-gray-100 text-gray-600" />
            <SummaryCard icon={Wallet} label="Net Profit" value={fmt(yearTotals.net)}
              iconClass={yearTotals.net >= 0 ? 'bg-emerald2-50 text-emerald2-600' : 'bg-rust-50 text-rust-600'} />
          </div>

          <div className="card p-5 mb-6">
            <h3 className="text-sm font-bold text-charcoal-900 mb-1">Income vs Net Profit · {year}</h3>
            <p className="text-xs text-gray-500 mb-5">{availableMonths.length} months with data</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={yearChart} barSize={16} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(201,161,84,0.06)' }} />
                <Bar dataKey="incoming" name="Income" fill="#c9a154" radius={[3,3,0,0]} />
                <Bar dataKey="net" name="Net Profit" radius={[3,3,0,0]}>
                  {yearChart.map((d, i) => <Cell key={i} fill={d.net >= 0 ? '#10b981' : '#b3573f'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200/80">
              <h3 className="text-sm font-bold text-charcoal-900">Monthly Breakdown · {year}</h3>
              <p className="text-xs text-gray-500 mt-0.5">Tap a row to see villa detail</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="px-5 py-3 text-left text-2xs uppercase tracking-[0.14em] text-gray-500 font-bold">Month</th>
                    <th className="px-4 py-3 text-right text-2xs uppercase tracking-[0.14em] text-gray-500 font-bold">Income</th>
                    <th className="px-4 py-3 text-right text-2xs uppercase tracking-[0.14em] text-blue-600 font-bold">To Owners</th>
                    <th className="px-4 py-3 text-right text-2xs uppercase tracking-[0.14em] text-gray-500 font-bold">FEWA</th>
                    <th className="px-4 py-3 text-right text-2xs uppercase tracking-[0.14em] text-gray-500 font-bold">Others</th>
                    <th className="px-5 py-3 text-right text-2xs uppercase tracking-[0.14em] text-gray-500 font-bold">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {yearChart.map((m, i) => {
                    const mNum = availableMonths[i]
                    return (
                      <tr key={mNum} onClick={() => { setMonth(mNum); setViewMode('monthly') }}
                        className="border-t border-gray-100 hover:bg-primary-50/40 transition-colors cursor-pointer">
                        <td className="px-5 py-3.5"><span className="text-charcoal-900 font-bold">{MONTH_LABELS[mNum]}</span></td>
                        <td className="px-4 py-3.5 text-right"><span className="text-charcoal-900 font-bold tabular-nums">{fmtShort(m.incoming)}</span></td>
                        <td className="px-4 py-3.5 text-right"><span className="text-blue-600 tabular-nums">{m.ejaar > 0 ? fmtShort(m.ejaar) : '—'}</span></td>
                        <td className="px-4 py-3.5 text-right"><span className="text-amber-600 tabular-nums">{m.fewa > 0 ? fmtShort(m.fewa) : '—'}</span></td>
                        <td className="px-4 py-3.5 text-right"><span className="text-gray-600 tabular-nums">{m.others > 0 ? fmtShort(m.others) : '—'}</span></td>
                        <td className="px-5 py-3.5 text-right"><span className={`font-bold tabular-nums ${m.net >= 0 ? 'text-emerald2-600' : 'text-rust-600'}`}>{m.net >= 0 ? '+' : ''}{fmtShort(m.net)}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-charcoal-900 text-cream">
                    <td className="px-5 py-3.5"><span className="text-2xs uppercase tracking-wider font-bold text-primary-400">Total {year}</span></td>
                    <td className="px-4 py-3.5 text-right"><span className="font-bold tabular-nums text-cream">{fmtShort(yearTotals.incoming)}</span></td>
                    <td className="px-4 py-3.5 text-right"><span className="font-bold tabular-nums text-blue-300">{fmtShort(yearTotals.ejaar)}</span></td>
                    <td className="px-4 py-3.5 text-right"><span className="font-bold tabular-nums text-amber-300">{fmtShort(yearTotals.fewa)}</span></td>
                    <td className="px-4 py-3.5 text-right"><span className="font-bold tabular-nums text-gray-300">{fmtShort(yearTotals.others)}</span></td>
                    <td className="px-5 py-3.5 text-right"><span className={`font-bold tabular-nums ${yearTotals.net >= 0 ? 'text-emerald-400' : 'text-rust-300'}`}>{yearTotals.net >= 0 ? '+' : ''}{fmtShort(yearTotals.net)}</span></td>
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
