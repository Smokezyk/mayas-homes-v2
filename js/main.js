/* =========================================================
   Entry script — Lenis smooth scroll, section reveals,
   year stamp, anchor smoothing, and the Maya's Eye intent.
   ========================================================= */

const { gsap } = window;
const ScrollTrigger = window.ScrollTrigger;
const Lenis = window.Lenis;

/* — Lenis: silky momentum scroll wired into ScrollTrigger — */
let lenis;
if (Lenis && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1.0,
    touchMultiplier: 1.4,
  });
  /* Expose so nav.js can drive scrollTo for the brand-link return. */
  window.__lenis = lenis;

  if (gsap && ScrollTrigger) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    requestAnimationFrame(() => ScrollTrigger.refresh());
  } else {
    requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    });
  }

  // — Intro lock/unlock — pair with the cinematic intro state machine.
  if (document.querySelector('[data-intro]')) {
    try { lenis.stop(); } catch (_) {}
    window.addEventListener('intro:end', () => {
      try { lenis.start(); } catch (_) {}
    });
  }
}

/* — Smooth anchor scrolls with Lenis — */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href');
    if (!href || href === '#' || href.length < 2) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    if (lenis) {
      lenis.scrollTo(target, { offset: -20, duration: 1.2 });
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* — Display word-by-word reveal — wraps every word in spans
   on the .display elements, then triggers on intersection. — */
const splitDisplay = (el) => {
  if (el.dataset.split) return;
  el.dataset.split = '1';
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue;
      if (!text || !text.trim()) return;
      const frag = document.createDocumentFragment();
      const tokens = text.split(/(\s+)/);
      tokens.forEach((tok) => {
        if (/^\s+$/.test(tok)) {
          frag.appendChild(document.createTextNode(tok));
        } else if (tok.length) {
          const wrap = document.createElement('span');
          wrap.className = 'word';
          const inner = document.createElement('span');
          inner.textContent = tok;
          wrap.appendChild(inner);
          frag.appendChild(wrap);
        }
      });
      node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE && node.childNodes.length) {
      Array.from(node.childNodes).forEach(walk);
    }
  };
  Array.from(el.childNodes).forEach(walk);
};
document.querySelectorAll('.display').forEach(splitDisplay);

/* — Reveal sections + display headlines on intersection. After the
     slide-up reveal completes, .display elements get an additional
     .is-locked-in class so their .word wrappers can switch to
     overflow: visible — italic glyphs no longer get clipped. — */
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const el = entry.target;
      el.classList.add('is-in');
      // Slide-up animation runs ~1000ms with up to ~420ms stagger →
      // 1500ms is comfortably past the last word settling.
      if (el.classList.contains('display')) {
        setTimeout(() => el.classList.add('is-locked-in'), 1500);
      }
      io.unobserve(el);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

// Skip elements inside the hero — GSAP owns those reveals.
const heroEl = document.querySelector('[data-hero]');
document.querySelectorAll('.display, .reveal, .eyebrow, blockquote, .tile, .contact__row')
  .forEach((el) => {
    if (heroEl && heroEl.contains(el)) return;
    el.classList.add('reveal');
    io.observe(el);
  });

/* — Manifesto pillars: observe the list itself so .is-in toggles
     the gold-leaf hairline animation under each <b>. No `.reveal`
     class — only the hairlines should animate, not the list itself. */
const pillarList = document.querySelector('.manifesto__pillars');
if (pillarList) io.observe(pillarList);

/* — Maja's pull-quotes: crystallise in (blur 10px → 0, opacity 0 → 1)
     on scroll-in, same treatment as the hero brand. CSS owns the
     transition; the observer just toggles `.is-in`. Both the Method
     section quote and the Craft section quote share this reveal. */
document.querySelectorAll('[data-method-quote], [data-craft-quote], [data-cascais-quote]')
  .forEach((el) => io.observe(el));

/* — Living portraits — autoplay loop while in viewport, pause when
   off-screen. Saves CPU and respects users' scroll-out-of-view
   expectations. The video carries no `autoplay` attribute in markup;
   this observer is the only thing that ever calls .play() on it. */
