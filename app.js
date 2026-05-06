// ============================================================
// LOLA SEO — COMPLETE app.js
// Copy entire file → Paste into GitHub → Done
// ============================================================

const API_URL = "https://web-production-e4bd3.up.railway.app";
let analysisData = null;

// ── INITIALIZATION ──────────────────────────────────────────

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("audit-form");
  if (form) {
    form.addEventListener("submit", handleFormSubmit);
  }
  goToStep("step-form");
});

// ── FORM SUBMISSION ─────────────────────────────────────────

async function handleFormSubmit(e) {
  e.preventDefault();

  const businessName = document.getElementById("business-name").value.trim();
  const website = document.getElementById("website").value.trim();
  const city = document.getElementById("city").value.trim();
  const businessType = document.getElementById("business-type").value;
  const email = document.getElementById("email").value.trim();

  if (!businessName || !website || !city || !email) {
    alert("Please fill in all fields.");
    return;
  }

  goToStep("step-loading");
  updateLoadingHeadline();

  try {
    const response = await fetch(`${API_URL}/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business_name: businessName,
        website: website,
        city: city,
        business_type: businessType,
        email: email,
      }),
    });

    if (!response.ok) {
      throw new Error("Audit failed. Try again.");
    }

    analysisData = await response.json();
    goToStep("step-email");
  } catch (error) {
    console.error("Error:", error);
    alert("Something went wrong. Please try again.");
    goToStep("step-form");
  }
}

// ── LOADING ANIMATION ───────────────────────────────────────

function updateLoadingHeadline() {
  const headlines = [
    "🐾 Lola is on the scent...",
    "📊 Analyzing your SEO...",
    "💰 Calculating your revenue loss...",
    "🔍 Scanning for gaps...",
    "⚡ Almost done...",
  ];

  let index = 0;
  const headlineEl = document.getElementById("loading-headline");

  setInterval(() => {
    headlineEl.textContent = headlines[index % headlines.length];
    index++;
  }, 2000);
}

// ── EMAIL STEP ──────────────────────────────────────────────

function goToEmail() {
  const emailBtn = document.getElementById("view-report-btn");
  emailBtn.disabled = true;
  emailBtn.textContent = "Sending...";

  setTimeout(() => {
    goToStep("step-report");
    emailBtn.disabled = false;
    emailBtn.textContent = "View My Report";
  }, 1500);
}

// ── REPORT STEP ─────────────────────────────────────────────

function goToStep(step) {
  document.querySelectorAll("[id^='step-']").forEach((el) => {
    el.style.display = "none";
  });
  const targetStep = document.getElementById(step);
  if (targetStep) {
    targetStep.style.display = "block";
  }

  if (step === "step-report") {
    showReport();
  }
}

// ── SHOW REPORT ─────────────────────────────────────────────

function showReport() {
  const container = document.getElementById("report-container");
  if (!container) return;
  container.innerHTML = "";

  const { 
    total_score, 
    grade, 
    grade_label, 
    business_name, 
    revenue_leak,
    page_speed,
    business_info,
    competitors,
    categories
  } = analysisData;

  // ── HEADER ──────────────────────────────────────────────
  const header = document.createElement('div');
  header.innerHTML = `
    <div style="text-align: center; margin-bottom: 40px;">
      <div style="font-size: 48px; margin: 20px 0;">🐾</div>
      <h1 style="margin: 0; font-size: 32px; color: white;">${total_score}/100</h1>
      <p style="margin: 10px 0; font-size: 18px; color: #FFD700;">${grade} — ${grade_label}</p>
      <h2 style="margin: 15px 0; font-size: 20px; color: white; font-weight: normal;">
        ${business_name} has real gaps costing customers right now.
      </h2>
    </div>
  `;
  container.appendChild(header);

  // ── REVENUE LEAK (THE HOOK) ─────────────────────────────
  const revenueSection = document.createElement('div');
  revenueSection.innerHTML = `
    <div style="background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%); color: white; padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center;">
      <h3 style="margin-top: 0; font-size: 24px;">💰 Your Monthly Revenue Loss</h3>
      <p style="font-size: 14px; margin: 10px 0; opacity: 0.9;">Based on ${revenue_leak.missed_calls_per_month} missed calls @ $${revenue_leak.avg_job_value}/job</p>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
        <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px;">
          <div style="font-size: 12px; text-transform: uppercase; opacity: 0.8; margin-bottom: 10px;">This Month</div>
          <div style="font-size: 36px; font-weight: bold;">$${revenue_leak.monthly_leak.toLocaleString()}</div>
        </div>
        <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px;">
          <div style="font-size: 12px; text-transform: uppercase; opacity: 0.8; margin-bottom: 10px;">This Year</div>
          <div style="font-size: 36px; font-weight: bold;">$${revenue_leak.annual_leak.toLocaleString()}</div>
        </div>
      </div>
      
      <p style="margin: 15px 0; font-size: 14px;">
        That's <strong>${revenue_leak.missed_calls_per_month} customers</strong> choosing your competitors instead.
      </p>
    </div>
  `;
  container.appendChild(revenueSection);

  // ── SCORE BREAKDOWN ──────────────────────────────────────
  const breakdown = document.createElement('div');
  breakdown.innerHTML = `
    <div style="margin: 30px 0;">
      <h3 style="color: #FFD700; font-size: 16px; text-transform: uppercase; margin-bottom: 20px;">📊 Score Breakdown</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div style="background: rgba(255,215,0,0.1); padding: 15px; border-radius: 8px; border-left: 3px solid #FFD700;">
          <div style="font-size: 12px; color: #999; margin-bottom: 8px;">SITE HEALTH</div>
          <div style="font-size: 28px; font-weight: bold; color: #FFD700;">${categories.page_speed.score || 50}</div>
          <div style="font-size: 12px; color: #999;">Speed, HTTPS, Schema</div>
        </div>
        <div style="background: rgba(255,215,0,0.1); padding: 15px; border-radius: 8px; border-left: 3px solid #FFD700;">
          <div style="font-size: 12px; color: #999; margin-bottom: 8px;">LOCAL PRESENCE</div>
          <div style="font-size: 28px; font-weight: bold; color: #FFD700;">${categories.local_presence.score || 25}</div>
          <div style="font-size: 12px; color: #999;">GBP, Citations, Reviews</div>
        </div>
        <div style="background: rgba(255,215,0,0.1); padding: 15px; border-radius: 8px; border-left: 3px solid #FFD700;">
          <div style="font-size: 12px; color: #999; margin-bottom: 8px;">MOBILE</div>
          <div style="font-size: 28px; font-weight: bold; color: #FFD700;">${categories.mobile.score || 50}</div>
          <div style="font-size: 12px; color: #999;">Speed & Usability</div>
        </div>
        <div style="background: rgba(255,215,0,0.1); padding: 15px; border-radius: 8px; border-left: 3px solid #FFD700;">
          <div style="font-size: 12px; color: #999; margin-bottom: 8px;">CONTENT</div>
          <div style="font-size: 28px; font-weight: bold; color: #FFD700;">${categories.content.score || 60}</div>
          <div style="font-size: 12px; color: #999;">Keywords, Links</div>
        </div>
      </div>
    </div>
  `;
  container.appendChild(breakdown);

  // ── BUSINESS INFO (GBP DATA) ────────────────────────────
  if (business_info && business_info.ok) {
    const gbpSection = document.createElement('div');
    gbpSection.innerHTML = `
      <div style="margin: 30px 0;">
        <h3 style="color: #FFD700; font-size: 16px; text-transform: uppercase; margin-bottom: 15px;">🗺️ Your Google Business Profile</h3>
        <div style="background: rgba(255,215,0,0.05); padding: 20px; border-radius: 8px; border: 1px solid rgba(255,215,0,0.2);">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <div style="font-size: 12px; color: #999; margin-bottom: 8px;">NAME</div>
              <div style="font-size: 14px; color: white;">${business_info.name || 'Not verified'}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #999; margin-bottom: 8px;">PHONE</div>
              <div style="font-size: 14px; color: white;">${business_info.phone || 'Missing'}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #999; margin-bottom: 8px;">RATING</div>
              <div style="font-size: 14px; color: white;">⭐ ${business_info.rating || 'No reviews'} (${business_info.review_count || 0} reviews)</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #999; margin-bottom: 8px;">ADDRESS</div>
              <div style="font-size: 14px; color: white;">${business_info.address || 'Not verified'}</div>
            </div>
          </div>
        </div>
      </div>
    `;
    container.appendChild(gbpSection);
  }

  // ── COMPETITORS (RANKING COMPARISON) ────────────────────
  if (competitors && competitors.length > 0) {
    const compSection = document.createElement('div');
    compSection.innerHTML = `
      <div style="margin: 30px 0;">
        <h3 style="color: #FFD700; font-size: 16px; text-transform: uppercase; margin-bottom: 15px;">🏆 Who's Ranking Above You</h3>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${competitors.slice(0, 5).map((comp, i) => `
            <div style="background: rgba(255,215,0,0.05); padding: 15px; border-radius: 8px; border-left: 3px solid ${i === 0 ? '#FFD700' : '#666'};">
              <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                  <div style="font-size: 12px; color: #FFD700; margin-bottom: 5px;">RANK #${i + 1}</div>
                  <div style="font-size: 14px; font-weight: bold; color: white; margin-bottom: 5px;">${comp.title}</div>
                  <div style="font-size: 12px; color: #999;">${comp.snippet.substring(0, 60)}...</div>
                </div>
                <a href="${comp.url}" target="_blank" style="color: #FFD700; text-decoration: none; font-size: 12px; margin-left: 10px;">Visit →</a>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    container.appendChild(compSection);
  }

  // ── RECOVERY POTENTIAL ──────────────────────────────────
  const recoverySection = document.createElement('div');
  recoverySection.innerHTML = `
    <div style="background: linear-gradient(135deg, #2ECC71 0%, #27AE60 100%); color: white; padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center;">
      <h3 style="margin-top: 0;">✅ Recovery Potential</h3>
      <div style="font-size: 32px; font-weight: bold; margin: 15px 0;">+$${revenue_leak.recovery_potential.toLocaleString()}/month</div>
      <p style="margin: 10px 0; font-size: 14px;">
        If we fix these gaps, you'd recover <strong>${revenue_leak.recovery_calls} additional calls/month</strong>
      </p>
      <p style="margin: 0; font-size: 12px; opacity: 0.9;">
        Payback in <strong>${revenue_leak.payback_months} months</strong> at $600/month
      </p>
    </div>
  `;
  container.appendChild(recoverySection);

  // ── CTA: FREE CALL + RETAINER ───────────────────────────
  const cta = document.createElement('div');
  cta.innerHTML = `
    <div style="background: rgba(255,107,53,0.1); padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center; border: 2px solid #FF6B35;">
      <h3 style="margin-top: 0; color: #FFD700; font-size: 18px;">Here's What Happens Next</h3>
      
      <div style="margin: 25px 0;">
        <h4 style="color: white; margin-bottom: 15px;">Option 1: Free Strategy Call (Recommended)</h4>
        <p style="color: #999; margin: 10px 0; font-size: 14px;">We review your audit, show you the exact fixes, and discuss how to own your market.</p>
        <a href="https://calendly.com/ty/lola-strategy-call" style="display: inline-block; background: #FFD700; color: black; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px; cursor: pointer;">
          📞 Book Free Call (20 min)
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 10px;">No credit card. No sales pitch. Just strategy.</p>
      </div>

      <hr style="border: none; border-top: 1px solid rgba(255,215,0,0.2); margin: 20px 0;">

      <div style="margin: 25px 0;">
        <h4 style="color: white; margin-bottom: 15px;">Option 2: Done-For-You ($600/month)</h4>
        <p style="color: #999; margin: 10px 0; font-size: 14px;">We implement everything from this audit + ongoing optimization.</p>
        <p style="color: #FFD700; font-weight: bold; font-size: 14px; margin: 15px 0;">30-day implementation • Monthly reporting • Direct access</p>
        <a href="https://calendly.com/ty/lola-strategy-call?utm_source=lola&utm_campaign=retainer" style="display: inline-block; background: #FF6B35; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px; cursor: pointer;">
          💪 Start $600/month Retainer
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 10px;">$${revenue_leak.recovery_potential.toLocaleString()}/month recovery potential</p>
      </div>
    </div>
  `;
  container.appendChild(cta);

  // ── BOTTOM CTA ──────────────────────────────────────────
  const bottomCta = document.createElement('div');
  bottomCta.innerHTML = `
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center; border: 2px solid #FFD700;">
      <h3 style="margin-top: 0; color: white;">Stop Losing Money</h3>
      <p style="color: #999; margin: 15px 0;">Every day you wait costs you $${Math.round(revenue_leak.monthly_leak / 30)} in missed revenue.</p>
      <p style="color: #FFD700; font-size: 14px; margin: 15px 0; font-weight: bold;">
        This audit is free. The strategy call is free. The only thing you invest is 20 minutes of your time.
      </p>
      <a href="https://calendly.com/ty/lola-strategy-call" style="display: inline-block; background: #FFD700; color: black; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin-top: 15px; cursor: pointer;">
        → Book Your Call Now
      </a>
    </div>
  `;
  container.appendChild(bottomCta);
}
