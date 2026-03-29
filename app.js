/* ============================================================
   SEO SCORE ANALYZER — Ty Alexander Media
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
  ['step-input','step-loading','step-gate','step-report'].forEach(hide);
  show(step);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  updateStepIndicators(step);
}

function updateStepIndicators(step) {
  const stepMap = { 'step-input': 1, 'step-loading': 1, 'step-gate': 2, 'step-report': 3 };
  const current = stepMap[step] || 1;
  document.querySelectorAll('.step').forEach((el, i) => {
    const num = i + 1; // steps are 1,2,3 (indices 0,1,2)
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

  // Normalize URL
  let website = websiteRaw;
  if (!website.startsWith('http')) website = 'https://' + website;

  analysisData = { bizName, website, city, bizType };

  // Go to loading state
  // Fun rotating headlines while loading
  const headlines = [
    'Lola is on the scent… 🐽',
    'Sniffing your title tags… 👃',
    'Chasing down your page speed… 🏃',
    'Digging up your local signals… 🦮',
    'Fetching your SEO score… 🎾',
    'Almost got it! Good girl, Lola… 🐾',
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

  // Animate loading checks + progress bar
  setProgress(5);
  animateLoadCheck('lc1', 300,  18);
  animateLoadCheck('lc2', 900,  35);
  animateLoadCheck('lc3', 1600, 52);
  animateLoadCheck('lc4', 2300, 68);
  animateLoadCheck('lc5', 3000, 82);
  animateLoadCheck('lc6', 3700, 95);

  // Run real checks in parallel — hard 9s timeout so slow APIs never stall the flow
  const timeout = new Promise(resolve => setTimeout(resolve, 9000));
  const [siteData, speedData] = await Promise.all([
    Promise.race([fetchSiteData(website), timeout.then(() => ({ ok: false, httpsOk: website.startsWith('https://'), title: '', metaDesc: '', metaViewport: false, h1Text: '', h1Count: 0, canonicalTag: false, ogTags: false, schemaJson: false, wordCount: 0, imgCount: 0, altMissing: 0, internalLinks: 0, hasPhone: false, hasAddress: false, hasMaps: false, hasGBP: false }))]),
    Promise.race([fetchPageSpeed(website), timeout.then(() => ({ ok: false, performance: 50, accessibility: 50, seo: 50, isMobileOk: true, hasViewport: true, isCrawlable: true }))])
  ]);

  // Ensure loading animation has time to finish (min 5s from start)
  await sleep(1000);
  setProgress(100);

  // Score each category
  const scores = {
    siteHealth:   scoreSiteHealth(siteData, website),
    localPresence: scoreLocalPresence(siteData, bizName, city, bizType),
    mobile:        scoreMobile(speedData),
    speed:         scoreSpeed(speedData),
    content:       scoreContent(siteData, bizName, city)
  };

  // Overall weighted score
  const total = Math.round(
    scores.siteHealth   * 0.25 +
    scores.localPresence * 0.30 +
    scores.mobile        * 0.15 +
    scores.speed         * 0.15 +
    scores.content       * 0.15
  );

  analysisData.scores = scores;
  analysisData.total = total;
  analysisData.siteData = siteData;
  analysisData.speedData = speedData;

  // Determine issues and quick wins
  analysisData.issues = buildIssues(scores, siteData, speedData, website, bizName, city);
  analysisData.quickWins = buildQuickWins(scores, siteData, city);

  // Show teaser / gate
  showGate(total, bizName);
}

// ── REAL DATA FETCHERS ────────────────────────────────────────

async function fetchSiteData(url) {
  try {
    // Use a CORS proxy to fetch the target page HTML
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}&timestamp=${Date.now()}`;
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error('fetch failed');
    const json = await res.json();
    const html = json.contents || '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const title = doc.querySelector('title')?.textContent?.trim() || '';
    const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
    const metaViewport = !!doc.querySelector('meta[name="viewport"]');
    const h1s = doc.querySelectorAll('h1');
    const h1Text = h1s[0]?.textContent?.trim() || '';
    const bodyText = doc.body?.innerText || doc.body?.textContent || '';
    const canonicalTag = !!doc.querySelector('link[rel="canonical"]');
    const ogTags = !!doc.querySelector('meta[property^="og:"]');
    const schemaJson = !!doc.querySelector('script[type="application/ld+json"]');
    const httpsOk = url.startsWith('https://');
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;
    const imgCount = doc.querySelectorAll('img').length;
    const altMissing = Array.from(doc.querySelectorAll('img')).filter(img => !img.getAttribute('alt')).length;
    const internalLinks = Array.from(doc.querySelectorAll('a[href]')).filter(a => {
      try { const href = a.getAttribute('href'); return href && !href.startsWith('http') && !href.startsWith('mailto'); }
      catch { return false; }
    }).length;

    // Check for local signals
    const lowerHtml = html.toLowerCase();
    const hasPhone = /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\(\d{3}\)\s?\d{3}[-.\s]?\d{4})/.test(html);
    const hasAddress = /(street|avenue|blvd|drive|road|suite|\bst\b|\bave\b|\bdr\b)/i.test(html);
    const hasMaps = lowerHtml.includes('google.com/maps') || lowerHtml.includes('maps.google') || lowerHtml.includes('goo.gl/maps');
    const hasGBP = lowerHtml.includes('business.google') || lowerHtml.includes('g.page') || lowerHtml.includes('g.co/');

    return {
      ok: true, title, metaDesc, metaViewport, h1Text, h1Count: h1s.length,
      canonicalTag, ogTags, schemaJson, httpsOk, wordCount, imgCount, altMissing,
      internalLinks, hasPhone, hasAddress, hasMaps, hasGBP
    };
  } catch (err) {
    // Fallback: infer from URL only
    const httpsOk = url.startsWith('https://');
    return {
      ok: false, httpsOk, title: '', metaDesc: '', metaViewport: false,
      h1Text: '', h1Count: 0, canonicalTag: false, ogTags: false, schemaJson: false,
      wordCount: 0, imgCount: 0, altMissing: 0, internalLinks: 0,
      hasPhone: false, hasAddress: false, hasMaps: false, hasGBP: false
    };
  }
}

async function fetchPageSpeed(url) {
  try {
    // Google PageSpeed Insights API (no key needed for basic usage)
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&category=accessibility&category=seo`;
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(12000) });
    if (res.status === 429 || res.status === 503 || !res.ok) throw new Error('pagespeed failed');
    const data = await res.json();

    const cats = data.lighthouseResult?.categories || {};
    const audits = data.lighthouseResult?.audits || {};

    return {
      ok: true,
      performance: Math.round((cats.performance?.score || 0) * 100),
      accessibility: Math.round((cats.accessibility?.score || 0) * 100),
      seo: Math.round((cats.seo?.score || 0) * 100),
      fcp: audits['first-contentful-paint']?.displayValue || '',
      lcp: audits['largest-contentful-paint']?.displayValue || '',
      cls: audits['cumulative-layout-shift']?.displayValue || '',
      isMobileOk: (cats.performance?.score || 0) >= 0.5,
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
  if (s.httpsOk)        score += 25;  // HTTPS
  if (s.title?.length > 10 && s.title?.length < 70) score += 20;
  else if (s.title?.length > 0) score += 10;
  if (s.metaDesc?.length > 50 && s.metaDesc?.length < 160) score += 20;
  else if (s.metaDesc?.length > 0) score += 8;
  if (s.canonicalTag)   score += 10;
  if (s.ogTags)         score += 10;
  if (s.schemaJson)     score += 15;
  return Math.min(score, 100);
}

function scoreLocalPresence(s, bizName, city, bizType) {
  let score = 0;
  if (s.hasPhone)   score += 28;
  if (s.hasAddress) score += 22;
  if (s.hasMaps)    score += 15;
  if (s.hasGBP)     score += 15;
  if (s.schemaJson) score += 10;  // local business schema
  // Check if city name appears in title or meta
  const cityLower = city.split(',')[0].toLowerCase();
  if (s.title?.toLowerCase().includes(cityLower))   score += 5;
  if (s.metaDesc?.toLowerCase().includes(cityLower)) score += 5;
  return Math.min(score, 100);
}

function scoreMobile(p) {
  if (!p.ok) return 55; // neutral fallback
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
  if (s.h1Count === 1)  score += 25;  // exactly one H1
  else if (s.h1Count > 1) score += 10;
  if (s.wordCount > 300) score += 20;
  else if (s.wordCount > 100) score += 10;
  if (s.internalLinks > 2) score += 15;
  if (s.imgCount > 0) score += 10;
  const altRatio = s.imgCount > 0 ? 1 - (s.altMissing / s.imgCount) : 1;
  score += Math.round(altRatio * 15);
  if (s.ogTags) score += 15;
  return Math.min(score, 100);
}

// ── ISSUE BUILDER ─────────────────────────────────────────────

function buildIssues(scores, siteData, speedData, url, bizName, city) {
  const issues = [];

  if (!siteData.httpsOk)
    issues.push({ icon:'🔓', severity:'error', title:'No HTTPS / SSL Certificate', body:'Your site runs on HTTP, not HTTPS. Google treats this as insecure and can suppress your ranking. Most hosting providers offer free SSL — enable it today.' });

  if (!siteData.title || siteData.title.length < 10)
    issues.push({ icon:'📄', severity:'error', title:'Missing or Too-Short Page Title', body:'Your homepage title tag is missing or very short. This is one of the most important on-page SEO signals. It should be 50–60 characters and include your primary keyword and city.' });
  else if (siteData.title.length > 65)
    issues.push({ icon:'📄', severity:'warn', title:'Page Title Too Long', body:`Your title is ${siteData.title.length} characters. Google truncates titles over 60 characters in search results, cutting off your message.` });

  if (!siteData.metaDesc || siteData.metaDesc.length < 50)
    issues.push({ icon:'📝', severity:'error', title:'Missing Meta Description', body:'No meta description detected. This is the text that appears under your link in Google results. Without it, Google writes its own — often poorly.' });

  if (!siteData.hasPhone)
    issues.push({ icon:'📞', severity:'error', title:'No Phone Number Detected', body:'Google uses NAP (Name, Address, Phone) consistency for local ranking. Your phone number should be visible in the text of your page, not just in an image.' });

  if (!siteData.hasAddress)
    issues.push({ icon:'📍', severity:'error', title:'No Physical Address Found', body:'For local SEO, your address needs to appear as crawlable text on your website — ideally in your footer on every page and in a Contact section.' });

  if (!siteData.schemaJson)
    issues.push({ icon:'🗂️', severity:'warn', title:'No Structured Data (Schema Markup)', body:'Schema markup tells Google exactly what type of business you are. Adding LocalBusiness schema can improve how you appear in local search results and Google Maps.' });

  if (speedData.ok && speedData.performance < 50)
    issues.push({ icon:'⚡', severity:'error', title:`Slow Page Speed (${speedData.performance}/100)`, body:`Your site scores ${speedData.performance}/100 on mobile performance. Slow sites rank lower and lose 53% of visitors before the page loads.${speedData.lcp ? ' Largest Contentful Paint: ' + speedData.lcp + '.' : ''}` });
  else if (speedData.ok && speedData.performance < 75)
    issues.push({ icon:'⚡', severity:'warn', title:`Page Speed Needs Improvement (${speedData.performance}/100)`, body:`Mobile performance score is ${speedData.performance}/100. Google's threshold for "good" is 90+. Optimizing images and reducing render-blocking resources would help most.` });

  if (siteData.h1Count === 0)
    issues.push({ icon:'🔤', severity:'warn', title:'No H1 Heading Found', body:'Your page has no H1 tag. Every page should have exactly one H1 that clearly describes the page topic and includes your primary keyword.' });
  else if (siteData.h1Count > 2)
    issues.push({ icon:'🔤', severity:'warn', title:'Multiple H1 Tags Detected', body:`Found ${siteData.h1Count} H1 tags. Best practice is exactly one H1 per page to signal the primary topic clearly to search engines.` });

  if (siteData.wordCount < 200 && siteData.ok)
    issues.push({ icon:'✍️', severity:'warn', title:'Very Thin Page Content', body:`Only ~${siteData.wordCount} words detected on the homepage. Google favors pages with substantive content (300+ words) that genuinely answers user questions.` });

  return issues.slice(0, 6); // Show top 6 issues
}

// ── QUICK WINS BUILDER ─────────────────────────────────────────

function buildQuickWins(scores, siteData, city) {
  const wins = [];
  const cityName = city.split(',')[0];

  if (!siteData.metaDesc || siteData.metaDesc.length < 50)
    wins.push({ title: 'Write a Meta Description', body: `Add a 150-character description to your homepage that includes your city (${cityName}) and main service. This shows up directly in Google results and increases click rates.`, effort: 'Easy', effortClass: '' });

  if (!siteData.hasPhone)
    wins.push({ title: 'Add Your Phone Number as Text', body: 'Place your phone number as visible, copyable text in your page header and footer — not just as an image. Google needs to read it to confirm your NAP.', effort: 'Easy', effortClass: '' });

  if (!siteData.schemaJson)
    wins.push({ title: 'Add LocalBusiness Schema', body: `Add JSON-LD structured data to your site declaring your business name, address, phone, and service area (${cityName}). Free tools like TechnicalSEO.com/tools/schema-markup-generator/ generate it in minutes.`, effort: 'Easy', effortClass: '' });

  if (scores.speed < 60)
    wins.push({ title: 'Compress Your Images', body: "Images are the #1 cause of slow load times. Run your site through TinyPNG.com or Squoosh.app to reduce image file sizes by 60–80% without visible quality loss.", effort: 'Easy', effortClass: '' });

  if (!siteData.hasAddress)
    wins.push({ title: `Add "${cityName}" to Your Page Title`, body: `Update your homepage title tag to include your city and main service: e.g. "Pressure Washing Services in ${cityName} | [Your Business Name]". This is the single highest-impact on-page local SEO change you can make.`, effort: 'Medium', effortClass: 'medium' });

  wins.push({ title: 'Claim & Optimize Your Google Business Profile', body: 'If you haven\'t already, claim your free Google Business Profile at business.google.com. Fully filling it out (hours, photos, services) is the fastest path to showing up in the Local Pack — the 3 businesses at the top of local search.', effort: 'Easy', effortClass: '' });

  return wins.slice(0, 3);
}

// ── SHOW GATE ─────────────────────────────────────────────────

function showGate(total, bizName) {
  $('teaser-score-num').textContent = total;
  $('teaser-score-label').textContent = getGradeLabel(total);
  $('teaser-score-label').style.color = getScoreColor(total);
  $('gate-biz-name').textContent = bizName;

  // Animate ring
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

  // Lock button while sending
  const unlockBtn = $('unlock-btn');
  const unlockText = $('unlock-btn-text');
  if (unlockBtn) { unlockBtn.disabled = true; unlockBtn.style.opacity = '0.7'; }
  if (unlockText) unlockText.textContent = 'Sending…';

  try {
    await fetch('/api/capture-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        bizName: analysisData.bizName,
        city: analysisData.city,
        bizType: analysisData.bizType,
        total: analysisData.total,
        scores: analysisData.scores,
        issues: analysisData.issues,
        quickWins: analysisData.quickWins,
      })
    });
    // Show "report sent" confirmation
    const confirm = $('email-sent-confirm');
    if (confirm) confirm.classList.remove('hidden');
  } catch(e) {}

  // Brief pause so user sees the confirmation
  await sleep(1400);
  showReport();
});

// ── SHOW FULL REPORT ──────────────────────────────────────────

function showReport() {
  const { bizName, city, total, scores, issues, quickWins } = analysisData;

  // Score ring
  const pct = total / 100;
  const circumference = 364;
  const dashOffset = circumference - (circumference * pct);
  setTimeout(() => {
    $('report-ring-fill').style.strokeDashoffset = dashOffset;
  }, 200);

  $('report-score-num').textContent = total;
  $('report-status-badge').textContent = getGradeLabel(total);
  $('report-status-badge').style.color = getScoreColor(total);

  // Badge
  const badge = $('report-badge');
  const grade = getLetterGrade(total);
  badge.textContent = `Grade ${grade} — ${getGradeLabel(total)}`;
  badge.className = `report-badge grade-${grade.toLowerCase()}`;

  // Headline
  const headlines = {
    'A': '🏆 Best in show — Lola is impressed! Here\'s how to stay on top.',
    'B': '🐕 Good dog! A few more tricks and you\'re top of the pack.',
    'C': '🐾 You\'re in the middle of the pack — your competitors smell blood.',
    'D': '⚠️ Lola is concerned. Google can barely find you right now.',
    'F': '🚨 Off the leash! You\'re basically invisible on Google.'
  };
  $('report-headline').textContent = headlines[grade] || 'Here\'s your full breakdown.';
  $('report-subline').textContent = `${bizName} · ${city}`;
  $('report-biz-name-display').textContent = bizName;
  $('report-city-display').textContent = city;
  $('report-date-display').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Categories
  const cats = [
    { emoji: '🌐', name: 'Site Health', score: scores.siteHealth, desc: 'HTTPS, title tags, meta description, schema markup' },
    { emoji: '📍', name: 'Local Presence', score: scores.localPresence, desc: 'Phone, address, Google Maps, local schema' },
    { emoji: '📱', name: 'Mobile Experience', score: scores.mobile, desc: 'Viewport, mobile performance, accessibility' },
    { emoji: '⚡', name: 'Page Speed', score: scores.speed, desc: 'Load time, Core Web Vitals, performance score' },
    { emoji: '✍️', name: 'Content Quality', score: scores.content, desc: 'H1 tags, word count, images, internal links' },
  ];

  const catsGrid = $('categories-grid');
  catsGrid.innerHTML = '';
  cats.forEach(cat => {
    const barClass = cat.score >= 70 ? 'bar-good' : cat.score >= 45 ? 'bar-ok' : 'bar-bad';
    const numClass = cat.score >= 70 ? 'score-good' : cat.score >= 45 ? 'score-ok' : 'score-bad';
    const row = document.createElement('div');
    row.className = 'category-row';
    row.innerHTML = `
      <div class="cat-left">
        <div class="cat-title-row">
          <span class="cat-emoji">${cat.emoji}</span>
          <span class="cat-name">${cat.name}</span>
        </div>
        <div class="cat-bar-wrap"><div class="cat-bar ${barClass}" style="width:0%" data-width="${cat.score}%"></div></div>
        <span class="cat-desc">${cat.desc}</span>
      </div>
      <span class="cat-score-badge ${numClass}">${cat.score}</span>
    `;
    catsGrid.appendChild(row);
  });

  // Animate bars after render
  setTimeout(() => {
    document.querySelectorAll('.cat-bar[data-width]').forEach(bar => {
      bar.style.width = bar.dataset.width;
    });
  }, 300);

  // Issues
  const issuesList = $('issues-list');
  if (issues.length === 0) {
    issuesList.innerHTML = '<p style="color:var(--text-muted);font-size:0.875rem;">No critical issues found. Nice work!</p>';
    $('issues-section').style.display = 'none';
  } else {
    issuesList.innerHTML = issues.map(issue => `
      <div class="issue-item${issue.severity === 'warn' ? ' warn' : ''}">
        <span class="issue-icon">${issue.icon}</span>
        <div class="issue-text">
          <strong>${issue.title}</strong>
          <p>${issue.body}</p>
        </div>
      </div>
    `).join('');
  }

  // Quick wins
  const qwList = $('quickwins-list');
  qwList.innerHTML = quickWins.map((win, i) => `
    <div class="qw-item">
      <div class="qw-num">${i + 1}</div>
      <div class="qw-text">
        <strong>${win.title}</strong>
        <p>${win.body}</p>
        <span class="qw-effort ${win.effortClass}">${win.effort} Win</span>
      </div>
    </div>
  `).join('');

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
