/* ============================================================
   LOLA SEO — Ty Alexander Media
   Real checks via public APIs + intelligent heuristics
============================================================ */

// ── State ─────────────────────────────────────────────────────
let analysisData = {};

// ── DOM helpers ───────────────────────────────────────────────
const $ = id => document.getElementById(id);
const show = id => { const el = $(id); if (el) el.classList.remove('hidden'); };
const hide = id => { const el = $(id); if (el) el.classList.add('hidden'); };

// ── STEP TRANSITIONS ──────────────────────────────────────────
function goToStep(step) {
  ['step-input','step-loading','step-gate','step-ig','step-report'].forEach(hide);
  show(step);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  updateStepIndicators(step);
}

function updateStepIndicators(step) {
  const stepMap = { 'step-input': 1, 'step-loading': 1, 'step-gate': 2, 'step-ig': 2, 'step-report': 3 };
  const current = stepMap[step] || 1;
  document.querySelectorAll('.step-pill').forEach((el, i) => {
    const num = i + 1;
    el.classList.remove('active','done');
    if (num < current) el.classList.add('done');
    else if (num === current) el.classList.add('active');
  });
}

// ── FORM: Step 1 → Analysis ───────────────────────────────────
$('seo-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const bizName = $('business-name').value.trim();
  const websiteRaw = $('website-url').value.trim();
  const city = $('business-city').value.trim();
  const bizType = $('business-type').value;

  if (!bizName || !websiteRaw || !city) {
    alert('Please fill in your business name, website, and city.');
    return;
  }

  let website = websiteRaw;
  if (!website.startsWith('http')) website = 'https://' + website;

  analysisData = { bizName, website, city, bizType };

  const headlines = [
    'Lola is on the scent… 🐽',
    'Sniffing your title tags… 👃',
    'Digging for robots.txt and sitemap… 🗂️',
    'Chasing down your page speed… 🏃',
    'Digging up your local signals… 🦮',
    'Sniffing your schema and OG tags… 📝',
    'Almost got it! Lola\'s closing in… 🐾',
  ];
  let hIdx = 0;
  const hInterval = setInterval(() => {
    hIdx = (hIdx + 1) % headlines.length;
    const el = $('loading-headline');
    if (el) el.textContent = headlines[hIdx];
  }, 1400);
  goToStep('step-loading');
  await runAnalysis();
  clearInterval(hInterval);
});

// ── LOADING SEQUENCE ──────────────────────────────────────────
async function animateLoadCheck(id, delay, progressPct) {
  await sleep(delay);
  const el = $(id);
  if (!el) return;
  el.classList.add('active');
  el.querySelector('.lc-icon').textContent = '◌';
  setProgress(progressPct);
  await sleep(800);
  el.classList.remove('active');
  el.classList.add('done');
  el.querySelector('.lc-icon').textContent = '✓';
}

