/**
 * Coaching application handler — Coach Ty Alexander (coachtyalexander.com)
 *
 * Reuses the project's existing server-side email integration pattern
 * (`external-tool call` → "gcal" / send_email) from the previous
 * capture-lead function. All sending happens server-side inside the Netlify
 * function, so no API keys, tokens or webhook URLs are ever exposed to the
 * browser. If you later swap the transport (e.g. Resend/SendGrid), read the
 * key from process.env.* here — never inline it in client code.
 *
 * POST JSON:
 *   { name, email, phone, goal, experience, option, availability, referral, notes, company? }
 *   `company` is a honeypot: any value = silent bot, we 200 without emailing.
 */
const { execSync } = require("child_process");

function sendEmail({ to, subject, body }) {
  const params = JSON.stringify({
    source_id: "gcal",
    tool_name: "send_email",
    arguments: {
      action: {
        action: "send",
        to: Array.isArray(to) ? to : [to],
        cc: [],
        bcc: [],
        subject,
        body,
        in_reply_to: null,
      },
    },
  });
  const result = execSync(`external-tool call '${params.replace(/'/g, "'\\''")}'`, {
    timeout: 30000,
  }).toString();
  return JSON.parse(result);
}

const COACH_EMAIL = "ty@tyalexandermedia.com";
const clean = (s) => String(s == null ? "" : s).replace(/[\r\n]+/g, " ").trim().slice(0, 500);

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid request" }) };
  }

  // Honeypot — pretend success, send nothing.
  if (data.company) return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };

  const name = clean(data.name);
  const email = clean(data.email);
  const phone = clean(data.phone);
  const goal = clean(data.goal);
  const experience = clean(data.experience);
  const option = clean(data.option);
  const availability = clean(data.availability);
  const referral = clean(data.referral) || "—";
  const notes = clean(data.notes) || "—";

  if (!name || !email || !phone || !goal || !experience || !option || !availability) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing required fields" }) };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid email" }) };
  }

  const date = new Date().toLocaleString("en-US", {
    dateStyle: "long", timeStyle: "short", timeZone: "America/New_York",
  });

  // ── Notification to Coach Ty ──────────────────────────────
  const coachBody = `New coaching application — ${name}

Received: ${date} (ET)

Name:            ${name}
Email:           ${email}
Phone:           ${phone}

Primary goal:    ${goal}
Experience:      ${experience}
Preferred:       ${option}
Availability:    ${availability}
Heard via:       ${referral}

Notes:
${notes}

---
Reply to ${email} or call ${phone}.
coachtyalexander.com`;

  // ── Confirmation to the applicant ─────────────────────────
  const applicantBody = `Hi ${name.split(" ")[0] || name},

Thanks for applying to train with me — I got your application and I read every one personally.

Here's what you sent:
• Goal:          ${goal}
• Experience:    ${experience}
• Preferred:     ${option}
• Availability:  ${availability}

I'll follow up soon to talk through your goals and the best way for us to train together. No pressure and no hard sell — just a real conversation about getting you stronger, moving better and staying ready for real life.

If you need me sooner, reply to this email or call/text (727) 300-6573.

Train with purpose,
Coach Ty
Coach Ty Alexander — Strength · Conditioning · Athletic Performance
St. Petersburg, FL
coachtyalexander.com`;

  try {
    // Coach notification is the one that must not be lost.
    sendEmail({
      to: COACH_EMAIL,
      subject: `🏋️ New coaching application — ${name} (${option})`,
      body: coachBody,
    });
  } catch (err) {
    console.error("Coach notification failed:", err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Could not submit application" }) };
  }

  // Applicant confirmation is best-effort — never fail the request over it.
  try {
    sendEmail({ to: email, subject: "Got your application — Coach Ty Alexander", body: applicantBody });
  } catch (err) {
    console.error("Applicant confirmation failed (non-fatal):", err.message);
  }

  return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
};
