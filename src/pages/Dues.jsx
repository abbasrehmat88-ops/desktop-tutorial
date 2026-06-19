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
    const paidAt = (tenant.paidAt && typeof tenant.paidAt === 'object') ? { ...tenant.paidAt } : {}
    paidAt[KEY] = format(new Date(), 'yyyy-MM-dd') // stamp collection date for Dashboard daily revenue
    try {
      await updateItem('tenants', tenant.id, {
        payments: { ...currentPayments, [KEY]: true },
        paidAt,
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
        <div className="mb-4 p-4 bg-rust-50 border border-rust-200 rounded-xl flex gap-2 items-center text-rust-700 text-sm animate-pop">
          <AlertCircle size={16} />{error}
          <button onClick={() => setError('')} aria-label="Dismiss error" className="ml-auto p-1"><X size={14} /></button>
        </div>
      )}

      {/* Month navigator */}
      <div className="card !p-2.5 mb-5 flex items-center justify-between gap-3">
        <button
          onClick={() => setOffset(o => o + 1)}
          aria-label="Previous month"
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-600 transition-colors flex-shrink-0"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="font-display text-lg text-charcoal-900 leading-tight">{LABEL}</p>
          <p className="section-label mt-0.5">
            {isCurrent ? 'Current month' : offset === 1 ? 'Last month' : `${offset} months ago`}
          </p>
        </div>
        <button
          onClick={() => setOffset(o => Math.max(0, o - 1))}
          disabled={offset === 0}
          aria-label="Next month"
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-600 transition-colors disabled:opacity-30 disabled:hover:bg-gray-100 disabled:hover:text-gray-600 flex-shrink-0"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 stagger">
        <div className="stat-card">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rust-50 flex items-center justify-center flex-shrink-0">
              <CalendarClock size={22} className="text-rust-600" />
            </div>
            <div className="min-w-0">
              <p className="section-label">Total Pending</p>
              <p className="font-display text-2xl font-bold text-rust-600 mt-1 tabular leading-tight">AED {totalPending.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-0.5">{LABEL}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-charcoal-900 flex items-center justify-center flex-shrink-0">
              <Users size={22} className="text-primary-400" />
            </div>
            <div className="min-w-0">
              <p className="section-label">Tenants Owing</p>
              <p className="font-display text-2xl font-bold text-charcoal-900 mt-1 tabular leading-tight">{pending.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">of {tenants.length} tenants</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={22} className="text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="section-label">Paid Partially</p>
              <p className="font-display text-2xl font-bold text-charcoal-900 mt-1 tabular leading-tight">{partialCount}</p>
              <p className="text-xs text-gray-400 mt-0.5">Partial amount received</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input type="text" placeholder="Search by name, room, villa…"
          value={search} onChange={e => setSearch(e.target.value)}
          aria-label="Search pending dues"
          className="input-field pl-10" />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card !p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : pending.length === 0 ? (
        <div className="card p-12 text-center animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-emerald2-50 flex items-center justify-center mx-auto mb-4">
            <Check size={30} className="text-emerald2-600" />
          </div>
          <h3 className="font-display text-lg text-charcoal-900">All clear for {LABEL}!</h3>
          <p className="text-gray-400 text-sm mt-1">
            {search ? 'No pending tenants match your search.' : 'Every tenant has paid for this month.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {pending.map(({ tenant, rent, partial, remaining, unpaidStreak }) => (
            <div key={tenant.id}
              className={`card !p-4 transition-shadow duration-200 hover:shadow-lg ${unpaidStreak >= 2 ? 'border-l-4 border-l-rust-500' : ''}`}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Identity */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 bg-gradient-to-br from-rust-50 to-rust-100 rounded-2xl flex items-center justify-center text-rust-600 font-display font-bold text-base flex-shrink-0 shadow-card">
                    {tenant.name?.charAt(0).toUpperCase() || 'T'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-semibold text-charcoal-900 text-[15px] leading-tight truncate">{tenant.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      Room {tenant.unit || '—'}{tenant.property ? ` · ${tenant.property}` : ''}
                    </p>
                    {unpaidStreak >= 2 && (
                      <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 bg-rust-100 text-rust-700 rounded-full">
                        <AlertCircle size={10} /> {unpaidStreak} months unpaid
                      </span>
                    )}
                  </div>
                </div>

                {/* Amounts */}
                <div className="flex items-center gap-4 text-sm pl-14 sm:pl-0">
                  <div className="text-left sm:text-right">
                    {partial > 0 ? (
                      <>
                        <p className="text-xs text-amber-600 font-semibold tabular">AED {partial.toLocaleString()} paid</p>
                        <p className="font-display font-bold text-rust-600 text-base tabular leading-tight">AED {remaining.toLocaleString()} due</p>
                      </>
                    ) : (
                      <p className="font-display font-bold text-rust-600 text-base tabular leading-tight">AED {remaining.toLocaleString()} due</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pl-14 sm:pl-0">
                  <button
                    onClick={() => markPaid(tenant)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 min-h-[44px] px-4 text-xs font-bold bg-gradient-to-r from-primary-500 to-primary-600 text-charcoal-900 rounded-xl shadow-glow-sm hover:from-primary-400 hover:to-primary-500 transition-all"
                  >
                    <Check size={14} /> Mark Paid
                  </button>
                  {tenant.phone && (
                    <a href={duesWhatsApp(tenant, remaining)} target="_blank" rel="noopener noreferrer"
                      aria-label={`Send WhatsApp reminder to ${tenant.name}`}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 min-h-[44px] px-4 text-xs font-semibold text-emerald2-700 bg-emerald2-50 hover:bg-emerald2-100 rounded-xl transition-colors">
                      <MessageCircle size={14} /> Remind
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
