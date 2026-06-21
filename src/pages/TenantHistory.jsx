import { useMemo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Users, DoorOpen, History, TrendingUp, ChevronDown, Pencil, X, Loader2, AlertCircle, Zap } from 'lucide-react'
import businessData from '../data/businessData.json'
import { deriveLiveVillaYear } from '../data/liveVilla'
import { watchCollection, updateItem, isDemoMode } from '../data/db'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const fmt = (n) => (n === null || n === undefined || Number.isNaN(n) ? '—' : Math.round(n).toLocaleString())
const aed = (n) => 'AED ' + Math.round(Number(n) || 0).toLocaleString()
const sumNonNull = (arr) => (arr || []).reduce((s, v) => (v === null || v === undefined ? s : s + v), 0)

// The year that is driven live from the editable Tenants section.
const LIVE_YEAR = String(new Date().getFullYear())

const VILLA_META = businessData.villas || []
const metaByName = new Map(VILLA_META.map((v) => [v.name, v]))

// Every year that has any static room data, plus the live year.
const ALL_YEARS = (() => {
  const set = new Set([LIVE_YEAR])
  VILLA_META.forEach((v) =>
    Object.entries(v.years || {}).forEach(([y, d]) => {
      if (Array.isArray(d.rooms) && d.rooms.length) set.add(y)
    })
  )
  return [...set].sort()
})()

// A room counts as "occupied" if it has a tenant name or any income.
const isOccupied = (r) =>
  (r.tenant && r.tenant.trim() && !/^vacant|empty|–|-$/i.test(r.tenant.trim())) ||
  sumNonNull(r.monthly) > 0

