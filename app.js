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

// ── ISSUE BUILDER — with step-by-step fix plans ───────────────
function buildIssues(scores, siteData, speedData, url, bizName, city) {
  const issues = [];
  const cityName = city.split(',')[0];

  // ── HTTPS ──
  if (!siteData.httpsOk) {
    issues.push({
      icon: '🔓', severity: 'error',
      title: 'No HTTPS — Google Flags Your Site as Insecure',
      impact: 'Critical', impactClass: 'critical',
      time: '15 min',
      body: `Your site runs on HTTP. Google explicitly demotes non-HTTPS sites and shows visitors a "Not Secure" warning — killing trust before they read a single word.`,
      steps: [
        'Log into your hosting account (GoDaddy, Wix, Squarespace, etc.)',
        'Find "SSL Certificate" in your settings — most hosts offer it free via Let\'s Encrypt',
        'Enable SSL and force HTTPS redirects so all traffic routes to https://',
        'Test at <a href="https://www.ssllabs.com/ssltest/" target="_blank">SSLLabs.com</a> to confirm it\'s active'
      ],
      ty: null
    });
  }

  // ── TITLE TAG ──
  if (!siteData.title || siteData.title.length < 10) {
    issues.push({
      icon: '📄', severity: 'error',
      title: 'Missing Page Title — Your #1 Google Ranking Signal',
      impact: 'Critical', impactClass: 'critical',
      time: '10 min',
      body: `Your homepage has no title tag (or it's too short). This is the single most important on-page SEO element. Google reads it first to decide what you rank for.`,
      steps: [
        `Write a title in this format: "[Your Main Service] in ${cityName} | ${bizName}"`,
        'Keep it 50–60 characters — use <a href="https://www.seoptimer.com/title-tag-preview" target="_blank">this preview tool</a> to check length',
        'Add it inside your page\'s <code>&lt;head&gt;</code> as: <code>&lt;title&gt;Your Title Here&lt;/title&gt;</code>',
        'Update it in your CMS (Wix, WordPress, Squarespace) under SEO Settings'
      ],
      ty: { label: 'We write and implement all title tags as part of our On-Page SEO service.', cta: 'Get On-Page SEO Done For You →' }
    });
  } else if (siteData.title.length > 65) {
    issues.push({
      icon: '📄', severity: 'warn',
      title: `Page Title Too Long (${siteData.title.length} chars) — Gets Cut Off in Google`,
      impact: 'High', impactClass: 'high',
      time: '5 min',
      body: `Your current title: "<em>${siteData.title}</em>" — Google truncates titles over 60 characters, cutting off the end of your message in search results.`,
      steps: [
        'Trim your title to under 60 characters while keeping your primary keyword and city',
        `Ideal format: "[Service] in ${cityName} | ${bizName}"`,
        'Check how it looks in Google at <a href="https://www.seoptimer.com/title-tag-preview" target="_blank">seoptimer.com/title-tag-preview</a>'
      ],
      ty: null
    });
  }

  // ── META DESCRIPTION ──
  if (!siteData.metaDesc || siteData.metaDesc.length < 50) {
    issues.push({
      icon: '📝', severity: 'error',
      title: 'Missing Meta Description — Google Writes It For You (Badly)',
      impact: 'High', impactClass: 'high',
      time: '10 min',
      body: `No meta description found. This is the 2-line snippet people read under your link in Google results. Without it, Google auto-generates one — usually a random sentence that doesn't sell your business.`,
      steps: [
        `Write 1–2 sentences (140–155 chars) that answer: "What do you do, where, and why should I call you?"`,
        `Example: "Top-rated [service] in ${cityName}. [Bizname] has served [X] customers since [year]. Call for a free quote today."`,
        'Add it to your page\'s <code>&lt;head&gt;</code>: <code>&lt;meta name="description" content="Your text here"&gt;</code>',
        'In Wix/WordPress/Squarespace, find "SEO Description" under page settings'
      ],
      ty: { label: 'Compelling meta descriptions for every page are included in our SEO packages.', cta: 'See Our SEO Packages →' }
    });
  }

  // ── PHONE NUMBER ──
  if (!siteData.hasPhone) {
    issues.push({
      icon: '📞', severity: 'error',
      title: 'No Phone Number Detected — NAP Inconsistency Hurts Local Rank',
      impact: 'Critical', impactClass: 'critical',
      time: '10 min',
      body: `Google verifies your business using NAP (Name, Address, Phone). If your phone number isn't readable as text on your page — not baked into an image — Google can't confirm it and won't trust your local signals.`,
      steps: [
        'Add your phone number as <strong>plain clickable text</strong> in your header: <code>&lt;a href="tel:+1XXXXXXXXXX"&gt;(XXX) XXX-XXXX&lt;/a&gt;</code>',
        'Also add it to your footer so it appears on every page',
        'Make sure it exactly matches the phone on your Google Business Profile',
        'Verify it matches your listings on Yelp, Facebook, and local directories'
      ],
      ty: { label: 'NAP consistency across your site + 50+ citations is part of our Local SEO package.', cta: 'Fix My Local Presence →' }
    });
  }

  // ── ADDRESS ──
  if (!siteData.hasAddress) {
    issues.push({
      icon: '📍', severity: 'error',
      title: 'No Address Found — Google Can\'t Confirm Your Location',
      impact: 'Critical', impactClass: 'critical',
      time: '10 min',
      body: `Your physical address isn't appearing as readable text on your site. For local SEO, your address must be visible HTML text (not an image), so Google can tie your website to your geographic area.`,
      steps: [
        'Add your full address as text in your footer: "123 Main St, ' + cityName + ', FL 00000"',
        'Wrap it in a <code>&lt;address&gt;</code> HTML tag for extra semantic clarity',
        'Embed a Google Maps widget on your Contact page — this also adds a strong local signal',
        'Make sure the address exactly matches your Google Business Profile listing'
      ],
      ty: { label: 'We audit and fix your full local footprint — site, GBP, citations and maps.', cta: 'Get Your Local SEO Fixed →' }
    });
  }

  // ── SCHEMA ──
  if (!siteData.schemaJson) {
    issues.push({
      icon: '🗂️', severity: 'warn',
      title: 'No Schema Markup — Google Doesn\'t Know What Type of Business You Are',
      impact: 'High', impactClass: 'high',
      time: '20 min',
      body: `Schema markup (structured data) is code that tells Google exactly what your business is, where it's located, what hours you keep, and what services you offer. Without it, Google guesses — and guesses wrong.`,
      steps: [
        `Go to <a href="https://technicalseo.com/tools/schema-markup-generator/" target="_blank">TechnicalSEO.com/tools/schema-markup-generator/</a>`,
        'Select "LocalBusiness" and fill in your name, address, phone, hours, and URL',
        'Copy the generated JSON-LD code and paste it into your page\'s <code>&lt;head&gt;</code>',
        'Test it at <a href="https://validator.schema.org" target="_blank">validator.schema.org</a> to confirm it reads correctly'
      ],
      ty: { label: 'Schema markup is installed and validated on every site we optimize.', cta: 'Have Us Handle It →' }
    });
  }

  // ── PAGE SPEED ──
  if (speedData.ok && speedData.performance < 50) {
    issues.push({
      icon: '⚡', severity: 'error',
      title: `Critical Page Speed (${speedData.performance}/100) — You\'re Losing 53% of Visitors`,
      impact: 'Critical', impactClass: 'critical',
      time: '1–2 hrs',
      body: `Google data: 53% of mobile visitors abandon a page that takes over 3 seconds to load. Your score is ${speedData.performance}/100.${speedData.lcp ? ' Largest Contentful Paint: ' + speedData.lcp + '.' : ''} You are actively losing customers before they read a single word.`,
      steps: [
        'Run a full audit at <a href="https://pagespeed.web.dev" target="_blank">pagespeed.web.dev</a> — it shows your exact bottlenecks',
        'Compress all images at <a href="https://squoosh.app" target="_blank">squoosh.app</a> (typically cuts 60–80% file size)',
        'Enable lazy loading on images: add <code>loading="lazy"</code> to every <code>&lt;img&gt;</code> tag',
        'Remove or defer unused JavaScript — check the "Unused JavaScript" section in PageSpeed'
      ],
      ty: { label: 'Our technical SEO service includes full speed optimization — images, code, caching, and CDN setup.', cta: 'Fix My Site Speed →' }
    });
  } else if (speedData.ok && speedData.performance < 75) {
    issues.push({
      icon: '⚡', severity: 'warn',
      title: `Page Speed Below Google\'s Threshold (${speedData.performance}/100)`,
      impact: 'Medium', impactClass: 'medium',
      time: '30–60 min',
      body: `Mobile performance is ${speedData.performance}/100. Google's "good" threshold is 90+. You're not in the danger zone, but competitors with faster sites will outrank you when all else is equal.`,
      steps: [
        'Audit at <a href="https://pagespeed.web.dev" target="_blank">pagespeed.web.dev</a> and focus on "Opportunities" section',
        'Compress images with <a href="https://tinypng.com" target="_blank">TinyPNG.com</a>',
        'Convert images to WebP format — supported in all modern browsers and 30% smaller than JPG',
        'Enable browser caching if your host supports it (most do via cPanel or plugin)'
      ],
      ty: null
    });
  }

  // ── H1 TAG ──
  if (siteData.h1Count === 0) {
    issues.push({
      icon: '🔤', severity: 'warn',
      title: 'No H1 Heading — Google Doesn\'t Know What Your Page Is About',
      impact: 'High', impactClass: 'high',
      time: '5 min',
      body: `Your homepage has no H1 tag. The H1 is your page's headline — it tells Google (and visitors) exactly what service you offer and where. It's one of the top 3 on-page SEO factors.`,
      steps: [
        `Create one clear H1 that includes your service and city: e.g. <strong>"Pressure Washing Services in ${cityName}"</strong>`,
        'Make sure it\'s the largest, most prominent text on the page — visually and in the HTML',
        'Use only ONE H1 per page — multiple H1s dilute the signal',
        'Subheadings should use H2 and H3 tags, not additional H1s'
      ],
      ty: null
    });
  } else if (siteData.h1Count > 2) {
    issues.push({
      icon: '🔤', severity: 'warn',
      title: `${siteData.h1Count} H1 Tags Detected — Diluting Your Ranking Signal`,
      impact: 'Medium', impactClass: 'medium',
      time: '10 min',
      body: `Found ${siteData.h1Count} H1 tags on your page. Every page should have exactly one — it's your primary topic declaration to Google. Multiple H1s split the signal and confuse crawlers.`,
      steps: [
        'Open your page source (Ctrl+U) and search for "<h1" to find all instances',
        'Keep the one that best describes your core service + city',
        'Change all others to H2 or H3 tags',
        'Re-check with <a href="https://www.seobility.net/en/seocheck/" target="_blank">seobility.net/en/seocheck/</a>'
      ],
      ty: null
    });
  }

  // ── THIN CONTENT ──
  if (siteData.wordCount < 200 && siteData.ok) {
    issues.push({
      icon: '✍️', severity: 'warn',
      title: `Thin Content (~${siteData.wordCount} words) — Not Enough for Google to Trust You`,
      impact: 'Medium', impactClass: 'medium',
      time: '1–2 hrs',
      body: `Your homepage has only ~${siteData.wordCount} words. Google's local ranking algorithm favors pages with substantive content that answers what customers actually search for. Thin pages signal low authority.`,
      steps: [
        'Target 400–600 words on your homepage — enough to answer "what you do, who you serve, and why you\'re the best in ' + cityName + '"',
        'Include a Services section listing what you offer with 2–3 sentences per service',
        'Add a "Why Choose Us" section with 3–5 specific differentiators (not generic claims)',
        'Include a local FAQ section — "Do you serve [nearby city]?" answers real search queries and adds content naturally'
      ],
      ty: { label: 'We write SEO-optimized page copy built around your city\'s actual search terms.', cta: 'Get Content Written For You →' }
    });
  }

  // ── ROBOTS.TXT ──
  if (siteData.robotsOk === false) {
    issues.push({
      icon: '🤖', severity: 'error',
      title: 'robots.txt May Be Blocking Google From Crawling Your Site',
      impact: 'Critical', impactClass: 'critical',
      time: '10 min',
      body: `Lola sniffed your robots.txt and found a broad \'Disallow: /\' rule — meaning you may have accidentally told Google not to crawl your entire site. This is one of the most common and devastating SEO mistakes local businesses make.`,
      steps: [
        `Visit <a href="${url}/robots.txt" target="_blank">${url}/robots.txt</a> in your browser to view it`,
        'If you see <code>Disallow: /</code> under <code>User-agent: *</code>, that blocks all crawlers — fix it immediately',
        'The correct version for most sites: <code>User-agent: *</code> then <code>Disallow:</code> (blank = allow all)',
        'Update in your CMS under SEO/robots settings, or edit the file directly via FTP/cPanel',
        'Verify with <a href="https://www.google.com/webmasters/tools/robots-testing-tool" target="_blank">Google\'s Robots Testing Tool</a>'
      ],
      ty: { label: 'We audit and fix your entire technical crawl setup as part of our SEO onboarding.', cta: 'Fix My Crawlability →' }
    });
  }

  // ── SITEMAP ──
  if (siteData.sitemapFound === false) {
    issues.push({
      icon: '🗺️', severity: 'warn',
      title: 'No XML Sitemap Found — Google Has No Roadmap to Your Pages',
      impact: 'High', impactClass: 'high',
      time: '15 min',
      body: `Your site doesn\'t appear to have a sitemap.xml. A sitemap tells Google every page you want indexed and when they were last updated. Without one, new pages can take weeks to get discovered — or never get indexed at all.`,
      steps: [
        'Most CMS platforms generate sitemaps automatically: Wix, WordPress (Yoast SEO plugin), Squarespace, Shopify',
        'For Wix: go to Marketing & SEO → SEO Tools → Site Booster — sitemap is auto-generated',
        'For WordPress: install <a href="https://yoast.com" target="_blank">Yoast SEO</a> (free) — it generates and maintains your sitemap',
        'Submit your sitemap in <a href="https://search.google.com/search-console" target="_blank">Google Search Console</a> under Sitemaps'
      ],
      ty: { label: 'Sitemap creation, submission, and Search Console setup is included in our SEO package.', cta: 'Get My Sitemap Set Up →' }
    });
  }

  // ── NOINDEX ──
  if (siteData.noindex) {
    issues.push({
      icon: '🚫', severity: 'error',
      title: 'noindex Tag Found — Google Is Told NOT to Show This Page',
      impact: 'Critical', impactClass: 'critical',
      time: '5 min',
      body: `Your page contains a <code>meta robots noindex</code> tag, which tells Google to remove this page from search results entirely. This is often set during development and accidentally left on live sites.`,
      steps: [
        'View your page source (Ctrl+U) and search for <code>noindex</code>',
        'Remove or change it to <code>&lt;meta name="robots" content="index, follow"&gt;</code>',
        'In your CMS, check SEO settings for an "Indexing" or "Search Visibility" toggle and ensure it\'s ON',
        'After fixing, ask Google to re-crawl via <a href="https://search.google.com/search-console" target="_blank">Search Console</a> URL Inspection tool'
      ],
      ty: { label: 'We run a full technical audit to catch hidden indexing issues that kill your rankings.', cta: 'Get a Technical SEO Audit →' }
    });
  }

  // ── OG TAGS INCOMPLETE ──
  if (siteData.ogTags && !siteData.ogComplete) {
    const missing = [!siteData.ogTitle && 'og:title', !siteData.ogDesc && 'og:description', !siteData.ogImage && 'og:image'].filter(Boolean).join(', ');
    issues.push({
      icon: '🔗', severity: 'warn',
      title: `Incomplete Open Graph Tags (Missing: ${missing})`,
      impact: 'Medium', impactClass: 'medium',
      time: '10 min',
      body: `When someone shares your site on Facebook, LinkedIn, or iMessage, the preview is controlled by Open Graph tags. You have some but not all three required tags. Incomplete OG = ugly, unclickable shares that damage your brand.`,
      steps: [
        'Add all three to your page head: <code>og:title</code>, <code>og:description</code>, and <code>og:image</code>',
        `Recommended: <code>&lt;meta property="og:title" content="${bizName} | ${cityName}"&gt;</code>`,
        'Your og:image should be at least 1200×630px — use your logo on a branded background',
        'Test your preview at <a href="https://www.opengraph.xyz" target="_blank">opengraph.xyz</a>'
      ],
      ty: null
    });
  } else if (!siteData.ogTags) {
    issues.push({
      icon: '🔗', severity: 'warn',
      title: 'No Open Graph Tags — Your Site Looks Broken When Shared',
      impact: 'Medium', impactClass: 'medium',
      time: '15 min',
      body: `Zero Open Graph tags detected. Every time someone shares your site link on social media or in text, it shows as an unstyled link with no image, title, or description. That\'s free traffic you\'re actively wasting.`,
      steps: [
        'Add these three tags to your <code>&lt;head&gt;</code>:',
        `<code>&lt;meta property="og:title" content="${bizName} — [Your Main Service] in ${cityName}"&gt;</code>`,
        '<code>&lt;meta property="og:description" content="[Your 1-sentence value prop]"&gt;</code>',
        '<code>&lt;meta property="og:image" content="[Full URL to your best branded image]"&gt;</code>',
        'Validate at <a href="https://www.opengraph.xyz" target="_blank">opengraph.xyz</a>'
      ],
      ty: null
    });
  }

  // ── ANALYTICS ──
  if (!siteData.hasAnalytics && !siteData.hasGTM) {
    issues.push({
      icon: '📊', severity: 'warn',
      title: 'No Google Analytics or Tag Manager Detected — Flying Blind',
      impact: 'High', impactClass: 'high',
      time: '20 min',
      body: `No tracking code found on your site. Without analytics, you have no idea who\'s visiting, where they came from, which pages convert, or whether your SEO improvements are working. It\'s impossible to optimize what you can\'t measure.`,
      steps: [
        'Go to <a href="https://analytics.google.com" target="_blank">analytics.google.com</a> and create a free GA4 property',
        'Follow the setup wizard and copy your Measurement ID (starts with G-)',
        'In your CMS, paste the tracking code into your site\'s <code>&lt;head&gt;</code> or use a tracking plugin',
        'Better yet: install <a href="https://tagmanager.google.com" target="_blank">Google Tag Manager</a> — it lets you manage all tracking in one place',
        'Verify it\'s working at <a href="https://analytics.google.com" target="_blank">analytics.google.com</a> under Realtime'
      ],
      ty: { label: 'Analytics setup, goal tracking, and conversion measurement is included in our onboarding.', cta: 'Get Analytics Set Up →' }
    });
  }

  // ── ALT TEXT ──
  if (siteData.altMissingPct > 40 && siteData.imgCount > 3) {
    issues.push({
      icon: '🖼️', severity: 'warn',
      title: `${siteData.altMissingPct}% of Images Missing Alt Text — Invisible to Google Images`,
      impact: 'Medium', impactClass: 'medium',
      time: '20–40 min',
      body: `${siteData.altMissing} of your ${siteData.imgCount} images have no alt text. Alt text is how Google reads your images — it\'s a missed keyword opportunity AND an accessibility failure. Google Images is the 2nd largest search engine in the world.`,
      steps: [
        'For each image, write a descriptive alt text: what is in the image + relevant keyword if natural',
        `Example: instead of alt="image1.jpg", use alt="${bizName} team pressure washing driveway in ${cityName}"`,
        'In Wix/WordPress/Squarespace, click any image and find the alt text field in image settings',
        'Prioritize hero images and service images first — those carry the most weight',
        'Check your full list at <a href="https://www.seobility.net/en/seocheck/" target="_blank">seobility.net</a>'
      ],
      ty: null
    });
  }

  // Sort: critical first, then high, then medium
  const order = { critical: 0, high: 1, medium: 2 };
  issues.sort((a, b) => (order[a.impactClass] ?? 3) - (order[b.impactClass] ?? 3));

  return issues.slice(0, 8);
}

