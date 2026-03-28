const { execSync } = require("child_process");

function callTool(sourceId, toolName, args) {
  const params = JSON.stringify({
    source_id: sourceId,
    tool_name: toolName,
    arguments: args,
  });
  const result = execSync(`external-tool call '${params}'`, {
    timeout: 30000,
  }).toString();
  return JSON.parse(result);
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { email, bizName, city, bizType, total, scores, issues, quickWins } = JSON.parse(event.body);

    if (!email || !bizName) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing required fields" }) };
    }

    const grade = total >= 85 ? "A" : total >= 70 ? "B" : total >= 55 ? "C" : total >= 40 ? "D" : "F";
    const gradeLabel = total >= 85 ? "Excellent" : total >= 70 ? "Good" : total >= 55 ? "Average" : total >= 40 ? "Needs Work" : "Critical";
    const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    // Build issues text
    const issuesText = issues && issues.length > 0
      ? issues.map((i, n) => `${n + 1}. ${i.title}\n   ${i.body}`).join("\n\n")
      : "No critical issues found.";

    // Build quick wins text
    const winsText = quickWins && quickWins.length > 0
      ? quickWins.map((w, n) => `${n + 1}. ${w.title} (${w.effort} Win)\n   ${w.body}`).join("\n\n")
      : "";

    // ── EMAIL 1: Lead notification to Ty ──────────────────────
    const tyEmail = `New LOLA SEO Lead — ${bizName}

Date: ${date}
Business: ${bizName}
City: ${city}
Type: ${bizType || "Local Business"}
Score: ${total}/100 (Grade ${grade} — ${gradeLabel})

Lead Email: ${email}

Category Breakdown:
• Site Health:     ${scores?.siteHealth ?? "—"}/100
• Local Presence:  ${scores?.localPresence ?? "—"}/100
• Mobile:          ${scores?.mobile ?? "—"}/100
• Page Speed:      ${scores?.speed ?? "—"}/100
• Content:         ${scores?.content ?? "—"}/100

Top Issues Found:
${issuesText}

---
Follow up at: https://www.tyalexandermedia.com/contact
LOLA SEO by Ty Alexander Media`;

    callTool("gcal", "send_email", {
      action: {
        action: "send",
        to: ["ty@tyalexandermedia.com"],
        cc: [],
        bcc: [],
        subject: `🐾 New Lead: ${bizName} scored ${total}/100 — LOLA SEO`,
        body: tyEmail,
        in_reply_to: null,
      },
    });

    // ── EMAIL 2: Report summary to client ─────────────────────
    const clientEmail = `Hi there,

Your free Local SEO Score Report from LOLA SEO is ready.

BUSINESS: ${bizName}
LOCATION: ${city}
OVERALL SCORE: ${total}/100 — Grade ${grade} (${gradeLabel})
REPORT DATE: ${date}

CATEGORY SCORES:
• Site Health:     ${scores?.siteHealth ?? "—"}/100
• Local Presence:  ${scores?.localPresence ?? "—"}/100
• Mobile:          ${scores?.mobile ?? "—"}/100
• Page Speed:      ${scores?.speed ?? "—"}/100
• Content Quality: ${scores?.content ?? "—"}/100

TOP ISSUES FOUND:
${issuesText}

QUICK WINS TO IMPROVE YOUR SCORE:
${winsText}

---
Want us to fix these issues for you?

Ty Alexander Media helps local businesses rank higher on Google and get more customers from search.

Book a free strategy call: https://www.tyalexandermedia.com/contact

— Ty Alexander
Ty Alexander Media
Tampa Bay, FL | 727-300-6573
https://www.tyalexandermedia.com`;

    callTool("gcal", "send_email", {
      action: {
        action: "send",
        to: [email],
        cc: [],
        bcc: [],
        subject: `Your Local SEO Report — ${bizName} scored ${total}/100`,
        body: clientEmail,
        in_reply_to: null,
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: "Emails sent successfully" }),
    };
  } catch (err) {
    console.error("Error:", err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to send emails", details: err.message }),
    };
  }
};
