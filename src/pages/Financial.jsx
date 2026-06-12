import React, { useState, useEffect } from 'react'
import { watchCollection, isDemoMode } from '../data/db'
import { format, subMonths, parseISO } from 'date-fns'
import {
  DollarSign, TrendingUp, TrendingDown, Users, AlertCircle, CheckCircle,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts'

const PIE_COLORS = ['#c9a154', '#b3573f']

// ── Per-month helpers ─────────────────────────────────────────────────────────
function monthKey(d = new Date()) { return format(d, 'yyyy-MM') }
function monthLabel(d = new Date()) { return format(d, 'MMMM yyyy') }

function isPaid(tenant, key = monthKey()) {
  const p = tenant?.payments
  if (p && typeof p === 'object' && key in p) return !!p[key]
  return key === monthKey() ? !!tenant?.paid : false
}

function isOwnerPaid(owner, key) {
  const p = owner?.payments
  if (p && typeof p === 'object' && key in p) return !!p[key]
  return false
}

function StatCard({ icon: Icon, label, value, subtext, color }) {
  return (
    <div className="stat-card">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">{label}</p>
          <p className="text-2xl font-bold text-charcoal-900 mt-1">{value}</p>
          {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
        </div>
      </div>
    </div>
  )
}

function buildMonthlyData(tenants) {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d   = subMonths(now, 5 - i)
    const key = monthKey(d)
    const label = format(d, 'MMM yy')
    const collected = tenants.filter(t =>  isPaid(t, key)).reduce((s, t) => s + Number(t.rentAmount || 0), 0)
    const pending   = tenants.filter(t => !isPaid(t, key)).reduce((s, t) => s + Number(t.rentAmount || 0), 0)
    return { month: label, Collected: collected, Pending: pending }
  })
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

export default function Financial() {
  const [tenants, setTenants] = useState([])
  const [owners,  setOwners]  = useState([])
  const [loading, setLoading] = useState(true)
  const [ownersLoading, setOwnersLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('monthly')

  // Revenue tab state
  const [revenueYear, setRevenueYear] = useState(new Date().getFullYear())

  useEffect(() => {
    const unsub = watchCollection(
      'tenants',
      'createdAt',
      'desc',
      (data) => {
        setTenants(data)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setError('Failed to load financial data.')
        setLoading(false)
      }
    )
    return unsub
  }, [])

  useEffect(() => {
    const unsub = watchCollection(
      'owners',
      'createdAt',
      'desc',
      (data) => {
        setOwners(data)
        setOwnersLoading(false)
      },
      (err) => {
        console.error(err)
        setOwnersLoading(false)
      }
    )
    return unsub
  }, [])

  const MONTH       = monthKey()
  const MONTH_LABEL = monthLabel()

  const totalCollected = tenants.filter(t =>  isPaid(t, MONTH)).reduce((s, t) => s + Number(t.rentAmount || 0), 0)
  const totalPending   = tenants.filter(t => !isPaid(t, MONTH)).reduce((s, t) => s + Number(t.rentAmount || 0), 0)
  const totalDeposits  = tenants.reduce((s, t) => s + Number(t.deposit || 0), 0)
  const paidCount   = tenants.filter(t =>  isPaid(t, MONTH)).length
  const unpaidCount = tenants.filter(t => !isPaid(t, MONTH)).length

  const pieData = [
    { name: 'Paid', value: totalCollected },
    { name: 'Pending', value: totalPending },
  ]

  const monthlyData = buildMonthlyData(tenants)

  // Yearly: sum up payments across all 12 months of this year
  const now = new Date()
  let yearlyCollected = 0, yearlyPending = 0
  for (let m = 0; m < 12; m++) {
    const d   = new Date(now.getFullYear(), m, 1)
    const key = monthKey(d)
    yearlyCollected += tenants.filter(t =>  isPaid(t, key)).reduce((s, t) => s + Number(t.rentAmount || 0), 0)
    yearlyPending   += tenants.filter(t => !isPaid(t, key)).reduce((s, t) => s + Number(t.rentAmount || 0), 0)
  }

  const formatAED = (v) => `AED ${Number(v).toLocaleString()}`

  // ── Revenue tab data ─────────────────────────────────────────────────────────
  const currentMonthKey = monthKey()
  const revenueRows = MONTH_NAMES.map((name, idx) => {
    const d = new Date(revenueYear, idx, 1)
    const key = format(d, 'yyyy-MM')
    const tenantIncome = tenants
      .filter(t => isPaid(t, key))
      .reduce((s, t) => s + Number(t.rentAmount || 0), 0)
    const ownerCost = owners
      .filter(o => isOwnerPaid(o, key))
      .reduce((s, o) => s + Number(o.rentAmount || 0), 0)
    const netProfit = tenantIncome - ownerCost
    return { name, key, tenantIncome, ownerCost, netProfit }
  })

  const totalTenantIncome = revenueRows.reduce((s, r) => s + r.tenantIncome, 0)
  const totalOwnerCost    = revenueRows.reduce((s, r) => s + r.ownerCost, 0)
  const totalNetProfit    = totalTenantIncome - totalOwnerCost

  const revenueLoading = loading || ownersLoading

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      <div className="mb-6">
        <h1 className="page-title">Financial Overview</h1>
        <span className="gold-rule" />
        <p className="text-gray-500 text-sm mt-3">
          {MONTH_LABEL} — payment status resets automatically each new month
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-center text-red-700 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {isDemoMode && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg flex gap-3">
          <AlertCircle size={18} className="text-primary-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">Demo Mode — figures are based on sample data on this device.</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['monthly', 'yearly', 'revenue'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold capitalize transition-all duration-300 ${
              tab === t
                ? 'bg-charcoal-900 text-primary-400 shadow-card'
                : 'bg-white text-gray-600 border border-gray-300 hover:border-primary-500 hover:text-primary-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Revenue Tab ───────────────────────────────────────────────────────── */}
      {tab === 'revenue' && (
        <div>
          {/* Year selector */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setRevenueYear(y => y - 1)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-300 hover:border-primary-500 hover:text-primary-700 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xl font-bold text-charcoal-900 min-w-[4rem] text-center">{revenueYear}</span>
            <button
              onClick={() => setRevenueYear(y => y + 1)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-300 hover:border-primary-500 hover:text-primary-700 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Summary cards */}
          {revenueLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="stat-card animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                      <div className="h-7 bg-gray-200 rounded w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatCard
                icon={TrendingUp}
                label="Annual Income"
                value={formatAED(totalTenantIncome)}
                color="bg-emerald2-50 text-emerald2-600"
                subtext={`Tenant rents collected in ${revenueYear}`}
              />
              <StatCard
                icon={TrendingDown}
                label="Annual Outgoing"
                value={formatAED(totalOwnerCost)}
                color="bg-rust-50 text-rust-600"
                subtext={`Owner rents paid in ${revenueYear}`}
              />
              <StatCard
                icon={DollarSign}
                label="Annual Profit"
                value={formatAED(totalNetProfit)}
                color={totalNetProfit >= 0 ? 'bg-charcoal-900 text-primary-400' : 'bg-rust-50 text-rust-600'}
                subtext="Income minus outgoing"
              />
            </div>
          )}

          {/* 12-month table */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-display text-xl text-charcoal-900">Monthly Revenue Breakdown — {revenueYear}</h2>
            </div>
            {revenueLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Month</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tenant Income</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner Cost</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {revenueRows.map((row) => {
                      const isCurrentMonth = row.key === currentMonthKey
                      return (
                        <tr
                          key={row.key}
                          className={`transition-colors ${
                            isCurrentMonth
                              ? 'bg-primary-50 border-l-4 border-l-primary-400'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-6 py-3.5 font-medium text-gray-900">
                            {row.name}
                            {isCurrentMonth && (
                              <span className="ml-2 text-[10px] font-bold uppercase bg-primary-400 text-charcoal-900 px-1.5 py-0.5 rounded-full">
                                Current
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 font-medium text-gray-800">
                            {row.tenantIncome > 0 ? formatAED(row.tenantIncome) : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-6 py-3.5 font-medium text-gray-800">
                            {row.ownerCost > 0 ? formatAED(row.ownerCost) : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-6 py-3.5 font-bold">
                            {row.tenantIncome === 0 && row.ownerCost === 0 ? (
                              <span className="text-gray-400">—</span>
                            ) : (
                              <span className={row.netProfit >= 0 ? 'text-emerald2-600' : 'text-rust-600'}>
                                {row.netProfit >= 0 ? '+' : ''}{formatAED(row.netProfit)}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                      <td className="px-6 py-3.5 text-sm font-bold text-gray-700">Yearly Total</td>
                      <td className="px-6 py-3.5 text-sm font-bold text-gray-900">{formatAED(totalTenantIncome)}</td>
                      <td className="px-6 py-3.5 text-sm font-bold text-gray-900">{formatAED(totalOwnerCost)}</td>
                      <td className={`px-6 py-3.5 text-sm font-bold ${totalNetProfit >= 0 ? 'text-emerald2-600' : 'text-rust-600'}`}>
                        {totalNetProfit >= 0 ? '+' : ''}{formatAED(totalNetProfit)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Monthly / Yearly Tabs ─────────────────────────────────────────────── */}
      {tab !== 'revenue' && (
        <>
          {/* Stat Cards */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="stat-card animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                      <div className="h-7 bg-gray-200 rounded w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={DollarSign}
                label="Total Collected"
                value={formatAED(tab === 'monthly' ? totalCollected : yearlyCollected)}
                color="bg-charcoal-900 text-primary-400"
                subtext={tab === 'monthly' ? 'All time' : `Year ${now.getFullYear()}`}
              />
              <StatCard
                icon={TrendingDown}
                label="Total Pending"
                value={formatAED(tab === 'monthly' ? totalPending : yearlyPending)}
                color="bg-rust-50 text-rust-600"
                subtext="Outstanding balance"
              />
              <StatCard
                icon={CheckCircle}
                label="Number Paid"
                value={paidCount}
                color="bg-emerald2-50 text-emerald2-600"
                subtext="Tenants with paid status"
              />
              <StatCard
                icon={Users}
                label="Number Unpaid"
                value={unpaidCount}
                color="bg-primary-100 text-primary-700"
                subtext="Tenants with pending status"
              />
              <StatCard
                icon={TrendingUp}
                label="Total Deposits"
                value={formatAED(totalDeposits)}
                color="bg-charcoal-900 text-primary-400"
                subtext="Security deposits held"
              />
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Bar Chart */}
            <div className="card p-6 lg:col-span-2">
              <h2 className="font-display text-xl text-charcoal-900 mb-1">Monthly Rent Overview</h2>
              <p className="text-sm text-gray-500 mb-4">Last 6 months — collected vs pending (AED)</p>
              {loading ? (
                <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5dd" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#8d8a7f' }} axisLine={{ stroke: '#d8d5ca' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#8d8a7f' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => [`AED ${Number(v).toLocaleString()}`, undefined]} contentStyle={{ borderRadius: 14, border: '1px solid #e7e5dd', boxShadow: 'rgba(19,21,28,0.12) 0 8px 20px 0', fontSize: 13 }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="Collected" fill="#c9a154" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Pending" fill="#b3573f" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie Chart */}
            <div className="card p-6">
              <h2 className="font-display text-xl text-charcoal-900 mb-1">Payment Breakdown</h2>
              <p className="text-sm text-gray-500 mb-4">Paid vs pending by amount</p>
              {loading ? (
                <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
              ) : totalCollected === 0 && totalPending === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-400 text-sm text-center">
                  No payment data yet.<br />Add tenants to see breakdown.
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`AED ${Number(v).toLocaleString()}`, undefined]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-6 mt-2">
                    {pieData.map((entry, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                        <span className="text-xs text-gray-600">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Transaction Table */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-display text-xl text-charcoal-900">All Tenants — Payment Status</h2>
            </div>
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : tenants.length === 0 ? (
              <div className="p-10 text-center text-gray-400 text-sm">
                No tenant data. Add tenants to see the financial summary.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tenant</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rent (AED)</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deposit (AED)</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rent Date</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tenants.map((t) => {
                      let dueDateDisplay = '—'
                      try {
                        if (t.dueDate) dueDateDisplay = format(parseISO(t.dueDate), 'MMM d, yyyy')
                      } catch {}
                      return (
                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-xs flex-shrink-0">
                                {t.name?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <span className="font-medium text-gray-900">{t.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{t.unit || '—'}</td>
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {Number(t.rentAmount || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {t.deposit ? Number(t.deposit).toLocaleString() : '—'}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{t.rentSchedule || dueDateDisplay}</td>
                          <td className="px-6 py-4">
                            <span className={isPaid(t, MONTH) ? 'badge-paid' : 'badge-unpaid'}>
                              {isPaid(t, MONTH) ? 'Paid' : 'Unpaid'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td colSpan={2} className="px-6 py-3 text-sm font-semibold text-gray-700">Total</td>
                      <td className="px-6 py-3 text-sm font-bold text-gray-900">
                        {(totalCollected + totalPending).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-sm font-bold text-gray-900">
                        {totalDeposits.toLocaleString()}
                      </td>
                      <td />
                      <td className="px-6 py-3">
                        <span className="text-xs text-gray-500">
                          {paidCount} paid · {unpaidCount} pending
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
