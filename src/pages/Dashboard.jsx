import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { watchCollection, isDemoMode } from '../data/db'
import { useAuth } from '../contexts/AuthContext'
import { Users, DollarSign, AlertCircle, TrendingUp, Bell, Clock, ArrowRight, Trophy, CalendarDays } from 'lucide-react'
import { format, isWithinInterval, addDays, addMonths, subMonths, parseISO } from 'date-fns'
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import CountUp from '../components/CountUp'
import businessData from '../data/businessData.json'

function monthKey(d = new Date()) { return format(d, 'yyyy-MM') }
function isPaid(tenant, key = monthKey()) {
  const p = tenant?.payments
  if (p && typeof p === 'object' && key in p) return !!p[key]
  return key === monthKey() ? !!tenant?.paid : false
}

const fmtAED = (v) => `AED ${Number(v || 0).toLocaleString()}`

/** Last 12 months (ending at the current month) of cash flow totals. */
function buildMonthlySeries() {
  const now = new Date()
  const series = []
  for (let i = 11; i >= 0; i--) {
    const d = subMonths(now, i)
    const block = (businessData.cashflow || []).find(
      (b) => b.year === d.getFullYear() && b.month === d.getMonth() + 1
    )
    let incoming = 0
    let outgoing = 0
    if (block) {
      for (const e of block.entries || []) {
        incoming += Number(e.incoming) || 0
        outgoing += (Number(e.fewa) || 0) + (Number(e.ejaar) || 0) + (Number(e.others) || 0)
      }
    }
    series.push({
      label: format(d, 'MMM yy'),
      incoming,
      outgoing,
      net: incoming - outgoing,
    })
  }
  return series
}

/** Top 5 villas by net (incoming − outgoing) for the current year. */
function buildTopVillas() {
  const year = new Date().getFullYear()
  const byVilla = {}
  for (const block of businessData.cashflow || []) {
    if (block.year !== year) continue
    for (const e of block.entries || []) {
      const name = e.villa || 'Unknown'
      if (!byVilla[name]) byVilla[name] = { villa: name, incoming: 0, outgoing: 0 }
      byVilla[name].incoming += Number(e.incoming) || 0
      byVilla[name].outgoing += (Number(e.fewa) || 0) + (Number(e.ejaar) || 0) + (Number(e.others) || 0)
    }
  }
  return Object.values(byVilla)
    .map((v) => ({ ...v, net: v.incoming - v.outgoing }))
    .sort((a, b) => b.net - a.net)
    .slice(0, 5)
}

