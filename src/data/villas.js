// Canonical villa list + name normalization.
//
// These 14 names mirror the villa labels on the Cash Flow page (v1 Adil,
// v2 Rauf, …). They are hardcoded here on purpose so the villa dropdown in the
// Tenant and Deposit forms keeps working even if the Cash Flow business data is
// cleared. Update this list if villas are added or renamed.

export const CANONICAL_VILLAS = [
  'v1 Adil',
  'v2 Rauf',
  'v3 Dawood',
  'v4 Zam Zam',
  'v5 Arif',
  'v6 Al_sarooj',
  'v7 Park',
  'v8 AbraR',
  'v9 Flat',
  'v10 munir',
  'v11 munir 2',
  'v12 flat 06',
  'v13 abumaryam',
  'v14 khlid mus',
]

// Map a tenant's free-text property value to the closest canonical villa name.
// Tenants/deposits were typed with many spellings ("khalid villa" vs the
// canonical "v14 khlid mus", "villa 10" vs "v10 munir", "Muneer" vs "munir").
// An explicit alias table (longest alias wins) plus a villa-number fallback
// bridges these so every tenant groups under the right villa chip.
export const VILLA_ALIASES = {
  'v1 Adil':       ['adil'],
  'v2 Rauf':       ['mustafa arbab', 'arbab', 'rauf'],
  'v3 Dawood':     ['dawood', 'dawud', 'dawd'],
  'v4 Zam Zam':    ['zam zam', 'zamzam', 'zam'],
  'v5 Arif':       ['arif masool', 'arif'],
  'v6 Al_sarooj':  ['al sarooj real estate', 'al sarooj', 'al_sarooj', 'sarooj', 'tekadar'],
  'v7 Park':       ['park'],
  'v8 AbraR':      ['abrar', 'abra'],
  'v9 Flat':       ['flate 01', 'flat 01', 'flat1'],
  'v10 munir':     ['muneer', 'munir', 'villa no 10', 'villa 10', 'villa10', 'v-10', 'v10'],
  'v11 munir 2':   ['muneer 2', 'munir 2', 'muneer2', 'munir2'],
  'v12 flat 06':   ['building flat 06', 'flate 06', 'flat 06', 'flat6', 'flat 6'],
  'v13 abumaryam': ['abumaryam', 'abu maryam', 'maryam'],
  'v14 khlid mus': ['khalid villa', 'khlid mus', 'khalid', 'khlid'],
}

// Flatten to {canonical, alias} and sort by alias length (longest/most-specific
// first) so "flate 06" wins over the generic "flat", "munir 2" over "munir".
const _ALIAS_ENTRIES = Object.entries(VILLA_ALIASES)
  .flatMap(([canonical, aliases]) => aliases.map(a => ({ canonical, alias: a, aliasNS: a.replace(/\s+/g, '') })))
  .sort((a, b) => b.alias.length - a.alias.length)

export function normalizeToCanonical(property) {
  if (!property) return ''
  const raw = property.trim()
  if (!raw) return ''
  if (CANONICAL_VILLAS.includes(raw)) return raw

  const lower   = raw.toLowerCase()
  const lowerNS = lower.replace(/\s+/g, '')   // no-space form for "abu maryam" ↔ "abumaryam"

  // Pass 1: alias match (name aliases take priority over bare numbers)
  for (const { canonical, alias, aliasNS } of _ALIAS_ENTRIES) {
    if (lower.includes(alias) || lowerNS.includes(aliasNS)) return canonical
  }

  // Pass 2: bare "villa N" / "v-N" with no recognised name → canonical villa N
  const numMatch = lower.match(/(?:^|\b)(?:villa\s*(?:no\.?\s*)?|v[-\s]?)(\d{1,2})\b/)
  if (numMatch) {
    const hit = CANONICAL_VILLAS.find(v => v.match(/^v(\d+)/i)?.[1] === numMatch[1])
    if (hit) return hit
  }

  return raw
}
