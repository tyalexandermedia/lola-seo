const { execSync } = require("child_process");

function callTool(sourceId, toolName, args) {
  const params = JSON.stringify({
    source_id: sourceId,
    tool_name: toolName,
    arguments: args,
  });
  const result = execSync(`external-tool call '${params}'`, { timeout: 30000 }).toString();
  return JSON.parse(result);
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { email, bizName, city, bizType, total, scores, issues, quickWins } = req.body;
    if (!email || !bizName) return res.status(400).json({ error: "Missing fields" });

    const grade = total >= 85 ? "A" : total >= 70 ? "B" : total >= 55 ? "C" : total >= 40 ? "D" : "F";
    const gradeLabel = total >= 85 ? "Excellent" : total >= 70 ? "Good" : total >= 55 ? "Average" : total >= 40 ? "Needs Work" : "Critical";
    const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    const issuesText = issues?.length
      ? issues.map((i, n) => `${n + 1}. ${i.title}\n   ${i.body}`).join("\n\n")
      : "No critical issues found — Lola approves! 🐾";

    const winsText = quickWins?.length
      ? quickWins.map((w, n) => `${n + 1}. ${w.title} (${w.effort} Win)\n   ${w.body}`).join("\n\n")
      : "";

    // Email to Ty
    callTool("gcal", "send_email", {
      action: {
        action: "send",
        to: ["ty@tyalexandermedia.com"],
        cc: [], bcc: [],
        subject: `🐾 Lola sniffed a new lead! ${bizName} scored ${total}/100`,
        body: `Woof! New LOLA SEO Lead\n\nDate: ${date}\nBusiness: ${bizName}\nCity: ${city}\nType: ${bizType || "Local Business"}\nScore: ${total}/100 (Grade ${grade} — ${gradeLabel})\nLead Email: ${email}\n\nCategory Breakdown:\n• Site Health:     ${scores?.siteHealth ?? "—"}/100\n• Local Presence:  ${scores?.localPresence ?? "—"}/100\n• Mobile:          ${scores?.mobile ?? "—"}/100\n• Page Speed:      ${scores?.speed ?? "—"}/100\n• Content:         ${scores?.content ?? "—"}/100\n\nTop Issues:\n${issuesText}\n\n---\nFollow up: https://www.tyalexandermedia.com/contact\nLOLA SEO by Ty Alexander Media`,
        in_reply_to: null,
      },
    });

    // Email to client
    callTool("gcal", "send_email", {
      action: {
        action: "send",
        to: [email],
        cc: [], bcc: [],
        subject: `🐾 Lola's SEO Report for ${bizName} — Score: ${total}/100`,
        body: `Hey there!\n\nLola finished sniffing around your website and your Local SEO Report is ready. 🐾\n\nBUSINESS: ${bizName}\nLOCATION: ${city}\nOVERALL SCORE: ${total}/100 — Grade ${grade} (${gradeLabel})\nREPORT DATE: ${date}\n\nCATEGORY SCORES:\n• Site Health:     ${scores?.siteHealth ?? "—"}/100\n• Local Presence:  ${scores?.localPresence ?? "—"}/100\n• Mobile:          ${scores?.mobile ?? "—"}/100\n• Page Speed:      ${scores?.speed ?? "—"}/100\n• Content Quality: ${scores?.content ?? "—"}/100\n\nWHAT LOLA FOUND:\n${issuesText}\n\nQUICK WINS TO FETCH MORE CUSTOMERS:\n${winsText}\n\n---\nWant Ty's team to fix this for you?\n\nWe help local businesses rank higher on Google and get more customers from search. Book a free 30-min strategy call — we'll walk through this report together.\n\nhttps://www.tyalexandermedia.com/contact\n\nStay scrappy,\nLola 🐾 & Ty Alexander\nTy Alexander Media | Tampa Bay, FL\n727-300-6573 | tyalexandermedia.com`,
        in_reply_to: null,
      },
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: err.message });
  }
};
