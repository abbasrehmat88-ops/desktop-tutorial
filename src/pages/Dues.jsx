import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { watchCollection, updateItem } from '../data/db'
import { format, subMonths } from 'date-fns'
import {
  CalendarClock, AlertCircle, Check, MessageCircle, X,
  ChevronLeft, ChevronRight, Search, Users,
} from 'lucide-react'

function monthKey(d) { return format(d, 'yyyy-MM') }
function monthLabel(d) { return format(d, 'MMMM yyyy') }

function isPaid(tenant, key) {
  const p = tenant?.payments
  if (p && typeof p === 'object' && key in p) return !!p[key]
  return false
}

export default function Dues() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [search, setSearch]   = useState('')
  // Default to last month — that's the main question: "who still owes me?"
  const [offset, setOffset]   = useState(1) // months back from current

  useEffect(() => {
    return watchCollection('tenants', 'createdAt', 'desc',
      data => { setTenants(data); setLoading(false) },
      err  => { console.error(err); setError('Failed to load tenants.'); setLoading(false) }
    )
  }, [])

  const viewDate  = subMonths(new Date(), offset)
  const KEY       = monthKey(viewDate)
  const LABEL     = monthLabel(viewDate)
  const isCurrent = offset === 0

  const pending = useMemo(() => {
    return tenants
      .filter(t => !isPaid(t, KEY))
      .map(t => {
        const rent    = Number(t.rentAmount || 0)
        const partial = Number(t.partialPayments?.[KEY] || 0)
        // How many of the last 6 months (incl. viewed) are unpaid — repeat offenders
        let unpaidStreak = 0
        for (let i = offset; i < offset + 6; i++) {
          if (!isPaid(t, monthKey(subMonths(new Date(), i)))) unpaidStreak++
          else break
        }
        return { tenant: t, rent, partial, remaining: Math.max(0, rent - partial), unpaidStreak }
      })
      .filter(p => {
        if (!search) return true
        const q = search.toLowerCase()
        const t = p.tenant
        return (
          t.name?.toLowerCase().includes(q) ||
          String(t.unit ?? '').toLowerCase().includes(q) ||
          t.property?.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => b.remaining - a.remaining)
  }, [tenants, KEY, search, offset])

  const totalPending = pending.reduce((s, p) => s + p.remaining, 0)
  const partialCount = pending.filter(p => p.partial > 0).length

  async function markPaid(tenant) {
    const currentPayments = (tenant.payments && typeof tenant.payments === 'object')
      ? tenant.payments : {}
    try {
      await updateItem('tenants', tenant.id, {
        payments: { ...currentPayments, [KEY]: true },
      })
    } catch (err) {
      setError('Could not update: ' + err.message)
    }
  }

  function duesWhatsApp(tenant, remaining) {
    const phone = (tenant.phone || '').replace(/\D/g, '')
    const text = `Dear ${tenant.name}, your rent of AED ${remaining.toLocaleString()} for room ${tenant.unit} (${LABEL}) is still pending. Please arrange payment as soon as possible. Thank you, Rehmat Properties.`
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">

      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title">Pending Dues</h1>
        <span className="gold-rule" />
        <p className="text-gray-500 text-sm mt-2">
          Tenants who have not paid for a past month — chase what is owed
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-center text-red-700 text-sm">
          <AlertCircle size={16} />{error}
          <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Month navigator */}
      <div className="card !p-3 mb-5 flex items-center justify-between gap-3">
        <button
          onClick={() => setOffset(o => o + 1)}
          className="p-2.5 rounded-xl bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-600 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="font-display text-lg text-charcoal-900">{LABEL}</p>
          <p className="text-[11px] text-gray-400 uppercase tracking-wider">
            {isCurrent ? 'Current month' : offset === 1 ? 'Last month' : `${offset} months ago`}
          </p>
        </div>
        <button
          onClick={() => setOffset(o => Math.max(0, o - 1))}
          disabled={offset === 0}
          className="p-2.5 rounded-xl bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-600 transition-colors disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 stagger">
        <div className="stat-card">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rust-50 flex items-center justify-center flex-shrink-0">
              <CalendarClock size={22} className="text-rust-600" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Pending</p>
              <p className="text-2xl font-bold text-rust-600 mt-1">AED {totalPending.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-0.5">{LABEL}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-charcoal-900 flex items-center justify-center flex-shrink-0">
              <Users size={22} className="text-primary-400" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Tenants Owing</p>
              <p className="text-2xl font-bold text-charcoal-900 mt-1">{pending.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">of {tenants.length} tenants</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={22} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Paid Partially</p>
              <p className="text-2xl font-bold text-charcoal-900 mt-1">{partialCount}</p>
              <p className="text-xs text-gray-400 mt-0.5">Partial amount received</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search by name, room, villa…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="input-field pl-9" />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card !p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : pending.length === 0 ? (
        <div className="card p-12 text-center">
          <Check size={48} className="text-emerald2-600 mx-auto mb-3" />
          <h3 className="text-charcoal-900 font-semibold">All clear for {LABEL}!</h3>
          <p className="text-gray-400 text-sm mt-1">
            {search ? 'No pending tenants match your search.' : 'Every tenant has paid for this month.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {pending.map(({ tenant, rent, partial, remaining, unpaidStreak }) => (
            <div key={tenant.id}
              className={`card !p-4 ${unpaidStreak >= 2 ? 'border-l-4 border-l-rust-500' : ''}`}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Identity */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-rust-50 rounded-full flex items-center justify-center text-rust-600 font-bold text-sm flex-shrink-0">
                    {tenant.name?.charAt(0).toUpperCase() || 'T'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">{tenant.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Room {tenant.unit || '—'}{tenant.property ? ` · ${tenant.property}` : ''}
                    </p>
                    {unpaidStreak >= 2 && (
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 bg-rust-50 text-rust-600 rounded-full">
                        {unpaidStreak} months unpaid
                      </span>
                    )}
                  </div>
                </div>

                {/* Amounts */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    {partial > 0 ? (
                      <>
                        <p className="text-xs text-amber-600 font-semibold">AED {partial.toLocaleString()} paid</p>
                        <p className="font-bold text-rust-600">AED {remaining.toLocaleString()} due</p>
                      </>
                    ) : (
                      <p className="font-bold text-rust-600">AED {remaining.toLocaleString()} due</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => markPaid(tenant)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-gradient-to-r from-primary-500 to-primary-600 text-charcoal-900 rounded-xl shadow-glow hover:from-primary-400 hover:to-primary-500 transition-all"
                  >
                    <Check size={13} /> Mark Paid
                  </button>
                  {tenant.phone && (
                    <a href={duesWhatsApp(tenant, remaining)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition-colors">
                      <MessageCircle size={13} /> Remind
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer hint */}
      {!loading && pending.length > 0 && (
        <p className="text-xs text-gray-400 text-center mt-6">
          Tap <span className="font-semibold text-primary-700">Mark Paid</span> when a tenant settles {LABEL} —
          it updates their record instantly. Manage current month on the{' '}
          <Link to="/tenants" className="text-primary-700 font-semibold hover:underline">Tenants page</Link>.
        </p>
      )}
    </div>
  )
}
