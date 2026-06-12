import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Bell,
  Building2,
  LogOut,
  Home,
  Upload,
  Landmark,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/tenants',    icon: Users,           label: 'Tenants'    },
  { to: '/financial',  icon: DollarSign,      label: 'Financial'  },
  { to: '/deposits',   icon: Landmark,        label: 'Deposits'   },
  { to: '/reminders',  icon: Bell,            label: 'Reminders'  },
  { to: '/properties', icon: Building2,       label: 'Properties' },
]

export default function Sidebar({ open, onClose }) {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-20 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-charcoal-900 z-30
          flex flex-col transition-transform duration-300
          lg:relative lg:translate-x-0 lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/[0.08]">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-glow">
            <Home size={19} className="text-charcoal-900" />
          </div>
          <div>
            <h1 className="font-display text-lg leading-tight text-white tracking-wide">Ajman Rentals</h1>
            <p className="text-primary-400 text-[11px] uppercase tracking-[0.18em] mt-0.5">Estate Management</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-300 ${
                  isActive
                    ? 'bg-white/[0.07] text-white font-semibold'
                    : 'text-charcoal-300 font-medium hover:bg-white/[0.04] hover:text-white hover:translate-x-1'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-gradient-to-b from-primary-400 to-primary-600 rounded-r-full" />
                  )}
                  <Icon size={18} className={isActive ? 'text-primary-400' : ''} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* One-time import link */}
        <NavLink
          to="/import-data"
          onClick={onClose}
          className={({ isActive }) =>
            `relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-300 ${
              isActive
                ? 'bg-primary-500/20 text-primary-300 font-semibold'
                : 'text-primary-400 font-medium border border-primary-500/30 hover:bg-primary-500/10 hover:text-primary-300'
            }`
          }
        >
          <Upload size={16} />
          Import Tenant Data
        </NavLink>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-white/[0.08]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 text-charcoal-900 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {currentUser?.email || 'User'}
              </p>
              <p className="text-[11px] text-charcoal-400">Owner</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-2 text-charcoal-400 hover:text-primary-400 hover:bg-white/[0.06] rounded-lg transition-all duration-300"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
