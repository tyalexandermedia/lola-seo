/* =====================================================================
   Ty Alexander Media — interactions (tam.js)
   Vanilla JS, no dependencies. Progressive enhancement + a11y.
   ===================================================================== */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  try {

  /* ---- Header: solid on scroll ---- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 24) header.classList.add("is-solid");
      else header.classList.remove("is-solid");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Mobile nav toggle ---- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    var setNav = function (open) {
      links.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", function () { setNav(!links.classList.contains("is-open")); });
    links.addEventListener("click", function (e) { if (e.target.closest("a")) setNav(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("is-open")) { setNav(false); toggle.focus(); }
    });
  }

  /* ---- Reveal on scroll ---- */
  var reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---- Portfolio filter ---- */
  var filters = document.querySelectorAll(".filter");
  var items = document.querySelectorAll(".work-item");
  if (filters.length && items.length) {
    filters.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cat = btn.getAttribute("data-filter");
        filters.forEach(function (b) { b.classList.remove("is-active"); b.setAttribute("aria-pressed", "false"); });
        btn.classList.add("is-active"); btn.setAttribute("aria-pressed", "true");
        items.forEach(function (it) {
          var match = cat === "all" || it.getAttribute("data-cat") === cat;
          it.classList.toggle("is-hidden", !match);
        });
      });
    });
  }

  /* ---- Real-footage video helper (when a <video data-autoplay> is added) ---- */
  document.querySelectorAll("video[data-autoplay]").forEach(function (v) {
    var container = v.closest(".has-video, .hero, .media") || v.parentElement;
    if (container) container.classList.add("has-video");
    v.muted = true; v.setAttribute("muted", ""); v.playsInline = true;
    v.setAttribute("playsinline", ""); v.loop = true;
    if (!reduceMotion) { var p = v.play(); if (p && p.catch) p.catch(function(){}); }
    // mute toggle if present
    var mb = container && container.querySelector("[data-mute]");
    if (mb) {
      mb.addEventListener("click", function () {
        v.muted = !v.muted;
        mb.setAttribute("aria-label", v.muted ? "Unmute video" : "Mute video");
        mb.dataset.state = v.muted ? "muted" : "on";
      });
    }
  });

  /* ---- Footer year ---- */
  var yr = document.querySelector("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---- Prefill "Requested service" from ?service= ---- */
  try {
    var params = new URLSearchParams(window.location.search);
    var svc = params.get("service");
    var svcSel = document.querySelector("[name=service]");
    if (svc && svcSel) {
      Array.prototype.forEach.call(svcSel.options, function (o) {
        if (o.value === svc || o.textContent.trim() === svc) svcSel.value = o.value;
      });
    }
  } catch (e) { /* no-op */ }

  /* ---- Request-a-Shoot form ---- */
  var form = document.querySelector("#shoot-form");
  if (form) {
    var status = form.querySelector(".form-status");
    var submitBtn = form.querySelector("[type=submit]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      // honeypot
      if (form.querySelector("[name=company_website]") && form.querySelector("[name=company_website]").value) {
        return; // bot
      }
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      if (status) { status.className = "form-status"; status.textContent = ""; }
      if (submitBtn) { submitBtn.disabled = true; submitBtn.dataset.html = submitBtn.innerHTML; submitBtn.textContent = "Sending…"; }

      fetch("/.netlify/functions/request-shoot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; });
      }).then(function (res) {
        if (res.ok && res.j && res.j.success) {
          form.reset();
          if (status) {
            status.classList.add("is-ok");
            status.textContent = "Request received. Ty will reach out to confirm availability and scope — this is a request, not a confirmed booking.";
          }
          form.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        } else if (status) {
          // Server responded but rejected the request → surface the specific reason.
          status.classList.add("is-err");
          status.textContent = (res.j && res.j.error)
            ? res.j.error
            : "We couldn't send that just now. Please email ty@tyalexandermedia.com or call 727-300-6573 and we'll get you scheduled.";
        }
      }).catch(function (err) {
        // True network / parse failure → human fallback.
        if (status) {
          status.classList.add("is-err");
          status.textContent = "We couldn't reach the server. Please email ty@tyalexandermedia.com or call 727-300-6573 and we'll get you scheduled.";
        }
        console.error(err);
      }).finally(function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = submitBtn.dataset.html || "Request a Shoot"; }
      });
    });
  }
  } catch (err) {
    console.error(err);
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-in"); });
  }
})();