function setProgress(pct) {
  const fill = $('progress-fill');
  const icon = $('progress-lola-icon');
  const label = $('progress-pct');
  if (!fill) return;
  fill.style.width = pct + '%';
  if (icon) icon.style.left = pct + '%';
  if (label) label.textContent = pct + '%';
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── MAIN ANALYSIS ENGINE ──────────────────────────────────────
async function runAnalysis() {
  const { bizName, website, city, bizType } = analysisData;

  setProgress(5);
  animateLoadCheck('lc1', 300,  12);
  animateLoadCheck('lc2', 800,  24);
  animateLoadCheck('lc3', 1400, 36);
  animateLoadCheck('lc4', 2000, 50);
  animateLoadCheck('lc5', 2600, 64);
  animateLoadCheck('lc6', 3200, 76);
  animateLoadCheck('lc7', 3700, 88);
  animateLoadCheck('lc8', 4200, 95);

  const timeout = new Promise(resolve => setTimeout(resolve, 9000));
  const fallbackSite = {
    ok: false, httpsOk: website.startsWith('https://'), title: '', metaDesc: '',
    metaViewport: false, h1Text: '', h1Count: 0, h2Count: 0, canonicalTag: false,
    canonicalSelf: false, noindex: false, ogTitle: false, ogDesc: false, ogImage: false,
    ogTags: false, schemaJson: false, wordCount: 0, imgCount: 0, altMissing: 0,
    altMissingPct: 0, internalLinks: 0, externalLinks: 0, hasPhone: false,
    hasAddress: false, hasMaps: false, hasGBP: false, hasAnalytics: false,
    hasGTM: false, hasPrivacyLink: false, robotsOk: null, sitemapFound: null,
    isRedirect: false, headingHierarchyOk: true
  };
  const fallbackSpeed = { ok: false, performance: 50, accessibility: 50, seo: 50,
    isMobileOk: true, hasViewport: true, isCrawlable: true, fcp: '', lcp: '', cls: '' };

  const [siteData, speedData] = await Promise.all([
    Promise.race([fetchSiteData(website), timeout.then(() => fallbackSite)]),
    Promise.race([fetchPageSpeed(website), timeout.then(() => fallbackSpeed)]),
  ]);

  await sleep(1000);
  setProgress(100);

  const scores = {
    siteHealth:    scoreSiteHealth(siteData, website),
    localPresence: scoreLocalPresence(siteData, bizName, city, bizType),
    mobile:        scoreMobile(speedData),
    speed:         scoreSpeed(speedData),
    content:       scoreContent(siteData, bizName, city)
  };

  const total = Math.round(
    scores.siteHealth   * 0.25 +
    scores.localPresence * 0.30 +
    scores.mobile        * 0.15 +
    scores.speed         * 0.15 +
    scores.content       * 0.15
  );

  analysisData.scores   = scores;
  analysisData.total    = total;
  analysisData.siteData = siteData;
  analysisData.speedData = speedData;
  analysisData.issues   = buildIssues(scores, siteData, speedData, website, bizName, city);
  analysisData.quickWins = buildQuickWins(scores, siteData, city, bizType);

  showGate(total, bizName);
}

// ── REAL DATA FETCHERS ────────────────────────────────────────
async function fetchSiteData(url) {
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}&timestamp=${Date.now()}`;
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error('fetch failed');
    const json = await res.json();
    const html = json.contents || '';
    const lowerHtml = html.toLowerCase();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // ── Core tags ──
    const title      = doc.querySelector('title')?.textContent?.trim() || '';
    const metaDesc   = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
    const metaViewport = !!doc.querySelector('meta[name="viewport"]');
    const httpsOk    = url.startsWith('https://');

    // ── Headings ──
    const h1s    = doc.querySelectorAll('h1');
    const h2s    = doc.querySelectorAll('h2');
    const h3s    = doc.querySelectorAll('h3');
    const h1Text = h1s[0]?.textContent?.trim() || '';
    // Heading hierarchy: H2 should come after H1, H3 after H2
    const headingHierarchyOk = h1s.length === 1; // simplified check

    // ── Canonical ──
    const canonicalEl  = doc.querySelector('link[rel="canonical"]');
    const canonicalTag = !!canonicalEl;
    const canonicalHref = canonicalEl?.getAttribute('href') || '';
    // Self-referencing canonical = correct practice
    const canonicalSelf = canonicalTag && (canonicalHref.includes(new URL(url).hostname) || canonicalHref.startsWith('/'));

    // ── Noindex check ──
    const robotsMeta  = doc.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
    const noindex     = robotsMeta.toLowerCase().includes('noindex');

    // ── Open Graph completeness ──
    const ogTitle  = !!doc.querySelector('meta[property="og:title"]');
    const ogDesc   = !!doc.querySelector('meta[property="og:description"]');
    const ogImage  = !!doc.querySelector('meta[property="og:image"]');
    const ogTags   = ogTitle || ogDesc || ogImage;
    const ogComplete = ogTitle && ogDesc && ogImage;

    // ── Schema ──
    const schemaJson = !!doc.querySelector('script[type="application/ld+json"]');

    // ── Content ──
    const bodyText  = doc.body?.innerText || doc.body?.textContent || '';
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

    // ── Images & alt ──
    const imgs       = Array.from(doc.querySelectorAll('img'));
    const imgCount   = imgs.length;
    const altMissing = imgs.filter(img => !img.getAttribute('alt') || img.getAttribute('alt').trim() === '').length;
    const altMissingPct = imgCount > 0 ? Math.round((altMissing / imgCount) * 100) : 0;

    // ── Links ──
    const allLinks = Array.from(doc.querySelectorAll('a[href]'));
    const internalLinks = allLinks.filter(a => {
      try { const href = a.getAttribute('href'); return href && !href.startsWith('http') && !href.startsWith('mailto') && !href.startsWith('tel'); }
      catch { return false; }
    }).length;
    const externalLinks = allLinks.filter(a => {
      try { const href = a.getAttribute('href'); return href && href.startsWith('http'); }
      catch { return false; }
    }).length;

    // ── Local signals ──
    const hasPhone   = /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\(\d{3}\)\s?\d{3}[-.\s]?\d{4})/.test(html);
    const hasAddress = /(street|avenue|blvd|drive|road|suite|\bst\b|\bave\b|\bdr\b)/i.test(html);
    const hasMaps    = lowerHtml.includes('google.com/maps') || lowerHtml.includes('maps.google') || lowerHtml.includes('goo.gl/maps');
    const hasGBP     = lowerHtml.includes('business.google') || lowerHtml.includes('g.page') || lowerHtml.includes('g.co/');

    // ── Analytics & tracking ──
    const hasAnalytics = lowerHtml.includes('google-analytics.com') || lowerHtml.includes('gtag(') || lowerHtml.includes('ga.js') || lowerHtml.includes('analytics.js') || lowerHtml.includes('googletagmanager.com/gtag');
    const hasGTM       = lowerHtml.includes('googletagmanager.com/gtm');
    const hasPixel     = lowerHtml.includes('connect.facebook.net') || lowerHtml.includes('fbq(');
    const hasPrivacyLink = lowerHtml.includes('privacy') || lowerHtml.includes('terms');

    // ── Robots.txt & Sitemap (parallel fetch, non-blocking) ──
    let robotsOk    = null;
    let sitemapFound = null;
    try {
      const origin = new URL(url).origin;
      const [robotsRes, sitemapRes] = await Promise.allSettled([
        fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(origin + '/robots.txt')}`, { signal: AbortSignal.timeout(4000) }),
        fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(origin + '/sitemap.xml')}`, { signal: AbortSignal.timeout(4000) })
      ]);
      if (robotsRes.status === 'fulfilled' && robotsRes.value.ok) {
        const rb = await robotsRes.value.json();
        const rbText = (rb.contents || '').toLowerCase();
        robotsOk = rbText.includes('user-agent') && !rbText.includes('disallow: /');
      }
      if (sitemapRes.status === 'fulfilled' && sitemapRes.value.ok) {
        const sm = await sitemapRes.value.json();
        sitemapFound = (sm.contents || '').length > 50 && (sm.contents || '').includes('urlset');
      }
    } catch(e) { /* non-blocking */ }

    return {
      ok: true, title, metaDesc, metaViewport, h1Text,
      h1Count: h1s.length, h2Count: h2s.length, h3Count: h3s.length,
      headingHierarchyOk,
      canonicalTag, canonicalSelf, noindex,
      ogTitle, ogDesc, ogImage, ogTags, ogComplete,
      schemaJson, httpsOk, wordCount, imgCount, altMissing, altMissingPct,
      internalLinks, externalLinks,
      hasPhone, hasAddress, hasMaps, hasGBP,
      hasAnalytics, hasGTM, hasPixel, hasPrivacyLink,
      robotsOk, sitemapFound
    };
  } catch (err) {
    const httpsOk = url.startsWith('https://');
    return {
      ok: false, httpsOk, title: '', metaDesc: '', metaViewport: false,
      h1Text: '', h1Count: 0, h2Count: 0, h3Count: 0, headingHierarchyOk: true,
      canonicalTag: false, canonicalSelf: false, noindex: false,
      ogTitle: false, ogDesc: false, ogImage: false, ogTags: false, ogComplete: false,
      schemaJson: false, wordCount: 0, imgCount: 0, altMissing: 0, altMissingPct: 0,
      internalLinks: 0, externalLinks: 0,
      hasPhone: false, hasAddress: false, hasMaps: false, hasGBP: false,
      hasAnalytics: false, hasGTM: false, hasPixel: false, hasPrivacyLink: false,
      robotsOk: null, sitemapFound: null
    };
  }
}

async function fetchPageSpeed(url) {
  try {
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&category=accessibility&category=seo`;
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(12000) });
    if (res.status === 429 || res.status === 503 || !res.ok) throw new Error('pagespeed failed');
    const data = await res.json();

    const cats   = data.lighthouseResult?.categories || {};
    const audits = data.lighthouseResult?.audits || {};

    return {
      ok: true,
      performance:   Math.round((cats.performance?.score || 0) * 100),
      accessibility: Math.round((cats.accessibility?.score || 0) * 100),
      seo:           Math.round((cats.seo?.score || 0) * 100),
      fcp:  audits['first-contentful-paint']?.displayValue || '',
      lcp:  audits['largest-contentful-paint']?.displayValue || '',
      cls:  audits['cumulative-layout-shift']?.displayValue || '',
      isMobileOk:  (cats.performance?.score || 0) >= 0.5,
      hasViewport: (audits['viewport']?.score || 0) === 1,
      isCrawlable: (audits['is-crawlable']?.score || 0) === 1,
    };
  } catch (err) {
    return { ok: false, performance: 50, accessibility: 50, seo: 50, isMobileOk: true, hasViewport: true, isCrawlable: true };
  }
}

