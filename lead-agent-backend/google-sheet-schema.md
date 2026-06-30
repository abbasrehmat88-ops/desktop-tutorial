# Master Leads — Google Sheet schema

Create one Google Sheet named **`Ajman Owner Leads`** with a tab called **`Master Leads`**.
Paste this exact header row into row 1 (matches the n8n workflow's auto-mapping):

```
ownerName	phone	whatsappAvailable	listingsCount	areas	propertyType	leadScore	tier	status	firstSeen	lastSeen	lastContact	source	listingUrl	aiNotes	arabicMessage
```

## Column meaning

| Column | Filled by | Notes |
|---|---|---|
| `ownerName` | scraper / OCR | Empty if only an agency name was found |
| `phone` | scraper (normalized) | **Dedupe key** — `+9715XXXXXXXX`. Mandatory. |
| `whatsappAvailable` | enrichment | `TRUE`/`FALSE` |
| `listingsCount` | dedupe step | Increments when the same phone reappears |
| `areas` | geocode | Comma-separated Ajman neighbourhoods |
| `propertyType` | classifier | villa / building / unit / land |
| `leadScore` | scoring engine | 1–10 |
| `tier` | scoring engine | HOT (8–10) / WARM (5–7) / COLD (1–4) |
| `status` | **you, manually** | NEW / CONTACTED / WARM / NEGOTIATING / CLOSED / DEAD / UNDER_CONSTRUCTION |
| `firstSeen` / `lastSeen` | scraper | ISO dates |
| `lastContact` | **you, manually** | When you last called/messaged |
| `source` | scraper | dubizzle / bayut / pf / facebook / field_photo / permit |
| `listingUrl` | scraper | Link(s) to the listing |
| `aiNotes` | scoring engine | Why this scored high/low (explainable) |
| `arabicMessage` | message generator | Pre-written Gulf-Arabic WhatsApp outreach, ready to copy |

## Why dedupe on phone (not name)
The most valuable signal in the spec is **"same phone on 2+ listings = multi-property owner."**
Keying the sheet on `phone` makes that automatic: a returning number bumps `listingsCount`
instead of creating a duplicate row, which directly feeds the lead score.

## Honoring opt-outs (compliance, spec §7)
If an owner replies "stop", set `status = DEAD`. Build any outreach scenario to **skip
rows where status = DEAD**, permanently.
