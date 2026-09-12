# CoachTyAlexander.com — repositioning & migration

**Date:** 2026-09-12
**Branch:** `claude/inspiring-cori-yi36yw`

This repository (`lola-seo`, Netlify site `b15fb495-…`) has been repositioned
from the old **Lola / local-business-marketing** site into
**CoachTyAlexander.com** — Ty Alexander's personal-training and
athletic-performance site for St. Petersburg, FL.

The local-business-marketing brand (Growth Score, Lola Leads, AI websites,
Local SEO, Google Business Profile services, Lola OS, industry landing pages)
now lives on **CoachTyLeads.com** (the `lola-backend/frontend` app on Vercel).
That app is intentionally **not modified** here.

---

## New site structure

| Route | Purpose |
|---|---|
| `/` | Homepage — hero, outcomes, philosophy, flagship offer, ways to train, basketball + about teasers, FAQ, apply CTA |
| `/coaching/` | Coaching system, semi-private vs private, how it works, pricing positioning, FAQ |
| `/basketball-performance/` | Off-court basketball performance training + Florida Rain Hoops / Coach Ty Hoops links |
| `/about/` | About Coach Ty, credentials |
| `/apply/` | Coaching application form (primary conversion) |

Primary CTA everywhere: **Apply for Coaching** → `/apply/`.
Secondary CTA: **See Coaching Options** → `/coaching/`.

---

## Redirect map (`_redirects`, 301)

### Confirmed equivalents on coachtyleads.com
These destinations are verified live (present in coachtyleads' sitemap and/or
used as redirect destinations in its own `vercel.json`).

| Old URL (coachtyalexander.com) | → New URL (coachtyleads.com) |
|---|---|
| `/plumber-seo-tampa` | `/lp/plumber-seo-tampa` |
| `/plumber-seo-st-petersburg` | `/lp/plumber-seo-st-petersburg` |
| `/plumber-seo-clearwater` | `/lp/plumber-seo-clearwater` |
| `/hvac-seo-tampa` | `/lp/hvac-seo-tampa` |
| `/electrician-seo-tampa` | `/lp/electrician-seo-tampa` |
| `/pressure-washing-seo-tampa` | `/lp/pressure-washing-seo-tampa` |
| `/roofer-seo-tampa` | `/lp/roofing-seo-tampa` (service renamed "roofer"→"roofing") |
| `/landscaping-seo-tampa` | `/lp/lawn-care-seo-tampa` (nearest available service) |
| `/roadmap` | `/roadmap` |

### No exact equivalent yet → `/lp/industries` hub
These verticals have **no matching page on coachtyleads.com**. Per the brief,
their exact destination is **not guessed** — they 301 to the confirmed
`/lp/industries` hub as a sensible parent, and are flagged here for Ty to
decide whether to (a) build the specific page on coachtyleads.com and update
the redirect, or (b) leave them pointing at the hub.

`restaurant-seo-{tampa, st-petersburg, clearwater}`,
`salon-seo-{tampa, st-petersburg, clearwater}`,
`gym-seo-{tampa, st-petersburg, clearwater}`,
`med-spa-seo-tampa`, `dentist-seo-tampa`, `chiropractor-seo-tampa`,
`law-firm-seo-tampa`, `auto-repair-seo-tampa`, `real-estate-seo-tampa`,
`pet-grooming-seo-tampa`.

> **Action for Ty:** confirm the `/lp/industries` fallback is acceptable, or
> tell me the intended coachtyleads.com URL for any of the above and I'll
> repoint the redirect exactly.

---

## Removed (old Lola marketing site)

Deleted from this repo (content now lives on coachtyleads.com; redirects
preserve link equity):

- 24 industry landing-page directories (`*-seo-*`) + `roadmap/`
- `index.html` (old Lola homepage) — replaced by the new homepage
- `lola-logo.png`, `lola-logo-hero.png`
- `api/` (`capture-lead.js`, `ig-profile.js`, `purchase-intent.js`) — Lola Growth Score tooling
- `tools/gen_pages.py` — generated the old Lola landing pages
- `netlify/functions/capture-lead.js` — Growth Score lead capture, replaced by `apply.js`

---

## ⚠️ Required infra cutover (cannot be done from this repo)

`coachtyalexander.com` currently **301-redirects to coachtyleads.com** via a
rule in the Vercel project (`lola-backend/frontend/vercel.json`):

```
coachtyalexander.com/:path+      → https://www.coachtyleads.com/:path+
www.coachtyalexander.com/:path+  → https://www.coachtyleads.com/:path+
```

For this new site to go live at `www.coachtyalexander.com`, someone with
access must:

1. **Point `coachtyalexander.com` (apex + `www`) at this Netlify site**
   (`b15fb495-1b7c-4360-a4ab-8bdba7ab4251`) and set `www` as primary domain,
   apex → `www` 301.
2. **Remove the two `coachtyalexander.com` redirect rules from
   `lola-backend/frontend/vercel.json`** (and detach the domain alias from
   that Vercel project) so it no longer captures the domain. *That is the only
   change needed in the coachtyleads.com repo — left undone here to avoid
   touching the live business site.*

Until step 1 + 2 happen, the site is fully built and deployable but the domain
still bounces to coachtyleads.com.

---

## Form integration

`/apply/` POSTs JSON to `/.netlify/functions/apply` (see
`netlify/functions/apply.js`). It reuses the project's existing server-side
email pattern (`external-tool call` → `gcal` / `send_email`) from the old
capture-lead function:

- Sends a **notification to Ty** (`ty@tyalexandermedia.com`) — required; the
  request fails if this can't send.
- Sends an **applicant confirmation** — best-effort (never fails the request).
- **No secrets in client code.** Includes a honeypot field + server-side
  validation. If the email transport changes, read credentials from
  `process.env.*` inside the function — never inline them client-side.

---

## Verified facts used (nothing fabricated)

- Ty Alexander Traufield ("Coach Ty"), St. Petersburg / Tampa Bay, FL
- Phone `(727) 300-6573`, email `ty@tyalexandermedia.com`
- Instagram `@tyalexandermedia`; basketball: `@floridarainhoops`, `linktr.ee/coachtyhoops`
- Certifications: Certified Personal Trainer, TRIBE Team Training, Les Mills GRIT, CPR/AED; NSCA-CPT **(in progress)**
- Photos: `images/ty-coaching-gym.jpg`, `images/ty-lola-beach.jpg` (real, from the project)

## Test-positioning pricing (confirm before treating as permanent)

- Semi-private coaching: **from $249/month**
- Private one-on-one: **from $400/month**
- Assessment: presented as the first step, **no price shown** (not yet approved)

All pricing is framed as "starting at / depends on goals, schedule &
availability." Confirm or adjust before locking in.