// ── SCORING LOGIC ─────────────────────────────────────────────
function scoreSiteHealth(s, url) {
  let score = 0;
  if (s.httpsOk)   score += 20;
  if (s.title?.length > 10 && s.title?.length < 70) score += 15;
  else if (s.title?.length > 0) score += 8;
  if (s.metaDesc?.length > 50 && s.metaDesc?.length < 160) score += 15;
  else if (s.metaDesc?.length > 0) score += 6;
  if (s.canonicalTag)   score += 8;
  if (s.ogComplete)     score += 12;   // all 3 OG tags = full credit
  else if (s.ogTags)    score += 5;    // partial
  if (s.schemaJson)     score += 12;
  if (!s.noindex)       score += 8;    // not blocking indexing
  if (s.robotsOk === true)  score += 5;
  if (s.sitemapFound === true) score += 5;
  return Math.min(score, 100);
}

function scoreLocalPresence(s, bizName, city, bizType) {
  let score = 0;
  if (s.hasPhone)   score += 28;
  if (s.hasAddress) score += 22;
  if (s.hasMaps)    score += 15;
  if (s.hasGBP)     score += 15;
  if (s.schemaJson) score += 10;
  const cityLower = city.split(',')[0].toLowerCase();
  if (s.title?.toLowerCase().includes(cityLower))    score += 5;
  if (s.metaDesc?.toLowerCase().includes(cityLower)) score += 5;
  return Math.min(score, 100);
}

function scoreMobile(p) {
  if (!p.ok) return 55;
  let score = 0;
  score += Math.round(p.performance * 0.6);
  score += Math.round(p.accessibility * 0.25);
  if (p.hasViewport) score += 15;
  return Math.min(Math.round(score), 100);
}

function scoreSpeed(p) {
  if (!p.ok) return 50;
  return Math.min(Math.round(p.performance), 100);
}

function scoreContent(s, bizName, city) {
  let score = 0;
  if (s.h1Count === 1)  score += 25;
  else if (s.h1Count > 1) score += 10;
  if (s.wordCount > 300)  score += 20;
  else if (s.wordCount > 100) score += 10;
  if (s.internalLinks > 2) score += 15;
  if (s.imgCount > 0) score += 10;
  const altRatio = s.imgCount > 0 ? 1 - (s.altMissing / s.imgCount) : 1;
  score += Math.round(altRatio * 15);
  if (s.ogTags) score += 15;
  return Math.min(score, 100);
}

// ── ISSUE BUILDER — compact, one clear action per issue ─────────
function buildIssues(scores, siteData, speedData, url, bizName, city) {
  const issues = [];
  const cityName = city.split(',')[0];

  if (!siteData.httpsOk) {
    issues.push({ icon: '🔓', severity: 'error', impactClass: 'critical',
      title: 'No HTTPS — Google marks your site "Not Secure"',
      fix: 'Enable the free SSL certificate in your hosting dashboard. Force HTTPS redirects so every visitor lands on a secure URL.',
      action: { label: 'Test SSL at SSLLabs.com →', url: 'https://www.ssllabs.com/ssltest/' },
      upsell: null });
  }

  if (!siteData.title || siteData.title.length < 10) {
    issues.push({ icon: '📄', severity: 'error', impactClass: 'critical',
      title: 'Missing page title — your #1 Google ranking signal',
      fix: `Write a title under 60 chars: "[Your Service] in ${cityName} | ${bizName}". Add it in your CMS under SEO Settings.`,
      action: { label: 'Preview title length →', url: 'https://www.seoptimer.com/title-tag-preview' },
      upsell: { label: 'We write and implement all title tags.', cta: 'On-Page SEO Service →', url: 'https://www.tyalexandermedia.com/contact' } });
  } else if (siteData.title.length > 65) {
    issues.push({ icon: '📄', severity: 'warn', impactClass: 'high',
      title: `Title too long (${siteData.title.length} chars) — gets cut off in Google`,
      fix: `Trim to under 60 characters. Keep your primary keyword and city. Current: "${siteData.title.substring(0,50)}…"`,
      action: { label: 'Check the preview →', url: 'https://www.seoptimer.com/title-tag-preview' },
      upsell: null });
  }

  if (!siteData.metaDesc || siteData.metaDesc.length < 50) {
    issues.push({ icon: '📝', severity: 'error', impactClass: 'high',
      title: 'No meta description — Google writes one for you (badly)',
      fix: `Write 140–155 characters: "Top [service] in ${cityName}. [Differentiator]. Call for a free quote today." Add it in your CMS page settings.`,
      action: { label: 'Check length →', url: 'https://www.seoptimer.com/meta-description-preview' },
      upsell: null });
  }

  if (siteData.noindex) {
    issues.push({ icon: '🚫', severity: 'error', impactClass: 'critical',
      title: 'noindex tag detected — Google is told to hide this page',
      fix: 'Open your CMS SEO settings and turn "Search Visibility" ON. This is often left on from development mode.',
      action: { label: 'Inspect in Search Console →', url: 'https://search.google.com/search-console' },
      upsell: { label: 'Technical SEO audit in our onboarding.', cta: 'Fix My Site →', url: 'https://www.tyalexandermedia.com/contact' } });
  }

  if (!siteData.hasPhone) {
    issues.push({ icon: '📞', severity: 'error', impactClass: 'critical',
      title: "No phone number — Google can't verify your business location",
      fix: 'Add your phone as plain HTML text in your header AND footer. Use a tel: link so mobile visitors tap to call instantly.',
      action: null,
      upsell: { label: 'NAP consistency across 50+ citations in our Local SEO package.', cta: 'Fix My Local SEO →', url: 'https://www.tyalexandermedia.com/contact' } });
  }

  if (!siteData.hasAddress) {
    issues.push({ icon: '📍', severity: 'error', impactClass: 'critical',
      title: "No address found — Google can't place you on the map",
      fix: `Add your full address as visible text in your footer: "123 Main St, ${cityName}, FL." Embed a Google Map on your Contact page.`,
      action: null,
      upsell: { label: 'Full local footprint — site, GBP, and citations.', cta: 'Get My Local SEO Fixed →', url: 'https://www.tyalexandermedia.com/contact' } });
  }

  if (!siteData.schemaJson) {
    issues.push({ icon: '🗂️', severity: 'warn', impactClass: 'high',
      title: "No schema markup — Google doesn't know what type of business you are",
      fix: "Generate a LocalBusiness JSON-LD snippet and paste it into your site's head. The free tool below takes 20 minutes.",
      action: { label: 'Generate schema free →', url: 'https://technicalseo.com/tools/schema-markup-generator/' },
      upsell: null });
  }

  if (speedData.ok && speedData.performance < 50) {
    issues.push({ icon: '⚡', severity: 'error', impactClass: 'critical',
      title: `Critical page speed (${speedData.performance}/100) — you're losing 53% of visitors before they read a word`,
      fix: 'Run PageSpeed Insights now. Biggest quick win: compress all images to WebP at squoosh.app — typically moves the needle 20–30 points.',
      action: { label: 'Run PageSpeed Insights →', url: 'https://pagespeed.web.dev' },
      upsell: { label: 'Full speed optimization in our technical SEO service.', cta: 'Fix My Speed →', url: 'https://www.tyalexandermedia.com/contact' } });
  } else if (speedData.ok && speedData.performance < 75) {
    issues.push({ icon: '⚡', severity: 'warn', impactClass: 'medium',
      title: `Page speed (${speedData.performance}/100) — below Google's 90+ threshold`,
      fix: "Compress images at TinyPNG.com and convert to WebP. Check the Opportunities tab in PageSpeed Insights for your specific bottlenecks.",
      action: { label: 'Check your full report →', url: 'https://pagespeed.web.dev' },
      upsell: null });
  }

  if (siteData.h1Count === 0) {
    issues.push({ icon: '🔤', severity: 'warn', impactClass: 'high',
      title: "No H1 heading — Google doesn't know what your page is about",
      fix: `Add one H1 to your homepage with your service and city: "${cityName} Pressure Washing" or similar. One per page, make it the biggest text.`,
      action: null,
      upsell: null });
  } else if (siteData.h1Count > 2) {
    issues.push({ icon: '🔤', severity: 'warn', impactClass: 'medium',
      title: `${siteData.h1Count} H1 tags — diluting your ranking signal`,
      fix: "Keep exactly one H1 per page. Change all extras to H2 or H3. Open page source (Ctrl+U) and search for '<h1' to find them.",
      action: null,
      upsell: null });
  }

  if (siteData.ok && siteData.wordCount < 200) {
    issues.push({ icon: '✍️', severity: 'warn', impactClass: 'medium',
      title: `Thin content (~${siteData.wordCount} words) — not enough for Google to trust you`,
      fix: `Target 400–600 words on your homepage. Cover: what you do, who you serve in ${cityName}, why customers choose you. A FAQ section is easy content.`,
      action: null,
      upsell: { label: 'We write SEO copy built around your city search terms.', cta: 'Get Content Written →', url: 'https://www.tyalexandermedia.com/contact' } });
  }

  if (siteData.robotsOk === false) {
    issues.push({ icon: '🤖', severity: 'error', impactClass: 'critical',
      title: 'robots.txt may be blocking Google from crawling your site',
      fix: "Visit your-site.com/robots.txt. If you see 'Disallow: /' under 'User-agent: *', change it to just 'Disallow:' (blank). This allows all crawlers in.",
      action: { label: "Test with Google's Robots Tool →", url: 'https://www.google.com/webmasters/tools/robots-testing-tool' },
      upsell: { label: 'Full crawl audit in our technical SEO package.', cta: 'Fix My Crawlability →', url: 'https://www.tyalexandermedia.com/contact' } });
  }

  if (siteData.sitemapFound === false) {
    issues.push({ icon: '🗺️', severity: 'warn', impactClass: 'high',
      title: 'No sitemap.xml — Google has no roadmap to your pages',
      fix: 'Most CMS platforms auto-generate sitemaps. Wix has it built in. WordPress uses Yoast SEO (free). Submit it in Google Search Console.',
      action: { label: 'Submit in Search Console →', url: 'https://search.google.com/search-console' },
      upsell: null });
  }

  if (!siteData.hasAnalytics && !siteData.hasGTM) {
    issues.push({ icon: '📊', severity: 'warn', impactClass: 'high',
      title: "No analytics — you're optimizing blind",
      fix: "Install Google Analytics 4 (free). Go to analytics.google.com, create a property, paste the tracking code into your site head. 15 minutes.",
      action: { label: 'Set up GA4 →', url: 'https://analytics.google.com' },
      upsell: null });
  }

  if (!siteData.ogTags) {
    issues.push({ icon: '🔗', severity: 'warn', impactClass: 'medium',
      title: 'No Open Graph tags — site looks broken when shared on social',
      fix: "Add og:title, og:description, and og:image to your page head. Your og:image should be 1200×630px. Test the result at opengraph.xyz.",
      action: { label: 'Test your share preview →', url: 'https://www.opengraph.xyz' },
      upsell: null });
  }

  if (siteData.altMissingPct > 40 && siteData.imgCount > 3) {
    issues.push({ icon: '🖼️', severity: 'warn', impactClass: 'medium',
      title: `${siteData.altMissingPct}% of images missing alt text — invisible to Google Images`,
      fix: `Click each image in your CMS and add a description: "${bizName} team serving ${cityName}." Use your service and city naturally.`,
      action: null,
      upsell: null });
  }

  const order = { critical: 0, high: 1, medium: 2 };
  issues.sort((a, b) => (order[a.impactClass] ?? 3) - (order[b.impactClass] ?? 3));
  return issues.slice(0, 8);
}

