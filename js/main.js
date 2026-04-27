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

/* — Reveal sections + display headlines on intersection — */
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
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

/* — Footer year — */
const yearEl = document.querySelector('[data-year]');
if (yearEl) yearEl.textContent = new Date().getFullYear();

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
  const btn = tile.querySelector('.tile__link') || tile;
  btn.addEventListener('click', play);

  // When the morph completes, video sits on its true last frame
  // (the "after" state). Mark `is-revealed` so the hint stays gone.
  video.addEventListener('ended', () => {
    tile.classList.add('is-revealed');
  });
});