const livingPortraits = document.querySelectorAll('[data-living-portrait]');
if (livingPortraits.length && 'IntersectionObserver' in window) {
  const portraitObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target;
      if (entry.isIntersecting) {
        // Only start play if the video hasn't already finished a full
        // playthrough this session. Once .ended, it stays frozen on
        // its final frame for the rest of the session.
        if (!video.ended) {
          video.play().catch(() => {}); /* swallow autoplay rejection */
        }
      } else {
        // Only pause if the video is still mid-playback. If it has
        // ended, leave it frozen on the final frame.
        if (!video.ended) {
          video.pause();
        }
      }
    });
  }, { threshold: 0.15 });
  livingPortraits.forEach((v) => portraitObserver.observe(v));
}

/* — Process Timeline animations (four steps + Result closer): click
     anywhere on the video frame to play. The hint pill in the top-
     left switches its label from 'Click to reveal' to 'Play again'
     once the video has played through; clicking again replays. Full
     video data only loads after the user opts in, so the five
     videos don't share initial-load bandwidth. */
document.querySelectorAll('[data-step]').forEach((figure) => {
  const video = figure.querySelector('[data-step-video]');
  const link  = figure.querySelector('.process__step-link');
  if (!video || !link) return;

  // Belt-and-braces playback flags — same as the intro and tile videos.
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('webkit-playsinline', '');

  const play = (e) => {
    if (e) e.preventDefault();
    figure.classList.add('is-playing');
    figure.classList.remove('is-revealed');
    try { video.currentTime = 0; } catch (_) {}
    const p = video.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  };

  link.addEventListener('click', play);

  // When the morph completes, swap from is-playing → is-revealed so
  // the hint pill returns reading 'Play again'.
  video.addEventListener('ended', () => {
    figure.classList.remove('is-playing');
    figure.classList.add('is-revealed');
  });
});


/* — Local Mastery: three magazine-style tabs (Area / Permits / Climate).
     One tab click swaps the map + caption + lede + quote together,
     with caption immediate, lede +200ms, quote +400ms (transition-delay
     does the staggering — JS just toggles classes). Clicking the active
     tab a second time returns to the overview state. */
(function initLocalMastery() {
  const root = document.querySelector('.local-mastery');
  if (!root) return;

  const tabs     = root.querySelectorAll('.local-mastery__tab');
  const maps     = root.querySelectorAll('.local-mastery__map');
  const captions = root.querySelectorAll('.local-mastery__caption');
  const ledes    = root.querySelectorAll('.local-mastery__lede-text');
  const quotes   = root.querySelectorAll('.local-mastery__quote-text');

  function setActive(target) {
    root.dataset.active = target;
    tabs.forEach((t) => {
      const active = t.dataset.target === target;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    maps.forEach((m)     => m.classList.toggle('is-active', m.dataset.state === target));
    captions.forEach((c) => c.classList.toggle('is-active', c.dataset.state === target));
    ledes.forEach((l)    => l.classList.toggle('is-active', l.dataset.state === target));
    quotes.forEach((q)   => q.classList.toggle('is-active', q.dataset.state === target));
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;
      // Click the active tab again → return to overview.
      setActive(root.dataset.active === target ? 'overview' : target);
    });
  });
})();

/* — Nav CTA: mouse-tracked radial shine + 3D tilt. The CSS reads
     four custom properties (--shine-x, --shine-y, --rotate-x,
     --rotate-y) that this handler updates on mousemove. rAF-throttled
     so rapid cursor movement doesn't jank. Mouseleave resets all four
     so the pill returns to its flat resting state. */
(function initNavCtaShine() {
  const cta = document.querySelector('.nav__cta');
  if (!cta) return;
  let frame = null;

  const updateShine = (e) => {
    const rect = cta.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    const xRatio = (e.clientX - rect.left) / rect.width;
    const yRatio = (e.clientY - rect.top) / rect.height;
    const rotateY = (xRatio - 0.5) * 8;   /* ±4° */
    const rotateX = (0.5 - yRatio) * 6;   /* ±3° */
    cta.style.setProperty('--shine-x', `${xPct}%`);
    cta.style.setProperty('--shine-y', `${yPct}%`);
    cta.style.setProperty('--rotate-x', `${rotateX}deg`);
    cta.style.setProperty('--rotate-y', `${rotateY}deg`);
  };

  cta.addEventListener('mousemove', (e) => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => updateShine(e));
  });

  cta.addEventListener('mouseleave', () => {
    if (frame) cancelAnimationFrame(frame);
    cta.style.removeProperty('--shine-x');
    cta.style.removeProperty('--shine-y');
    cta.style.removeProperty('--rotate-x');
    cta.style.removeProperty('--rotate-y');
  });
})();