// ── QUICK WINS BUILDER — tight, scannable ────────────────────────
function buildQuickWins(scores, siteData, city, bizType) {
  const wins = [];
  const cityName = city.split(',')[0];

  wins.push({
    title: 'Claim & fully optimize your Google Business Profile',
    why: 'This is the single fastest move to get into the Google Local Pack — the 3 businesses shown at the top of every local search. Nothing else comes close.',
    action: 'Go to business.google.com. Fill every field: hours, services, description with your city, 10+ photos. Ask your last 3 customers for a Google review this week.',
    link: { label: 'Open Google Business →', url: 'https://business.google.com' },
    effort: 'Highest ROI', time: '1–2 hrs',
    upsell: { label: 'Full GBP optimization in our Local SEO package.', cta: 'Get My GBP Done →', url: 'https://www.tyalexandermedia.com/contact' }
  });

  if (!siteData.metaDesc || siteData.metaDesc.length < 50) {
    wins.push({
      title: 'Write a click-worthy meta description',
      why: "The 2-line preview under your Google result. A strong one doubles click-through rate without moving a single ranking.",
      action: `Formula: "[Service] in ${cityName} — [differentiator]. [Social proof]. Free quote today." Under 155 chars.`,
      link: { label: 'Check length at SEOptimer →', url: 'https://www.seoptimer.com/meta-description-preview' },
      effort: 'Easy Win', time: '15 min',
      upsell: null
    });
  }

  if (!siteData.schemaJson) {
    wins.push({
      title: 'Add LocalBusiness Schema (free, 20 minutes)',
      why: 'Tells Google exactly what your business is — can trigger star ratings and hours directly in search results. Most local businesses skip this, which means doing it puts you ahead.',
      action: "Use the free generator at technicalseo.com. Select LocalBusiness, fill in your details, paste the JSON-LD code into your site head.",
      link: { label: 'Generate schema free →', url: 'https://technicalseo.com/tools/schema-markup-generator/' },
      effort: 'Easy Win', time: '20 min',
      upsell: null
    });
  }

  if (scores.speed < 60) {
    wins.push({
      title: 'Compress your images — the #1 speed fix',
      why: 'Images cause 80% of slow load times. Compressing to WebP cuts file size 60–80% with zero visible quality difference.',
      action: 'Go to squoosh.app. Upload each image, switch to WebP, quality 80%. Download and replace originals on your site.',
      link: { label: 'Compress at Squoosh.app →', url: 'https://squoosh.app' },
      effort: 'Easy Win', time: '30 min',
      upsell: null
    });
  }

  wins.push({
    title: `Create a city page: "[Your Service] in ${cityName}"`,
    why: 'A single location page targeting your service + city can rank for dozens of local searches. This is how small businesses outrank big competitors.',
    action: `New page, title: "[Service] in ${cityName}, [State]." Write 400–600 words. Include "${cityName}" in the H1, first paragraph, and meta description.`,
    link: null,
    effort: 'Medium Win', time: '1–2 hrs',
    upsell: { label: "We write and optimize location pages built around your buyers' exact searches.", cta: 'Get Location Pages Built →', url: 'https://www.tyalexandermedia.com/contact' }
  });

  return wins.slice(0, 4);
}

