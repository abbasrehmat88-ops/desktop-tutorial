import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { watchCollection, isDemoMode } from '../data/db'
import { useAuth } from '../contexts/AuthContext'
import { Users, DollarSign, AlertCircle, TrendingUp, Bell, Clock, ArrowRight, Trophy } from 'lucide-react'
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
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">{label}</p>
        <p className="text-2xl font-bold text-charcoal-900 mt-1">
          {animate ? <CountUp value={value} /> : value}
        </p>
        {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
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
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-card bg-charcoal-900 mb-8 animate-fade-up">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/30 via-transparent to-charcoal-800 pointer-events-none" />
        <div className="relative px-6 py-8 sm:px-10 sm:py-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <p className="text-primary-400 text-[11px] uppercase tracking-[0.25em] mb-2">
              {format(today, 'EEEE, MMMM d, yyyy')}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl text-white">
              Welcome back, <span className="italic text-primary-300 capitalize">{firstName}</span>
            </h1>
            <p className="text-charcoal-300 text-sm mt-2">Here's how your properties are performing today.</p>
          </div>
          <div className="sm:text-right">
            <p className="text-charcoal-300 text-xs uppercase tracking-wider mb-1">Collected this month</p>
            <p className="font-display text-4xl sm:text-5xl text-white">
              <span className="text-primary-400 text-2xl align-top mr-1">AED</span>
              {loading ? '—' : <CountUp value={totalRevenue} duration={1600} />}
            </p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-2xl" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                  <div className="h-7 bg-gray-200 rounded w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8 stagger">
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
              <div className="p-6 text-center text-gray-400 text-sm">
                No tenants yet. Add your first tenant!
              </div>
            ) : (
              recentTenants.map((tenant) => (
                <Link key={tenant.id} to="/tenants" className="flex items-center gap-3 px-6 py-4 transition-colors duration-300 hover:bg-gray-50 cursor-pointer">
                  <div className="w-10 h-10 bg-charcoal-900 rounded-full flex items-center justify-center text-primary-400 font-bold text-sm flex-shrink-0">
                    {tenant.name?.charAt(0).toUpperCase() || 'T'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-charcoal-900 text-sm truncate">{tenant.name}</p>
                    <p className="text-xs text-gray-500">Unit {tenant.unit} · AED {Number(tenant.rentAmount || 0).toLocaleString()}</p>
                  </div>
                  <span className={isPaid(tenant, MONTH) ? 'badge-paid' : 'badge-unpaid'}>
                    {isPaid(tenant, MONTH) ? 'Paid' : 'Unpaid'}
                  </span>
                </Link>
              ))
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
              <div className="p-6 text-center text-gray-400 text-sm">
                No upcoming reminders in the next 7 days.
              </div>
            ) : (
              upcomingReminders.map((reminder) => {
                let daysLeft = 0
                try {
                  const due = parseISO(reminder.dueDate)
                  daysLeft = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
                } catch {}
                return (
                  <div key={reminder.id} className="flex items-center gap-3 px-6 py-4 transition-colors duration-300 hover:bg-gray-50">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock size={16} className="text-primary-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-charcoal-900 text-sm truncate">{reminder.title}</p>
                      <p className="text-xs text-gray-500">
                        {reminder.type} · Due {reminder.dueDate ? format(parseISO(reminder.dueDate), 'MMM d, yyyy') : 'N/A'}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      daysLeft <= 2 ? 'bg-rust-50 text-rust-600' : 'bg-primary-100 text-primary-700'
                    }`}>
                      {daysLeft === 0 ? 'Today' : daysLeft === 1 ? '1 day' : `${daysLeft} days`}
                    </span>
                  </div>
                )
              })
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
            <div className="px-6 py-5 flex items-center gap-2 text-sm text-emerald2-600">
              <span className="font-semibold">No payments due in the next 7 days ✓</span>
            </div>
          ) : (
            upcomingOwnerPayments.map((owner) => (
              <Link
                key={owner.id}
                to="/owners"
                className="flex items-center gap-3 px-6 py-4 transition-colors duration-300 hover:bg-gray-50 cursor-pointer"
              >
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider flex-shrink-0 ${
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
                  <p className="font-bold text-charcoal-900 text-sm">
                    AED {Number(owner.rentAmount || 0).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-gray-400 capitalize">
                    {owner.paymentMethod === 'check'
                      ? `Check${owner.bankName ? ` · ${owner.bankName}` : ''}`
                      : owner.paymentMethod || ''}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Business Analytics */}
      <div className="mt-10">
        <h2 className="font-display text-xl text-charcoal-900">Business Analytics</h2>
        <span className="gold-rule" />
        <p className="text-xs text-gray-400 mt-1 mb-5">Villa cash flow over the last 12 months</p>

        {!showCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5 h-[300px] animate-pulse bg-gray-50" />
            <div className="card p-5 h-[300px] animate-pulse bg-gray-50" />
          </div>
        )}

        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${!showCharts ? 'hidden' : ''}`}>
          {/* Chart A — Income vs Outgoing */}
          <div className="card p-5 sm:p-6">
            <h3 className="font-display text-lg text-charcoal-900">Income vs Outgoing</h3>
            <p className="text-xs text-gray-400 mb-4">Last 12 months · AED</p>
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
            <h3 className="font-display text-lg text-charcoal-900">Net Kept per Month</h3>
            <p className="text-xs text-gray-400 mb-4">Incoming minus outgoing · AED</p>
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
            <div className="p-6 text-center text-gray-400 text-sm">
              No cash flow data for this year yet.
            </div>
          ) : (
            topVillas.map((villa, i) => (
              <div key={villa.villa} className="flex items-center gap-3 px-6 py-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    i === 0
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {i + 1}
                </div>
                <p className="flex-1 min-w-0 font-semibold text-charcoal-900 text-sm truncate">
                  {villa.villa}
                </p>
                <p
                  className={`text-sm font-bold text-right flex-shrink-0 ${
                    villa.net >= 0 ? 'text-emerald2-600' : 'text-rust-600'
                  }`}
                >
                  {villa.net < 0 ? '−' : ''}AED {Math.abs(villa.net).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
