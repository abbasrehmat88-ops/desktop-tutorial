import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { watchCollection, isDemoMode } from '../data/db'
import { useAuth } from '../contexts/AuthContext'
import { Users, DollarSign, AlertCircle, TrendingUp, Bell, Clock } from 'lucide-react'
import { format, isWithinInterval, addDays, parseISO } from 'date-fns'

function StatCard({ icon: Icon, label, value, color, subtext }) {
  return (
    <div className="stat-card flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Welcome back, {currentUser?.email}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-center text-red-700 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {isDemoMode && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
          <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold">Demo Mode — sample data loaded</p>
            <p className="mt-1">You're previewing the app with example data saved on this device. Add Firebase credentials to enable real-time sync across phones.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                  <div className="h-7 bg-gray-200 rounded w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={Users}
            label="Total Tenants"
            value={totalTenants}
            color="bg-blue-500"
            subtext={`${paidCount} paid · ${unpaidCount} pending`}
          />
          <StatCard
            icon={DollarSign}
            label="Paid This Month"
            value={paidCount}
            color="bg-green-500"
            subtext="Tenants with paid status"
          />
          <StatCard
            icon={AlertCircle}
            label="Pending Payments"
            value={unpaidCount}
            color="bg-red-500"
            subtext="Tenants with unpaid status"
          />
          <StatCard
            icon={TrendingUp}
            label="Monthly Revenue"
            value={`AED ${totalRevenue.toLocaleString()}`}
            color="bg-purple-500"
            subtext="From paid tenants"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tenants */}
        <div className="card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users size={18} className="text-primary-600" />
              Recent Tenants
            </h2>
            <Link to="/tenants" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
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
                <div key={tenant.id} className="flex items-center gap-3 px-6 py-3.5">
                  <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">
                    {tenant.name?.charAt(0).toUpperCase() || 'T'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{tenant.name}</p>
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
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Bell size={18} className="text-primary-600" />
              Upcoming Reminders
            </h2>
            <Link to="/reminders" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
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
                  <div key={reminder.id} className="flex items-center gap-3 px-6 py-3.5">
                    <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock size={16} className="text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{reminder.title}</p>
                      <p className="text-xs text-gray-500">
                        {reminder.type} · Due {reminder.dueDate ? format(parseISO(reminder.dueDate), 'MMM d, yyyy') : 'N/A'}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      daysLeft <= 2 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
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