// ── SHOW GATE ─────────────────────────────────────────────────
function showGate(total, bizName) {
  $('teaser-score-num').textContent = total;
  $('teaser-score-label').textContent = getGradeLabel(total);
  $('teaser-score-label').style.color = getScoreColor(total);
  $('gate-biz-name').textContent = bizName;

  const pct = total / 100;
  const circumference = 314;
  const dashOffset = circumference - (circumference * pct);
  setTimeout(() => {
    $('score-ring-fill').style.strokeDashoffset = dashOffset;
  }, 100);

  goToStep('step-gate');
}

// ── EMAIL GATE ─────────────────────────────────────────────────
$('email-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('user-email').value.trim();
  if (!email || !email.includes('@')) {
    alert('Please enter a valid email address.');
    return;
  }
  analysisData.email = email;

  const unlockBtn  = $('unlock-btn');
  const unlockText = $('unlock-btn-text');
  if (unlockBtn)  { unlockBtn.disabled = true; unlockBtn.style.opacity = '0.7'; }
  if (unlockText) unlockText.textContent = 'Sending…';

  try {
    await fetch('/api/capture-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        bizName:   analysisData.bizName,
        city:      analysisData.city,
        bizType:   analysisData.bizType,
        total:     analysisData.total,
        scores:    analysisData.scores,
        issues:    analysisData.issues,
        quickWins: analysisData.quickWins,
      })
    });
    const confirmEl = $('email-sent-confirm');
    if (confirmEl) confirmEl.classList.remove('hidden');
  } catch(e) {}

  await sleep(1400);
  goToStep('step-ig');
});

// ── INSTAGRAM STEP ───────────────────────────────────────────────────
$('ig-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const handle = $('ig-handle').value.trim().replace(/^@/, '');
  if (!handle) { showReport(); return; }
  const btn = $('ig-check-btn');
  btn.disabled = true; btn.textContent = '👃 Sniffing...';
  const igData = await fetchInstagramProfile(handle);
  analysisData.igData = igData;
  analysisData.igHandle = handle;
  showReport();
});

$('ig-skip-btn').addEventListener('click', () => {
  analysisData.igData = null;
  showReport();
});

async function fetchInstagramProfile(handle) {
  try {
    const res = await fetch(`/api/ig-profile?username=${encodeURIComponent(handle)}`, {
      signal: AbortSignal.timeout(12000)
    });
    if (!res.ok) throw new Error('proxy failed');
    return await res.json();
  } catch(e) {
    return { ok: false, handle, error: 'Could not reach the profile check. Try again in a moment.' };
  }
}

