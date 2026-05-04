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
  ['step-input','step-loading','step-gate','step-ig','step-report'].forEach(id => { const e = document.getElementById(id); if(e) e.classList.add('hidden'); });
  show(step);
  updateStepIndicators(step);
  const el = document.getElementById(step);
  if (el) {
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }
}

function updateStepIndicators(step) {
  const stepMap = { 'step-input': 1, 'step-loading': 1, 'step-gate': 2, 'step-report': 3 };
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
async function animateLoadCheck(id, delayMs, progressPct) {
  setTimeout(() => {
    const el = $(id);
    if (!el) return;
    el.classList.remove('pending');
    el.classList.add('active');
    const icon = el.querySelector('.lc-icon');
    setTimeout(() => {
      el.classList.remove('active');
      el.classList.add('done');
      if (icon) icon.textContent = '✓';
      setProgress(progressPct);
    }, 700);
  }, delayMs);
}

function setProgress(pct) {
  const fill  = $('progress-fill');
  const pctEl = $('progress-pct');
  if (fill)  fill.style.width = Math.round(pct) + '%';
  if (pctEl) pctEl.textContent = Math.round(pct) + '%';
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── MAIN ANALYSIS ENGINE ──────────────────────────────────────
const LOLA_API = 'https://web-production-e4bd3.up.railway.app';

async function runAnalysis() {
  const { bizName, website, city, bizType, email } = analysisData;

  const loadingEl = document.getElementById('step-loading');
  if (loadingEl) {
    loadingEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    loadingEl.style.minHeight = '80vh';
  }

  setProgress(5);
  animateLoadCheck('lc1', 400,  12);
  animateLoadCheck('lc2', 900,  24);
  animateLoadCheck('lc3', 1600, 36);
  animateLoadCheck('lc4', 2400, 50);
  animateLoadCheck('lc5', 3200, 64);
  animateLoadCheck('lc6', 4000, 76);
  animateLoadCheck('lc7', 5000, 88);
  animateLoadCheck('lc8', 6500, 95);

  try {
    const resp = await Promise.race([
      fetch(`${LOLA_API}/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: bizName,
          website,
          city,
          business_type: bizType || 'contractor',
          email: email || 'noemail@lola-seo.app',
          instagram_handle: analysisData.igHandle || null,
        }),
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 28000)),
    ]);

    if (!resp.ok) throw new Error(`API ${resp.status}`);
    const data = await resp.json();

    setProgress(100);
    await sleep(600);

    const cats = data.categories || {};
    analysisData.scores = {
      siteHealth:    cats.site_health?.score    ?? 50,
      localPresence: cats.local_presence?.score  ?? 0,
      mobile:        cats.mobile?.score          ?? 50,
      speed:         cats.page_speed?.score      ?? 50,
      content:       cats.content?.score         ?? 50,
    };
    analysisData.total       = data.total_score ?? 0;
    analysisData.grade       = data.grade;
    analysisData.gradeLabel  = data.grade_label;
    analysisData.auditId     = data.audit_id;
    analysisData.revenueLeak = data.revenue_leak_monthly;
    analysisData.percentile  = data.percentile_string;
    analysisData.confidence  = data.confidence_score;
    analysisData.issues      = (data.issues || []).map(i => ({
      icon: _severityIcon(i.severity),
      impactClass: i.severity?.toLowerCase() === 'critical' ? 'critical' : i.severity?.toLowerCase() === 'high' ? 'high' : 'medium',
      title: i.issue,
      impact: i.description,
      revenue_impact_monthly: parseInt((i.revenue_impact||'').replace(/[^0-9]/g,'')) || 0,
      cta_type: i.cta_type || 'consult',
    }));
    analysisData.quickWins   = (data.quick_wins || []).map(w => ({
      title: w.win,
      why: `${w.effort} · ${w.impact || 'High'} Impact`,
      action: (w.steps || []).join(' → '),
      effort: w.effort || 'Quick Win',
      time: w.effort || '15 min',
      ctaType: 'consult',
    }));
    analysisData.competitors = data.competitors || [];
    analysisData.siteData    = _backendToSiteData(data);
    analysisData.speedData   = { ok: true, performance: cats.page_speed?.score ?? 50 };

    showGate(analysisData.total, bizName);

  } catch (err) {
    console.warn('Backend API failed, falling back to local analysis:', err.message);
    await runAnalysisFallback();
  }
}

function _severityIcon(sev) {
  const s = (sev||'').toLowerCase();
  if (s === 'critical') return '🚨';
  if (s === 'high')     return '⚠️';
  return '📌';
}

function _backendToSiteData(data) {
  const cats = data.categories || {};
  return {
    ok: true,
    hasPhone: cats.local_presence?.score > 10,
    hasAddress: cats.local_presence?.score > 20,
    hasMaps: false,
    schemaJson: cats.site_health?.score >= 50,
    ogComplete: cats.site_health?.score >= 80,
    httpsOk: data.website?.startsWith('https://'),
    wordCount: 0,
    _raw: data,
  };
}

// ── LOCAL FALLBACK ───────────────────────────────────────────
async function runAnalysisFallback() {
  const { bizName, website, city, bizType } = analysisData;

  const timeout = new Promise(resolve => setTimeout(resolve, 9000));
  const fallbackSite = { ok: false, httpsOk: website.startsWith('https://'), title: '', metaDesc: '',
    metaViewport: false, h1Text: '', h1Count: 0, h2Count: 0, canonicalTag: false,
    canonicalSelf: false, noindex: false, ogTitle: false, ogDesc: false, ogImage: false,
    ogTags: false, schemaJson: false, wordCount: 0, imgCount: 0, altMissing: 0,
    altMissingPct: 0, internalLinks: 0, externalLinks: 0, hasPhone: false,
    hasAddress: false, hasMaps: false, hasGBP: false, hasAnalytics: false,
    hasGTM: false, hasPrivacyLink: false, robotsOk: null, sitemapFound: null };
  const fallbackSpeed = { ok: false, performance: 50, accessibility: 50, seo: 50,
    isMobileOk: true, hasViewport: true, isCrawlable: true, fcp: '', lcp: '', cls: '' };

  const [siteData, speedData] = await Promise.all([
    Promise.race([fetchSiteData(website), timeout.then(() => fallbackSite)]),
    Promise.race([fetchPageSpeed(website), timeout.then(() => fallbackSpeed)]),
  ]);

  setProgress(100);
  await sleep(600);

  const scores = {
    siteHealth:    scoreSiteHealth(siteData, website),
    localPresence: scoreLocalPresence(siteData, bizName, city, bizType),
    mobile:        scoreMobile(speedData),
    speed:         scoreSpeed(speedData),
    content:       scoreContent(siteData, bizName, city)
  };
  const total = Math.round(
    scores.siteHealth    * 0.25 + scores.localPresence * 0.30 +
    scores.mobile        * 0.15 + scores.speed         * 0.15 +
    scores.content       * 0.15
  );

  analysisData.scores    = scores;
  analysisData.total     = total;
  analysisData.siteData  = siteData;
  analysisData.speedData = speedData;
  analysisData.issues    = buildIssues(scores, siteData, speedData, website, bizName, city);
  analysisData.quickWins = buildQuickWins(scores, siteData, city, bizType);
  analysisData.competitors = [];

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

    const title      = doc.querySelector('title')?.textContent?.trim() || '';
    const metaDesc   = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
    const metaViewport = !!doc.querySelector('meta[name="viewport"]');
    const httpsOk    = url.startsWith('https://');

    const h1s    = doc.querySelectorAll('h1');
    const h2s    = doc.querySelectorAll('h2');
    const h3s    = doc.querySelectorAll('h3');
    const h1Text = h1s[0]?.textContent?.trim() || '';
    const headingHierarchyOk = h1s.length === 1;

    const canonicalEl  = doc.querySelector('link[rel="canonical"]');
    const canonicalTag = !!canonicalEl;
    const canonicalHref = canonicalEl?.getAttribute('href') || '';
    const canonicalSelf = canonicalTag && (canonicalHref.includes(new URL(url).hostname) || canonicalHref.startsWith('/'));

    const robotsMeta  = doc.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
    const noindex     = robotsMeta.toLowerCase().includes('noindex');

    const ogTitle  = !!doc.querySelector('meta[property="og:title"]');
    const ogDesc   = !!doc.querySelector('meta[property="og:description"]');
    const ogImage  = !!doc.querySelector('meta[property="og:image"]');
    const ogTags   = ogTitle || ogDesc || ogImage;
    const ogComplete = ogTitle && ogDesc && ogImage;

    const schemaJson = !!doc.querySelector('script[type="application/ld+json"]');

    const bodyText  = doc.body?.innerText || doc.body?.textContent || '';
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

    const imgs       = Array.from(doc.querySelectorAll('img'));
    const imgCount   = imgs.length;
    const altMissing = imgs.filter(img => !img.getAttribute('alt') || img.getAttribute('alt').trim() === '').length;
    const altMissingPct = imgCount > 0 ? Math.round((altMissing / imgCount) * 100) : 0;

    const allLinks = Array.from(doc.querySelectorAll('a[href]'));
    const internalLinks = allLinks.filter(a => {
      try { const href = a.getAttribute('href'); return href && !href.startsWith('http') && !href.startsWith('mailto') && !href.startsWith('tel'); }
      catch { return false; }
    }).length;
    const externalLinks = allLinks.filter(a => {
      try { const href = a.getAttribute('href'); return href && href.startsWith('http'); }
      catch { return false; }
    }).length;

    const hasPhone   = /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\(\d{3}\)\s?\d{3}[-.\s]?\d{4})/.test(html);
    const hasAddress = /(street|avenue|blvd|drive|road|suite|\bst\b|\bave\b|\bdr\b)/i.test(html);
    const hasMaps    = lowerHtml.includes('google.com/maps') || lowerHtml.includes('maps.google') || lowerHtml.includes('goo.gl/maps');
    const hasGBP     = lowerHtml.includes('business.google') || lowerHtml.includes('g.page') || lowerHtml.includes('g.co/');

    const hasAnalytics = lowerHtml.includes('google-analytics.com') || lowerHtml.includes('gtag(') || lowerHtml.includes('ga.js') || lowerHtml.includes('analytics.js') || lowerHtml.includes('googletagmanager.com/gtag');
    const hasGTM       = lowerHtml.includes('googletagmanager.com/gtm');
    const hasPixel     = lowerHtml.includes('connect.facebook.net') || lowerHtml.includes('fbq(');
    const hasPrivacyLink = lowerHtml.includes('privacy') || lowerHtml.includes('terms');

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
  if (s.ogComplete)     score += 12;
  else if (s.ogTags)    score += 5;
  if (s.schemaJson)     score += 12;
  if (!s.noindex)       score += 8;
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

// ── ISSUE BUILDER ──────────────────────────────────────────────
function buildIssues(scores, siteData, speedData, url, bizName, city) {
  const issues = [];
  const cityName = city.split(',')[0];

  if (!siteData.httpsOk) {
    issues.push({ icon: '🔓', impactClass: 'critical',
      title: 'Your site is flagged "Not Secure" by Google',
      impact: 'Google actively demotes non-HTTPS sites and shows a security warning to every visitor. You\'re losing trust and rankings before anyone reads a word.',
      ctaType: 'consult' });
  }

  if (!siteData.title || siteData.title.length < 10) {
    issues.push({ icon: '📄', impactClass: 'critical',
      title: 'No page title — Google doesn\'t know what you do',
      impact: `Your homepage has no title tag, which is the single most important ranking signal. Google literally cannot determine what service you offer or where you\'re located in ${cityName}.`,
      ctaType: 'quickfix' });
  } else if (siteData.title.length > 65) {
    issues.push({ icon: '📄', impactClass: 'high',
      title: `Page title cut off at ${siteData.title.length} characters`,
      impact: 'Google truncates your title in search results, cutting off your message mid-sentence. You\'re paying for impressions but delivering a broken first impression.',
      ctaType: 'quickfix' });
  }

  if (!siteData.metaDesc || siteData.metaDesc.length < 50) {
    issues.push({ icon: '📝', impactClass: 'high',
      title: 'No meta description — Google picks random text for your listing',
      impact: `Without a meta description, Google auto-generates the 2-line preview under your search result — usually a random sentence that does nothing to sell your business to ${cityName} customers.`,
      ctaType: 'quickfix' });
  }

  if (siteData.noindex) {
    issues.push({ icon: '🚫', impactClass: 'critical',
      title: 'noindex tag found — this page is hidden from Google',
      impact: 'Your site has a tag that explicitly tells Google not to show this page in search results. This is often left on accidentally after a site build. Until it\'s removed, you don\'t exist on Google.',
      ctaType: 'consult' });
  }

  if (!siteData.hasPhone) {
    issues.push({ icon: '📞', impactClass: 'critical',
      title: 'No phone number detected on your site',
      impact: `Google verifies local businesses using Name, Address, and Phone (NAP). Without a readable phone number, Google can\'t confirm you\'re a real ${cityName} business — directly suppressing your local ranking.`,
      ctaType: 'consult' });
  }

  if (!siteData.hasAddress) {
    issues.push({ icon: '📍', impactClass: 'critical',
      title: 'No address found — Google can\'t tie you to your city',
      impact: `Local SEO depends on Google knowing exactly where you operate. Without a visible address, you\'re invisible in "${cityName} near me" searches — which is where your customers are.`,
      ctaType: 'consult' });
  }

  if (!siteData.schemaJson) {
    issues.push({ icon: '🗂️', impactClass: 'high',
      title: 'No structured data — Google is guessing what type of business you are',
      impact: 'Schema markup tells Google your business type, hours, service area, and phone number in a language it understands perfectly. Without it, you\'re missing rich results and local ranking signals your competitors may already have.',
      ctaType: 'quickfix' });
  }

  if (speedData.ok && speedData.performance < 50) {
    issues.push({ icon: '⚡', impactClass: 'critical',
      title: `Page speed critical (${speedData.performance}/100) — most visitors leave before the page loads`,
      impact: `Google data: 53% of mobile visitors abandon a site that takes over 3 seconds to load. Your score is ${speedData.performance}/100. Every slow second is customers choosing your competitor instead.`,
      ctaType: 'consult' });
  } else if (speedData.ok && speedData.performance < 75) {
    issues.push({ icon: '⚡', impactClass: 'high',
      title: `Page speed below threshold (${speedData.performance}/100)`,
      impact: `Google's threshold for "good" is 90+. At ${speedData.performance}/100, you\'re slower than competitors who rank above you. Speed is a direct ranking factor — this is costing you positions.`,
      ctaType: 'consult' });
  }

  if (siteData.h1Count === 0) {
    issues.push({ icon: '🔤', impactClass: 'high',
      title: 'No H1 heading — Google can\'t identify your main topic',
      impact: `Your homepage has no primary heading, which is one of the top 3 on-page signals Google uses to understand your page. It doesn\'t know if you\'re a pressure washer, a plumber, or a restaurant in ${cityName}.`,
      ctaType: 'quickfix' });
  } else if (siteData.h1Count > 2) {
    issues.push({ icon: '🔤', impactClass: 'medium',
      title: `${siteData.h1Count} H1 tags found — splitting your ranking signal`,
      impact: 'Having multiple H1 tags dilutes the signal. Google expects one clear primary topic declaration per page. Multiple H1s create confusion about what you actually want to rank for.',
      ctaType: 'quickfix' });
  }

  if (siteData.ok && siteData.wordCount < 200) {
    issues.push({ icon: '✍️', impactClass: 'medium',
      title: `Thin content (~${siteData.wordCount} words) — not enough for Google to trust you`,
      impact: `Your homepage has fewer words than this paragraph. Google uses content depth as a trust signal. Thin pages rank below competitors with substantive content about their services in ${cityName}.`,
      ctaType: 'consult' });
  }

  if (siteData.robotsOk === false) {
    issues.push({ icon: '🤖', impactClass: 'critical',
      title: 'robots.txt is blocking Google from crawling your site',
      impact: 'Your robots.txt file contains a rule that prevents Google from accessing your pages. This is one of the most damaging technical errors possible — Google may not be indexing you at all.',
      ctaType: 'consult' });
  }

  if (siteData.sitemapFound === false) {
    issues.push({ icon: '🗺️', impactClass: 'high',
      title: 'No XML sitemap — Google has no roadmap to your pages',
      impact: 'Without a sitemap, Google has to discover your pages by crawling links. New pages may take weeks to get indexed, or never get found at all — especially service and location pages.',
      ctaType: 'quickfix' });
  }

  if (!siteData.hasAnalytics && !siteData.hasGTM) {
    issues.push({ icon: '📊', impactClass: 'high',
      title: 'No analytics — you have no data on who\'s visiting or converting',
      impact: 'Without tracking, you can\'t know what\'s working, where visitors drop off, or whether any SEO improvements are having an effect. You\'re flying blind on every marketing decision.',
      ctaType: 'quickfix' });
  }

  if (!siteData.ogTags) {
    issues.push({ icon: '🔗', impactClass: 'medium',
      title: 'No social sharing tags — your site looks broken on social media',
      impact: 'When someone shares your link on social media or texts it, it appears as an unstyled URL with no image or description. That\'s free referral traffic you\'re actively destroying.',
      ctaType: 'quickfix' });
  }

  if (siteData.altMissingPct > 40 && siteData.imgCount > 3) {
    issues.push({ icon: '🖼️', impactClass: 'medium',
      title: `${siteData.altMissingPct}% of your images are invisible to Google`,
      impact: 'Alt text is how Google reads images. Images without it are completely ignored — that\'s lost keyword relevance, lost Google Images traffic, and an accessibility penalty all at once.',
      ctaType: 'quickfix' });
  }

  const order = { critical: 0, high: 1, medium: 2 };
  issues.sort((a, b) => (order[a.impactClass] ?? 3) - (order[b.impactClass] ?? 3));
  return issues.slice(0, 8);
}

// ── QUICK WINS ─────────────────────────────────────────────────
function buildQuickWins(scores, siteData, city, bizType) {
  const wins = [];
  const cityName = city.split(',')[0];

  wins.push({
    title: 'Google Business Profile Optimization',
    why: `The Google Local Pack — the 3 businesses at the top of every local "${cityName}" search — is driven almost entirely by your GBP. A fully optimized profile gets 5× more direction requests and calls than a bare listing.`,
    what: 'Fill every field, add 10+ photos, set your service area, get your first 5 reviews this week.',
    effort: 'Highest ROI', time: '1–2 hrs',
    ctaType: 'consult'
  });

  if (!siteData.metaDesc || siteData.metaDesc.length < 50) {
    wins.push({
      title: 'Meta Description — Your Google Pitch',
      why: 'The 2-line preview under your search result is the last thing between a searcher and a click. Most local businesses leave it blank and let Google pick random text. A strong one can double your click-through rate overnight.',
      what: 'Write one sentence that includes your service, city, and a reason to click.',
      effort: 'Quick Win', time: '15 min',
      ctaType: 'quickfix'
    });
  }

  if (!siteData.schemaJson) {
    wins.push({
      title: 'LocalBusiness Schema Markup',
      why: 'Schema is invisible code that gives Google a direct line to your business details — hours, service area, phone, type of business. It can unlock rich results (star ratings, phone numbers) that your competitors already have.',
      what: 'Add a LocalBusiness JSON-LD snippet to your site head.',
      effort: 'Quick Win', time: '20 min',
      ctaType: 'quickfix'
    });
  }

  if (scores.speed < 60) {
    wins.push({
      title: 'Image Compression & Speed',
      why: `Your page speed is costing you Google rankings and customers. 53% of mobile visitors leave if a page takes over 3 seconds. Images are the #1 culprit — fixing them alone can push your speed score up significantly.`,
      what: 'Convert all images to WebP format and enable lazy loading.',
      effort: 'Quick Win', time: '30 min',
      ctaType: 'consult'
    });
  }

  wins.push({
    title: `City Landing Page for ${cityName}`,
    why: `A page specifically targeting "[your service] in ${cityName}" can rank for dozens of local search terms. This is the #1 content move for local businesses — small businesses outrank national chains with this strategy every day.`,
    what: 'Create a dedicated page with your service, city, and why locals choose you.',
    effort: 'High Impact', time: '1–2 hrs',
    ctaType: 'consult'
  });

  return wins.slice(0, 4);
}

// ── SHOW GATE ─────────────────────────────────────────────────
function showGate(total, bizName) {
  const scoreEl = $('teaser-score-num');
  if (scoreEl) {
    scoreEl.textContent = '0';
    const _start = Date.now();
    const _dur = 1500;
    const _tick = () => {
      const elapsed = Date.now() - _start;
      const progress = Math.min(elapsed / _dur, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      scoreEl.textContent = Math.round(eased * total);
      if (progress < 1) requestAnimationFrame(_tick);
    };
    setTimeout(() => requestAnimationFrame(_tick), 250);
  }

  $('teaser-score-label').textContent = getGradeLabel(total);
  $('teaser-score-label').style.color = getScoreColor(total);
  $('gate-biz-name').textContent = bizName;

  const leadsLostEl = $('gate-leads-lost');
  if (leadsLostEl) {
    const revLeak = analysisData.revenueLeak;
    const leadsRanges = [[25,'50–70'],[40,'35–50'],[60,'20–35'],[75,'10–20'],[101,'3–10']];
    const leadsStr = leadsRanges.find(([cap]) => total < cap)?.[1] || '3–10';
    leadsLostEl.textContent = revLeak
      ? `You're losing an estimated $${revLeak.toLocaleString()}/mo in missed leads.`
      : `You're missing an estimated ~${leadsStr} inbound calls per month.`;
    leadsLostEl.style.display = 'block';
  }

  const pct = total / 100;
  const circumference = 352;
  const dashOffset = circumference - (circumference * pct);

  const ring = $('score-ring-fill');
  if (ring) {
    ring.style.transition = 'none';
    ring.style.strokeDashoffset = '352';
    setTimeout(() => {
      ring.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)';
      ring.style.strokeDashoffset = dashOffset;
    }, 400);
  }

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
    fetch('/api/capture-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email, bizName: analysisData.bizName, city: analysisData.city,
        bizType: analysisData.bizType, total: analysisData.total,
        scores: analysisData.scores, issues: analysisData.issues,
        quickWins: analysisData.quickWins,
      })
    }).catch(() => {});

    fetch(`${LOLA_API}/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_name: analysisData.bizName,
        website:       analysisData.website,
        city:          analysisData.city,
        business_type: analysisData.bizType || 'contractor',
        email,
        instagram_handle: analysisData.igHandle || null,
      })
    }).catch(() => {});

    const confirmEl = $('email-sent-confirm');
    if (confirmEl) confirmEl.classList.remove('hidden');
  } catch(e) {}

  await sleep(800);
  showReport();
});

// ── COMPETITOR COMPARISON ──────────────────────────────────────
function renderCompetitors(competitors, city, bizName) {
  const section = $('competitor-section');
  const list = $('competitor-list');
  if (!section || !list || !competitors.length) return;
  section.classList.remove('hidden');

  const cityShort = (city || '').split(',')[0];
  list.innerHTML = `
    <div class="comp-intro">
      <p>These businesses are ranking above <strong>${bizName}</strong> for your services in ${cityShort} right now. Every day they hold those spots, they're getting the calls that should go to you.</p>
    </div>
    <div class="comp-grid">
      ${competitors.map((c, i) => `
        <div class="comp-card">
          <div class="comp-rank">#${i + 1}</div>
          <div class="comp-info">
            <div class="comp-name">${c.title || c.domain || 'Competitor'}</div>
            <div class="comp-url">${c.url || ''}</div>
            ${c.snippet ? `<div class="comp-snippet">${c.snippet.substring(0, 100)}…</div>` : ''}
          </div>
          <div class="comp-signal">📈 Ranking</div>
        </div>`).join('')}
    </div>
    <div class="comp-cta">
      <span>Want to outrank them? The fixes are in your report.</span>
      <a href="https://www.tyalexandermedia.com/contact?offer=quick-fix" class="rpt-upsell-pill" target="_blank">Get It Fixed →</a>
    </div>`;
}

// ── GBP BEFORE / AFTER ────────────────────────────────────────
function renderGBPComparison(bizName, city, siteData) {
  const section = $('gbp-section');
  const container = $('gbp-comparison');
  if (!section || !container) return;

  const cityShort = (city || '').split(',')[0];
  const hasPhone = siteData?.hasPhone;
  const hasAddress = siteData?.hasAddress;
  const hasMaps = siteData?.hasMaps;
  const hasSchema = siteData?.schemaJson;

  const missingCount = [!hasPhone, !hasAddress, !hasMaps, !hasSchema].filter(Boolean).length;
  if (missingCount === 0) return;
  section.classList.remove('hidden');

  const checks = [
    { label: 'Phone number visible', before: hasPhone, fix: 'Add clickable tel: link in header + footer' },
    { label: 'Address on site', before: hasAddress, fix: `Add "${cityShort}" address in footer` },
    { label: 'Google Maps embed', before: hasMaps, fix: 'Embed map on Contact page' },
    { label: 'Schema markup', before: hasSchema, fix: 'Add LocalBusiness JSON-LD to site head' },
  ];

  container.innerHTML = `
    <div class="gbp-panel">
      <div class="gbp-col gbp-before">
        <div class="gbp-col-label">&#x26A0; Current State</div>
        <div class="gbp-mock">
          <div class="gbp-mock-name">${bizName}</div>
          <div class="gbp-mock-city">${cityShort}</div>
          ${checks.map(c => `
            <div class="gbp-mock-row ${c.before ? 'has' : 'missing'}">
              <span>${c.before ? '✓' : '✗'}</span> ${c.label}
            </div>`).join('')}
          <div class="gbp-mock-signal">Google confidence: <strong>Low</strong></div>
        </div>
      </div>
      <div class="gbp-arrow">→</div>
      <div class="gbp-col gbp-after">
        <div class="gbp-col-label">✅ Optimized State</div>
        <div class="gbp-mock gbp-mock--optimized">
          <div class="gbp-mock-name">${bizName}</div>
          <div class="gbp-mock-city">${cityShort}</div>
          ${checks.map(c => `
            <div class="gbp-mock-row has">
              <span>✓</span> ${c.label}
            </div>`).join('')}
          <div class="gbp-mock-signal">Google confidence: <strong style="color:var(--green)">High</strong></div>
        </div>
      </div>
    </div>
    <div class="gbp-fixes">
      ${checks.filter(c => !c.before).map(c => `
        <div class="gbp-fix-row">
          <span class="gbp-fix-icon">→</span>
          <span>${c.fix}</span>
        </div>`).join('')}
    </div>`;
}

// ── SHOW FULL REPORT ───────────────────────────────────────────
function showReport() {
  const { bizName, city, total, scores, issues, quickWins } = analysisData;
  const grade = getLetterGrade(total);
  const gradeColor = getScoreColor(total);

  const circ = 314;
  setTimeout(() => {
    const ring = $('report-ring-fill');
    if (ring) ring.style.strokeDashoffset = circ - (circ * total / 100);
  }, 200);
  $('report-score-num').textContent = total;

  const gradePill = $('rpt-grade-pill');
  const gradeLabels = { A: '🏆 Best in Show', B: '✅ Solid Foundation', C: '🐾 Needs Work', D: '⚠️ Needs Training', F: '🚨 Off the Leash' };
  gradePill.textContent = gradeLabels[grade] || grade;
  gradePill.className = 'rpt-grade-pill grade-' + grade.toLowerCase();

  const headlines = {
    A: `${bizName} is dialed in. Here's how to stay ahead.`,
    B: `${bizName} has a solid base — these fixes are the difference between good and dominant.`,
    C: `${bizName} is competing but leaving rankings on the table every single day.`,
    D: `${bizName} has real gaps that are costing customers right now.`,
    F: `${bizName} is effectively invisible on Google. The fix list below is your playbook.`
  };
  const rptLabel = $('rpt-label');
  if (rptLabel) { rptLabel.textContent = `Grade ${grade} · ${getGradeLabel(total)}`; rptLabel.style.color = gradeColor; }
  const rptH = $('report-headline');
  if (rptH) rptH.textContent = headlines[grade] || 'Your Local SEO Report';
  const rptMeta = $('rpt-meta');
  if (rptMeta) rptMeta.innerHTML = `<span>${bizName}</span><span class="rpt-dot">·</span><span>${city}</span><span class="rpt-dot">·</span><span>${new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>`;

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
      const scoreColor = sc === 'good' ? 'var(--green)' : sc === 'ok' ? 'var(--medium)' : 'var(--critical)';
      return `<div class="rpt-cat rpt-cat--${sc}">
        <span class="rpt-cat-emoji">${cat.emoji}</span>
        <div class="rpt-cat-info">
          <div class="rpt-cat-name">${cat.name}</div>
          <div class="rpt-cat-note">${cat.note}</div>
        </div>
        <div class="rpt-cat-score-wrap">
          <div class="rpt-cat-score">${cat.score}</div>
          <div class="rpt-cat-bar">
            <div class="rpt-cat-bar-fill" style="width:${cat.score}%;background:${scoreColor}"></div>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  const fixableIssues   = issues.filter(i => i.ctaType === 'quickfix');
  const strategicIssues = issues.filter(i => i.ctaType === 'consult');

  const issuesEl = $('issues-list');
  if (issuesEl) {
    if (!issues || issues.length === 0) {
      $('issues-section').style.display = 'none';
    } else {
      issuesEl.innerHTML = issues.map(issue => `
        <div class="rpt-issue rpt-issue--${issue.impactClass}">
          <div class="rpt-issue-top">
            <span class="rpt-issue-icon">${issue.icon}</span>
            <div class="rpt-issue-right">
              <div class="rpt-issue-header">
                <span class="rpt-issue-title">${issue.title}</span>
                <span class="rpt-badge rpt-badge--${issue.impactClass}">${issue.impactClass === 'critical' ? 'Critical' : issue.impactClass === 'high' ? 'High' : 'Medium'}</span>
              </div>
              <p class="rpt-issue-fix">${issue.impact}</p>
            </div>
          </div>
        </div>`).join('');
    }
  }

  // ── REVENUE BANNER — populated with real score data ──────────
  populateRevenueBanner(total, analysisData.bizType, analysisData.city);

  // ── URGENCY LINE — populated with real competitor name ────────
  const comp = analysisData.competitors && analysisData.competitors[0];
  const compName = comp?.name || comp?.business_name || comp?.title || null;
  populateUrgencyLine(compName, analysisData.city, analysisData.bizType);

  const winsEl = $('quickwins-list');
  if (winsEl) {
    winsEl.innerHTML = quickWins.map((win, i) => `
      <div class="rpt-win">
        <div class="rpt-win-top">
          <span class="rpt-win-num">${i + 1}</span>
          <div class="rpt-win-right">
            <div class="rpt-win-header">
              <span class="rpt-win-title">${win.title}</span>
              <span class="rpt-win-badge">${win.effort} · ${win.time}</span>
            </div>
            <p class="rpt-win-why">${win.why}</p>
            <p class="rpt-win-action">${win.what || win.action || ''}</p>
          </div>
        </div>
      </div>`).join('');
  }

  const upsellEl = $('rpt-upsell');
  if (upsellEl) {
    upsellEl.innerHTML = buildBottomUpsell(total, grade, strategicIssues.length);
  }

  if (analysisData.competitors && analysisData.competitors.length > 0) {
    renderCompetitors(analysisData.competitors, analysisData.city, analysisData.bizName);
  }

  renderGBPComparison(analysisData.bizName, analysisData.city, analysisData.siteData);

  injectReportOffers();
  goToStep('step-report');
}

// ── REVENUE BANNER — populates with real score + biz type ─────
function populateRevenueBanner(score, businessType, city) {
  let leadsRange, dollarRange;

  if (score <= 25)      { leadsRange = '50–70 calls'; dollarRange = '$15,000–$56,000'; }
  else if (score <= 40) { leadsRange = '35–50 calls'; dollarRange = '$10,500–$40,000'; }
  else if (score <= 60) { leadsRange = '20–35 calls'; dollarRange = '$6,000–$28,000'; }
  else if (score <= 75) { leadsRange = '10–20 calls'; dollarRange = '$3,000–$16,000'; }
  else                  { leadsRange = '3–10 calls';  dollarRange = '$900–$8,000'; }

  const jobValueMap = {
    softwash:    '$300–$800/job', contractor:  '$300–$800/job',
    hvac:        '$200–$1,200/job', plumbing:  '$150–$800/job',
    roofing:     '$500–$15,000/job', landscaping: '$200–$600/job',
    electrical:  '$150–$600/job', cleaning:    '$100–$400/job',
    restaurant:  '$30–$100/visit', salon:       '$50–$200/visit',
    medical:     '$200–$800/visit', fitness:    '$30–$150/visit',
    retail:      '$50–$300/visit', default:     '$200–$600/job',
  };
  const jobValue = jobValueMap[businessType] || '$200–$600/job';

  const revNumber  = document.getElementById('rev-number');
  const revSub     = document.getElementById('rev-score-sub');
  const revDollars = document.getElementById('rev-dollars');

  if (revNumber)  revNumber.textContent  = '~' + leadsRange;
  if (revSub)     revSub.textContent     = 'Based on your score of ' + score + '/100 · avg ' + jobValue;
  if (revDollars) revDollars.textContent = dollarRange;
}

// ── URGENCY LINE — competitor-specific ────────────────────────
function populateUrgencyLine(competitorName, city, bizType) {
  const urgencyEl = document.getElementById('urgency-competitor');
  if (!urgencyEl) return;

  const serviceMap = {
    softwash: 'soft wash', contractor: 'home services', hvac: 'HVAC',
    plumbing: 'plumbing', roofing: 'roofing', landscaping: 'landscaping',
    electrical: 'electrical', cleaning: 'cleaning',
  };
  const service = serviceMap[bizType] || 'your services';
  const displayCity = (city || '').split(',')[0];

  if (competitorName) {
    urgencyEl.textContent = `${competitorName} is ranking for "${service} ${displayCity}" right now. Every day you wait, they get another call that should have been yours.`;
  } else {
    urgencyEl.textContent = `Every day you wait, a competitor in ${displayCity} is picking up the phone you should be answering.`;
  }
}

// ── $97 QUICK FIX OFFER ────────────────────────────────────────
const BEACONS_QUICK_FIX_URL = 'https://www.tyalexandermedia.com/contact?offer=quick-fix';

function buildQuickFixOffer(fixCount, total, grade, bizName) {
  const urgency = total < 40
    ? `Lola found <strong>${fixCount} things we can fix on your site within 24 hours</strong> — no call needed, no waiting around.`
    : total < 65
    ? `<strong>${fixCount} of Lola's findings are quick implementations</strong> — things that move your score fast once someone actually makes the change.`
    : `Even at this score, <strong>${fixCount} optimizations</strong> are sitting undone. Each one is a missed ranking opportunity.`;

  return `
    <div class="qf-offer">
      <div class="qf-offer-inner">
        <div class="qf-eyebrow">⚡ Instant Fix Available</div>
        <h3 class="qf-title">The Quick Fix Package</h3>
        <p class="qf-desc">${urgency}</p>
        <div class="qf-deliverables">
          <div class="qf-item">Title tag optimized for your city + service</div>
          <div class="qf-item">Meta description written to convert clicks</div>
          <div class="qf-item">Schema markup added to your site</div>
          <div class="qf-item">Open Graph tags for social sharing</div>
        </div>
        <div class="qf-price-row">
          <span class="qf-price">$97</span>
          <div><div class="qf-price-note">one-time</div><div class="qf-price-anchor">Agencies charge $500+</div></div>
        </div>
        <div class="qf-timeline">⏱ 24-hr turnaround · No login needed until after payment</div>
        <button class="btn btn-cta" id="qf-buy-btn" onclick="handleQuickFixClick(event)" style="margin-top:16px">
          Fix My Site for $97 →
        </button>
        <p class="qf-guarantee">🐾 Not satisfied? Full refund. No questions.</p>
      </div>
    </div>`;
}

