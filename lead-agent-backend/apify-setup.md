# Apify setup — the actual scraping engine

Browser pages (and your GitHub Pages website) **cannot** scrape Dubizzle/Bayut directly:
they use Cloudflare anti-bot and hide phone numbers behind a "reveal" tap. Apify actors
run real headless browsers on Apify's servers, solve those, and return clean JSON — this
is the realistic, spec-aligned path (the spec names Apify in Option A).

## 1. Create an Apify account
- https://apify.com → free tier includes ~$5/month of platform credits (enough for a
  daily Ajman run at low volume to prove Week 1).
- Account → **Integrations / API** → copy your **API token**.

## 2. Rent the scraper actors (Apify Store)
Search the Apify Store and pick a maintained actor for each site. Good starting points:

| Site | What to search in Apify Store | Actor input you care about |
|---|---|---|
| Dubizzle Ajman | "dubizzle scraper" / "dubizzle property" | `startUrls`, `maxItems`, contact info on |
| Bayut | "bayut scraper" | search URL for Ajman to-rent |
| Property Finder | "propertyfinder scraper" | Ajman rent URL |
| Facebook Marketplace | "facebook marketplace scraper" | query "building for rent Ajman" |

> Actor IDs change over time, so the workflow uses a placeholder `APIFY_ACTOR_ID`.
> Open the actor page → **API** tab → copy the actor's `id` (looks like `username~actor-name`).

## 3. Exact Dubizzle start URLs for Ajman (whole buildings + villas)
```
https://ajman.dubizzle.com/property-for-rent/residential/building/
https://ajman.dubizzle.com/property-for-rent/residential/villa/
```

## 4. Wire it into n8n
1. Import `n8n-ajman-lead-agent.json`.
2. In n8n: **Settings → Variables/Env** add `APIFY_TOKEN = <your token>`.
3. Open the **"Apify: scrape Dubizzle Ajman"** node → replace `APIFY_ACTOR_ID` with the
   actor id from step 2.
4. Open **"Upsert to Master Sheet"** → connect your Google account, set the Sheet ID.
5. Run once manually → confirm rows land in `Master Leads`. **This is your Week-1 goal:
   10+ real leads in the sheet.**

## 5. Be a good citizen (spec §7 — compliance)
- Throttle: keep `maxItems` modest and run every 6h, not every minute.
- Apify actors already rotate proxies; don't disable that.
- Phone numbers are PII under **UAE Federal Decree-Law No. 45 of 2021** — store only in
  your private Sheet, never publish, use only for legitimate B2B outreach.
- Honor opt-outs → `status = DEAD`.

## Cost reality (matches spec §9, trimmed for a lean start)
| Item | ~AED/month |
|---|---|
| Apify credits (low volume) | 0–55 (free tier may cover Week 1) |
| n8n (self-host on Render/Railway free tier, or your own VPS) | 0–40 |
| Google Workspace (Sheets/Drive) | 0 (personal Google is fine to start) |
| WhatsApp Cloud API (you already have it in Make) | ~150 |
| **Lean start total** | **~0–250** |

Scale up (more sources, proxies, Make Pro) only after Week 1 produces real leads.
