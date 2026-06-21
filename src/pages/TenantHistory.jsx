import { useMemo, useState, useEffect } from 'react'
import {
  Users, DoorOpen, History, TrendingUp, ChevronDown,
  Pencil, X, Plus, Trash2, Save, RotateCcw, Loader2, AlertCircle, Zap, Check,
} from 'lucide-react'
import businessData from '../data/businessData.json'
import { deriveLiveVillaYear } from '../data/liveVilla'
import { watchCollection, setDocItem, removeItem, isDemoMode } from '../data/db'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const LIVE_YEAR = String(new Date().getFullYear())
const VILLA_META = businessData.villas || []

const fmt = (n) => (n === null || n === undefined || Number.isNaN(n) ? '—' : Math.round(n).toLocaleString())
const aed = (n) => 'AED ' + Math.round(Number(n) || 0).toLocaleString()
const sumNonNull = (arr) => (arr || []).reduce((s, v) => (v === null || v === undefined ? s : s + v), 0)
const isOccupied = (r) =>
  (r.tenant && r.tenant.trim() && !/^vacant|empty|–|-$/i.test(r.tenant.trim())) ||
  sumNonNull(r.monthly) > 0

function blankRow() {
  return { room: '', tenant: '', monthly: Array(12).fill(null) }
}

function rowTotal(r) {
  return sumNonNull(r.monthly)
}

// ── Edit-mode table ──────────────────────────────────────────────────────────
function EditTable({ rows, onChange, onAddRow, onDeleteRow }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead className="bg-amber-50 text-gray-500 uppercase text-[10px] font-semibold">
          <tr>
            <th className="px-2 py-2 text-left whitespace-nowrap">Room</th>
            <th className="px-2 py-2 text-left whitespace-nowrap">Tenant</th>
            {MONTHS.map((m) => <th key={m} className="px-1 py-2 text-right whitespace-nowrap">{m}</th>)}
            <th className="px-2 py-2 text-right whitespace-nowrap">Total</th>
            <th className="px-2 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r, ri) => (
            <tr key={ri} className="bg-white hover:bg-amber-50/30">
              <td className="px-1 py-1">
                <input
                  value={r.room}
                  onChange={(e) => onChange(ri, 'room', e.target.value)}
                  placeholder="Room"
                  className="w-14 px-1.5 py-1 border border-gray-200 rounded-lg text-xs focus:border-primary-400 focus:outline-none"
                />
              </td>
              <td className="px-1 py-1">
                <input
                  value={r.tenant}
                  onChange={(e) => onChange(ri, 'tenant', e.target.value)}
                  placeholder="Tenant name"
                  className="w-32 px-1.5 py-1 border border-gray-200 rounded-lg text-xs focus:border-primary-400 focus:outline-none"
                />
              </td>
              {r.monthly.map((v, mi) => (
                <td key={mi} className="px-0.5 py-1">
                  <input
                    type="number"
                    min="0"
                    value={v ?? ''}
                    onChange={(e) => onChange(ri, mi, e.target.value)}
                    placeholder="—"
                    className="w-14 px-1 py-1 border border-gray-200 rounded-lg text-xs text-right tabular focus:border-primary-400 focus:outline-none"
                  />
                </td>
              ))}
              <td className="px-2 py-1 text-right tabular font-semibold text-charcoal-900 whitespace-nowrap">
                {rowTotal(r) > 0 ? rowTotal(r).toLocaleString() : '—'}
              </td>
              <td className="px-1 py-1">
                <button
                  onClick={() => onDeleteRow(ri)}
                  aria-label="Delete row"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-rust-500 hover:bg-rust-50 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-primary-50 font-bold text-charcoal-900">
            <td className="px-2 py-2" colSpan={2}>Total Income</td>
            {MONTHS.map((_, mi) => {
              const col = rows.reduce((s, r) => s + (r.monthly[mi] || 0), 0)
              return <td key={mi} className="px-1 py-2 text-right tabular">{col > 0 ? col.toLocaleString() : '—'}</td>
            })}
            <td className="px-2 py-2 text-right tabular">
              {rows.reduce((s, r) => s + rowTotal(r), 0).toLocaleString()}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
      <div className="px-4 py-3 border-t border-amber-100">
        <button
          onClick={onAddRow}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-2 rounded-lg transition-colors"
        >
          <Plus size={13} /> Add Room / Tenant
        </button>
      </div>
    </div>
  )
}