// ── PURCHASE INTENT HANDLER ────────────────────────────────────
async function handleQuickFixClick(evt) {
  if (evt) evt.preventDefault();
  const btn = document.getElementById('qf-buy-btn');
  if (btn) { btn.textContent = 'Opening…'; btn.disabled = true; }

  try {
    const { email, bizName, city, website, total, issues } = analysisData || {};
    if (email && bizName) {
      fetch('/api/purchase-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, bizName, city, website: website || '', total: total || 0,
          grade: getLetterGrade(total || 0),
          issues: (issues || []).slice(0,5).map(i => ({ icon: i.icon || '', title: i.title, impactClass: i.impactClass })),
          offer: 'Quick Fix Package — $97'
        })
      });
    }
  } catch(e) { /* non-blocking */ }

  await sleep(350);
  window.open(BEACONS_QUICK_FIX_URL, '_blank');
  if (btn) { btn.textContent = 'Fix My Site for $97 →'; btn.disabled = false; }
}

// ── BOTTOM UPSELL ──────────────────────────────────────────────
function buildBottomUpsell(total, grade, strategicCount) {
  const note = strategicCount > 0
    ? `Beyond the quick wins, Lola flagged <strong style="color:var(--text)">${strategicCount} strategic issues</strong> that need a deeper approach — content, local authority, competitive positioning. That's the conversation for a strategy call.`
    : `The quick wins are the foundation. Dominating your local market from here is a strategy conversation — that's what the call is for.`;

  return `
    <div class="rpt-upsell-block">
      <img src="lola-logo.png" class="rpt-upsell-lola" alt="" aria-hidden="true" />
      <div class="rpt-upsell-eyebrow">After your quick fixes are live —</div>
      <h3 class="rpt-upsell-h3">Ready to dominate your market, not just fix your score?</h3>
      <p class="rpt-upsell-body">${note}</p>
      <div class="rpt-offer-grid">
        <div class="rpt-offer rpt-offer--featured" style="max-width:380px;margin:0 auto">
          <div class="rpt-offer-tag featured-tag">Free · After Quick Fix</div>
          <div class="rpt-offer-name">Strategy Call with Ty</div>
          <p class="rpt-offer-desc">Once the quick fixes are live, we'll review your results together and map out what it actually takes to own page 1 in your market.</p>
          <a href="https://www.tyalexandermedia.com/contact" class="rpt-offer-btn rpt-offer-btn--gold" target="_blank">Book Your Strategy Call →</a>
        </div>
      </div>
      <div class="rpt-stats-row">
        <div class="rpt-stat"><span class="rpt-stat-num">97%</span><span class="rpt-stat-label">of buyers Google before buying local</span></div>
        <div class="rpt-stat"><span class="rpt-stat-num">#1</span><span class="rpt-stat-label">result gets 10× more clicks than #10</span></div>
        <div class="rpt-stat"><span class="rpt-stat-num">28%</span><span class="rpt-stat-label">of local searches lead to a purchase within 24 hrs</span></div>
      </div>
      <p class="rpt-upsell-note">Ty Alexander Media · Tampa Bay, FL · <a href="tel:+17273006573" style="color:var(--gold);text-decoration:none">727-300-6573</a></p>
    </div>`;
}

