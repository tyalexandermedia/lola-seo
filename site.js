/* Coach Ty Alexander — site interactions
   Nav scroll state · mobile menu · reveal-on-scroll · footer year */
(function () {
  'use strict';

  // Current year
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  // Header shadow/border on scroll
  var header = document.getElementById('header');
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 8) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Mobile menu
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
      if (e.key === 'Escape' && menu.classList.contains('open')) setOpen(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 900 && menu.classList.contains('open')) setOpen(false);
    });
  }

  // Reveal on scroll
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if (!('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reveals.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  // Offer stack — accordion (one open at a time)
  var offerHeads = document.querySelectorAll('.offer-head');
  offerHeads.forEach(function (head) {
    head.addEventListener('click', function () {
      var offer = head.parentElement;
      var isOpen = offer.classList.contains('open');
      var group = offer.parentElement;
      group.querySelectorAll('.offer.open').forEach(function (o) {
        if (o !== offer) {
          o.classList.remove('open');
          var h = o.querySelector('.offer-head');
          if (h) h.setAttribute('aria-expanded', 'false');
        }
      });
      offer.classList.toggle('open', !isOpen);
      head.setAttribute('aria-expanded', String(!isOpen));
    });
  });
})();
