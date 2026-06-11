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
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tenants', icon: Users, label: 'Tenants' },
  { to: '/financial', icon: DollarSign, label: 'Financial' },
  { to: '/reminders', icon: Bell, label: 'Reminders' },
  { to: '/properties', icon: Building2, label: 'Properties' },
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
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-30
          flex flex-col transition-transform duration-300
          lg:relative lg:translate-x-0 lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
          <div className="w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Home size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight text-gray-900">Ajman Rentals</h1>
            <p className="text-gray-600 text-xs">Management System</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-gray-100 text-gray-900 font-semibold'
                    : 'text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-primary-500' : ''} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {currentUser?.email || 'User'}
              </p>
              <p className="text-xs text-gray-500">Owner</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 text-gray-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
