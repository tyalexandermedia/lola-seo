const RESEND_API_KEY = 're_Ar7MjxPa_HzuGzAD9Qwq6nRHVw4PMp5yD';

async function sendEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'LOLA SEO <onboarding@resend.dev>',
      to,
      subject,
      html,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, bizName, city, bizType, total, scores, issues, quickWins } = req.body;
    if (!email || !bizName) return res.status(400).json({ error: 'Missing fields' });

    const grade = total >= 85 ? 'A' : total >= 70 ? 'B' : total >= 55 ? 'C' : total >= 40 ? 'D' : 'F';
    const gradeLabel = total >= 85 ? '🐾 Best in Show' : total >= 70 ? '✅ Good Dog' : total >= 55 ? '🐕 Still Learning' : total >= 40 ? '⚠️ Needs Training' : '🚨 Off the Leash';
    const scoreColor = total >= 70 ? '#22c55e' : total >= 45 ? '#f59e0b' : '#ef4444';
    const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const issuesHtml = issues?.length
      ? issues.map(i => `<div style="margin-bottom:12px;padding:12px;background:#1e1e2e;border-left:3px solid #ef4444;border-radius:6px"><strong style="color:#f87171">${i.title}</strong><p style="color:#94a3b8;margin:4px 0 0;font-size:14px">${i.body}</p></div>`).join('')
      : '<p style="color:#22c55e">No critical issues found — Lola approves! 🐾</p>';

    const winsHtml = quickWins?.length
      ? quickWins.map((w, n) => `<div style="margin-bottom:12px;padding:12px;background:#1e1e2e;border-left:3px solid #d4a117;border-radius:6px"><strong style="color:#fbbf24">${n+1}. ${w.title}</strong> <span style="font-size:12px;color:#64748b">(${w.effort} Win)</span><p style="color:#94a3b8;margin:4px 0 0;font-size:14px">${w.body}</p></div>`).join('')
      : '';

    const catRows = [
      ['🌐 Site Health', scores?.siteHealth],
      ['📍 Local Presence', scores?.localPresence],
      ['📱 Mobile', scores?.mobile],
      ['⚡ Page Speed', scores?.speed],
      ['✍️ Content', scores?.content],
    ].map(([name, score]) => {
      const color = score >= 70 ? '#22c55e' : score >= 45 ? '#f59e0b' : '#ef4444';
      return `<tr><td style="padding:8px 0;color:#94a3b8;font-size:14px">${name}</td><td style="padding:8px 0;text-align:right;font-weight:700;color:${color}">${score}/100</td></tr>`;
    }).join('');

    // ── Email to Ty (lead notification) ──
    await sendEmail(
      'ty@tyalexandermedia.com',
      `🐾 Lola sniffed a new lead! ${bizName} scored ${total}/100`,
      `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0d1f4a;color:#fff;padding:24px;border-radius:12px">
        <h2 style="color:#d4a117;margin-top:0">🐾 New LOLA SEO Lead</h2>
        <p style="color:#94a3b8;margin:0 0 20px">${date}</p>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="color:#64748b;padding:4px 0">Business</td><td style="font-weight:700;text-align:right">${bizName}</td></tr>
          <tr><td style="color:#64748b;padding:4px 0">City</td><td style="text-align:right">${city}</td></tr>
          <tr><td style="color:#64748b;padding:4px 0">Lead Email</td><td style="text-align:right"><a href="mailto:${email}" style="color:#d4a117">${email}</a></td></tr>
          <tr><td style="color:#64748b;padding:4px 0">Score</td><td style="text-align:right;font-weight:700;color:${scoreColor}">${total}/100 — ${gradeLabel}</td></tr>
        </table>
        <hr style="border-color:#1e3a6e;margin:20px 0">
        <h3 style="color:#d4a117;margin:0 0 12px">Category Breakdown</h3>
        <table style="width:100%;border-collapse:collapse">${catRows}</table>
        <hr style="border-color:#1e3a6e;margin:20px 0">
        <h3 style="color:#f87171;margin:0 0 12px">What Lola Found</h3>
        ${issuesHtml}
        <a href="https://www.tyalexandermedia.com/contact" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#d4a117;color:#000;font-weight:700;border-radius:8px;text-decoration:none">Follow Up With This Lead →</a>
      </div>`
    );

    // ── Email to client (full report) ──
    await sendEmail(
      email,
      `🐾 Lola's SEO Report for ${bizName} — Score: ${total}/100`,
      `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0d1f4a;color:#fff;padding:0;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#1a3a8f,#0d1f4a);padding:32px 24px;text-align:center">
          <h1 style="color:#d4a117;margin:0 0 8px;font-size:28px">🐾 LOLA SEO</h1>
          <p style="color:#94a3b8;margin:0;font-size:14px">by Ty Alexander Media</p>
        </div>
        <div style="padding:24px">
          <p style="color:#94a3b8;margin:0 0 4px;font-size:13px">${date}</p>
          <h2 style="margin:0 0 4px">Lola's Report for <span style="color:#d4a117">${bizName}</span></h2>
          <p style="color:#64748b;margin:0 0 24px">${city}</p>

          <div style="text-align:center;padding:24px;background:#0a1228;border-radius:12px;margin-bottom:24px">
            <div style="font-size:56px;font-weight:800;color:${scoreColor}">${total}</div>
            <div style="color:#64748b;font-size:14px">out of 100</div>
            <div style="margin-top:8px;display:inline-block;padding:6px 16px;background:${scoreColor}22;border:1px solid ${scoreColor}55;border-radius:99px;color:${scoreColor};font-weight:700;font-size:14px">${gradeLabel}</div>
          </div>

          <h3 style="color:#d4a117;margin:0 0 12px">Score Breakdown</h3>
          <table style="width:100%;border-collapse:collapse">${catRows}</table>

          <hr style="border-color:#1e3a6e;margin:24px 0">
          <h3 style="color:#f87171;margin:0 0 12px">🚨 What Lola Sniffed Out</h3>
          ${issuesHtml}

          ${winsHtml ? `<hr style="border-color:#1e3a6e;margin:24px 0"><h3 style="color:#d4a117;margin:0 0 12px">🎾 Quick Fetches — Do These First</h3>${winsHtml}` : ''}

          <hr style="border-color:#1e3a6e;margin:24px 0">
          <div style="background:#0a1228;border-radius:12px;padding:20px;text-align:center">
            <p style="color:#d4a117;font-weight:700;margin:0 0 8px">Want Ty's team to fix all this for you?</p>
            <p style="color:#94a3b8;font-size:14px;margin:0 0 16px">Free 30-min strategy call. We'll walk through Lola's report together — no pressure, no tricks.</p>
            <a href="https://www.tyalexandermedia.com/contact" style="display:inline-block;padding:14px 28px;background:#d4a117;color:#000;font-weight:700;border-radius:8px;text-decoration:none;font-size:16px">Book a Free Strategy Call →</a>
          </div>

          <p style="color:#475569;font-size:12px;text-align:center;margin-top:24px">
            Ty Alexander Media · Tampa Bay, FL · 727-300-6573<br>
            <a href="https://www.tyalexandermedia.com" style="color:#d4a117">tyalexandermedia.com</a>
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
