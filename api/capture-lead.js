const RESEND_API_KEY = 're_Ar7MjxPa_HzuGzAD9Qwq6nRHVw4PMp5yD';
const NOTIFY_EMAIL  = 'ty@tyalexandermedia.com';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function sendEmail(to, subject, html, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'LOLA SEO <lola@tyalexandermedia.com>',
          to, subject, html,
        }),
      });
      const data = await res.json();
      if (res.status === 429) {
        await sleep(attempt * 1200);
        continue;
      }
      if (!res.ok) throw new Error(JSON.stringify(data));
      return data;
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(attempt * 800);
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────
function getGradeLabel(total) {
  if (total >= 85) return '🐾 Best in Show';
  if (total >= 70) return '✅ Good Dog';
  if (total >= 55) return '🐕 Still Learning';
  if (total >= 40) return '⚠️ Needs Training';
  return '🚨 Off the Leash';
}
function getLetterGrade(total) {
  if (total >= 85) return 'A';
  if (total >= 70) return 'B';
  if (total >= 55) return 'C';
  if (total >= 40) return 'D';
  return 'F';
}
function scoreColor(s) {
  return s >= 70 ? '#22c55e' : s >= 45 ? '#f59e0b' : '#ef4444';
}
function impactColor(cls) {
  return cls === 'critical' ? '#ef4444' : cls === 'high' ? '#f59e0b' : '#64748b';
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, bizName, city, bizType, total, scores, issues, quickWins } = req.body;
    if (!email || !bizName) return res.status(400).json({ error: 'Missing fields' });

    const grade      = getLetterGrade(total);
    const gradeLabel = getGradeLabel(total);
    const sc         = scoreColor(total);
    const date       = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const cityName   = (city || '').split(',')[0];

    // ── Category rows ──
    const catRows = [
      ['🌐 Site Health',    scores?.siteHealth,    'HTTPS, title tags, meta, schema'],
      ['📍 Local Presence', scores?.localPresence, 'Phone, address, GBP, NAP'],
      ['📱 Mobile',         scores?.mobile,        'Viewport, mobile performance'],
      ['⚡ Page Speed',     scores?.speed,         'Core Web Vitals, load time'],
      ['✍️ Content',        scores?.content,       'H1s, word count, structure'],
    ].map(([name, score, sub]) => {
      const c = scoreColor(score);
      const label = score >= 70 ? 'Strong' : score >= 45 ? 'Needs Work' : 'Critical Gap';
      return `
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #1c2b4a">
            <div style="font-size:14px;font-weight:700;color:#dde4f5">${name}</div>
            <div style="font-size:12px;color:#4a5d80;margin-top:2px">${sub}</div>
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #1c2b4a;text-align:center;white-space:nowrap">
            <span style="font-size:11px;font-weight:700;padding:3px 8px;border-radius:99px;background:${c}20;color:${c};border:1px solid ${c}44">${label}</span>
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #1c2b4a;text-align:right;font-size:18px;font-weight:800;color:${c}">${score}</td>
        </tr>`;
    }).join('');

    // ── Issues HTML ──
    const issuesHtml = issues?.length
      ? issues.map(issue => {
          const ic = impactColor(issue.impactClass);
          return `
            <div style="margin-bottom:10px;border:1px solid #1c2b4a;border-left:3px solid ${ic};border-radius:8px;padding:12px 14px">
              <div style="display:flex;align-items:flex-start;gap:10px">
                <span style="font-size:18px;flex-shrink:0">${issue.icon || '•'}</span>
                <div style="flex:1">
                  <div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:5px">
                    <strong style="font-size:14px;color:#dde4f5;line-height:1.3">${issue.title}</strong>
                    <span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:99px;background:${ic}20;color:${ic};border:1px solid ${ic}44;white-space:nowrap">${issue.impactClass === 'critical' ? 'Critical' : issue.impactClass === 'high' ? 'High' : 'Medium'}</span>
                  </div>
                  <p style="font-size:13px;color:#7a8db8;line-height:1.65;margin:0">${issue.impact || issue.body || ''}</p>
                </div>
              </div>
            </div>`;
        }).join('')
      : '<p style="color:#22c55e;font-size:14px">No critical issues found — Lola approves! 🐾</p>';

    // ── Quick wins HTML — no DIY steps, Ty's team framing ──
    const winsHtml = quickWins?.length
      ? quickWins.map((win, n) => `
          <div style="margin-bottom:12px;border:1px solid rgba(34,197,94,0.2);border-radius:8px;overflow:hidden;background:rgba(34,197,94,0.03)">
            <div style="padding:14px">
              <div style="display:flex;align-items:flex-start;gap:10px">
                <div style="width:24px;height:24px;min-width:24px;border-radius:50%;background:#22c55e;color:#061410;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;margin-top:2px">${n+1}</div>
                <div style="flex:1">
                  <strong style="font-size:14px;color:#dde4f5;line-height:1.3;display:block;margin-bottom:6px">${win.title}</strong>
                  <p style="font-size:13px;color:#7a8db8;line-height:1.65;margin:0 0 8px">${win.why || win.body || ''}</p>
                  <p style="font-size:13px;color:#e4b118;line-height:1.55;margin:0;font-style:italic">${win.action || ''}</p>
                </div>
              </div>
            </div>
          </div>`).join('')
      : '';

    // ── Context-aware grade message ──
    const gradeMessages = {
      'A': 'Strong signals across the board. Focus on content depth and review velocity to stay at the top.',
      'B': 'Solid foundation in place. The issues below are the gap between good and dominant.',
      'C': 'Competing but leaving rankings on the table. Fix issues below in order of priority.',
      'D': 'Foundational gaps suppressing every other effort. Start with Critical issues first.',
      'F': 'Missing core signals Google needs to rank local businesses. This fix list is your playbook.'
    };

    // ══════════════════════════════════════════
    // EMAIL 1: Lead notification to Ty
    // ══════════════════════════════════════════
    await sendEmail(
      NOTIFY_EMAIL,
      `🐾 New lead: ${bizName} scored ${total}/100 — Grade ${grade}`,
      `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#0c1020;color:#dde4f5;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#1a3a8f,#0d1f4a);padding:24px;text-align:center">
          <h1 style="color:#d4a117;margin:0 0 4px;font-size:22px">🐾 LOLA SEO — New Lead</h1>
          <p style="color:#7a8db8;margin:0;font-size:13px">${date}</p>
        </div>
        <div style="padding:24px">
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
            <tr><td style="color:#4a5d80;padding:6px 0;font-size:13px;width:110px">Business</td><td style="font-weight:700;font-size:15px">${bizName}</td></tr>
            <tr><td style="color:#4a5d80;padding:6px 0;font-size:13px">City</td><td style="font-size:14px">${city}</td></tr>
            <tr><td style="color:#4a5d80;padding:6px 0;font-size:13px">Industry</td><td style="font-size:14px">${bizType || 'Not specified'}</td></tr>
            <tr><td style="color:#4a5d80;padding:6px 0;font-size:13px">Lead Email</td><td><a href="mailto:${email}" style="color:#d4a117;font-size:14px">${email}</a></td></tr>
            <tr><td style="color:#4a5d80;padding:6px 0;font-size:13px">Score</td><td style="font-weight:800;font-size:22px;color:${sc}">${total}/100 <span style="font-size:13px;font-weight:600">${gradeLabel}</span></td></tr>
          </table>
          <div style="background:#0a0f1f;border-radius:8px;padding:16px;margin-bottom:20px">
            <div style="font-size:11px;font-weight:700;color:#d4a117;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px">Category Breakdown</div>
            <table style="width:100%;border-collapse:collapse">${catRows}</table>
          </div>
          <div style="background:#0a0f1f;border-radius:8px;padding:14px;margin-bottom:20px">
            <div style="font-size:11px;font-weight:700;color:#f87171;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">Top Issue</div>
            <p style="font-size:13px;color:#7a8db8;margin:0">${issues?.[0] ? `<strong style="color:#dde4f5">${issues[0].title}</strong> — ${issues[0].body?.substring(0, 120)}...` : 'No critical issues found'}</p>
          </div>
          <div style="text-align:center">
            <a href="mailto:${email}?subject=Your LOLA SEO Report for ${encodeURIComponent(bizName)}" style="display:inline-block;padding:14px 28px;background:#d4a117;color:#000;font-weight:700;border-radius:8px;text-decoration:none;font-size:15px;margin-bottom:10px">Reply to This Lead →</a>
            <br>
            <a href="https://www.tyalexandermedia.com/contact" style="font-size:12px;color:#4a5d80">Schedule follow-up call</a>
          </div>
        </div>
      </div>`
    );

    await sleep(400);

    // ══════════════════════════════════════════
    // EMAIL 2: Full actionable report to client
    // ══════════════════════════════════════════
    await sendEmail(
      email,
      `Your LOLA SEO Report: ${bizName} scored ${total}/100 — ${gradeLabel}`,
      `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#0c1020;color:#dde4f5;border-radius:12px;overflow:hidden">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#1a3a8f,#0d1f4a);padding:32px 24px;text-align:center">
          <h1 style="color:#d4a117;margin:0 0 6px;font-size:26px">🐾 LOLA SEO</h1>
          <p style="color:#7a8db8;margin:0;font-size:13px">by Ty Alexander Media · ${date}</p>
        </div>

        <div style="padding:28px 24px">

          <!-- Score block -->
          <div style="text-align:center;padding:24px;background:#0a1228;border-radius:12px;margin-bottom:24px">
            <div style="font-size:64px;font-weight:800;color:${sc};line-height:1">${total}</div>
            <div style="color:#4a5d80;font-size:13px;margin-top:4px">out of 100</div>
            <div style="margin-top:10px;display:inline-block;padding:6px 18px;background:${sc}20;border:1px solid ${sc}44;border-radius:99px;color:${sc};font-weight:700;font-size:14px">${gradeLabel} — Grade ${grade}</div>
            <p style="color:#7a8db8;font-size:13px;margin:12px 0 0;line-height:1.6">${gradeMessages[grade] || ''}</p>
          </div>

          <!-- Category table -->
          <h2 style="font-size:16px;font-weight:700;color:#dde4f5;margin:0 0 12px;padding-bottom:10px;border-bottom:1px solid #1c2b4a">🐾 Score Breakdown</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:28px">
            <thead>
              <tr>
                <th style="text-align:left;font-size:11px;font-weight:700;color:#4a5d80;text-transform:uppercase;letter-spacing:0.07em;padding:0 8px 10px">Category</th>
                <th style="text-align:center;font-size:11px;font-weight:700;color:#4a5d80;text-transform:uppercase;letter-spacing:0.07em;padding:0 8px 10px">Status</th>
                <th style="text-align:right;font-size:11px;font-weight:700;color:#4a5d80;text-transform:uppercase;letter-spacing:0.07em;padding:0 8px 10px">Score</th>
              </tr>
            </thead>
            <tbody>${catRows}</tbody>
          </table>

          <!-- Issues with step-by-step fixes -->
          <h2 style="font-size:16px;font-weight:700;color:#dde4f5;margin:0 0 12px;padding-bottom:10px;border-bottom:1px solid #1c2b4a">🚨 What Lola Sniffed Out</h2>
          <p style="font-size:13px;color:#7a8db8;margin:0 0 16px">Each issue below comes with a step-by-step fix you can act on today. Prioritized by impact.</p>
          ${issuesHtml}

          <!-- Quick wins -->
          ${winsHtml ? `
          <h2 style="font-size:16px;font-weight:700;color:#dde4f5;margin:24px 0 12px;padding-bottom:10px;border-bottom:1px solid #1c2b4a">🎾 Quick Wins — Do These First</h2>
          <p style="font-size:13px;color:#7a8db8;margin:0 0 16px">These are the highest-leverage moves ranked by speed and impact. Each one includes a how-to.</p>
          ${winsHtml}` : ''}

          <!-- Quick Fix Offer -->
          <div style="background:linear-gradient(135deg,#0f1d3a,#091020);border:1px solid rgba(228,177,24,0.3);border-radius:12px;padding:24px;margin-top:24px;margin-bottom:16px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#e4b118;margin-bottom:10px">⚡ Instant Fix Available</div>
            <h2 style="font-size:20px;font-weight:800;color:#fff;margin:0 0 10px">The Quick Fix Package — $97</h2>
            <p style="font-size:13px;color:#94a8cc;margin:0 0 16px;line-height:1.7">Ty's team implements your fixable items — title tags, meta descriptions, schema markup, and Open Graph tags — directly on your site within 24 hours. No call needed.</p>
            <div style="margin-bottom:16px">
              <div style="font-size:12px;color:#94a8cc;margin-bottom:8px">✓ Title tag optimized for your city + service<br>✓ Meta description written to convert clicks<br>✓ Schema markup installed<br>✓ Open Graph tags for social sharing</div>
            </div>
            <a href="https://www.tyalexandermedia.com/contact?offer=quick-fix" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#f0c840,#e4b118);color:#07100a;font-weight:800;border-radius:8px;text-decoration:none;font-size:15px">Get It Fixed for $97 →</a>
          </div>

          <!-- Upsell block -->
          <div style="background:linear-gradient(135deg,#111828,rgba(26,58,143,0.25));border:1px solid rgba(212,161,23,0.2);border-radius:12px;padding:24px;margin-top:0;text-align:center">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#d4a117;margin-bottom:10px">Want the Full Strategy?</div>
            <h2 style="font-size:20px;font-weight:800;color:#fff;margin:0 0 12px;line-height:1.3">Every Day You're Not on Page 1,<br>Your Competitor Gets the Sale.</h2>
            <p style="font-size:13px;color:#7a8db8;margin:0 0 20px;line-height:1.7">Lola just handed you the full playbook. But most business owners read reports like this, feel overwhelmed, and do nothing — which is exactly why their competitors keep winning. Ty's team implements everything in this report for you.</p>

            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:16px">
              <div style="background:#0a1228;border:1px solid #1c2b4a;border-radius:8px;padding:14px 16px;min-width:140px;text-align:center">
                <div style="font-size:22px;font-weight:800;color:#d4a117">97%</div>
                <div style="font-size:11px;color:#4a5d80;margin-top:4px">of buyers check Google before purchasing local</div>
              </div>
              <div style="background:#0a1228;border:1px solid #1c2b4a;border-radius:8px;padding:14px 16px;min-width:140px;text-align:center">
                <div style="font-size:22px;font-weight:800;color:#d4a117">#1</div>
                <div style="font-size:11px;color:#4a5d80;margin-top:4px">result gets 10× more clicks than #10</div>
              </div>
              <div style="background:#0a1228;border:1px solid #1c2b4a;border-radius:8px;padding:14px 16px;min-width:140px;text-align:center">
                <div style="font-size:22px;font-weight:800;color:#d4a117">28%</div>
                <div style="font-size:11px;color:#4a5d80;margin-top:4px">of local searches result in a purchase within 24 hrs</div>
              </div>
            </div>

            <div style="text-align:left;background:#0a1228;border-radius:8px;padding:16px;margin-bottom:20px">
              <div style="font-size:12px;font-weight:700;color:#dde4f5;margin-bottom:12px">What Ty's team does for you:</div>
              <div style="display:flex;flex-direction:column;gap:8px">
                <div style="display:flex;gap:8px;font-size:13px;color:#7a8db8"><span style="color:#22c55e;font-weight:800;flex-shrink:0">✓</span><div><strong style="color:#dde4f5">Local keyword domination</strong> — we find the exact searches your buyers type when they're ready to spend money in ${cityName}</div></div>
                <div style="display:flex;gap:8px;font-size:13px;color:#7a8db8"><span style="color:#22c55e;font-weight:800;flex-shrink:0">✓</span><div><strong style="color:#dde4f5">Google Business Profile</strong> — fully optimized GBP is the fastest path into the local pack</div></div>
                <div style="display:flex;gap:8px;font-size:13px;color:#7a8db8"><span style="color:#22c55e;font-weight:800;flex-shrink:0">✓</span><div><strong style="color:#dde4f5">On-page fixes, speed &amp; citations</strong> — everything in this report, implemented for you</div></div>
                <div style="display:flex;gap:8px;font-size:13px;color:#7a8db8"><span style="color:#22c55e;font-weight:800;flex-shrink:0">✓</span><div><strong style="color:#dde4f5">Transparent monthly reporting</strong> — you see exactly what ranked, what moved, what revenue it drove</div></div>
              </div>
            </div>

            <a href="https://www.tyalexandermedia.com/contact" style="display:inline-block;padding:16px 32px;background:#d4a117;color:#000;font-weight:700;border-radius:8px;text-decoration:none;font-size:16px;margin-bottom:10px">Book a Free Strategy Call →</a>
            <p style="color:#4a5d80;font-size:12px;margin:0">30 minutes. No pitch. We walk through this report live and show you exactly what we'd do — yours to keep even if you never hire us.</p>
          </div>

          <!-- Footer -->
          <p style="color:#3a4d70;font-size:12px;text-align:center;margin-top:24px;line-height:1.7">
            Ty Alexander Media · Tampa Bay, FL · 727-300-6573<br>
            <a href="https://www.tyalexandermedia.com" style="color:#d4a117">tyalexandermedia.com</a> ·
            <a href="https://www.instagram.com/tyalexandermedia" style="color:#d4a117">@tyalexandermedia</a>
          </p>
        </div>
      </div>`
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: err.message });
  }
};