/* — Footer year — */
const yearEl = document.querySelector('[data-year]');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* — Contact form: post-submit thank-you banner.
     Formspree redirects back to ?sent=1; swap the form for a
     small "Message sent" panel so the user gets immediate
     feedback without a separate confirmation page. */
(function initContactSent() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('sent') !== '1') return;
  const form = document.querySelector('.contact__form');
  const panel = document.querySelector('[data-contact-sent]');
  if (form) form.hidden = true;
  if (panel) panel.hidden = false;
  const contact = document.getElementById('contact');
  if (contact) contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
})();

/* =========================================================
   STATS COUNT-UP — fast, sharp, GSAP ScrollTrigger.

   Each .stats__digit ships its FINAL value in the markup so
   slow-loading or fast-scrolling visitors always see correct
   numbers (no momentary "6+ years, 2 experts" mid-tween).
   When the band reaches the viewport, we reset the digits to
   "0" and tween them up to the target. If GSAP never runs, or
   the user scrolls past too fast, the markup values stand.
   ========================================================= */
if (gsap && ScrollTrigger) {
  ScrollTrigger.create({
    trigger: '.stats',
    start: 'top 85%',
    once: true,
    onEnter: () => {
      document.querySelectorAll('.stats__number').forEach((el) => {
        const target = parseInt(el.dataset.count, 10);
        const digit = el.querySelector('.stats__digit');
        if (!digit || isNaN(target) || target === 0) return;

        digit.textContent = '0';
        const obj = { value: 0 };
        gsap.to(obj, {
          value: target,
          duration: 0.9,
          ease: 'power1.out',
          snap: { value: 1 },
          onUpdate: () => { digit.textContent = obj.value | 0; },
        });
      });
    },
  });
}

/* =========================================================
   PROJECT TILES — click-to-reveal morph videos.

   Each tile holds a <video data-tile-video> paused on frame 0.
   Clicking (or tapping) the tile plays the morph from start to
   finish. The text/blueprint overlays remain on top of the video
   so the problem-solving copy reads as the morph transforms.
   ========================================================= */
document.querySelectorAll('[data-tile]').forEach((tile) => {
  const video = tile.querySelector('[data-tile-video]');
  if (!video) return;

  // Hard-set playback flags — same belt-and-braces as the intro.
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('webkit-playsinline', '');

  // Pre-decode frame 0 once metadata arrives, so the user always
  // sees the actual first frame ("before") rather than the poster
  // or a blank canvas while the browser is deciding what to show.
  const lockFrameZero = () => {
    try { video.currentTime = 0; } catch (_) {}
    try { video.pause(); } catch (_) {}
  };
  if (video.readyState >= 1) lockFrameZero();
  else video.addEventListener('loadedmetadata', lockFrameZero, { once: true });

  // Click-to-reveal — the magic.
  const play = (e) => {
    if (e) e.preventDefault();
    // If already playing, ignore — let the morph finish naturally.
    if (!video.paused && !video.ended) return;
    tile.classList.add('is-playing');
    try { video.currentTime = 0; } catch (_) {}
    const p = video.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  };

  // The button wrapper is the natural click + keyboard target.
  // Bind ONLY to .tile__link — falling back to the whole tile would
  // also intercept clicks on the post-reveal "View the project" link.
  const btn = tile.querySelector('.tile__link');
  if (btn) btn.addEventListener('click', play);

  // When the morph completes, video sits on its true last frame
  // (the "after" state). Mark `is-revealed` so the hint stays gone.
  video.addEventListener('ended', () => {
    tile.classList.add('is-revealed');
  });
});
