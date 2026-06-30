/**
 * UAE phone normalization + owner deduplication helpers (Stage 2).
 * Pure JS, no dependencies. Used by the n8n/Make "Code" node.
 */

/**
 * Normalize any UAE phone string to E.164 (+9715XXXXXXXX).
 * Handles: 05XXXXXXXX, 5XXXXXXXX, 9715..., 00971..., spaces/dashes, etc.
 * Returns "" if it cannot be confidently normalized to a UAE mobile.
 */
function normalizeUaePhone(raw) {
  if (!raw) return '';
  let d = String(raw).replace(/[^\d]/g, '');

  // strip international prefixes
  if (d.startsWith('00971')) d = d.slice(5);
  else if (d.startsWith('971')) d = d.slice(3);
  else if (d.startsWith('0')) d = d.slice(1);

  // UAE mobiles are 9 digits starting with 5 (50/52/54/55/56/58)
  if (d.length === 9 && d.startsWith('5')) return '+971' + d;

  // Sometimes leading 5 already trimmed differently; last-9 fallback
  const last9 = d.slice(-9);
  if (last9.length === 9 && last9.startsWith('5')) return '+971' + last9;

  return ''; // not a valid UAE mobile
}

/** Extract ALL phone numbers from a free-text blob (title + description). */
function extractPhones(text) {
  if (!text) return [];
  const matches = String(text).match(/(?:\+?971|00971|0)?\s*5\d(?:[\s\-]?\d){7}/g) || [];
  const out = [];
  for (const m of matches) {
    const n = normalizeUaePhone(m);
    if (n && !out.includes(n)) out.push(n);
  }
  return out;
}

/** Is the contact name likely an agency (vs a direct owner)? */
function looksLikeAgency(name) {
  if (!name) return false;
  const n = String(name).toLowerCase();
  return /(real\s?estate|properties|property|broker|realty|consultanc|llc|homes|estate agent)/.test(n);
}

/**
 * Merge a fresh lead into the existing master list keyed by phone.
 * Increments listingsCount and merges areas/sources/urls.
 * @param {Array} master  existing owner records
 * @param {Object} lead   new lead (must have normalized .phone)
 * @returns {Object} { master, record, isNew }
 */
function upsertByPhone(master, lead) {
  const idx = master.findIndex(r => r.phone === lead.phone);
  if (idx === -1) {
    const record = {
      ...lead,
      listingsCount: 1,
      areas: lead.area ? [lead.area] : [],
      sources: lead.source ? [lead.source] : [],
      sourceUrls: lead.listingUrl ? [lead.listingUrl] : [],
      firstSeen: lead.seenDate,
      lastSeen: lead.seenDate,
    };
    master.push(record);
    return { master, record, isNew: true };
  }
  const r = master[idx];
  r.listingsCount = (r.listingsCount || 1) + 1;
  if (lead.area && !r.areas.includes(lead.area)) r.areas.push(lead.area);
  if (lead.source && !r.sources.includes(lead.source)) r.sources.push(lead.source);
  if (lead.listingUrl && !r.sourceUrls.includes(lead.listingUrl)) r.sourceUrls.push(lead.listingUrl);
  r.lastSeen = lead.seenDate;
  return { master, record: r, isNew: false };
}

module.exports = { normalizeUaePhone, extractPhones, looksLikeAgency, upsertByPhone };