// ── Villa block (view + edit) ────────────────────────────────────────────────
function VillaBlock({ meta, yd, defaultOpen, isEdited, isLive, editingKey, villaKey, onStartEdit, onSave, onCancelEdit, saving }) {
  const [open, setOpen] = useState(defaultOpen)
  const [editRows, setEditRows] = useState([])
  const isEditing = editingKey === villaKey

  const rooms = yd?.rooms || []
  const incomeTotal = yd?.incomeTotal != null
    ? yd.incomeTotal
    : rooms.reduce((s, r) => s + (r.total != null ? r.total : sumNonNull(r.monthly)), 0)

  function startEdit() {
    setEditRows(rooms.map((r) => ({
      room: String(r.room ?? ''),
      tenant: r.tenant ?? '',
      monthly: Array(12).fill(null).map((_, i) => r.monthly?.[i] ?? null),
    })))
    setOpen(true)
    onStartEdit(villaKey)
  }

  function handleChange(ri, field, value) {
    setEditRows((prev) => prev.map((r, i) => {
      if (i !== ri) return r
      if (typeof field === 'number') {
        const monthly = [...r.monthly]
        monthly[field] = value === '' ? null : Number(value)
        return { ...r, monthly }
      }
      return { ...r, [field]: value }
    }))
  }

  async function handleSave() {
    const cleanRows = editRows.map((r) => ({
      room: r.room,
      tenant: r.tenant,
      monthly: r.monthly,
      total: rowTotal(r),
    }))
    const incomeMonthly = Array(12).fill(0).map((_, mi) =>
      cleanRows.reduce((s, r) => s + (r.monthly[mi] || 0), 0)
    )
    await onSave(villaKey, {
      villaId: meta.id,
      villaName: meta.name,
      villaNum: meta.num,
      year: villaKey.split('__')[1],
      rooms: cleanRows,
      incomeMonthly,
      incomeTotal: cleanRows.reduce((s, r) => s + r.total, 0),
    })
  }

  if (!rooms.length && !isEditing) return null

  return (
    <div className={`card overflow-hidden ${isEditing ? 'ring-2 ring-primary-400/50' : ''}`}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50/60 transition-colors">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex items-center gap-4 flex-1 min-w-0 text-left min-h-[44px]"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-charcoal-900 flex items-center justify-center font-display font-bold text-sm shrink-0">
            {meta.num}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-base text-charcoal-900 truncate">{meta.name}</h3>
            <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5">
              <span className="tabular">{rooms.filter(isOccupied).length}</span>/<span className="tabular">{rooms.length}</span> rooms
              {isEdited && <span className="px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-700 text-[9px] font-bold uppercase tracking-wide">edited</span>}
              {isLive && !isEdited && <span className="px-1.5 py-0.5 rounded-full bg-emerald2-100 text-emerald2-700 text-[9px] font-bold uppercase tracking-wide flex items-center gap-0.5"><Zap size={8} />live</span>}
            </p>
          </div>
          <p className="font-bold text-emerald2-600 tabular text-sm shrink-0 hidden sm:block">{aed(incomeTotal)}</p>
          <ChevronDown size={18} className={`text-gray-400 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </button>
        {/* Edit / Save / Cancel */}
        {!isEditing ? (
          <button
            onClick={startEdit}
            disabled={!!editingKey && editingKey !== villaKey}
            aria-label="Edit this villa's data"
            className="flex-shrink-0 flex items-center gap-1.5 min-h-[40px] px-3 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Pencil size={13} /> Edit
          </button>
        ) : (
          <div className="flex gap-1.5 flex-shrink-0">
            <button
              onClick={() => onCancelEdit()}
              className="flex items-center gap-1 min-h-[40px] px-3 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              <RotateCcw size={12} /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 min-h-[40px] px-3 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      {open && (
        <div className="border-t border-gray-100 animate-fade-up">
          {isEditing ? (
            <EditTable
              rows={editRows}
              onChange={handleChange}
              onAddRow={() => setEditRows((prev) => [...prev, blankRow()])}
              onDeleteRow={(ri) => setEditRows((prev) => prev.filter((_, i) => i !== ri))}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="px-3 py-2.5 text-left whitespace-nowrap">Room</th>
                    <th className="px-3 py-2.5 text-left whitespace-nowrap">Tenant</th>
                    {MONTHS.map((m) => <th key={m} className="px-2 py-2.5 text-right whitespace-nowrap">{m}</th>)}
                    <th className="px-3 py-2.5 text-right whitespace-nowrap">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rooms.map((r, i) => (
                    <tr key={i} className={`hover:bg-primary-50/40 transition-colors ${isOccupied(r) ? '' : 'opacity-50'}`}>
                      <td className="px-3 py-2.5 font-medium text-charcoal-900 whitespace-nowrap">{r.room}</td>
                      <td className="px-3 py-2.5 text-gray-600 max-w-[160px] truncate">{r.tenant || '—'}</td>
                      {(r.monthly || Array(12).fill(null)).map((v, j) => (
                        <td key={j} className="px-2 py-2.5 text-right tabular text-gray-700">{fmt(v)}</td>
                      ))}
                      <td className="px-3 py-2.5 text-right tabular font-semibold text-charcoal-900">
                        {fmt(r.total != null ? r.total : sumNonNull(r.monthly))}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-primary-50 font-bold text-charcoal-900">
                    <td className="px-3 py-2.5" colSpan={2}>Total Income</td>
                    {(yd.incomeMonthly || Array(12).fill(null)).map((v, j) => (
                      <td key={j} className="px-2 py-2.5 text-right tabular">{fmt(v)}</td>
                    ))}
                    <td className="px-3 py-2.5 text-right tabular">{fmt(incomeTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function TenantHistory() {
  const [year, setYear] = useState(LIVE_YEAR)
  const [tenants, setTenants] = useState([])
  const [overrides, setOverrides] = useState([]) // villaRecords collection docs
  const [editingKey, setEditingKey] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    const unsubTenants = watchCollection('tenants', 'createdAt', 'desc',
      setTenants, (err) => console.error(err)
    )
    const unsubOverrides = watchCollection('villaRecords', 'updatedAt', 'desc',
      setOverrides, (err) => console.error(err)
    )
    return () => { unsubTenants(); unsubOverrides() }
  }, [])

  // Live-derived 2026 data from tenants
  const liveYearData = useMemo(
    () => deriveLiveVillaYear(tenants, LIVE_YEAR),
    [tenants]
  )

  // Override map: { villaKey → yd data }
  const overrideMap = useMemo(() => {
    const m = {}
    overrides.forEach((o) => { m[o.id] = o })
    return m
  }, [overrides])

  // All years: static JSON + LIVE_YEAR + any override years
  const ALL_YEARS = useMemo(() => {
    const set = new Set([LIVE_YEAR])
    VILLA_META.forEach((v) => Object.keys(v.years || {}).forEach((y) => set.add(y)))
    overrides.forEach((o) => { if (o.year) set.add(o.year) })
    return [...set].sort()
  }, [overrides])

  // Resolve display data for each villa block in the selected year
  const blocks = useMemo(() => {
    return VILLA_META.map((meta) => {
      const villaKey = `${meta.id}__${year}`
      const override = overrideMap[villaKey]
      const isEdited = !!override
      const isLive = year === LIVE_YEAR && !override

      let yd
      if (override) {
        yd = override
      } else if (year === LIVE_YEAR) {
        const liveVilla = liveYearData[meta.name]
        yd = liveVilla ? { ...liveVilla } : { rooms: [], incomeMonthly: Array(12).fill(0), incomeTotal: 0 }
      } else {
        const staticYd = meta.years?.[year]
        if (!staticYd?.rooms?.length) return null
        yd = staticYd
      }

      if (!yd?.rooms?.length && year !== LIVE_YEAR) return null
      return { meta, yd, villaKey, isEdited, isLive }
    }).filter(Boolean)
  }, [year, overrideMap, liveYearData])

  const summary = useMemo(() => {
    let rooms = 0, occupied = 0, income = 0
    blocks.forEach(({ yd }) => {
      rooms += yd.rooms?.length || 0
      occupied += (yd.rooms || []).filter(isOccupied).length
      income += yd.incomeTotal != null
        ? yd.incomeTotal
        : (yd.rooms || []).reduce((s, r) => s + (r.total != null ? r.total : sumNonNull(r.monthly)), 0)
    })
    return { rooms, occupied, income, villas: blocks.length }
  }, [blocks])

  async function handleSave(villaKey, data) {
    setSaving(true)
    try {
      await setDocItem('villaRecords', villaKey, data)
      setEditingKey(null)
      setSaveMsg('Saved!')
      setTimeout(() => setSaveMsg(''), 3000)
    } catch (err) {
      alert('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const cards = [
    { label: 'Rooms Occupied', value: `${summary.occupied} / ${summary.rooms}`, icon: DoorOpen, accent: 'text-primary-600', bg: 'bg-primary-50' },
    { label: `Income — ${year}`, value: aed(summary.income), icon: TrendingUp, accent: 'text-emerald2-600', bg: 'bg-emerald2-50' },
    { label: 'Villas with Records', value: String(summary.villas), icon: Users, accent: 'text-charcoal-700', bg: 'bg-gray-100' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="section-label mb-1">Archive · Live</p>
          <h1 className="page-title">Villa Income</h1>
          <span className="gold-rule" />
          <p className="text-sm text-gray-500 mt-3">
            Room-by-room tenant &amp; income records — editable for every year.
            {isDemoMode && ' (Demo mode — changes saved on this device.)'}
          </p>
        </div>
        {saveMsg && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald2-50 text-emerald2-700 text-sm font-semibold animate-pop">
            <Check size={15} /> {saveMsg}
          </div>
        )}
      </div>

      {/* Year selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {ALL_YEARS.map((y) => (
          <button
            key={y}
            onClick={() => { setYear(y); setEditingKey(null) }}
            aria-pressed={year === y}
            className={`min-h-[44px] px-5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 border ${
              year === y
                ? 'bg-charcoal-900 text-primary-400 border-charcoal-900 shadow-card'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-700'
            }`}
          >
            {y}{y === LIVE_YEAR ? ' · live' : ''}
          </button>
        ))}
      </div>

      {/* Live year banner */}
      {year === LIVE_YEAR && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald2-50 border border-emerald2-100 flex items-start gap-2.5">
          <Zap size={16} className="text-emerald2-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald2-800">
            <span className="font-semibold">{LIVE_YEAR} starts with your live tenant data.</span>{' '}
            Tap <strong>Edit</strong> on any villa to manually set monthly rent values, add/remove rooms, and save. Saved data overrides the live sync for that villa.
          </p>
        </div>
      )}

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
            Switch to a year that has data, or add rooms by clicking Edit on any villa after switching to a year.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {blocks.map(({ meta, yd, villaKey, isEdited, isLive }, i) => (
            <VillaBlock
              key={villaKey}
              meta={meta}
              yd={yd}
              defaultOpen={i === 0}
              isEdited={isEdited}
              isLive={isLive}
              editingKey={editingKey}
              villaKey={villaKey}
              onStartEdit={setEditingKey}
              onSave={handleSave}
              onCancelEdit={() => setEditingKey(null)}
              saving={saving}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center mt-6">
        {year === LIVE_YEAR
          ? 'Live data from Tenants section. Edited villas show your manual values instead.'
          : `Archived records for ${year}. Tap Edit on any villa to update values manually.`}
      </p>
    </div>
  )
}
