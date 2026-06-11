# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

**RentFlow** — a UAE property rental business management app. Single-page, fully static (no build step, no framework, no package.json). All data persists in browser `localStorage` under the key `rentflow.v2`. Currency is AED (Dirhams). Target users: property owner/admin, their family members.

## Running locally

```bash
# Any of these work — just needs an HTTP server (not file://)
python3 -m http.server 8000
# then open http://localhost:8000
```

No install, no build, no compile step. Edit files and reload the browser.

## Building a single-file bundle (for sharing via WhatsApp/email)

```bash
node -e "
const fs = require('fs');
let html = fs.readFileSync('index.html','utf8');
html = html.replace(/<link rel=\"stylesheet\" href=\"assets\/styles\.css\"\s*\/?>/,
  '<style>\n' + fs.readFileSync('assets/styles.css','utf8') + '\n</style>');
html = html.replace(/<script src=\"assets\/app\.js\"><\/script>/,
  '<script>\n' + fs.readFileSync('assets/app.js','utf8') + '\n<\/script>');
fs.writeFileSync('RentFlow.html', html);
console.log('Bundled:', fs.statSync('RentFlow.html').size, 'bytes');
"
```

## Architecture

**Three files, no dependencies:**
- `index.html` — structure only; all views exist in the DOM simultaneously, shown/hidden via `.hidden` class
- `assets/styles.css` — all styles; CSS custom properties on `:root` define the full design system
- `assets/app.js` — all logic; no modules, runs top-to-bottom in the browser

**Data flow in `app.js`:**
1. `seed` object — UAE sample data built once at startup (IDs assigned at runtime via `id()`)
2. `store` object — wraps `localStorage`; `load()` / `save()` / `add()` / `update()` / `remove()`
3. `renderAll()` — called after every mutation; re-renders every view from `store.data`
4. Each `render*()` function reads `store.data` and writes innerHTML directly (no virtual DOM)

**View navigation:** `setView(name)` hides all `.view` elements, shows `#view-{name}`, and updates the active nav link. Views: `dashboard`, `properties`, `owners`, `clients`, `payments`, `whatsapp`, `reports`.

**Modal pattern:** `openModal(title, htmlString, onSubmitFn)` injects a modal into `#modal-root`. `onSubmitFn` receives `FormData` entries as a plain object. Returns false to keep modal open.

**Data relationships:**
- `payment.clientId` → `client.id`
- `client.propertyId` → `property.id`
- `property.ownerId` → `owner.id`
- All lookups use `store.ownerName(id)`, `store.propertyTitle(id)`, `store.clientName(id)` helpers

**Currency / locale:** Always use `fmt(n)` for amounts (outputs `AED 1,234`). Dates use `fmtDate(d)`. HTML output always goes through `esc(s)` to prevent XSS.

## Deployment

Push to `main` → GitHub Actions (`.github/workflows/pages.yml`) auto-deploys to GitHub Pages.  
**Requires the repo to be public** — Pages on private repos needs a paid GitHub plan.  
Intended URL: `https://abbasrehmat88-ops.github.io/desktop-tutorial/`

## Planned next steps (not yet built)

- **Shared backend** — replace `localStorage` with Firebase/Supabase so multiple family members see the same data
- **Multi-user auth** — separate logins for owner, admin, family
- **WhatsApp Business API** — webhook that parses group messages and auto-marks payments as paid
