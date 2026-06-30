/**
 * Ajman Building-Owner Lead Agent — Deterministic Lead Scoring Engine
 * ------------------------------------------------------------------
 * Implements the EXACT scoring rubric from the build spec (Stage 3),
 * with NO AI/API call required. Free, instant, explainable.
 *
 * Use in:
 *   - n8n  : a "Code" node (returns items) — see n8n-ajman-lead-agent.json
 *   - Make : an "Tools > Run JavaScript" equivalent, or call as a webhook
 *   - Node : require('./leadScoring').scoreLead(lead)
 *
 * INPUT  lead object (after cleaning/enrichment):
 *   {
 *     phone:            "+9715XXXXXXXX",   // normalized, see phoneNormalize.js
 *     listingAgeDays:   42,                // days since first posted
 *     listingsCount:    3,                 // # listings tied to this phone
 *     propertyType:     "building",        // villa | building | unit | land
 *     isWholeProperty:  true,              // whole building/villa vs single unit
 *     isDirectOwner:    true,              // false if a known agency
 *     area:             "Al Nuaimiya",     // geocoded Ajman neighbourhood
 *     priceCompetitive: true,             // optional signal (default true)
 *     source:           "dubizzle",        // dubizzle|bayut|pf|facebook|field_photo|permit
 *     status:           "UNDER_CONSTRUCTION" // optional; bumps relevance
 *   }
 *
 * OUTPUT { score: 1..10, tier: "HOT"|"WARM"|"COLD", reasons: [string] }
 */

const TARGET_AREAS = [
  'al nuaimiya', 'al nuaimia', 'nuaimiya',
  'al rashidiya', 'rashidiya',
  'al rumailah', 'rumailah',
  'al rawda', 'rawda',
  'al jurf', 'al mowaihat', 'al hamidiya', // nearby high-density residential
];

const KNOWN_AGENCY_HINTS = [
  'real estate', 'realestate', 'properties', 'property', 'broker',
  'consultancy', 'llc', 're brokers', 'homes', 'estate',
];

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

function tierFor(score) {
  if (score >= 8) return 'HOT';
  if (score >= 5) return 'WARM';
  return 'COLD';
}

/**
 * Core rubric. Starts at a neutral 4 and adds/subtracts per the spec.
 */
function scoreLead(lead = {}) {
  const reasons = [];
  let score = 4; // neutral baseline

  const area = String(lead.area || '').toLowerCase().trim();
  const inTargetArea = TARGET_AREAS.some(a => area.includes(a));

  // ── Positive signals ──────────────────────────────────────────────
  // Listed 30+ days ago → owner is frustrated / motivated
  if (lead.listingAgeDays >= 60) { score += 2; reasons.push('Sitting 60+ days (very motivated)'); }
  else if (lead.listingAgeDays >= 30) { score += 1.5; reasons.push('Listed 30+ days (motivated)'); }
  else if (lead.listingAgeDays < 3) { score -= 1.5; reasons.push('Brand-new listing (<3 days)'); }

  // Multi-property owner (phone on 2+ listings)
  if (lead.listingsCount >= 4) { score += 2; reasons.push(`${lead.listingsCount} listings on this number (portfolio owner)`); }
  else if (lead.listingsCount >= 2) { score += 1.5; reasons.push(`${lead.listingsCount} listings on this number (multi-property)`); }

  // Whole building / whole villa
  if (lead.isWholeProperty && (lead.propertyType === 'building')) { score += 2; reasons.push('Whole building'); }
  else if (lead.isWholeProperty && (lead.propertyType === 'villa')) { score += 1.5; reasons.push('Whole villa'); }
  else if (lead.propertyType === 'unit') { score -= 1; reasons.push('Single unit (low value)'); }

  // Direct owner vs agency
  if (lead.isDirectOwner === true) { score += 1.5; reasons.push('Direct owner (not agency)'); }
  else if (lead.isDirectOwner === false) { score -= 2; reasons.push('Posted by an agency'); }

  // Target areas
  if (inTargetArea) { score += 1.5; reasons.push(`Target area: ${lead.area}`); }
  else if (area) { score -= 1; reasons.push(`Outside target areas (${lead.area})`); }

  // Competitive price (optional, default neutral)
  if (lead.priceCompetitive === false) { score -= 1; reasons.push('Overpriced'); }

  // Under-construction tracker bonus — the most valuable module
  if (String(lead.status || '').toUpperCase() === 'UNDER_CONSTRUCTION') {
    score += 1; reasons.push('Under construction — will need a tenant soon');
  }
  // Field signboard photos are usually warmer
  if (lead.source === 'field_photo') { score += 2; reasons.push('Field signboard photo (+2 bonus)'); }

  score = clamp(Math.round(score), 1, 10);
  return { score, tier: tierFor(score), reasons };
}

/**
 * Freshness / anti-scam guard (spec §11): lower score for phones tied to
 * obvious scam patterns or that fail a cross-listing sanity check.
 */
function freshnessPenalty(lead = {}) {
  const reasons = [];
  let penalty = 0;
  const phone = String(lead.phone || '');
  // Repeated identical digits or too-short → suspicious
  if (/(\d)\1{6,}/.test(phone)) { penalty += 3; reasons.push('Suspicious repeated digits'); }
  if (phone.replace(/\D/g, '').length < 11) { penalty += 2; reasons.push('Phone too short / malformed'); }
  // Price absurdly low for a whole building → likely fake/bait
  if (lead.isWholeProperty && lead.price && Number(lead.price) > 0 && Number(lead.price) < 20000) {
    penalty += 2; reasons.push('Whole-property price implausibly low (bait risk)');
  }
  return { penalty, reasons };
}

/** Convenience: score + apply freshness penalty in one call. */
function scoreLeadSafe(lead = {}) {
  const base = scoreLead(lead);
  const fresh = freshnessPenalty(lead);
  const score = clamp(base.score - fresh.penalty, 1, 10);
  return {
    score,
    tier: tierFor(score),
    reasons: [...base.reasons, ...fresh.reasons.map(r => `⚠ ${r}`)],
  };
}

module.exports = { scoreLead, scoreLeadSafe, freshnessPenalty, tierFor, TARGET_AREAS };
