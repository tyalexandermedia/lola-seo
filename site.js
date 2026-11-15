/* Coach Ty Alexander — site interactions
   Footer year, mobile menu, Road to Miami ruler, mobile apply bar. */
(function () {
  'use strict';

  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  // Mobile menu (full-screen sheet)
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('mobileMenu');
  if (toggle && menu) {
    var setOpen = function (open) {
      menu.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    };
    toggle.addEventListener('click', function () {
      setOpen(!menu.classList.contains('open'));
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) { setOpen(false); toggle.focus(); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 900 && menu.classList.contains('open')) setOpen(false);
    });
  }

  // Road to Miami ruler: 20 weekly ticks, Mon Nov 9 2026 to Mar 28 2027.
  // The HTML ships a static week-1 state; this sets the real week.
  var rulers = document.querySelectorAll('[data-ruler]');
  if (rulers.length) {
    var WEEKS = 20;
    var days = Math.floor((Date.now() - new Date(2026, 10, 9).getTime()) / 864e5);
    var week = days < 0 ? 0 : Math.min(WEEKS, Math.floor(days / 7) + 1);
    var text = week === 0 ? 'Starts November 9' : 'Week ' + week + ' of ' + WEEKS;
    rulers.forEach(function (r) {
      var ticks = r.querySelectorAll('.ruler-ticks i:not(.end)');
      for (var i = 0; i < ticks.length; i++) {
        ticks[i].className = i < week - 1 ? 'done' : (i === week - 1 ? 'now' : '');
        ticks[i].style.setProperty('--n', i);
      }
      r.style.setProperty('--step', Math.round(600 / Math.max(week, 1)) + 'ms');
      var label = r.querySelector('.ruler-week');
      if (label) label.textContent = text;
      r.setAttribute('aria-label', 'Road to Miami: ' + (week === 0 ? 'training starts November 9' : 'week ' + week + ' of ' + WEEKS) + '. Miami is March 28. Not registered yet.');
    });
  }

  // Mobile apply bar: appears once the page's top section has scrolled out.
  var bar = document.querySelector('.sticky-cta');
  if (bar) {
    var hero = document.querySelector('[data-hero]');
    if (hero && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        bar.classList.toggle('show', !entries[0].isIntersecting);
      }).observe(hero);
    } else {
      bar.classList.add('show');
    }
  }
})();
