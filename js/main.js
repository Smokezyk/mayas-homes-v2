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

/* — Maya's Eye: optional cursor follower for interest while
     hovering tiles. Adds a tiny "+" cursor inside the tile. — */
document.querySelectorAll('[data-tile]').forEach((tile) => {
  const dot = document.createElement('span');
  dot.className = 'tile__cursor';
  dot.setAttribute('aria-hidden', 'true');
  dot.textContent = '+';
  Object.assign(dot.style, {
    position: 'absolute',
    top: '0', left: '0',
    width: '64px', height: '64px',
    display: 'grid', placeItems: 'center',
    color: 'var(--bone)',
    fontFamily: 'var(--serif)',
    fontStyle: 'italic',
    fontSize: '24px',
    pointerEvents: 'none',
    transform: 'translate(-50%, -50%) scale(0)',
    transition: 'transform 380ms cubic-bezier(0.16, 1, 0.3, 1), opacity 280ms',
    opacity: '0',
    zIndex: '5',
    mixBlendMode: 'difference',
  });
  const media = tile.querySelector('.tile__media');
  if (!media) return;
  media.style.position = 'relative';
  media.appendChild(dot);

  let raf = 0;
  const onMove = (e) => {
    const r = media.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      dot.style.left = x + 'px';
      dot.style.top = y + 'px';
    });
  };
  media.addEventListener('pointerenter', () => {
    dot.style.transform = 'translate(-50%, -50%) scale(1)';
    dot.style.opacity = '1';
    media.addEventListener('pointermove', onMove);
  });
  media.addEventListener('pointerleave', () => {
    dot.style.transform = 'translate(-50%, -50%) scale(0)';
    dot.style.opacity = '0';
    media.removeEventListener('pointermove', onMove);
  });
});