function renderInstagramResults(igData, handle) {
  const section = $('ig-section');
  const results = $('ig-results');
  if (!section || !results) return;
  section.classList.remove('hidden');

  if (!igData || !igData.ok) {
    const errMsg = igData?.error || 'Instagram blocked the request.';
    const isNotFound = errMsg.includes('not found') || errMsg.includes('404');
    results.innerHTML = `
      <div class="ig-error">
        <div class="ig-error-icon">👃</div>
        <p>${isNotFound
          ? `<strong>@${handle}</strong> wasn't found. Double-check the handle — no spaces, no @.`
          : `Lola couldn't sniff <strong>@${handle}</strong> right now. ${errMsg}`
        }</p>
        <a href="https://www.tyalexandermedia.com/contact" class="btn btn-outline btn-sm" target="_blank">Book a Social Strategy Session →</a>
      </div>`;
    return;
  }

  const {
    username, fullName, followers, following, postCount, bio, website,
    isProfessional, isBusiness, isVerified, highlightCount, hasReels,
    avgLikes, avgComments, engagementRate, postFreqPerWeek,
    mostRecentDaysAgo, recentPostCount30, recentPostCount90,
    contentMix, ffRatio,
    bioLength, bioHasEmoji, bioHasKeyword, bioHasCity, bioHasCTA
  } = igData;

  // ── Score (0–100) ───────────────────────────────────────────────────────
  let igScore = 0;
  // Followers
  if (followers >= 2000)  igScore += 20;
  else if (followers >= 500) igScore += 14;
  else if (followers >= 100) igScore += 8;
  else                   igScore += 3;
  // Engagement rate (industry benchmarks)
  if (engagementRate >= 6)       igScore += 20;
  else if (engagementRate >= 3)  igScore += 15;
  else if (engagementRate >= 1)  igScore += 8;
  else if (engagementRate > 0)   igScore += 3;
  // Posting frequency
  if (postFreqPerWeek >= 3)     igScore += 15;
  else if (postFreqPerWeek >= 1) igScore += 10;
  else if (postFreqPerWeek > 0)  igScore += 4;
  // Recency
  if (mostRecentDaysAgo !== null) {
    if (mostRecentDaysAgo <= 7)  igScore += 15;
    else if (mostRecentDaysAgo <= 30) igScore += 10;
    else if (mostRecentDaysAgo <= 90) igScore += 4;
  }
  // Bio
  if (bioLength >= 80)   igScore += 8;
  else if (bioLength >= 30) igScore += 5;
  if (bioHasCTA)         igScore += 4;
  if (bioHasKeyword)     igScore += 3;
  // Website link
  if (website)           igScore += 10;
  // Highlights
  if (highlightCount > 0) igScore += 5;

  igScore = Math.min(igScore, 100);
  const igGrade = igScore >= 75 ? 'Strong' : igScore >= 45 ? 'Needs Work' : 'Weak Signal';
  const igGradeClass = igScore >= 75 ? 'status-good' : igScore >= 45 ? 'status-ok' : 'status-bad';

  // ── Engagement rate label ──
  const erLabel = engagementRate >= 6 ? 'Excellent' :
                  engagementRate >= 3 ? 'Above Avg' :
                  engagementRate >= 1 ? 'Average' :
                  engagementRate > 0  ? 'Below Avg' : '—';
  const erColor = engagementRate >= 3 ? 'var(--green)' : engagementRate >= 1 ? 'var(--amber)' : 'var(--red)';

  // ── Posting frequency label ──
  const freqLabel = postFreqPerWeek >= 4 ? 'Very Active' :
                    postFreqPerWeek >= 2 ? 'Consistent' :
                    postFreqPerWeek >= 0.5 ? 'Irregular' : 'Inactive';
  const freqColor = postFreqPerWeek >= 2 ? 'var(--green)' : postFreqPerWeek >= 0.5 ? 'var(--amber)' : 'var(--red)';

  // ── Last post label ──
  const lastPostLabel = mostRecentDaysAgo === null ? 'Unknown' :
    mostRecentDaysAgo === 0 ? 'Today' :
    mostRecentDaysAgo === 1 ? 'Yesterday' :
    mostRecentDaysAgo <= 7 ? `${mostRecentDaysAgo}d ago` :
    mostRecentDaysAgo <= 30 ? `${Math.floor(mostRecentDaysAgo/7)}w ago` :
    `${Math.floor(mostRecentDaysAgo/30)}mo ago`;
  const lastPostColor = mostRecentDaysAgo !== null && mostRecentDaysAgo <= 14 ? 'var(--green)' :
    mostRecentDaysAgo !== null && mostRecentDaysAgo <= 60 ? 'var(--amber)' : 'var(--red)';

  // ── Stats grid ──
  const statsHtml = `
    <div class="ig-stats">
      <div class="ig-stat">
        <div class="ig-stat-num">${followers?.toLocaleString() ?? '—'}</div>
        <div class="ig-stat-label">Followers</div>
      </div>
      <div class="ig-stat">
        <div class="ig-stat-num">${postCount?.toLocaleString() ?? '—'}</div>
        <div class="ig-stat-label">Total Posts</div>
      </div>
      <div class="ig-stat ig-stat-colored" style="--ig-stat-color:${erColor}">
        <div class="ig-stat-num" style="color:${erColor}">${engagementRate > 0 ? engagementRate + '%' : '—'}</div>
        <div class="ig-stat-label">Engagement Rate <span class="ig-stat-badge" style="color:${erColor}">${erLabel}</span></div>
      </div>
      <div class="ig-stat ig-stat-colored" style="--ig-stat-color:${freqColor}">
        <div class="ig-stat-num" style="color:${freqColor}">${postFreqPerWeek > 0 ? postFreqPerWeek + '/wk' : '0'}</div>
        <div class="ig-stat-label">Post Frequency <span class="ig-stat-badge" style="color:${freqColor}">${freqLabel}</span></div>
      </div>
      <div class="ig-stat ig-stat-colored" style="--ig-stat-color:${lastPostColor}">
        <div class="ig-stat-num" style="color:${lastPostColor}">${lastPostLabel}</div>
        <div class="ig-stat-label">Last Post</div>
      </div>
      <div class="ig-stat">
        <div class="ig-stat-num">${avgLikes > 0 ? avgLikes.toLocaleString() : '—'}</div>
        <div class="ig-stat-label">Avg Likes/Post</div>
      </div>
    </div>`;

  // ── Actionable checklist ──
  const checks = [
    {
      label: 'Active posting schedule',
      pass: postFreqPerWeek >= 2,
      detail: postFreqPerWeek > 0
        ? `Posting ${postFreqPerWeek}x/week in the last 90 days.`
        : 'No recent posts detected in the last 90 days.',
      fix: 'The Instagram algorithm rewards consistency above all. 3–4 posts/week is the local business sweet spot. Batch-create content one day a month and schedule it out.',
    },
    {
      label: 'Last post within 14 days',
      pass: mostRecentDaysAgo !== null && mostRecentDaysAgo <= 14,
      detail: mostRecentDaysAgo !== null ? `Last post was ${lastPostLabel}.` : 'Could not determine last post date.',
      fix: 'A dormant account loses algorithmic reach fast. Post something today — even a quick behind-the-scenes clip takes 5 minutes and resets your distribution.',
    },
    {
      label: 'Engagement rate ≥1% (avg: 1–3%)',
      pass: engagementRate >= 1,
      detail: engagementRate > 0
        ? `Your engagement rate is ${engagementRate}% (industry avg for local business: 1–3%).`
        : 'Not enough post data to calculate engagement rate.',
      fix: 'Boost engagement by: (1) asking a question in every caption, (2) responding to every comment within 1 hour, (3) posting more Reels — they get 3–5× more reach than static images.',
    },
    {
      label: 'Bio includes keywords + CTA',
      pass: bioHasKeyword && bioHasCTA,
      detail: bioHasKeyword && bioHasCTA
        ? 'Bio has relevant keywords and a call to action.'
        : `Bio is ${bioLength} characters. ${!bioHasKeyword ? 'Missing service/industry keyword.' : ''} ${!bioHasCTA ? 'Missing CTA (link, book, DM, free).' : ''}`,
      fix: `Formula: [Who you serve] + [What you do] + [Location] + [CTA]. Example: “Helping Tampa businesses dominate Google Maps 📍 | Free SEO audit ↓”`,
    },
    {
      label: 'Website link in bio',
      pass: !!website,
      detail: website ? `Links to: ${website.replace('https://','').replace('http://','').split('/')[0]}` : 'No website link found in bio.',
      fix: 'Your bio link is the only clickable link on Instagram. It should go to a booking page, landing page, or your website. Use Linktree or Beacons if you have multiple destinations.',
    },
    {
      label: '500+ followers',
      pass: followers >= 500,
      detail: `${followers.toLocaleString()} followers. ${followers >= 500 ? 'Above the 500 local authority threshold.' : `Need ${(500 - followers).toLocaleString()} more.`}`,
      fix: 'Grow local followers by: (1) engaging with top local hashtags (#TampaBusiness, #YourCityEats, etc.), (2) tagging your location on every post, (3) collaborating with complementary local businesses on Reels.',
    },
    {
      label: 'Has Instagram Highlights',
      pass: highlightCount > 0,
      detail: highlightCount > 0 ? `${highlightCount} highlight reel${highlightCount > 1 ? 's' : ''} set up.` : 'No Story Highlights found.',
      fix: 'Highlights are the first thing profile visitors see. Create at least 3: “About Us”, “Services”, and “Reviews/Results” — these build instant trust before someone even scrolls.',
    },
    {
      label: 'Professional/Creator account',
      pass: isProfessional || isBusiness,
      detail: isProfessional ? 'Set up as a Professional account — you have access to analytics.' : isBusiness ? 'Set up as a Business account.' : 'Personal account — no analytics access.',
      fix: 'Switch to a Professional or Creator account (free). You get access to: post reach data, audience demographics, best posting times, and the ability to run ads.',
    },
  ];

  const checksHtml = checks.map(c => `
    <div class="ig-check ${c.pass ? 'pass' : 'fail'}">
      <span class="ig-check-icon">${c.pass ? '✓' : '✗'}</span>
      <div class="ig-check-text">
        <span class="ig-check-label">${c.label}</span>
        <span class="ig-check-detail">${c.detail}</span>
        ${!c.pass ? `<span class="ig-check-fix">🐾 Fix: ${c.fix}</span>` : ''}
      </div>
    </div>`).join('');

  // ── Content mix bar ──
  const totalPosts = contentMix?.total || 0;
  const contentMixHtml = totalPosts > 0 ? `
    <div class="ig-content-mix">
      <div class="ig-mix-label">Content Mix (last ${totalPosts} posts)</div>
      <div class="ig-mix-bars">
        ${contentMix.video > 0 ? `<div class="ig-mix-bar video" style="flex:${contentMix.video}"><span>🎥 Reels/Video (${contentMix.video})</span></div>` : ''}
        ${contentMix.carousel > 0 ? `<div class="ig-mix-bar carousel" style="flex:${contentMix.carousel}"><span>🖼️ Carousels (${contentMix.carousel})</span></div>` : ''}
        ${contentMix.image > 0 ? `<div class="ig-mix-bar image" style="flex:${contentMix.image}"><span>📸 Photos (${contentMix.image})</span></div>` : ''}
      </div>
      <p class="ig-mix-note">Reels get 3–5× more organic reach than static images. If you're not posting Reels, you're leaving free reach on the table.</p>
    </div>` : '';

  // ── Strategy tip (context-aware) ──
  let strategyTip = '';
  if (postFreqPerWeek === 0 && (mostRecentDaysAgo === null || mostRecentDaysAgo > 90)) {
    strategyTip = `<strong>🚨 Dead account alert:</strong> No posts in the last 90 days. Instagram's algorithm has likely deprioritized @${username} entirely. The fastest recovery: post a Reel today, then commit to 3 posts/week for 30 days straight. Don't buy followers — buy time and consistency.`;
  } else if (engagementRate > 0 && engagementRate < 1) {
    strategyTip = `<strong>📉 Low engagement despite ${followers.toLocaleString()} followers:</strong> This usually means followers aren't genuinely local or interested. Don't chase vanity metrics. Focus on 3 things: local hashtags (#${(analysisData.city || 'YourCity').split(',')[0].replace(/\s+/g,'')}Business), location tags on every post, and ending every caption with a direct question.`;
  } else if (postFreqPerWeek >= 3 && engagementRate >= 3) {
    strategyTip = `<strong>📈 Strong foundation:</strong> Consistent posting + solid engagement rate is exactly the profile that converts to real business. Next level: add a lead magnet in bio ("Free audit ↓"), use Reels to demonstrate your work, and reply to every comment within 60 minutes to maximize algorithmic distribution.`;
  } else {
    strategyTip = `<strong>👃 Lola's read:</strong> Instagram doesn't directly move your Google rank — but a credible, active local profile signals authority to both humans and algorithms. Consistency beats virality every time. Pick 3 posts/week and commit for 90 days.`;
  }

  // ── Score bar ──
  const scoreBarColor = igScore >= 75 ? 'var(--green)' : igScore >= 45 ? 'var(--amber)' : 'var(--red)';

  results.innerHTML = `
    <div class="ig-profile-header">
      <div class="ig-handle-tag">
        ${igData.profilePicUrl ? `<img src="${igData.profilePicUrl}" class="ig-avatar" alt="" onerror="this.style.display='none'" />` : ''}
        <div>
          <div class="ig-handle-name">@${username}</div>
          ${fullName ? `<div class="ig-full-name">${fullName}</div>` : ''}
        </div>
      </div>
      <div class="ig-score-wrap">
        <div class="ig-score-ring">
          <svg viewBox="0 0 60 60" width="60" height="60">
            <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="5"/>
            <circle cx="30" cy="30" r="24" fill="none" stroke="${scoreBarColor}" stroke-width="5"
              stroke-dasharray="150.8" stroke-dashoffset="${150.8 - (150.8 * igScore / 100)}"
              stroke-linecap="round" transform="rotate(-90 30 30)"
              style="transition:stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)"/>
          </svg>
          <div class="ig-score-center">
            <span class="ig-score-num" style="color:${scoreBarColor}">${igScore}</span>
          </div>
        </div>
        <span class="cat-status ${igGradeClass}">${igGrade}</span>
      </div>
    </div>
    ${bio ? `<div class="ig-bio-block"><span class="ig-bio-icon">📝</span><p class="ig-bio">${bio.replace(/\n/g,'<br>')}</p>${website ? `<a href="${website}" class="ig-website-link" target="_blank" rel="noopener">🔗 ${website.replace('https://','').replace('http://','').replace(/\/$/,'')}</a>` : ''}</div>` : ''}
    ${statsHtml}
    ${contentMixHtml}
    <div class="ig-section-head">Profile Audit — 8 Checks</div>
    <div class="ig-checklist">${checksHtml}</div>
    <div class="ig-tip"><p>${strategyTip}</p></div>
    <div class="ig-upsell">
      <span>📲 Want Ty's team to run your social + SEO together?</span>
      <a href="https://www.tyalexandermedia.com/contact" class="btn-inline-cta" target="_blank">Book a Strategy Call →</a>
    </div>`;
}

