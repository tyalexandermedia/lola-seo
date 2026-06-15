#!/usr/bin/env python3
"""
Lola programmatic landing-page generator.

Generates real, differentiated, buyer-intent static pages — one per
service x city — plus sitemap.xml and robots.txt. Run from repo root:

    python3 tools/gen_pages.py

Pages are written to <slug>/index.html for clean URLs
(e.g. /restaurant-seo-tampa/). Re-run any time the data below changes.
"""

import os, html

DOMAIN = "https://lola.tyalexandermedia.com"
BOOK = "https://calendar.app.google/J7idjUDitd2Hziuc7"

# Service definitions — each carries its own real search phrases + pain so
# pages are genuinely differentiated, not doorway/thin content.
SERVICES = {
    "restaurant":       dict(label="Restaurants", noun="restaurant",
                             phrases=["best restaurant near me", "places to eat in {city}", "{city} restaurants open now", "where to eat in {city}"],
                             pain="Hungry people search “best restaurant near me” and walk into whoever shows up first with photos, reviews, and hours.",
                             wins=["Get your menu, photos, and hours ranking on Google Maps", "Show up for “near me” and “open now” searches", "Turn reviews into a reservation machine"]),
    "salon":            dict(label="Salons & Spas", noun="salon",
                             phrases=["hair salon near me", "best salon in {city}", "{city} nail salon", "spa near me"],
                             pain="Someone needs a cut, color, or treatment today — they book whoever ranks first with great photos and reviews.",
                             wins=["Rank for “salon near me” in {city}", "Showcase your work and reviews on Google", "Fill your books from search, not just referrals"]),
    "gym":              dict(label="Gyms & Fitness Studios", noun="gym",
                             phrases=["gym near me", "{city} personal trainer", "fitness classes in {city}", "best gym in {city}"],
                             pain="New members search “gym near me” in January and sign up wherever shows up first with reviews and class info.",
                             wins=["Rank for “gym near me” and class searches", "Turn your reviews into new memberships", "Fill classes and personal-training slots from Google"]),
    "med-spa":          dict(label="Med Spas", noun="med spa",
                             phrases=["med spa near me", "botox in {city}", "{city} medical spa", "facial near me"],
                             pain="High-value clients search for treatments by name and book the practice that ranks first and looks trustworthy.",
                             wins=["Rank for treatment + “near me” searches", "Build trust with reviews and before/afters", "Book higher-ticket treatments from search"]),
    "dentist":          dict(label="Dentists", noun="dental practice",
                             phrases=["dentist near me", "emergency dentist {city}", "{city} dental office", "teeth whitening near me"],
                             pain="New patients search “dentist near me” and call the practice that ranks first with strong reviews.",
                             wins=["Rank for “dentist near me” in {city}", "Win emergency and new-patient searches", "Turn reviews into booked appointments"]),
    "chiropractor":     dict(label="Chiropractors", noun="chiropractic office",
                             phrases=["chiropractor near me", "{city} chiropractor", "back pain doctor near me", "adjustment near me"],
                             pain="People in pain search “chiropractor near me” and book whoever shows up first with good reviews.",
                             wins=["Rank for “chiropractor near me” in {city}", "Capture high-intent pain searches", "Convert reviews into new patients"]),
    "law-firm":         dict(label="Law Firms", noun="law firm",
                             phrases=["lawyer near me", "{city} personal injury attorney", "divorce lawyer {city}", "attorney near me"],
                             pain="A potential client with a real case searches for an attorney and calls whoever ranks first and looks credible.",
                             wins=["Rank for high-value “{city} attorney” searches", "Build authority and trust signals", "Turn search traffic into consultations"]),
    "plumber":          dict(label="Plumbers", noun="plumbing company",
                             phrases=["plumber near me", "emergency plumber {city}", "{city} drain cleaning", "water heater repair near me"],
                             pain="A burst pipe doesn't wait — they call the first plumber that shows up on Google with reviews and a phone number.",
                             wins=["Rank for emergency “plumber near me” calls", "Win same-day, high-intent searches", "Turn your phone into the booked calendar"]),
    "roofer":           dict(label="Roofers", noun="roofing company",
                             phrases=["roofer near me", "roof repair {city}", "{city} roofing company", "roof replacement near me"],
                             pain="After a storm, homeowners search “roof repair near me” and call whoever ranks first with reviews.",
                             wins=["Rank for storm and repair searches in {city}", "Win high-ticket roofing leads from Google", "Build trust with reviews and project photos"]),
    "pressure-washing": dict(label="Pressure Washing", noun="pressure washing company",
                             phrases=["pressure washing near me", "{city} soft wash", "house washing {city}", "driveway cleaning near me"],
                             pain="Homeowners search “pressure washing near me” and book whoever shows up first with before/after photos.",
                             wins=["Rank for “pressure washing near me” in {city}", "Win recurring exterior-cleaning jobs", "Turn before/afters and reviews into bookings"]),
}

