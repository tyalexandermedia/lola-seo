# Media Shot List & Asset Handoff — Ty Alexander Media (Drone & 360)

The site ships with **self-contained cinematic placeholders** (designed film-frame
slots — no fake photos, nothing broken). Every slot below is built to accept your
**real footage** as a drop-in swap.

> **Why placeholders and not your IG / Pexels?** This build environment's network
> policy **blocks `instagram.com` and `pexels.com`** (403), so I couldn't pull or
> verify that media from here. It does **not** affect the live site — once you add
> real files (or paste stock URLs), they render normally for visitors.
>
> **Best source = your own work:** [@tyalexandermedia](https://www.instagram.com/tyalexandermedia).
> Export the originals rather than screen-grabbing IG (higher quality, no watermark).

## How to add media (general pattern)

1. Create a folder `/media/` at the repo root and drop optimized files in it.
2. **Images:** export **WebP or AVIF** (JPG fallback ok), sized to display, quality ~80.
   Add `loading="lazy"` to anything below the fold; `fetchpriority="high"` to the hero image.
3. **Video:** provide **MP4 (H.264)** + **WebM**, 1080p, short loop (8–20s), no audio needed;
   keep the hero clip **under ~5–8 MB** for Core Web Vitals. Always include a `poster` image.
4. Write real, descriptive **alt text** (helps SEO + accessibility).

---

## Priority slots

### ⭐ P1 — Social preview image (affects every shared link)
- **File:** `/social-preview.jpg` — **1200 × 630px**, an aerial hero still at golden hour.
- Referenced by `og:image` / `twitter:image` on all pages. Until added, shared links have no thumbnail.

### ⭐ P1 — Homepage hero reel  → `index.html`, the `<div class="hero__media">`
- **Shoot:** your strongest cinematic aerial move — a slow reveal over a Tampa Bay waterfront
  property / the skyline / the water at golden hour. Vertical-friendly composition.
- **Swap the empty `.hero__media` for:**
  ```html
  <div class="hero__media" role="img" aria-label="Aerial reveal of a St. Petersburg waterfront property at golden hour">
    <img src="/media/hero-poster.jpg" alt="" fetchpriority="high">
    <video data-autoplay poster="/media/hero-poster.jpg" playsinline muted loop>
      <source src="/media/hero.webm" type="video/webm">
      <source src="/media/hero.mp4" type="video/mp4">
    </video>
  </div>
  ```
  `tam.js` auto-plays it muted, respects reduced-motion, and shows a mute toggle if you add
  `<button class="hero__mutebtn" data-mute aria-label="Mute video">…</button>` inside `.hero`.
- Same pattern for the sub-page heroes in `drone-services/` and `360-virtual-tours/`.

### ⭐ P2 — About portrait  → `index.html`, About section `.about__media .media`
- **Shoot:** you on location with the drone (or a strong portrait). Vertical 4:5.
- **Swap for:** `<img src="/media/ty-portrait.jpg" alt="Ty Alexander, FAA Part 107 drone pilot, on location in St. Petersburg" loading="lazy">` (place as first child of `.media`).

### ⭐ P2 — Featured work grid  → `index.html`, the 8 `.work-item` tiles
- Replace each slot's `.media` inner with a real edited piece, and set a **true** category
  (`data-cat`) + title (`.work-item__meta`). **Delete any tiles you don't have real work for**
  — do not leave empty categories or invent projects.
- Per tile:
  ```html
  <div class="media" data-ratio="16x9">
    <img src="/media/work-waterfront.jpg" alt="Aerial view of [real venue], Tampa Bay" loading="lazy">
  </div>
  ```
  (Or a `poster + <video data-autoplay>` block for motion tiles.)
- Suggested real categories you already serve: **Hospitality, Fitness, Commercial, Property, Local business.**

### P3 — Service-page section media
- `drone-services/` → "Aerial reel" slot (4:5): a strong aerial still/clip.
- `360-virtual-tours/` → "360 walkthrough" slot (1:1): embed a real 360 tour (Matterport/Kuula/etc.)
  via `<iframe>` **or** a looping preview clip. If you embed a third-party 360 iframe, tell me the
  provider so I can add the right `frame-src` allowance.

---

## Interim stock (optional, if you want imagery before your shoots)

Placeholders read fine as-is, but if you want photographic filler for a demo, these Pexels
searches are commercial-free (attribution appreciated). **Replace with your own work before launch** —
your brand is "real work only," so treat stock as scaffolding, never as portfolio:
- Aerial Tampa / St. Pete: https://www.pexels.com/search/tampa%20aerial/ · https://www.pexels.com/search/st%20petersburg%20florida%20drone/
- Drone waterfront / coast: https://www.pexels.com/search/drone%20beach%20florida/
- Gym / fitness interior: https://www.pexels.com/search/gym%20interior/
- Restaurant / waterfront venue: https://www.pexels.com/search/waterfront%20restaurant/

---

## Missing / to-confirm factual info

| Item | Status | Notes |
|---|---|---|
| FAA Part 107 certification | ✅ Confirmed by Ty | Now shown in trust bar, About, and drone FAQ + schema. Send a cert # / badge if you want it displayed. |
| Instagram handle | ✅ `@tyalexandermedia` | Linked in nav footer + schema `sameAs`. |
| Contact email / phone | ✅ `ty@tyalexandermedia.com` / `727-300-6573` | Pulled from existing repo code. Confirm these are the right public contacts for the drone brand. |
| `/social-preview.jpg` | ⛔ Needed | See P1. |
| Business street address | ⚠️ Not set | Schema uses **area served + St. Petersburg, FL** only (no street address found). Add a full address if you want stronger Google local ranking + a map. |
| Business hours | ⚠️ Optional | Add if you want `openingHours` in schema. |
| About bio specifics | ⚠️ Generic (non-fabricated) | Kept truthful/general — expand with real details you approve. |
| Client names / testimonials | ⛔ None used | Per the no-fake rule. Supply real ones (with permission) to add a testimonials section later. |
| Pricing ($450 / $950 starting) | ⚠️ From brief | Confirm these validation prices are current. |
