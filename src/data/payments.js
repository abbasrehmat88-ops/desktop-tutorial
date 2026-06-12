// Per-month rent payment tracking.
// Each tenant document carries a `payments` map keyed by month:
//   payments: { '2026-06': true, '2026-05': false, ... }
// A new month has no entry yet, so every tenant automatically starts
// the month as Unpaid — no manual reset needed.

import { format } from 'date-fns'

export function monthKey(date = new Date()) {
  return format(date, 'yyyy-MM')
}

export function monthLabel(date = new Date()) {
  return format(date, 'MMMM yyyy')
}

export function isPaidForMonth(tenant, key = monthKey()) {
  const p = tenant?.payments
  if (p && typeof p === 'object') return !!p[key]
  // Records created before per-month tracking only have the old
  // `paid` flag — honour it for the current month only.
  return key === monthKey() ? !!tenant?.paid : false
}

// True if at least one tenant has an explicit entry for the month,
// i.e. the month was actively tracked in the app.
export function isTrackedMonth(tenants, key) {
  return tenants.some((t) => t.payments && typeof t.payments === 'object' && key in t.payments)
}