// ── SHOW FULL REPORT ─────────────────────────────────────────────
function showReport() {
  const { bizName, city, total, scores, issues, quickWins } = analysisData;
  const grade = getLetterGrade(total);
  const gradeColor = getScoreColor(total);

  // ── Score ring ──
  const circ = 314;
  setTimeout(() => {
    const ring = $('report-ring-fill');
    if (ring) ring.style.strokeDashoffset = circ - (circ * total / 100);
  }, 200);
  $('report-score-num').textContent = total;

  // ── Grade pill ──
  const gradePill = $('rpt-grade-pill');
  const gradeLabels = { A: '🏆 Best in Show', B: '✅ Solid Foundation', C: '🐾 Needs Work', D: '⚠️ Needs Training', F: '🚨 Off the Leash' };
  gradePill.textContent = gradeLabels[grade] || grade;
  gradePill.className = 'rpt-grade-pill grade-' + grade.toLowerCase();

  // ── Hero text ──
  const headlines = {
    A: `${bizName} is dialed in. Here's how to stay there.`,
    B: `Solid base, ${bizName}. These fixes push you ahead of the pack.`,
    C: `${bizName} is competing but leaving rankings on the table.`,
    D: `${bizName} has gaps costing real customers every day.`,
    F: `${bizName} is effectively invisible on Google right now.`
  };
  const rptLabel = $('rpt-label');
  if (rptLabel) { rptLabel.textContent = `Grade ${grade} · ${getGradeLabel(total)}`; rptLabel.style.color = gradeColor; }
  const rptH = $('report-headline');
  if (rptH) rptH.textContent = headlines[grade] || 'Your Local SEO Report';
  const rptMeta = $('rpt-meta');
  if (rptMeta) rptMeta.innerHTML = `<span>${bizName}</span><span class="rpt-dot">·</span><span>${city}</span><span class="rpt-dot">·</span><span>${new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>`;

  // ── Bento category grid ──
  const cats = [
    { emoji: '🌐', name: 'Site Health',    score: scores.siteHealth,    note: 'HTTPS · titles · schema' },
    { emoji: '📍', name: 'Local Presence', score: scores.localPresence, note: 'Phone · address · GBP' },
    { emoji: '📱', name: 'Mobile',         score: scores.mobile,        note: 'Speed · viewport' },
    { emoji: '⚡', name: 'Page Speed',     score: scores.speed,         note: 'Core Web Vitals' },
    { emoji: '✍️', name: 'Content',        score: scores.content,       note: 'H1 · words · links' },
  ];
  const catsEl = $('categories-grid');
  if (catsEl) {
    catsEl.innerHTML = cats.map(cat => {
      const sc = cat.score >= 70 ? 'good' : cat.score >= 45 ? 'ok' : 'bad';
      const ring = Math.round((cat.score / 100) * 88);
      return `<div class="rpt-cat rpt-cat--${sc}">
        <div class="rpt-cat-top">
          <span class="rpt-cat-emoji">${cat.emoji}</span>
          <div class="rpt-cat-mini-ring">
            <svg viewBox="0 0 32 32" width="32" height="32">
              <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="3"/>
              <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" stroke-width="3"
                stroke-dasharray="88" stroke-dashoffset="${88 - ring}"
                stroke-linecap="round" transform="rotate(-90 16 16)"/>
            </svg>
            <span class="rpt-cat-mini-num">${cat.score}</span>
          </div>
        </div>
        <div class="rpt-cat-name">${cat.name}</div>
        <div class="rpt-cat-note">${cat.note}</div>
      </div>`;
    }).join('');
  }

  // ── Issues ──
  const issuesEl = $('issues-list');
  if (issuesEl) {
    if (!issues || issues.length === 0) {
      $('issues-section').style.display = 'none';
    } else {
      issuesEl.innerHTML = issues.map(issue => {
        const actionHtml = issue.action
          ? `<a href="${issue.action.url}" class="rpt-issue-action" target="_blank" rel="noopener">${issue.action.label}</a>`
          : '';
        const upsellHtml = issue.upsell
          ? `<div class="rpt-issue-upsell"><span>${issue.upsell.label}</span><a href="${issue.upsell.url}" class="rpt-upsell-pill" target="_blank">${issue.upsell.cta}</a></div>`
          : '';
        return `<div class="rpt-issue rpt-issue--${issue.impactClass}">
          <div class="rpt-issue-top">
            <span class="rpt-issue-icon">${issue.icon}</span>
            <div class="rpt-issue-right">
              <div class="rpt-issue-header">
                <span class="rpt-issue-title">${issue.title}</span>
                <span class="rpt-badge rpt-badge--${issue.impactClass}">${issue.impactClass === 'critical' ? 'Critical' : issue.impactClass === 'high' ? 'High' : 'Medium'}</span>
              </div>
              <p class="rpt-issue-fix">${issue.fix}</p>
              ${actionHtml}
            </div>
          </div>
          ${upsellHtml}
        </div>`;
      }).join('');
    }
  }

  // ── Quick Wins ──
  const winsEl = $('quickwins-list');
  if (winsEl) {
    winsEl.innerHTML = quickWins.map((win, i) => {
      const linkHtml = win.link
        ? `<a href="${win.link.url}" class="rpt-win-link" target="_blank" rel="noopener">${win.link.label}</a>`
        : '';
      const upsellHtml = win.upsell
        ? `<div class="rpt-issue-upsell"><span>${win.upsell.label}</span><a href="${win.upsell.url}" class="rpt-upsell-pill" target="_blank">${win.upsell.cta}</a></div>`
        : '';
      return `<div class="rpt-win">
        <div class="rpt-win-top">
          <span class="rpt-win-num">${i + 1}</span>
          <div class="rpt-win-right">
            <div class="rpt-win-header">
              <span class="rpt-win-title">${win.title}</span>
              <span class="rpt-win-badge">${win.effort} · ${win.time}</span>
            </div>
            <p class="rpt-win-why">${win.why}</p>
            <p class="rpt-win-action">→ ${win.action}</p>
            ${linkHtml}
          </div>
        </div>
        ${upsellHtml}
      </div>`;
    }).join('');
  }

  // ── Tiered upsell ──
  const upsellEl = $('rpt-upsell');
  if (upsellEl) {
    upsellEl.innerHTML = `
      <div class="rpt-upsell-block">
        <img src="lola-logo.png" class="rpt-upsell-lola" alt="" aria-hidden="true" />
        <div class="rpt-upsell-eyebrow">The report is free. The problem is expensive.</div>
        <h3 class="rpt-upsell-h3">Every day you're not on page 1,<br>your competitor gets the sale.</h3>
        <p class="rpt-upsell-body">Lola just showed you exactly where you're losing revenue. Two ways to fix it — pick yours:</p>
        <div class="rpt-offer-grid">
          <div class="rpt-offer">
            <div class="rpt-offer-tag starter">Free Starting Point</div>
            <div class="rpt-offer-name">30-Min Strategy Call</div>
            <p class="rpt-offer-desc">Walk through Lola's report live with Ty. Get a prioritized action plan, exact fix steps, and tool recommendations — no pitch, no obligation. Yours to keep.</p>
            <a href="https://www.tyalexandermedia.com/contact" class="rpt-offer-btn rpt-offer-btn--soft" target="_blank">Book Free Call →</a>
          </div>
          <div class="rpt-offer rpt-offer--featured">
            <div class="rpt-offer-tag featured-tag">Done For You</div>
            <div class="rpt-offer-name">Local SEO Management</div>
            <p class="rpt-offer-desc">Ty's team handles everything: GBP, on-page, citations, speed, content, and monthly reports. You run your business. We get you found.</p>
            <a href="https://www.tyalexandermedia.com/contact" class="rpt-offer-btn rpt-offer-btn--gold" target="_blank">Get a Custom Proposal →</a>
          </div>
        </div>
        <div class="rpt-stats-row">
          <div class="rpt-stat"><span class="rpt-stat-num">97%</span><span class="rpt-stat-label">of buyers Google before buying local</span></div>
          <div class="rpt-stat"><span class="rpt-stat-num">#1</span><span class="rpt-stat-label">result gets 10× more clicks than #10</span></div>
          <div class="rpt-stat"><span class="rpt-stat-num">28%</span><span class="rpt-stat-label">of local searches lead to a purchase within 24 hrs</span></div>
        </div>
        <p class="rpt-upsell-note">30 minutes. Zero pressure. Lola's report reviewed live with you. 🐾</p>
      </div>`;
  }

  // ── Instagram ──
  if (analysisData.igData) {
    renderInstagramResults(analysisData.igData, analysisData.igHandle);
  }

  goToStep('step-report');
}

// ── HELPERS ───────────────────────────────────────────────────
function getLetterGrade(score) {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function getGradeLabel(score) {
  if (score >= 85) return '🐾 Best in Show';
  if (score >= 70) return '✅ Good Dog';
  if (score >= 55) return '🐕 Still Learning';
  if (score >= 40) return '⚠️ Needs Training';
  return '🚨 Off the Leash';
}

function getScoreColor(score) {
  if (score >= 70) return 'var(--success)';
  if (score >= 45) return 'var(--warning)';
  return 'var(--error)';
}

// ── RESTART ───────────────────────────────────────────────────
$('restart-btn').addEventListener('click', () => {
  analysisData = {};
  $('seo-form').reset();
  goToStep('step-input');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