CITIES = {
    "tampa":          "Tampa",
    "st-petersburg":  "St. Petersburg",
    "clearwater":     "Clearwater",
}

# Coverage: every service in Tampa; top movers also in St. Pete + Clearwater.
PAGES = [(s, "tampa") for s in SERVICES]
for s in ["restaurant", "salon", "gym", "plumber"]:
    PAGES.append((s, "st-petersburg"))
    PAGES.append((s, "clearwater"))


def esc(t):
    return html.escape(t, quote=True)


def render(service_key, city_key):
    s = SERVICES[service_key]
    city = CITIES[city_key]
    label = s["label"]
    noun = s["noun"]
    slug = f"{service_key}-seo-{city_key}"
    url = f"{DOMAIN}/{slug}/"
    phrases = [p.replace("{city}", city) for p in s["phrases"]]
    wins = [w.replace("{city}", city) for w in s["wins"]]
    pain = s["pain"].replace("{city}", city)

    title = f"Local SEO for {label} in {city} | Get Found on Google — Lola"
    desc = f"Get your {noun} to the top of Google in {city}. Lola is a done-for-you local SEO system — website, Google Business Profile, and rankings that bring more customers. Free audit."
    h1 = f"{city} {label}: Show Up on Google &amp; Get More Customers"

    phrase_items = "".join(f"<li>“{esc(p)}”</li>" for p in phrases)
    win_items = "".join(f"<li>{esc(w)}</li>" for w in wins)

    related = [(f"{k}-seo-{city_key}", SERVICES[k]["label"]) for k in SERVICES if k != service_key][:6]
    related_links = "".join(
        f'<a href="/{rslug}/">{esc(rl)} in {esc(city)}</a>' for rslug, rl in related
    )

    faq = [
        (f"How do I get my {noun} to show up on Google in {city}?",
         f"It comes down to three things: a Google Business Profile optimized for {city}, a fast website built to rank and convert, and the local signals (reviews, citations, schema) Google trusts. Lola does all three for you."),
        (f"How long until my {noun} ranks in {city}?",
         "Most local businesses see movement in 30–60 days. We ranked Sandbar Soft Wash for 5 keywords in 3 weeks using this same system."),
    ]
    faq_html = "".join(
        f'<div class="card"><div class="q">{esc(q)}</div><p>{esc(a)}</p></div>' for q, a in faq
    )
    faq_ld = ", ".join(
        '{"@type":"Question","name":%s,"acceptedAnswer":{"@type":"Answer","text":%s}}'
        % (_json(q), _json(a)) for q, a in faq
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{url}">
<meta name="robots" content="index, follow">
<meta property="og:type" content="website">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="https://tyalexandermedia.com/lola-logo.png">
<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"Service","serviceType":"Local SEO for {esc(label)}","areaServed":{{"@type":"City","name":{_json(city)}}},"provider":{{"@type":"ProfessionalService","name":"Lola by Ty Alexander Media","url":"{DOMAIN}/"}},"url":"{url}"}}
</script>
<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{faq_ld}]}}
</script>
<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{{"@type":"ListItem","position":1,"name":"Home","item":"{DOMAIN}/"}},{{"@type":"ListItem","position":2,"name":{_json(f"{label} in {city}")},"item":"{url}"}}]}}
</script>
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{background:#0a0e27;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;padding:20px}}
.wrap{{max-width:760px;margin:0 auto}}
nav{{display:flex;justify-content:space-between;align-items:center;padding:14px 0;margin-bottom:30px}}
nav .logo{{color:#FFD700;font-weight:bold;letter-spacing:2px;font-size:15px;text-decoration:none}}
nav a.cta{{color:#FFD700;font-size:12px;letter-spacing:1px;text-transform:uppercase;text-decoration:none}}
h1{{font-size:40px;font-weight:900;letter-spacing:-1px;line-height:1.1;margin:10px 0 16px}}
.hl{{color:#FFD700}}
.sub{{color:#aaa;font-size:16px;margin-bottom:28px}}
h2{{font-size:24px;font-weight:800;margin:44px 0 16px}}
p{{color:#cfcfcf;margin:0 0 14px}}
ul{{margin:0 0 14px;padding-left:20px;color:#cfcfcf}}
li{{margin:6px 0}}
.card{{background:rgba(255,215,0,0.05);border:1px solid rgba(255,215,0,0.15);border-radius:12px;padding:20px;margin:12px 0}}
.q{{color:#fff;font-weight:700;margin-bottom:6px}}
.btn{{display:inline-block;background:#FFD700;color:#000;font-weight:bold;padding:14px 30px;border-radius:8px;text-decoration:none;margin:6px 8px 6px 0}}
.btn.alt{{background:linear-gradient(135deg,#FF6B35,#FF8C42);color:#fff}}
.proof{{background:rgba(255,215,0,0.05);border:1px solid rgba(255,215,0,0.2);border-radius:10px;padding:16px 20px;font-size:14px;color:#ccc;margin:24px 0}}
.related{{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}}
.related a{{color:#FFD700;font-size:13px;text-decoration:none;border:1px solid rgba(255,215,0,0.2);padding:8px 12px;border-radius:8px}}
footer{{margin-top:60px;padding-top:30px;border-top:1px solid rgba(255,215,0,0.1);color:#777;font-size:13px;text-align:center}}
footer a{{color:#FFD700;text-decoration:none}}
</style>
</head>
<body>
<div class="wrap">
  <nav>
    <a class="logo" href="/">LOLA SEO</a>
    <a class="cta" href="{BOOK}">Book a Call</a>
  </nav>

  <h1>{h1}</h1>
  <p class="sub">Your competitors in {esc(city)} show up when locals search. You don't. Lola fixes that — done for you.</p>
  <a class="btn" href="/">Get My Free Audit</a>
  <a class="btn alt" href="{BOOK}">Book a Call</a>

  <h2>The problem</h2>
  <p>{esc(pain)} If your {esc(noun)} isn't the one ranking, you're not losing to a better business — you're losing to one that simply <strong>shows up on Google</strong> when you don't. Every one of those searches is a customer handed to a competitor.</p>

  <h2>What Lola does for {esc(label.lower())} in {esc(city)}</h2>
  <ul>{win_items}</ul>

  <div class="proof">\U0001FAB4 <strong>Proof, not promises:</strong> we built this for our own business first — Sandbar Soft Wash ranked for <strong>5 keywords in 3 weeks</strong>, 100/100 PageSpeed, 22 pages. Same system we run for your {esc(noun)}.</div>

  <h2>What {esc(city)} customers are typing</h2>
  <ul>{phrase_items}</ul>
  <p>When they search these, Lola makes sure your {esc(noun)} is what they find.</p>

  <h2>Questions</h2>
  {faq_html}

  <h2>Ready to get found?</h2>
  <p>Run your free 60-second audit to see exactly why customers aren't finding you yet — or book a call and we'll map the plan.</p>
  <a class="btn" href="/">Get My Free Audit</a>
  <a class="btn alt" href="{BOOK}">Book a Call</a>

  <h2>More local SEO in {esc(city)}</h2>
  <div class="related">{related_links}</div>

  <footer>
    <p>\U0001F43E Built by Ty Alexander Media · Tampa Bay · <a href="/">lola.tyalexandermedia.com</a></p>
  </footer>
</div>
</body>
</html>
"""


def _json(s):
    import json
    return json.dumps(s, ensure_ascii=False)


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    urls = [f"{DOMAIN}/"]
    for service_key, city_key in PAGES:
        slug = f"{service_key}-seo-{city_key}"
        d = os.path.join(root, slug)
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "index.html"), "w", encoding="utf-8") as f:
            f.write(render(service_key, city_key))
        urls.append(f"{DOMAIN}/{slug}/")

    # sitemap.xml
    sm = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        sm.append(f"  <url><loc>{u}</loc></url>")
    sm.append("</urlset>")
    with open(os.path.join(root, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write("\n".join(sm) + "\n")

    # robots.txt
    with open(os.path.join(root, "robots.txt"), "w", encoding="utf-8") as f:
        f.write(f"User-agent: *\nAllow: /\nSitemap: {DOMAIN}/sitemap.xml\n")

    print(f"Generated {len(PAGES)} landing pages + sitemap ({len(urls)} urls) + robots.txt")


if __name__ == "__main__":
    main()