// ── Inline room editor (writes straight back to the live tenant doc) ──────────
function RoomEditModal({ open, room, villaName, onClose }) {
  const [form, setForm] = useState({ name: '', room: '', rent: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && room) {
      setForm({ name: room.tenant || '', room: String(room.room ?? ''), rent: String(room.rent ?? '') })
      setError('')
    }
  }, [open, room])

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('Tenant name is required.')
    if (form.rent === '' || isNaN(Number(form.rent))) return setError('Valid rent amount is required.')
    setSaving(true)
    try {
      await updateItem('tenants', room.id, {
        name: form.name.trim(),
        unit: form.room.trim(),
        rentAmount: Number(form.rent),
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-up"
      style={{ backgroundColor: 'rgba(26,26,29,0.6)', backdropFilter: 'blur(2px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-cream rounded-t-3xl sm:rounded-3xl shadow-premium w-full max-w-md flex flex-col animate-scale-in overflow-hidden">
        <div className="relative flex items-center justify-between px-6 py-5 bg-charcoal-900 flex-shrink-0">
          <div>
            <span className="section-label text-primary-400">{villaName} · {LIVE_YEAR}</span>
            <h2 className="font-display text-xl text-white leading-tight">Edit Room</h2>
          </div>
          <button onClick={onClose} aria-label="Close dialog"
            className="p-2.5 -mr-1 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X size={20} />
          </button>
          <span className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-primary-500 via-primary-400 to-transparent" />
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          {error && (
            <div className="p-3 bg-rust-50 border border-rust-200 rounded-xl flex gap-2 items-center text-rust-700 text-sm animate-pop">
              <AlertCircle size={15} className="flex-shrink-0" />{error}
            </div>
          )}
          <div>
            <label className="field-label">Tenant Name *</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input-field" placeholder="e.g. Ahmed Al Rashidi" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Room Number</label>
              <input value={form.room} onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                className="input-field" placeholder="e.g. 21" />
            </div>
            <div>
              <label className="field-label">Rent (AED) *</label>
              <input type="number" min="0" value={form.rent} onChange={(e) => setForm((f) => ({ ...f, rent: e.target.value }))}
                className="input-field tabular" placeholder="e.g. 2000" required />
            </div>
          </div>
          <p className="text-[11px] text-gray-400">
            This updates the live tenant record — it instantly reflects in the Tenants section and the {LIVE_YEAR} totals here.
          </p>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : null} Save
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

function VillaBlock({ meta, yd, defaultOpen, editable, onEditRoom }) {
  const [open, setOpen] = useState(defaultOpen)
  const rooms = yd?.rooms || []
  if (!rooms.length) return null

  const occupied = rooms.filter(isOccupied).length
  const income = yd.incomeTotal != null
    ? yd.incomeTotal
    : rooms.reduce((s, r) => s + (r.total != null ? r.total : sumNonNull(r.monthly)), 0)

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50/60 transition-colors min-h-[44px]"
      >
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-charcoal-900 flex items-center justify-center font-display font-bold text-sm shrink-0">
          {meta.num}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base text-charcoal-900 truncate">{meta.name}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            <span className="tabular">{occupied}</span>/<span className="tabular">{rooms.length}</span> rooms occupied · {editable ? `${LIVE_YEAR} · live` : 'archived'}
          </p>
        </div>
        <p className="font-bold text-emerald2-600 tabular text-sm shrink-0 hidden sm:block">{aed(income)}</p>
        <ChevronDown size={18} className={`text-gray-400 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="overflow-x-auto border-t border-gray-100 animate-fade-up">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-semibold">
              <tr>
                <th className="px-3 py-2.5 text-left whitespace-nowrap">Room</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap">Tenant</th>
                {MONTHS.map((m) => (
                  <th key={m} className="px-2 py-2.5 text-right whitespace-nowrap">{m}</th>
                ))}
                <th className="px-3 py-2.5 text-right whitespace-nowrap">Total</th>
                {editable && <th className="px-3 py-2.5 text-right whitespace-nowrap">Edit</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rooms.map((r, i) => (
                <tr key={r.id || i} className={`hover:bg-primary-50/40 transition-colors ${isOccupied(r) ? '' : 'opacity-50'}`}>
                  <td className="px-3 py-2.5 font-medium text-charcoal-900 whitespace-nowrap">{r.room}</td>
                  <td className="px-3 py-2.5 text-gray-600 max-w-[160px] truncate">{r.tenant || '—'}</td>
                  {(r.monthly || Array(12).fill(null)).map((v, j) => (
                    <td key={j} className="px-2 py-2.5 text-right tabular text-gray-700">{fmt(v)}</td>
                  ))}
                  <td className="px-3 py-2.5 text-right tabular font-semibold text-charcoal-900">
                    {fmt(r.total != null ? r.total : sumNonNull(r.monthly))}
                  </td>
                  {editable && (
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => onEditRoom(r, meta.name)}
                        aria-label={`Edit room ${r.room}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              <tr className="bg-primary-50 font-bold text-charcoal-900">
                <td className="px-3 py-2.5" colSpan={2}>Total Income</td>
                {(yd.incomeMonthly || Array(12).fill(null)).map((v, j) => (
                  <td key={j} className="px-2 py-2.5 text-right tabular">{fmt(v)}</td>
                ))}
                <td className="px-3 py-2.5 text-right tabular">{fmt(income)}</td>
                {editable && <td />}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function TenantHistory() {
  const [year, setYear] = useState(LIVE_YEAR)
  const [tenants, setTenants] = useState([])
  const [editRoom, setEditRoom] = useState(null) // { room, villaName }

  useEffect(() => {
    return watchCollection('tenants', 'createdAt', 'desc',
      (data) => setTenants(data),
      (err) => console.error(err)
    )
  }, [])

  const isLiveYear = year === LIVE_YEAR

  // Live-derived villa data for the current year (rebuilt whenever tenants change).
  const liveYearData = useMemo(
    () => (isLiveYear ? deriveLiveVillaYear(tenants, year) : null),
    [isLiveYear, tenants, year]
  )

  // Resolve the list of { meta, yd } blocks to render for the selected year.
  const blocks = useMemo(() => {
    const list = []
    if (isLiveYear && liveYearData) {
      for (const meta of VILLA_META) {
        const yd = liveYearData[meta.name]
        if (yd && yd.rooms.length) list.push({ meta, yd })
      }
      for (const [name, yd] of Object.entries(liveYearData)) {
        if (!metaByName.has(name) && yd.rooms.length) {
          list.push({ meta: { id: name, num: name === 'Unassigned' ? '?' : '•', name }, yd })
        }
      }
    } else {
      for (const meta of VILLA_META) {
        const yd = meta.years?.[year]
        if (yd && yd.rooms?.length) list.push({ meta, yd })
      }
    }
    return list
  }, [isLiveYear, liveYearData, year])

  const summary = useMemo(() => {
    let rooms = 0, occupied = 0, income = 0
    blocks.forEach(({ yd }) => {
      rooms += yd.rooms.length
      occupied += yd.rooms.filter(isOccupied).length
      income += yd.incomeTotal != null
        ? yd.incomeTotal
        : yd.rooms.reduce((s, r) => s + (r.total != null ? r.total : sumNonNull(r.monthly)), 0)
    })
    return { rooms, occupied, income, villasWithData: blocks.length }
  }, [blocks])

  const cards = [
    { label: 'Rooms Occupied', value: `${summary.occupied} / ${summary.rooms}`, icon: DoorOpen, accent: 'text-primary-600', bg: 'bg-primary-50' },
    { label: `Income — ${year}`, value: aed(summary.income), icon: TrendingUp, accent: 'text-emerald2-600', bg: 'bg-emerald2-50' },
    { label: 'Villas with Records', value: String(summary.villasWithData), icon: Users, accent: 'text-charcoal-700', bg: 'bg-gray-100' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      {/* Header */}
      <div className="mb-6">
        <p className="section-label mb-1">Archive</p>
        <h1 className="page-title">Tenant History</h1>
        <span className="gold-rule" />
        <p className="text-sm text-gray-500 mt-3">
          Room-by-room tenant &amp; income records across every villa, 2018–{LIVE_YEAR}
        </p>
      </div>

      {/* Live-year banner */}
      {isLiveYear && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald2-50 border border-emerald2-100 flex items-start gap-2.5">
          <Zap size={16} className="text-emerald2-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald2-800">
            <span className="font-semibold">{LIVE_YEAR} is live.</span> Rooms &amp; rents here come straight from your
            Tenants section — edit a room below and it updates everywhere instantly.
            {isDemoMode && ' (Demo mode — changes saved on this device only.)'}
          </p>
        </div>
      )}

      {/* Year selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {ALL_YEARS.map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            aria-pressed={year === y}
            className={`min-h-[44px] px-6 rounded-2xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 border ${
              year === y
                ? 'bg-charcoal-900 text-primary-400 border-charcoal-900 shadow-card'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-700'
            }`}
          >
            {y}{y === LIVE_YEAR ? ' · live' : ''}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 stagger">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="stat-card">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={22} className={c.accent} />
                </div>
                <div className="min-w-0">
                  <p className="section-label">{c.label}</p>
                  <p className="font-display text-2xl font-bold text-charcoal-900 mt-1 tabular leading-tight">{c.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Per-villa expandable blocks */}
      {blocks.length === 0 ? (
        <div className="card p-12 text-center animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-charcoal-900 flex items-center justify-center mx-auto mb-4">
            <History size={30} className="text-primary-400" />
          </div>
          <h3 className="font-display text-lg text-charcoal-900">No records for {year}</h3>
          <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto">
            {isLiveYear
              ? 'Add tenants in the Tenants section and they will appear here automatically.'
              : 'No tenant records were imported for this year.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {blocks.map(({ meta, yd }, i) => (
            <VillaBlock
              key={meta.id || meta.name}
              meta={meta}
              yd={yd}
              defaultOpen={i === 0}
              editable={isLiveYear}
              onEditRoom={(room, villaName) => setEditRoom({ room, villaName })}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center mt-6">
        {isLiveYear
          ? `${LIVE_YEAR} reflects your live Tenants data. Past years (2018–${String(LIVE_YEAR - 1)}) are the archived records imported from your villa books.`
          : 'Archived tenant occupancy & income imported from your villa records.'}
      </p>

      <RoomEditModal
        key={editRoom ? editRoom.room.id : '__none__'}
        open={!!editRoom}
        room={editRoom?.room}
        villaName={editRoom?.villaName}
        onClose={() => setEditRoom(null)}
      />
    </div>
  )
}
