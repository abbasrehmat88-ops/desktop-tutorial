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
  KeyRound,
  Wallet,
  Sparkles,
  Trash2,
  History,
  Zap,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const navGroups = [
  {
    items: [
      { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'  },
    ]
  },
  {
    label: 'Tenants',
    items: [
      { to: '/tenants',         icon: Users,           label: 'Tenants'    },
      { to: '/tenant-history',  icon: History,         label: 'Tenant History' },
      { to: '/deposits',        icon: Landmark,        label: 'Deposits'   },
    ]
  },
  {
    label: 'Finance',
    items: [
      { to: '/financial',  icon: DollarSign,      label: 'Financial'  },
      { to: '/owners',     icon: KeyRound,        label: 'Owners'     },
      { to: '/cashflow',   icon: Wallet,          label: 'Cash Flow'  },
      { to: '/fewa-bills', icon: Zap,             label: 'FEWA Bills' },
    ]
  },
  {
    label: 'Tools',
    items: [
      { to: '/reminders',       icon: Bell,      label: 'Reminders'      },
      { to: '/properties',      icon: Building2, label: 'Properties'     },
      { to: '/property-finder', icon: Sparkles,  label: 'Property Finder'},
    ]
  },
]

function NavItem({ to, icon: Icon, label, onClose }) {
  return (
    <NavLink
      to={to}
      onClick={onClose}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
          isActive
            ? 'bg-primary-400/[0.12] text-white ring-1 ring-primary-400/25'
            : 'text-charcoal-300 hover:bg-white/[0.06] hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Left indicator bar */}
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-gradient-to-b from-primary-300 to-primary-500 rounded-r-full"
              style={{ boxShadow: '0 0 8px rgba(201,161,84,0.7)' }} />
          )}

          {/* Icon box */}
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
            isActive
              ? 'bg-primary-400/20'
              : 'group-hover:bg-white/[0.07]'
          }`}
            style={isActive ? { boxShadow: '0 0 10px rgba(201,161,84,0.25)' } : {}}>
            <Icon size={15} className={isActive ? 'text-primary-400' : 'text-charcoal-400 group-hover:text-white transition-colors'} />
          </span>

          <span className={`flex-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>{label}</span>

          {/* Active dot */}
          {isActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0"
              style={{ boxShadow: '0 0 6px rgba(201,161,84,0.9)' }} />
          )}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar({ open, onClose }) {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-20 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-30
          flex flex-col transition-transform duration-300
          lg:relative lg:translate-x-0 lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          background: 'linear-gradient(180deg, #16181f 0%, #13151c 60%, #0f1118 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 bg-gradient-to-br from-primary-300 to-primary-600 rounded-xl flex items-center justify-center shadow-glow">
                <Home size={20} className="text-charcoal-900" />
              </div>
              {/* Subtle animated ring */}
              <span className="absolute inset-0 rounded-xl border border-primary-400/30 animate-pulse" />
            </div>
            <div>
              <h1 className="font-display text-base leading-tight text-white tracking-wide">Rehmat Properties</h1>
              <p className="text-primary-400/80 text-[10px] uppercase tracking-[0.2em] mt-0.5 font-medium">Premium Estate Mgmt</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="px-3 mb-1.5 text-[10px] uppercase tracking-[0.2em] text-charcoal-500 font-bold">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <NavItem key={item.to} {...item} onClose={onClose} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Import link */}
        <div className="px-3 pb-2">
          <NavLink
            to="/import-data"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-primary-500/20 text-primary-300 ring-1 ring-primary-500/30'
                  : 'text-primary-400/70 border border-primary-500/20 hover:bg-primary-500/10 hover:text-primary-300 hover:border-primary-500/40'
              }`
            }
          >
            <Upload size={14} />
            <span className="font-medium text-xs">Import Tenant Data</span>
          </NavLink>
          <NavLink
            to="/reset-data"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 mt-1.5 rounded-xl text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-rust-500/20 text-rust-300 ring-1 ring-rust-500/30'
                  : 'text-rust-400/70 border border-rust-500/20 hover:bg-rust-500/10 hover:text-rust-300 hover:border-rust-500/40'
              }`
            }
          >
            <Trash2 size={14} />
            <span className="font-medium text-xs">Reset Data</span>
          </NavLink>
        </div>

        {/* User footer */}
        <div className="px-3 py-3 border-t border-white/[0.07]"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-white/[0.04] transition-colors">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 text-charcoal-900 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-glow">
              {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {currentUser?.email || 'User'}
              </p>
              <p className="text-[10px] text-primary-400/70 mt-0.5 font-medium">Owner · Rehmat Properties</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 text-charcoal-500 hover:text-primary-400 hover:bg-white/[0.06] rounded-lg transition-all duration-200"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
