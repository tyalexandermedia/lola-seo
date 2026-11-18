# CoachTyAlexander.com — site notes

This repository (`lola-seo`, Netlify site `b15fb495-…`) is the
**Coach Ty Alexander** coaching site for St. Petersburg, FL. Despite the
repository name, it is not the Lola SEO application.

Plain HTML, CSS and JavaScript. No framework, no build step, no functions.

---

## History

- **2026-09-12** — Repository repositioned from the old local-business
  marketing site into the coaching site. The old marketing pages, tooling
  and lead-capture function were removed from this repo.
- **2026-11** (`site-reposition-nov26`) — Repositioned around
  "Move better under load": mobility messaging, semi-private waitlist,
  honest HYROX framing, Road to Miami journal page, Netlify Forms for the
  application, non-www canonical domain, and removal of all references to
  the unrelated marketing business.

---

## Site structure

| Route | Purpose |
|---|---|
| `/` | Homepage — hero, Road to Miami teaser, approach, semi-private waitlist, ways to train, basketball + about teasers, FAQ, apply CTA |
| `/coaching/` | Coaching options: semi-private (waitlist, planned price) and private 1:1 (availability by inquiry) |
| `/founding/` | Semi-private waitlist page (URL kept from the earlier founding-cohort page) |
| `/basketball-performance/` | Basketball strength and movement training, skills clinics (coming soon), Florida Rain links |
| `/hyrox/` | HYROX and hybrid training — one solo Open finished, coaching what is being learned and tested |
| `/road-to-miami/` | HYROX training journal |
| `/about/` | About Coach Ty, credentials |
| `/start/` | Fit Finder quiz that pre-fills the application |
| `/apply/` | Coaching application form (primary conversion) |

Primary CTA: **Apply for Coaching** → `/apply/`.
Waitlist CTA: **Join the Waitlist** → `/apply/?option=Semi-Private%20waitlist`.

---

## Canonical domain

`https://coachtyalexander.com` (no `www`). Canonical tags, Open Graph URLs,
the sitemap and `robots.txt` all use the apex domain. In Netlify, the apex
domain should be set as the primary domain so `www` redirects to it.

---

## Redirects (`_redirects`)

| From | To | Code |
|---|---|---|
| `/basketball` | `/basketball-performance/` | 301 |

The legacy redirects for the old marketing landing pages (`/*-seo-*`,
`/roadmap`) that pointed at the separate marketing site were removed in
November 2026 along with every other reference to that business. Those old
URLs now return the 404 page. If any of them still get traffic and should
go somewhere, add a rule here.

---

## Application form

`/apply/` uses **Netlify Forms**:

- The form is in the static HTML with `name="apply"`, `method="POST"`,
  `data-netlify="true"` and `netlify-honeypot="company"`, plus a hidden
  `form-name` input. Netlify detects it at deploy time.
- The page script POSTs `application/x-www-form-urlencoded` data
  (`URLSearchParams(new FormData(form))`) to `/` and shows the success
  panel only after a successful HTTP response.
- Submissions appear in the Netlify dashboard under Forms → `apply`.
  Email notifications to `ty@tyalexandermedia.com` are configured in the
  Netlify UI (Forms → Form notifications), not in this repo.
- `?option=`, `?goal=` and `?experience=` query parameters pre-select the
  matching dropdown values.

---

## Facts used on the site (nothing fabricated)

- Ty Alexander ("Coach Ty"), St. Petersburg, FL
- Phone `(727) 300-6573`, email `ty@tyalexandermedia.com`
- Instagram `@coachtyrellalexander`; basketball: `@floridarainhoops`, `linktr.ee/coachtyhoops`
- Head Coach, Florida Rain
- Credentials: TRIBE Team Training Certified,
  Les Mills GRIT Certified, CPR/AED, USA Basketball Gold Coach;
  NSCA-CPT **(in progress)**
- HYROX: one solo Open completed in 1:29:59. Considering Miami on March 28,
  **not registered**.
- Photos: `images/ty-coaching-gym.jpg`, `images/ty-lola-beach.jpg`

## Offers and pricing

- Semi-private coaching: **waitlist**. Planned price **$249/month**.
  St. Petersburg location and schedule are being confirmed.
- Private 1:1: from **$400/month**. Contact for current availability.
- No prices are included in structured data.
