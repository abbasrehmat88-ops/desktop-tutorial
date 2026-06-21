// Derive per-villa room/rent data for the CURRENT year straight from the live,
// editable tenant documents (Firestore). This is what keeps the Villa section
// (Tenant History) in sync with the rents you edit in the Tenants section.
//
// Historical years (2018–2025) still come from the static businessData.json
// snapshot — only the live year is rebuilt from tenants, so your verified
// history is never overwritten.

import { CANONICAL_VILLAS, normalizeToCanonical } from './villas'

// Parse a tenant's startDate ("2026-03-01" etc.) into the first month (1–12)
// they are active within `year`. Returns 1 if they started before the year,
// 13 (i.e. "never this year") if they start in a later year.
function firstActiveMonth(startDate, year) {
  if (!startDate) return 1
  const d = new Date(startDate)
  if (isNaN(d.getTime())) return 1
  if (d.getFullYear() > year) return 13
  if (d.getFullYear() < year) return 1
  return d.getMonth() + 1
}

// Build { 'v1 Adil': { rooms[], incomeMonthly[12], incomeTotal }, ... } from
// live tenants. Rent is projected across each elapsed month of the year
// (respecting the tenant's startDate); future months stay blank.
export function deriveLiveVillaYear(tenants, year) {
  const Y = Number(year)
  const now = new Date()
  // Months to populate: through the current month for this year, full 12 for a
  // past year, none for a future year.
  const lastMonth =
    now.getFullYear() === Y ? now.getMonth() + 1 : Y < now.getFullYear() ? 12 : 0

  const byVilla = new Map()
  for (const v of CANONICAL_VILLAS) {
    byVilla.set(v, { rooms: [], incomeMonthly: Array(12).fill(0) })
  }

  for (const t of tenants || []) {
    const villa = normalizeToCanonical(t.property) || 'Unassigned'
    if (!byVilla.has(villa)) byVilla.set(villa, { rooms: [], incomeMonthly: Array(12).fill(0) })
    const bucket = byVilla.get(villa)
    const rent = Number(t.rentAmount || 0)
    const startMonth = firstActiveMonth(t.startDate, Y)

    const monthly = Array(12).fill(null)
    for (let m = 1; m <= 12; m++) {
      if (m > lastMonth || m < startMonth) continue // future or before tenant joined
      monthly[m - 1] = rent
      bucket.incomeMonthly[m - 1] += rent
    }
    bucket.rooms.push({
      id: t.id,
      room: t.unit || '—',
      tenant: t.name || '',
      rent,
      monthly,
      total: monthly.reduce((s, x) => s + (x || 0), 0),
    })
  }

  const out = {}
  for (const [villa, data] of byVilla) {
    if (!data.rooms.length) continue
    data.rooms.sort((a, b) =>
      String(a.room).localeCompare(String(b.room), undefined, { numeric: true })
    )
    data.incomeTotal = data.incomeMonthly.reduce((s, x) => s + x, 0)
    out[villa] = data
  }
  return out
}