// ── QUICK WINS BUILDER — with exact actions + tools ───────────
function buildQuickWins(scores, siteData, city, bizType) {
  const wins = [];
  const cityName = city.split(',')[0];

  // GBP — always #1 for local
  wins.push({
    title: 'Claim & Fully Optimize Your Google Business Profile',
    body: `This is the single highest-ROI move in local SEO. A fully optimized GBP is what gets you into the "Local Pack" — the 3 businesses at the very top of local searches. Most businesses claim it and leave it half-empty.`,
    steps: [
      'Go to <a href="https://business.google.com" target="_blank">business.google.com</a> and claim your listing',
      'Fill in <strong>every field</strong>: hours, services, description (include "' + cityName + '" naturally), photos, and Q&A',
      'Upload at least 10 photos — businesses with photos get 42% more direction requests',
      'Set up your service areas to include ' + cityName + ' and surrounding areas',
      'Ask your last 5 customers for a Google review this week'
    ],
    effort: 'Easy Win', effortClass: '', time: '1 hr',
    ty: { label: 'Full GBP optimization is included in our Local SEO package.', cta: 'Get My GBP Optimized →' }
  });

  if (!siteData.metaDesc || siteData.metaDesc.length < 50) {
    wins.push({
      title: 'Write a Click-Worthy Meta Description',
      body: `This is the 2-line preview people see in Google before clicking. A strong meta description can double your click-through rate without moving a single ranking.`,
      steps: [
        `Use this formula: "[Specific service] in ${cityName} — [your key differentiator]. [Social proof or urgency]. Call or book online today."`,
        `Example: "Expert pressure washing in ${cityName} — fully licensed, $0 deposit, same-week service. Trusted by 200+ homeowners. Free quote in 60 seconds."`,
        'Keep it under 155 characters — check at <a href="https://www.seoptimer.com/meta-description-preview" target="_blank">seoptimer.com</a>',
        'Add it to every key page on your site, not just the homepage'
      ],
      effort: 'Easy Win', effortClass: '', time: '15 min',
      ty: null
    });
  }

  if (!siteData.schemaJson) {
    wins.push({
      title: 'Add LocalBusiness Schema in 20 Minutes (Free Tool)',
      body: `This is invisible code that tells Google exactly what your business is. It can trigger rich results like star ratings, business hours, and phone number directly in search. Most local businesses skip this entirely — which means doing it puts you ahead of the pack.`,
      steps: [
        'Go to <a href="https://technicalseo.com/tools/schema-markup-generator/" target="_blank">TechnicalSEO.com Schema Generator</a>',
        'Select "LocalBusiness" → fill in name, address, phone, website, hours',
        'Copy the JSON-LD code it generates',
        'Paste it into your site\'s <code>&lt;head&gt;</code> section (or use a plugin like "Schema Pro" on WordPress)',
        'Validate it at <a href="https://validator.schema.org" target="_blank">validator.schema.org</a>'
      ],
      effort: 'Easy Win', effortClass: '', time: '20 min',
      ty: null
    });
  }

  if (scores.speed < 60) {
    wins.push({
      title: 'Compress Your Images — The #1 Speed Fix',
      body: `Images cause 80% of slow load times. Running them through a compressor typically cuts file size 60–80% with zero visible quality difference. This is the fastest way to move your speed score.`,
      steps: [
        'Go to <a href="https://squoosh.app" target="_blank">squoosh.app</a> — free, browser-based, no upload limit',
        'Upload each image, switch format to WebP, set quality to 80%',
        'Download and replace the originals on your site',
        'For ongoing use, add an image optimization plugin (ShortPixel on WordPress is free up to 100 images/month)'
      ],
      effort: 'Easy Win', effortClass: '', time: '30 min',
      ty: { label: 'We handle full image and technical speed optimization as part of our site audit.', cta: 'Get My Speed Fixed →' }
    });
  }

  if (!siteData.hasPhone) {
    wins.push({
      title: 'Add a Clickable Phone Number to Every Page',
      body: `Google's local algorithm verifies your business using NAP (Name, Address, Phone). If your phone isn't readable text in your header and footer, Google can't confirm it — and won't fully trust your local signals.`,
      steps: [
        'Add your phone to your header: <code>&lt;a href="tel:+1XXXXXXXXXX"&gt;(XXX) XXX-XXXX&lt;/a&gt;</code>',
        'Repeat in the footer on every page',
        'Make sure it exactly matches what\'s on your Google Business Profile',
        'On mobile, the <code>tel:</code> link means visitors can tap to call instantly'
      ],
      effort: 'Easy Win', effortClass: '', time: '10 min',
      ty: null
    });
  }

  // Always add a content/blog tip
  wins.push({
    title: `Write One City-Specific Service Page`,
    body: `A single page targeting "[your service] in ${cityName}" can rank for dozens of local searches. This is how smaller businesses outrank large competitors — specific, local, authoritative content.`,
    steps: [
      `Create a new page titled: "[Your Service] in ${cityName}, [State]"`,
      'Write 400–600 words covering: what you offer, your service area, why locals choose you, and a clear CTA',
      `Include "${cityName}" naturally in the H1, first paragraph, meta description, and at least 2 more times in the body`,
      'Add a Google Maps embed showing your service area',
      'Link to it from your homepage navigation'
    ],
    effort: 'Medium Win', effortClass: 'medium', time: '1–2 hrs',
    ty: { label: 'We write and optimize location pages built around the exact keywords your buyers search.', cta: 'Get Location Pages Built →' }
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

// ── SHOW FULL REPORT ──────────────────────────────────────────
function showReport() {
  const { bizName, city, total, scores, issues, quickWins } = analysisData;

  // Score ring
  const circumference = 364;
  const dashOffset = circumference - (circumference * (total / 100));
  setTimeout(() => {
    $('report-ring-fill').style.strokeDashoffset = dashOffset;
  }, 200);

  $('report-score-num').textContent = total;
  $('report-status-badge').textContent = getGradeLabel(total);
  $('report-status-badge').style.color = getScoreColor(total);

  const badge = $('report-badge');
  const grade = getLetterGrade(total);
  badge.textContent = `Grade ${grade} — ${getGradeLabel(total)}`;
  badge.className = `report-badge grade-${grade.toLowerCase()}`;

  // Context-aware headlines
  const headlines = {
    'A': '🏆 Best in show — Lola is impressed. Here\'s how to stay at the top.',
    'B': '🐕 Good foundation — a few targeted fixes puts you ahead of most competitors.',
    'C': '🐾 Middle of the pack. Your competitors are actively taking searches you should own.',
    'D': '⚠️ Google can barely find you. Every day this stays broken is revenue walking out the door.',
    'F': '🚨 Effectively invisible. Urgent fixes needed before competitors cement their lead.'
  };
  // Context-aware sublines
  const sublines = {
    'A': `Strong signals across the board for ${bizName}. Focus on content depth and review velocity to stay there.`,
    'B': `${bizName} has solid basics in place. The issues below are the gap between good and dominant.`,
    'C': `${bizName} is competing but leaving rankings on the table. Fix the issues below in order of priority.`,
    'D': `${bizName} has foundational gaps that are suppressing every other effort. Start with Critical issues first.`,
    'F': `${bizName} is missing core signals Google needs to rank local businesses. The fix list below is your playbook.`
  };

  $('report-headline').textContent = headlines[grade] || 'Your Local SEO Report';
  $('report-subline').textContent  = sublines[grade] || `${bizName} · ${city}`;
  $('report-biz-name-display').textContent = bizName;
  $('report-city-display').textContent     = city;
  $('report-date-display').textContent     = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // ── 5 Categories ──
  const cats = [
    {
      emoji: '🌐', name: 'Site Health', score: scores.siteHealth,
      desc: 'HTTPS, title tags, meta descriptions, schema markup',
      what: 'Google reads these signals before anything else. Weak site health means weak rankings regardless of everything else you do.'
    },
    {
      emoji: '📍', name: 'Local Presence', score: scores.localPresence,
      desc: 'Phone, address, Google Maps, NAP consistency',
      what: 'The #1 factor for showing up in the Google Local Pack — the 3 businesses at the top of every local search.'
    },
    {
      emoji: '📱', name: 'Mobile Experience', score: scores.mobile,
      desc: 'Mobile performance, viewport, accessibility',
      what: '68% of local searches happen on mobile. Google ranks your mobile experience, not your desktop one.'
    },
    {
      emoji: '⚡', name: 'Page Speed', score: scores.speed,
      desc: 'Core Web Vitals, load time, performance score',
      what: '53% of visitors leave if a page takes more than 3 seconds. Google uses speed as a direct ranking factor.'
    },
    {
      emoji: '✍️', name: 'Content Quality', score: scores.content,
      desc: 'H1 tags, word count, images, internal links',
      what: 'Content tells Google what you do and for whom. Thin or poorly structured content signals low authority.'
    },
  ];

  const catsGrid = $('categories-grid');
  catsGrid.innerHTML = '';
  cats.forEach(cat => {
    const barClass = cat.score >= 70 ? 'bar-good' : cat.score >= 45 ? 'bar-ok' : 'bar-bad';
    const numClass = cat.score >= 70 ? 'score-good' : cat.score >= 45 ? 'score-ok' : 'score-bad';
    const statusLabel = cat.score >= 70 ? 'Strong' : cat.score >= 45 ? 'Needs Work' : 'Critical Gap';
    const statusClass = cat.score >= 70 ? 'status-good' : cat.score >= 45 ? 'status-ok' : 'status-bad';
    const row = document.createElement('div');
    row.className = 'category-row';
    row.innerHTML = `
      <div class="cat-left">
        <div class="cat-title-row">
          <span class="cat-emoji">${cat.emoji}</span>
          <span class="cat-name">${cat.name}</span>
          <span class="cat-status ${statusClass}">${statusLabel}</span>
        </div>
        <div class="cat-bar-wrap"><div class="cat-bar ${barClass}" style="width:0%" data-width="${cat.score}%"></div></div>
        <span class="cat-desc">${cat.desc}</span>
        <span class="cat-why">${cat.what}</span>
      </div>
      <span class="cat-score-badge ${numClass}">${cat.score}</span>
    `;
    catsGrid.appendChild(row);
  });

  setTimeout(() => {
    document.querySelectorAll('.cat-bar[data-width]').forEach(bar => {
      bar.style.width = bar.dataset.width;
    });
  }, 300);

  // ── Issues with step-by-step plans ──
  const issuesList = $('issues-list');
  if (!issues || issues.length === 0) {
    issuesList.innerHTML = '<p style="color:var(--text-muted);font-size:0.875rem;">No critical issues found — Lola approves! 🐾</p>';
    $('issues-section').style.display = 'none';
  } else {
    issuesList.innerHTML = issues.map((issue, idx) => {
      const stepsHtml = issue.steps
        ? `<div class="issue-steps">
            <div class="steps-label">🐾 Fix it — step by step:</div>
            <ol class="steps-list">${issue.steps.map(s => `<li>${s}</li>`).join('')}</ol>
           </div>`
        : '';
      const tyHtml = issue.ty
        ? `<div class="issue-ty-cta">
            <span class="ty-label">💼 ${issue.ty.label}</span>
            <a href="https://www.tyalexandermedia.com/contact" class="btn-inline-cta" target="_blank">${issue.ty.cta}</a>
           </div>`
        : '';
      return `
        <div class="issue-item${issue.severity === 'warn' ? ' warn' : ''}">
          <div class="issue-header">
            <span class="issue-icon">${issue.icon}</span>
            <div class="issue-header-text">
              <div class="issue-title-row">
                <strong>${issue.title}</strong>
                <span class="impact-badge impact-${issue.impactClass}">${issue.impact} Impact</span>
                <span class="time-badge">⏱ ${issue.time}</span>
              </div>
              <p class="issue-body-text">${issue.body}</p>
            </div>
          </div>
          ${stepsHtml}
          ${tyHtml}
        </div>
      `;
    }).join('');
  }

  // ── Quick Wins with step-by-step actions ──
  const qwList = $('quickwins-list');
  qwList.innerHTML = quickWins.map((win, i) => {
    const stepsHtml = win.steps
      ? `<div class="qw-steps">
          <div class="steps-label">How to do it:</div>
          <ol class="steps-list">${win.steps.map(s => `<li>${s}</li>`).join('')}</ol>
         </div>`
      : '';
    const tyHtml = win.ty
      ? `<div class="issue-ty-cta">
          <span class="ty-label">💼 ${win.ty.label}</span>
          <a href="https://www.tyalexandermedia.com/contact" class="btn-inline-cta" target="_blank">${win.ty.cta}</a>
         </div>`
      : '';
    return `
      <div class="qw-item">
        <div class="qw-header">
          <div class="qw-num">${i + 1}</div>
          <div class="qw-title-wrap">
            <strong>${win.title}</strong>
            <div class="qw-meta">
              <span class="qw-effort ${win.effortClass}">${win.effort}</span>
              <span class="qw-time">⏱ ${win.time}</span>
            </div>
          </div>
        </div>
        <p class="qw-body">${win.body}</p>
        ${stepsHtml}
        ${tyHtml}
      </div>
    `;
  }).join('');

  // ── Instagram results (if user checked IG) ──
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
