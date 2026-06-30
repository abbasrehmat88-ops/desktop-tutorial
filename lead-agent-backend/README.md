# Ajman Building-Owner Lead Agent — Backend Kit

This folder is the **real, working backend** for the lead agent in your spec. It finds
Ajman building/villa owners (including under-construction and just-completed buildings)
who want to rent out, scores them 1–10, and drops a ranked list into a Google Sheet with
a ready-to-send Arabic WhatsApp message per owner.

## The honest architecture (why it's split)

Your website (`abbasrehmat88-ops.github.io/desktop-tutorial`) is a **static site** — it has
no server, so it physically cannot scrape Dubizzle/Bayut or Ajman government sites, and it
must not store fake data. So the system is two parts:

```
  ┌─────────────────────────── BACKEND (this folder) ───────────────────────────┐
  │  Apify actors  →  n8n workflow  →  score (free JS)  →  Google Sheet (master) │
  │  (real scraping)   (orchestrate)   (1–10 + reasons)    (dedupe by phone)     │
  │                                                   ↓                          │
  │                                  Daily WhatsApp report (you already have it) │
  └──────────────────────────────────────────────────────────────────────────────┘
                                        ↓ (later, optional)
              Website "Property Finder" reads the Sheet to show a live dashboard
```

- **Scraping engine:** Apify actors (handle anti-bot + phone reveal). `apify-setup.md`.
- **Orchestrator:** `n8n-ajman-lead-agent.json` — import into n8n (you already use it).
- **Scoring:** `scoring/leadScoring.js` — your spec's exact rubric, **free, no API key**.
- **Phone/dedupe:** `scoring/phoneNormalize.js` — UAE `+9715XXXXXXXX`, multi-listing detection.
- **Database:** Google Sheet, schema in `google-sheet-schema.md`.
- **Outreach + AI (optional):** `ai-prompts.md` — Gulf-Arabic message + optional AI scoring.

## What I could NOT do for you (and why)
- **Run the scraper from here** — needs your Apify account + API token (paid external service).
- **Put real owner phone numbers in now** — that data only exists once *your* Apify token
  runs the actors. Inventing numbers would be fake + illegal under UAE PDPL.
- **Auto-create the Make scenario** — your Make Free plan has 1 free scenario slot and the
  scraper is better on n8n anyway (no operation limits). Say the word and I'll scaffold a
  Make version into your account too.

## Build order (mirrors spec §10 — get real leads in Week 1, not perfection in month 3)
1. **Today:** create the Google Sheet (`google-sheet-schema.md`).
2. **Today:** Apify account + token, rent the Dubizzle actor (`apify-setup.md`).
3. **Today:** import `n8n-ajman-lead-agent.json`, set `APIFY_TOKEN`, actor id, Sheet id.
4. **Run once** → confirm 10+ real Ajman leads land in the sheet, scored & ranked. ✅ Week-1 done.
5. **Week 2:** add Bayut + Property Finder actors (duplicate the HTTP node, change actor/URLs).
6. **Week 2:** daily 8 AM WhatsApp summary (reuse your existing WhatsApp scenario in Make).
7. **Week 3+:** signboard OCR + under-construction tracker (`ai-prompts.md` §3).

## Your existing assets I found (Make account: Abbas Rehmat)
- ✅ A working Make scenario "Real Estate Rent Reminder – WhatsApp" → **Google Sheets +
  WhatsApp Business Cloud are already connected.** Reuse those connections for the daily report.
- Free plan limits: 2 scenarios, 1,000 ops/mo, 15-min min interval → another reason to run
  the heavy scraping in n8n and keep Make only for the WhatsApp report.

## Next step
Once you have an **Apify token**, tell me and I'll: (a) finalize the actor id in the
workflow, and/or (b) scaffold the Make daily-report scenario into your account. After the
Sheet has real leads, I'll build the **Property Finder dashboard** on the website to read
and rank them live.
