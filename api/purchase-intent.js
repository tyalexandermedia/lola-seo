// ── LOLA SEO — Purchase Intent Capture ───────────────────────────
// Fires when a user clicks the Quick Fix offer.
// Sends Ty an instant notification email with full context.
// ─────────────────────────────────────────────────────────────────

const RESEND_API_KEY = 're_Ar7MjxPa_HzuGzAD9Qwq6nRHVw4PMp5yD';
const NOTIFY_EMAIL  = 'ty@tyalexandermedia.com';

async function sendEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'LOLA SEO <lola@tyalexandermedia.com>', to, subject, html }),
  });
  return res.json();
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, bizName, city, website, total, grade, issues, offer } = req.body;
    if (!email || !bizName) return res.status(400).json({ error: 'Missing fields' });

    const scoreColor = total >= 70 ? '#22c55e' : total >= 45 ? '#fbbf24' : '#f87171';
    const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Critical issues summary for Ty
    const criticalIssues = (issues || [])
      .filter(i => i.impactClass === 'critical' || i.impactClass === 'high')
      .slice(0, 5)
      .map(i => `<li style="color:#94a8cc;font-size:13px;margin-bottom:6px">${i.icon || '•'} <strong style="color:#eef2ff">${i.title}</strong></li>`)
      .join('');

    // ── Notify Ty instantly ──
    await sendEmail(
      NOTIFY_EMAIL,
      `🔥 HOT LEAD: ${bizName} clicked Quick Fix — Score ${total}/100`,
      `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#090e1e;color:#eef2ff;border-radius:12px;overflow:hidden;border:1px solid #1a3a8f">
        <div style="background:linear-gradient(135deg,#1a3a8f,#0c1635);padding:20px 24px;display:flex;align-items:center;gap:12px">
          <div style="font-size:28px">🔥</div>
          <div>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#e4b118;margin-bottom:2px">Purchase Intent</div>
            <div style="font-size:18px;font-weight:800;color:#fff">${bizName} wants the Quick Fix</div>
          </div>
        </div>
        <div style="padding:24px">
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;background:#0d1224;border-radius:8px;overflow:hidden">
            <tr><td style="padding:10px 14px;font-size:12px;color:#4d637a;width:110px;border-bottom:1px solid #111e40">Business</td><td style="padding:10px 14px;font-size:15px;font-weight:700;border-bottom:1px solid #111e40">${bizName}</td></tr>
            <tr><td style="padding:10px 14px;font-size:12px;color:#4d637a;border-bottom:1px solid #111e40">Email</td><td style="padding:10px 14px;border-bottom:1px solid #111e40"><a href="mailto:${email}" style="color:#e4b118;font-size:14px;font-weight:600">${email}</a></td></tr>
            <tr><td style="padding:10px 14px;font-size:12px;color:#4d637a;border-bottom:1px solid #111e40">Website</td><td style="padding:10px 14px;border-bottom:1px solid #111e40"><a href="${website}" style="color:#7098e8;font-size:13px">${website}</a></td></tr>
            <tr><td style="padding:10px 14px;font-size:12px;color:#4d637a;border-bottom:1px solid #111e40">City</td><td style="padding:10px 14px;font-size:14px;border-bottom:1px solid #111e40">${city}</td></tr>
            <tr><td style="padding:10px 14px;font-size:12px;color:#4d637a;border-bottom:1px solid #111e40">SEO Score</td><td style="padding:10px 14px;font-size:22px;font-weight:800;color:${scoreColor};border-bottom:1px solid #111e40">${total}/100 <span style="font-size:13px;font-weight:500">Grade ${grade}</span></td></tr>
            <tr><td style="padding:10px 14px;font-size:12px;color:#4d637a">Offer Clicked</td><td style="padding:10px 14px;font-size:14px;font-weight:700;color:#e4b118">${offer || 'Quick Fix Package'}</td></tr>
          </table>

          ${criticalIssues ? `<div style="background:#0d1224;border-radius:8px;padding:16px;margin-bottom:20px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#f87171;margin-bottom:10px">Top Issues on Their Site</div>
            <ul style="margin:0;padding-left:16px">${criticalIssues}</ul>
          </div>` : ''}

          <div style="background:#0a1635;border:1px solid #e4b11830;border-radius:10px;padding:16px;text-align:center">
            <div style="font-size:13px;color:#94a8cc;margin-bottom:12px">They're ready. Follow up within the hour.</div>
            <a href="mailto:${email}?subject=Your LOLA SEO Quick Fix — ${encodeURIComponent(bizName)}&body=Hey! Thanks for grabbing the Quick Fix package. I've reviewed your report and I'm ready to get started on your site. Here's what I'll be implementing..."
              style="display:inline-block;padding:12px 24px;background:#e4b118;color:#07100a;font-weight:700;border-radius:8px;text-decoration:none;font-size:14px">
              Reply to ${email.split('@')[0]} →
            </a>
          </div>
          <p style="font-size:11px;color:#2a3950;text-align:center;margin-top:16px">${date} · LOLA SEO · Ty Alexander Media</p>
        </div>
      </div>`
    );

    // ── Confirm to customer ──
    await sendEmail(
      email,
      `🐾 You're on the list — ${bizName}'s Quick Fix is coming`,
      `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#090e1e;color:#eef2ff;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#1a3a8f,#0c1635);padding:28px 24px;text-align:center">
          <div style="font-size:36px;margin-bottom:8px">🐾</div>
          <div style="font-size:22px;font-weight:800;color:#e4b118;margin-bottom:4px">LOLA SEO</div>
          <div style="font-size:13px;color:#7098e8">by Ty Alexander Media</div>
        </div>
        <div style="padding:28px 24px">
          <h2 style="font-size:20px;font-weight:800;color:#fff;margin:0 0 12px;line-height:1.3">Got it. Ty's team is on it.</h2>
          <p style="font-size:14px;color:#94a8cc;line-height:1.7;margin:0 0 20px">
            Lola sniffed out the leaks. Now we're plugging them. We'll review your site at <strong style="color:#eef2ff">${website}</strong> and implement your Quick Fix items within <strong style="color:#eef2ff">24–48 hours</strong>.
          </p>
          <div style="background:#0d1224;border-radius:10px;padding:16px;margin-bottom:20px;border:1px solid #111e40">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#e4b118;margin-bottom:10px">What We're Fixing</div>
            <div style="font-size:13px;color:#94a8cc;line-height:1.8">
              ✓ Page title tag optimized for ${city}<br>
              ✓ Meta description written for click-through<br>
              ✓ Schema markup added (tells Google your business type)<br>
              ✓ Open Graph tags for social sharing<br>
              ✓ Any additional quick wins from your report
            </div>
          </div>
          <div style="background:#0a1635;border:1px solid #e4b11830;border-radius:10px;padding:16px;text-align:center;margin-bottom:20px">
            <p style="font-size:13px;color:#94a8cc;margin:0 0 8px">Questions? Reply to this email or call Ty directly.</p>
            <a href="tel:+17273006573" style="font-size:18px;font-weight:800;color:#e4b118;text-decoration:none">727-300-6573</a>
          </div>
          <p style="font-size:12px;color:#2a3950;text-align:center;margin:0">Ty Alexander Media · Tampa Bay, FL · tyalexandermedia.com</p>
        </div>
      </div>`
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('purchase-intent error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
