# Migration & Redirect Report — TyAlexanderMedia.com → Drone & 360

_Branch: `claude/happy-goldberg-im067h` · Repo: `tyalexandermedia/lola-seo`_

## 1. What this repo actually was (before)

This repo (`lola-seo`) was **not** the TyAlexanderMedia.com brand site — it was the
**"Lola — AI Leads Expert"** local-SEO/lead-gen product, deployed at
**`lola.tyalexandermedia.com`**. Its content (24 `*-seo-*` city/industry landing
pages + a lead-capture home) is exactly the **websites / local-SEO / GBP / lead-system**
offering that the brief says now belongs to **CoachTyLeads.com**.

There is **no separate drone/`www.tyalexandermedia.com` repo** in the org
(repos found: `lola-seo`, `lola-backend`, `sandbar-site`, `travelsbyval`,
`randy-golden-mediation`). Per Coach Ty's "best ROI" call, the new drone/360 site
was built **on this branch** with **zero changes to production `main`** (branch
deploys don't touch the live Lola site).

## 2. ACTION NEEDED FROM TY (deploy/domain wiring)

The new site targets canonical **`https://www.tyalexandermedia.com`**. Before launch, confirm:

1. **Where does `www.tyalexandermedia.com` deploy from?** If it's a *different* Netlify
   site than the Lola one (siteId `b15fb495-…`), point that site at this branch/repo.
   If Lola and TAM should share one repo, we should split them into two Netlify sites.
2. **Set primary domain = `www.tyalexandermedia.com`** with apex → www redirect (Netlify
   domain settings). Not hard-coded here to avoid affecting the current Lola deploy.
3. **Keep `lola.tyalexandermedia.com` serving the Lola SEO pages** (they still hold
   backlink/search value) — nothing here deletes them.

## 3. URL disposition

Legend — **Belongs on TAM?** = should live on the drone site · **→ CTL** = move to CoachTyLeads.com

| Existing URL (path) | Content | Belongs on TAM (drone)? | Recommended destination | Action taken here |
|---|---|---|---|---|
| `/` (old) | Lola lead-capture home | No | Lola home stays on `lola.` / CTL | **Replaced** on this branch with the drone homepage. Old markup preserved in git history + on `main`. |
| `/auto-repair-seo-tampa/` | Local-SEO landing | No | → CTL (or keep on `lola.`) | Preserved on disk; removed from new nav/sitemap. Self-canonicals to `lola.` |
| `/chiropractor-seo-tampa/` | Local-SEO landing | No | → CTL / keep on `lola.` | Preserved; excluded from new site |
| `/dentist-seo-tampa/` | Local-SEO landing | No | → CTL / keep on `lola.` | Preserved; excluded |
| `/electrician-seo-tampa/` | Local-SEO landing | No | → CTL / keep on `lola.` | Preserved; excluded |
| `/gym-seo-{tampa,st-petersburg,clearwater}/` | Local-SEO landing ×3 | No* | → CTL / keep on `lola.` | Preserved; excluded. *Gyms are a drone target, but these are SEO pages, not drone content.* |
| `/hvac-seo-tampa/` | Local-SEO landing | No | → CTL / keep on `lola.` | Preserved; excluded |
| `/landscaping-seo-tampa/` | Local-SEO landing | No | → CTL / keep on `lola.` | Preserved; excluded |
| `/law-firm-seo-tampa/` | Local-SEO landing | No | → CTL / keep on `lola.` | Preserved; excluded |
| `/med-spa-seo-tampa/` | Local-SEO landing | No | → CTL / keep on `lola.` | Preserved; excluded |
| `/pet-grooming-seo-tampa/` | Local-SEO landing | No | → CTL / keep on `lola.` | Preserved; excluded |
| `/plumber-seo-{tampa,st-petersburg,clearwater}/` | Local-SEO landing ×3 | No | → CTL / keep on `lola.` | Preserved; excluded |
| `/pressure-washing-seo-tampa/` | Local-SEO landing | No | → CTL / keep on `lola.` | Preserved; excluded |
| `/real-estate-seo-tampa/` | Local-SEO landing | No | → CTL / keep on `lola.` | Preserved; excluded |
| `/restaurant-seo-{tampa,st-petersburg,clearwater}/` | Local-SEO landing ×3 | No* | → CTL / keep on `lola.` | Preserved; excluded |
| `/roofer-seo-tampa/` | Local-SEO landing | No | → CTL / keep on `lola.` | Preserved; excluded |
| `/salon-seo-{tampa,st-petersburg,clearwater}/` | Local-SEO landing ×3 | No | → CTL / keep on `lola.` | Preserved; excluded |
| `/roadmap/` | Internal Lola roadmap page | No | Keep on `lola.` (or delete) | Preserved; excluded |
| `/api/capture-lead.js`, `/api/ig-profile.js`, `/api/purchase-intent.js` | Lola backend endpoints | No | Keep with Lola | Untouched — not used by the drone site |
| `/tools/gen_pages.py` | Lola SEO page generator | No | Keep with Lola | Untouched |
| `/style.css`, `/lola-logo*.png` | Lola design assets | No | Keep (legacy pages use them) | Untouched; drone site uses `/tam.css` |
| `/404.html` | Lola 404 | — | TAM | **Replaced** with drone-branded 404 |
| `/sitemap.xml`, `/robots.txt` | Lola SEO | — | TAM | **Replaced** for the www drone site |

_All 24 legacy `*-seo-*` pages already `<link rel="canonical">` to `lola.tyalexandermedia.com`,
so even if temporarily reachable on `www`, Google will not index the `www` copies (no duplicate-content risk)._

## 4. Redirect recommendations (DO NOT enable until destinations are confirmed)

The brief says: only implement external redirects when the exact destination exists.
CoachTyLeads.com destination URLs are **not confirmed**, so **no `*-seo-*` redirects are
declared** in `netlify.toml`. When ready, add to `netlify.toml` (examples — confirm real targets first):

```toml
# Option A — if the SEO pages live on the lola subdomain (destination confirmed to exist there):
# [[redirects]]
#   from = "/gym-seo-tampa/*"
#   to = "https://lola.tyalexandermedia.com/gym-seo-tampa/:splat"
#   status = 301
#   force = true

# Option B — once CoachTyLeads has equivalent pages (confirm each URL first):
# [[redirects]]
#   from = "/gym-seo-tampa/*"
#   to = "https://coachtyleads.com/<confirmed-path>/:splat"
#   status = 301
#   force = true
```

**Recommendation:** keep the Lola SEO pages on `lola.tyalexandermedia.com` (backlinks/rankings
already point there). On the `www` drone deploy, 301 the whole legacy set to their `lola.`
equivalents (Option A) once you confirm `www` and `lola.` are separate deploys.

## 5. Files changed / added on this branch

**Added (drone site):** `tam.css`, `tam.js`, `drone-services/index.html`,
`360-virtual-tours/index.html`, `request-a-shoot/index.html`,
`netlify/functions/request-shoot.js`, `MIGRATION-REPORT.md`, `MEDIA-SHOTLIST.md`

**Replaced:** `index.html` (drone homepage), `404.html`, `sitemap.xml`, `robots.txt`, `netlify.toml` (added security/cache headers)

**Untouched (preserved for backlinks / Lola):** all `*-seo-*/`, `roadmap/`, `api/`, `tools/`, `style.css`, `lola-logo*.png`, `netlify/functions/capture-lead.js`
