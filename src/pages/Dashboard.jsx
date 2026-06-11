import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { watchCollection, isDemoMode } from '../data/db'
import { useAuth } from '../contexts/AuthContext'
import { Users, DollarSign, AlertCircle, TrendingUp, Bell, Clock, ArrowRight } from 'lucide-react'
import { format, isWithinInterval, addDays, parseISO } from 'date-fns'
import CountUp from '../components/CountUp'

function StatCard({ icon: Icon, label, value, color, subtext, animate }) {
  return (
    <div className="stat-card flex items-start gap-4">
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
    </div>
  )
}

export default function Dashboard() {
  const { currentUser } = useAuth()
  const [tenants, setTenants] = useState([])
  const [reminders, setReminders] = useState([])
  const [loadingTenants, setLoadingTenants] = useState(true)
  const [loadingReminders, setLoadingReminders] = useState(true)
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

    return () => {
      unsubTenants()
      unsubReminders()
    }
  }, [])

  const totalTenants = tenants.length
  const paidCount = tenants.filter((t) => t.paid).length
  const unpaidCount = tenants.filter((t) => !t.paid).length
  const totalRevenue = tenants.filter((t) => t.paid).reduce((sum, t) => sum + (Number(t.rentAmount) || 0), 0)

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

  const loading = loadingTenants || loadingReminders
  const firstName = currentUser?.email?.split('@')[0] || 'there'

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-card bg-charcoal-900 mb-8 animate-fade-up">
        <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full bg-primary-500/20 blur-[100px] animate-drift" />
        <div className="absolute -bottom-28 left-1/4 w-72 h-72 rounded-full bg-primary-600/10 blur-[90px] animate-drift-slow" />
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
          />
          <StatCard
            icon={DollarSign}
            label="Paid This Month"
            value={paidCount}
            animate
            color="bg-emerald2-50 text-emerald2-600"
            subtext="Tenants with paid status"
          />
          <StatCard
            icon={AlertCircle}
            label="Pending Payments"
            value={unpaidCount}
            animate
            color="bg-rust-50 text-rust-600"
            subtext="Tenants with unpaid status"
          />
          <StatCard
            icon={TrendingUp}
            label="Monthly Revenue"
            value={`AED ${totalRevenue.toLocaleString()}`}
            color="bg-primary-100 text-primary-700"
            subtext="From paid tenants"
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
                <div key={tenant.id} className="flex items-center gap-3 px-6 py-4 transition-colors duration-300 hover:bg-gray-50">
                  <div className="w-10 h-10 bg-charcoal-900 rounded-full flex items-center justify-center text-primary-400 font-bold text-sm flex-shrink-0">
                    {tenant.name?.charAt(0).toUpperCase() || 'T'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-charcoal-900 text-sm truncate">{tenant.name}</p>
                    <p className="text-xs text-gray-500">Unit {tenant.unit} · AED {Number(tenant.rentAmount || 0).toLocaleString()}</p>
                  </div>
                  <span className={tenant.paid ? 'badge-paid' : 'badge-unpaid'}>
                    {tenant.paid ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
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
    </div>
  )
}