function StatCard({ icon: Icon, label, value, color, subtext, animate, to }) {
  const inner = (
    <>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-glow-sm ${color}`}>
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="section-label text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-charcoal-900 mt-1.5 tabular leading-none">
          {animate ? <CountUp value={value} /> : value}
        </p>
        {subtext && <p className="text-xs text-gray-400 mt-1.5">{subtext}</p>}
      </div>
      <ArrowRight size={16} className="text-primary-500 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5 self-center flex-shrink-0" />
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        className="stat-card flex items-start gap-4 group ring-1 ring-transparent hover:ring-primary-400 hover:shadow-glow active:scale-[0.98] transition-all duration-200 cursor-pointer"
      >
        {inner}
      </Link>
    )
  }

  return (
    <div className="stat-card flex items-start gap-4">
      {inner}
    </div>
  )
}

export default function Dashboard() {
  const { currentUser } = useAuth()
  const [tenants, setTenants] = useState([])
  const [reminders, setReminders] = useState([])
  const [owners, setOwners] = useState([])
  const [loadingTenants, setLoadingTenants] = useState(true)
  const [loadingReminders, setLoadingReminders] = useState(true)
  const [showCharts, setShowCharts] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubTenants = watchCollection(
      'tenants',
      'createdAt',
      'desc',
      (data) => {
        setTenants(data)
        setLoadingTenants(false)
      },
      (err) => {
        console.error('Tenants fetch error:', err)
        setError('Failed to load tenant data.')
        setLoadingTenants(false)
      }
    )

    const unsubReminders = watchCollection(
      'reminders',
      'dueDate',
      'asc',
      (data) => {
        setReminders(data)
        setLoadingReminders(false)
      },
      (err) => {
        console.error('Reminders fetch error:', err)
        setLoadingReminders(false)
      }
    )

    const unsubOwners = watchCollection(
      'owners',
      'createdAt',
      'desc',
      (data) => setOwners(data),
      (err) => console.error('Owners fetch error:', err)
    )

    // Defer heavy chart rendering until after first paint
    const chartTimer = setTimeout(() => setShowCharts(true), 400)

    return () => {
      unsubTenants()
      unsubReminders()
      unsubOwners()
      clearTimeout(chartTimer)
    }
  }, [])

  const MONTH = monthKey()
  const totalTenants   = tenants.length
  const paidCount      = tenants.filter(t => isPaid(t, MONTH)).length
  const partialCount   = tenants.filter(t => !isPaid(t, MONTH) && Number(t.partialPayments?.[MONTH] || 0) > 0).length
  const unpaidCount    = tenants.filter(t => !isPaid(t, MONTH) && !Number(t.partialPayments?.[MONTH])).length
  const totalRevenue = tenants.reduce((sum, t) => {
    if (isPaid(t, MONTH)) return sum + (Number(t.rentAmount) || 0)
    return sum + Number(t.partialPayments?.[MONTH] || 0)
  }, 0)

  // Revenue collected TODAY — derived from the date each payment was stamped.
  // Full payment marked today counts the full rent; otherwise a partial stamped today.
  const TODAY_ISO = format(new Date(), 'yyyy-MM-dd')
  const todayRevenue = tenants.reduce((sum, t) => {
    if (t.paidAt?.[MONTH] === TODAY_ISO) return sum + (Number(t.rentAmount) || 0)
    if (t.partialAt?.[MONTH] === TODAY_ISO) return sum + Number(t.partialPayments?.[MONTH] || 0)
    return sum
  }, 0)
  const todayCount = tenants.filter(t => t.paidAt?.[MONTH] === TODAY_ISO || t.partialAt?.[MONTH] === TODAY_ISO).length

  const today = new Date()
  const sevenDaysLater = addDays(today, 7)
  const upcomingReminders = reminders.filter((r) => {
    if (!r.dueDate) return false
    try {
      const due = parseISO(r.dueDate)
      return isWithinInterval(due, { start: today, end: sevenDaysLater })
    } catch {
      return false
    }
  }).slice(0, 3)

  const recentTenants = tenants.slice(0, 5)

  // Owner payments due within the next 7 days (not yet paid for this month)
  const upcomingOwnerPayments = useMemo(() => {
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return owners
      .map((o) => {
        const dueDay = Number(o.dueDay)
        if (!dueDay) return null
        if (o.payments?.[MONTH] === true) return null
        const base = dueDay >= today.getDate() ? startOfToday : addMonths(startOfToday, 1)
        const dueDate = new Date(base.getFullYear(), base.getMonth(), dueDay)
        const daysUntil = Math.round((dueDate - startOfToday) / 86400000)
        if (daysUntil < 0 || daysUntil > 7) return null
        return { ...o, daysUntil }
      })
      .filter(Boolean)
      .sort((a, b) => a.daysUntil - b.daysUntil)
  }, [owners, MONTH])

  // Static business analytics (from imported cash flow data)
  const monthlySeries = useMemo(() => buildMonthlySeries(), [])
  const topVillas = useMemo(() => buildTopVillas(), [])

  const loading = loadingTenants
  const firstName = currentUser?.email?.split('@')[0] || 'there'

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Hero banner — private bank statement header */}
      <div className="relative overflow-hidden rounded-card bg-charcoal-900 mb-8 shadow-premium animate-fade-up">
        <div className="absolute inset-0 bg-gradient-to-br from-charcoal-800 via-charcoal-900 to-charcoal-950 pointer-events-none" />
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-primary-500/10 blur-3xl pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/40 to-transparent pointer-events-none" />
        <div className="relative px-6 py-8 sm:px-10 sm:py-11 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8">
          <div className="min-w-0">
            <p className="text-primary-400/90 text-[11px] uppercase tracking-[0.3em] mb-3">
              {format(today, 'EEEE, MMMM d, yyyy')}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl text-white leading-tight">
              Welcome back, <span className="italic text-primary-300 capitalize">{firstName}</span>
            </h1>
            <p className="text-charcoal-300 text-sm mt-3">Here's how your properties are performing today.</p>
          </div>
          <div className="sm:text-right shrink-0">
            <p className="text-charcoal-400 text-[11px] uppercase tracking-[0.2em] mb-2">Collected this month</p>
            <p className="font-display text-4xl sm:text-5xl text-white tabular leading-none">
              <span className="text-primary-400 text-xl sm:text-2xl align-top mr-1.5 tracking-normal">AED</span>
              {loading ? <span className="text-charcoal-500">—</span> : <CountUp value={totalRevenue} duration={1600} />}
            </p>
            <span className="hidden sm:block gold-rule ml-auto mt-3" />
            {/* Today's collections — updates automatically each day */}
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/5 ring-1 ring-white/10 px-3.5 py-1.5">
              <CalendarDays size={14} className="text-primary-400" />
              <span className="text-charcoal-300 text-[11px] uppercase tracking-[0.15em]">Today</span>
              <span className="font-display text-base text-white tabular leading-none">
                AED {loading ? '—' : todayRevenue.toLocaleString()}
              </span>
              {todayCount > 0 && (
                <span className="text-2xs text-primary-300/80 tabular">· {todayCount} paid</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-rust-50 border border-rust-100 rounded-xl flex gap-2 items-center text-rust-700 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {isDemoMode && (
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-xl flex gap-3 shadow-card animate-fade-up">
          <AlertCircle size={18} className="text-primary-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-600">
            <p className="font-semibold text-charcoal-900">Demo Mode — sample data loaded</p>
            <p className="mt-1">You're previewing the app with example data saved on this device. Add Firebase credentials to enable real-time sync across phones.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="stat-card">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 skeleton rounded-2xl" />
                <div className="flex-1">
                  <div className="h-3.5 skeleton rounded w-24 mb-2.5" />
                  <div className="h-7 skeleton rounded w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8 stagger">
          <StatCard
            icon={CalendarDays}
            label="Today's Revenue"
            value={`AED ${todayRevenue.toLocaleString()}`}
            color="bg-charcoal-900 text-primary-400"
            subtext={todayCount > 0 ? `${todayCount} collected today` : 'Updates as you collect'}
            to="/dues"
          />
          <StatCard
            icon={Users}
            label="Total Tenants"
            value={totalTenants}
            animate
            color="bg-charcoal-900 text-primary-400"
            subtext={`${paidCount} paid · ${unpaidCount} pending`}
            to="/tenants"
          />
          <StatCard
            icon={DollarSign}
            label="Paid This Month"
            value={paidCount}
            animate
            color="bg-emerald2-50 text-emerald2-600"
            subtext="Tenants with paid status"
            to="/tenants?filter=paid"
          />
          <StatCard
            icon={AlertCircle}
            label="Pending Payments"
            value={unpaidCount}
            animate
            color="bg-rust-50 text-rust-600"
            subtext={partialCount > 0 ? `+${partialCount} partial payment${partialCount > 1 ? 's' : ''}` : 'Tenants with unpaid status'}
            to="/dues"
          />
          <StatCard
            icon={TrendingUp}
            label="Monthly Revenue"
            value={`AED ${totalRevenue.toLocaleString()}`}
            color="bg-primary-100 text-primary-700"
            subtext="Paid + partial amounts"
            to="/financial"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger">
        {/* Recent Tenants */}
        <div className="card">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="font-display text-xl text-charcoal-900">Recent Tenants</h2>
              <span className="gold-rule" />
            </div>
            <Link to="/tenants" className="group flex items-center gap-1 text-sm text-primary-700 hover:text-primary-600 font-semibold transition-colors">
              View all
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {loadingTenants ? (
              <div className="p-6 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-9 h-9 bg-gray-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-1" />
                      <div className="h-3 bg-gray-200 rounded w-20" />
                    </div>
                    <div className="h-5 bg-gray-200 rounded w-12" />
                  </div>
                ))}
              </div>
            ) : recentTenants.length === 0 ? (
              <div className="px-6 py-12 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                  <Users size={22} />
                </div>
                <p className="text-sm font-semibold text-charcoal-900">No tenants yet</p>
                <p className="text-xs text-gray-400 mt-1">Add your first tenant to see them here.</p>
              </div>
            ) : (
              <div className="stagger">
                {recentTenants.map((tenant) => (
                  <Link key={tenant.id} to="/tenants" className="group flex items-center gap-3.5 px-6 py-4 transition-colors duration-200 hover:bg-gray-50 cursor-pointer">
                    <div className="w-10 h-10 bg-charcoal-900 rounded-full flex items-center justify-center text-primary-400 font-bold text-sm flex-shrink-0 shadow-glow-sm">
                      {tenant.name?.charAt(0).toUpperCase() || 'T'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-charcoal-900 text-sm truncate">{tenant.name}</p>
                      <p className="text-xs text-gray-500 tabular">Unit {tenant.unit} · AED {Number(tenant.rentAmount || 0).toLocaleString()}</p>
                    </div>
                    <span className={isPaid(tenant, MONTH) ? 'badge-paid' : 'badge-unpaid'}>
                      {isPaid(tenant, MONTH) ? 'Paid' : 'Unpaid'}
                    </span>
                    <ArrowRight size={15} className="text-primary-500 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5 flex-shrink-0 -ml-1" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Reminders */}
        <div className="card">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="font-display text-xl text-charcoal-900">Upcoming Reminders</h2>
              <span className="gold-rule" />
            </div>
            <Link to="/reminders" className="group flex items-center gap-1 text-sm text-primary-700 hover:text-primary-600 font-semibold transition-colors">
              View all
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {loadingReminders ? (
              <div className="p-6 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-9 h-9 bg-gray-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-1" />
                      <div className="h-3 bg-gray-200 rounded w-20" />
                    </div>
                    <div className="h-5 bg-gray-200 rounded w-16" />
                  </div>
                ))}
              </div>
            ) : upcomingReminders.length === 0 ? (
              <div className="px-6 py-12 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 mb-3">
                  <Bell size={20} />
                </div>
                <p className="text-sm font-semibold text-charcoal-900">All clear</p>
                <p className="text-xs text-gray-400 mt-1">No upcoming reminders in the next 7 days.</p>
              </div>
            ) : (
              <div className="stagger">
                {upcomingReminders.map((reminder) => {
                  let daysLeft = 0
                  try {
                    const due = parseISO(reminder.dueDate)
                    daysLeft = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
                  } catch {}
                  return (
                    <div key={reminder.id} className="flex items-center gap-3.5 px-6 py-4 transition-colors duration-200 hover:bg-gray-50">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Clock size={16} className="text-primary-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-charcoal-900 text-sm truncate">{reminder.title}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {reminder.type} · Due {reminder.dueDate ? format(parseISO(reminder.dueDate), 'MMM d, yyyy') : 'N/A'}
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full tabular flex-shrink-0 ${
                        daysLeft <= 2 ? 'bg-rust-50 text-rust-600' : 'bg-primary-100 text-primary-700'
                      }`}>
                        {daysLeft === 0 ? 'Today' : daysLeft === 1 ? '1 day' : `${daysLeft} days`}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming owner payments */}
      <div className="card border-l-4 border-primary-500 mt-6 animate-fade-up">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="font-display text-xl text-charcoal-900 flex items-center gap-2">
              <Bell size={18} className="text-primary-600" />
              Upcoming Payments
            </h2>
            <p className="text-xs text-gray-400 mt-1">Owner payments due in the next 7 days</p>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {upcomingOwnerPayments.length === 0 ? (
            <div className="px-6 py-5 flex items-center gap-3 text-sm text-emerald2-600">
              <span className="w-9 h-9 rounded-full bg-emerald2-50 flex items-center justify-center flex-shrink-0">
                <Bell size={16} />
              </span>
              <span className="font-semibold">No payments due in the next 7 days ✓</span>
            </div>
          ) : (
            <div className="stagger">
              {upcomingOwnerPayments.map((owner) => (
                <Link
                  key={owner.id}
                  to="/owners"
                  className="group flex items-center gap-3 px-6 py-4 transition-colors duration-200 hover:bg-gray-50 cursor-pointer"
                >
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider flex-shrink-0 tabular ${
                      owner.daysUntil === 0
                        ? 'bg-red-50 text-red-600'
                        : owner.daysUntil === 1
                        ? 'bg-rust-50 text-rust-600'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {owner.daysUntil === 0
                      ? 'TODAY'
                      : owner.daysUntil === 1
                      ? 'TOMORROW'
                      : `${owner.daysUntil} DAYS`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-charcoal-900 text-sm truncate">{owner.name}</p>
                    <p className="text-xs text-gray-500 truncate">{owner.property}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-charcoal-900 text-sm tabular">
                      AED {Number(owner.rentAmount || 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-gray-400 capitalize truncate">
                      {owner.paymentMethod === 'check'
                        ? `Check${owner.bankName ? ` · ${owner.bankName}` : ''}`
                        : owner.paymentMethod || ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Business Analytics */}
      <div className="mt-10">
        <p className="section-label text-primary-700">Insights</p>
        <h2 className="font-display text-xl text-charcoal-900 mt-1">Business Analytics</h2>
        <span className="gold-rule" />
        <p className="text-xs text-gray-400 mt-2 mb-5">Villa cash flow over the last 12 months</p>

        {!showCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5 sm:p-6 h-[300px] skeleton" />
            <div className="card p-5 sm:p-6 h-[300px] skeleton" />
          </div>
        )}

        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${!showCharts ? 'hidden' : ''}`}>
          {/* Chart A — Income vs Outgoing */}
          <div className="card p-5 sm:p-6">
            <p className="section-label text-gray-400">Cash flow</p>
            <h3 className="font-display text-lg text-charcoal-900 mt-1">Income vs Outgoing</h3>
            <span className="gold-rule" />
            <p className="text-xs text-gray-400 mt-2 mb-4">Last 12 months · AED</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlySeries} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5dd" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value, name) => [fmtAED(value), name]} cursor={{ fill: 'rgba(201,161,84,0.06)' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="incoming" name="Incoming" fill="#c9a154" radius={[6, 6, 0, 0]} />
                <Bar dataKey="outgoing" name="Outgoing" fill="#b3573f" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart B — Net Kept per Month */}
          <div className="card p-5 sm:p-6">
            <p className="section-label text-gray-400">Retained</p>
            <h3 className="font-display text-lg text-charcoal-900 mt-1">Net Kept per Month</h3>
            <span className="gold-rule" />
            <p className="text-xs text-gray-400 mt-2 mb-4">Incoming minus outgoing · AED</p>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlySeries} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="netGoldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c9a154" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#c9a154" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5dd" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => [fmtAED(value), 'Net kept']} />
                <Area
                  type="monotone"
                  dataKey="net"
                  name="Net kept"
                  stroke="#c9a154"
                  strokeWidth={2}
                  fill="url(#netGoldGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Villas leaderboard */}
      <div className="card mt-6 animate-fade-up">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="font-display text-xl text-charcoal-900 flex items-center gap-2">
            <Trophy size={18} className="text-primary-600" />
            Top Villas This Year
          </h2>
          <p className="text-xs text-gray-400 mt-1">Based on {new Date().getFullYear()} cash flow</p>
        </div>
        <div className="divide-y divide-gray-100">
          {topVillas.length === 0 ? (
            <div className="px-6 py-12 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 mb-3">
                <Trophy size={22} />
              </div>
              <p className="text-sm font-semibold text-charcoal-900">Nothing to rank yet</p>
              <p className="text-xs text-gray-400 mt-1">No cash flow data for this year yet.</p>
            </div>
          ) : (
            <div className="stagger">
              {topVillas.map((villa, i) => (
                <div
                  key={villa.villa}
                  className={`flex items-center gap-3.5 px-6 py-4 transition-colors duration-200 hover:bg-gray-50 ${
                    i === 0 ? 'bg-primary-50/40' : ''
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 tabular ${
                      i === 0
                        ? 'bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-glow-sm'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {i === 0 ? <Trophy size={16} /> : i + 1}
                  </div>
                  <p className={`flex-1 min-w-0 text-sm truncate ${i === 0 ? 'font-bold text-charcoal-900' : 'font-semibold text-charcoal-900'}`}>
                    {villa.villa}
                  </p>
                  <p
                    className={`text-sm font-bold text-right flex-shrink-0 tabular ${
                      villa.net >= 0 ? 'text-emerald2-600' : 'text-rust-600'
                    }`}
                  >
                    {villa.net < 0 ? '−' : ''}AED {Math.abs(villa.net).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