// ── HELPERS ────────────────────────────────────────────────────
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
  if (score >= 70) return 'var(--green)';
  if (score >= 45) return 'var(--medium)';
  return 'var(--critical)';
}

// ── INJECT DYNAMIC OFFER DATA ──────────────────────────────────
function injectReportOffers() {
  const { bizName, city, total, grade: storedGrade, revenueLeak, competitors } = analysisData;
  const grade = storedGrade || getLetterGrade(total);
  const comp  = competitors && competitors[0];
  const compName = comp?.name || comp?.business_name || comp?.title || null;

  const leadsRanges = [[25,'50–70'],[40,'35–50'],[60,'20–35'],[75,'10–20'],[101,'3–10']];
  const leadsStr = leadsRanges.find(([cap]) => total < cap)?.[1] || '3–10';
  const leakStr  = revenueLeak ? `$${Number(revenueLeak).toLocaleString()}/mo` : `~${leadsStr} calls/mo`;

  const gradeEmoji = { A:'🏆', B:'🐕', C:'🦮', D:'🐩', F:'🚨' };
  const gradeName  = { A:'Top Dog', B:'Good Boy', C:'Needs Training', D:'Lost the Scent', F:'Off the Leash' };
  const emoji = gradeEmoji[grade] || '🐾';
  const gname = gradeName[grade]  || 'Needs Work';

  const card97 = document.querySelector('.offer-97');
  if (card97 && total) {
    const existing = card97.querySelector('.offer-score-badge');
    if (existing) existing.remove();

    const badge = document.createElement('div');
    badge.className = 'offer-score-badge';
    badge.innerHTML = `
      <div class="osb-score">${total}<span>/100</span></div>
      <div class="osb-right">
        <div class="osb-grade">${emoji} ${gname}</div>
        <div class="osb-leak">Estimated loss: <strong>${leakStr}</strong></div>
      </div>`;
    card97.insertBefore(badge, card97.firstChild);

    const h3 = card97.querySelector('.offer-heading');
    if (h3) h3.textContent = `Fix ${bizName}'s SEO — $97`;
  }

  const card400 = document.getElementById('upsell-400');
  if (card400 && total) {
    const existing400 = card400.querySelector('.offer-score-badge');
    if (existing400) existing400.remove();

    const badge400 = document.createElement('div');
    badge400.className = 'offer-score-badge';
    badge400.innerHTML = `
      <div class="osb-score">${total}<span>/100</span></div>
      <div class="osb-right">
        <div class="osb-grade">${emoji} ${gname}</div>
        <div class="osb-leak">Lola found the gaps. Ty's team fixes them.</div>
      </div>`;
    card400.insertBefore(badge400, card400.firstChild);

    const h3_400 = card400.querySelector('.offer-heading');
    if (h3_400) h3_400.textContent = `Let Ty's Team Fix ${bizName}'s SEO`;
  }
}

// ── RESTART ────────────────────────────────────────────────────
$('restart-btn').addEventListener('click', () => {
  analysisData = {};
  $('seo-form').reset();
  goToStep('step-input');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── CTA PULSE ──────────────────────────────────────────────────
(function() {
  const ctaBtn = document.getElementById('analyze-btn');
  if (!ctaBtn) return;
  let pulseTimer = null;
  const startPulse = () => {
    clearTimeout(pulseTimer);
    pulseTimer = setTimeout(() => { ctaBtn.classList.add('pulse'); }, 4000);
  };
  ctaBtn.addEventListener('click', () => { ctaBtn.classList.remove('pulse'); clearTimeout(pulseTimer); });
  startPulse();
})();

// ── $400 SCROLL REVEAL ─────────────────────────────────────────
(function() {
  const upsell = document.getElementById('upsell-400');
  if (!upsell) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { upsell.classList.add('visible'); observer.unobserve(upsell); } });
  }, { threshold: 0.1 });
  observer.observe(upsell);
})();
