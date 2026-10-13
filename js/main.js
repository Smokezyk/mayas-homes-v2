/* =========================================================
   Entry script — Lenis smooth scroll, section reveals,
   year stamp, anchor smoothing, and the Maya's Eye intent.
   ========================================================= */

const { gsap } = window;
const ScrollTrigger = window.ScrollTrigger;
const Lenis = window.Lenis;
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

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
    gsap.ticker.add((time) => lenis?.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    requestAnimationFrame(() => ScrollTrigger.refresh());
  } else {
    requestAnimationFrame(function raf(time) {
      lenis?.raf(time);
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
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    if (lenis) {
      const editorialPage = document.body.classList.contains('portfolio-redesign');
      const anchorGap = editorialPage
        ? parseFloat(getComputedStyle(target).scrollMarginTop) || 20
        : 20;
      lenis.scrollTo(target, { offset: -anchorGap, duration: editorialPage ? 0.7 : 1.2 });
    } else {
      target.scrollIntoView({ behavior: motionPreference.matches ? 'auto' : 'smooth', block: 'start' });
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
document.querySelectorAll('.display, .reveal, .eyebrow, blockquote, .tile, .contact__row, .fade-in')
  .forEach((el) => {
    if (heroEl && heroEl.contains(el)) return;
    if (!el.classList.contains('fade-in')) el.classList.add('reveal');
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
document.querySelectorAll('[data-method-quote], [data-craft-quote], [data-cascais-quote], [data-studio-quote]')
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
      if (entry.isIntersecting && !motionPreference.matches) {
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

// Optional media never blocks project links; report failures accessibly.
function showMediaError(video) {
  const container = video.closest('[data-tile], [data-step]') || video.parentElement;
  container.classList.remove('is-playing');
  let status = container.querySelector('.media-playback-status');
  if (!status) {
    status = document.createElement('p');
    status.className = 'media-playback-status';
    status.setAttribute('role', 'status');
    container.append(status);
  }
  status.textContent = document.documentElement.lang.startsWith('pt')
    ? 'A animação não está disponível. Pode continuar a explorar o projeto.'
    : 'The animation is unavailable. You can still explore the project.';
}

/* — Service animations stay user-controlled: pause/resume in place, replay
     after completion, and keep a visible control throughout playback. — */
(() => {
  const isPortuguese = document.documentElement.lang.startsWith('pt');
  const labels = isPortuguese
    ? { idle: 'Ver animação', loading: 'A carregar…', playing: 'Pausar', paused: 'Continuar', ended: 'Repetir', error: 'Tentar novamente' }
    : { idle: 'Play animation', loading: 'Loading…', playing: 'Pause', paused: 'Resume', ended: 'Replay', error: 'Try again' };
  const players = [];

  document.querySelectorAll('[data-step]').forEach((figure) => {
    const video = figure.querySelector('[data-step-video]');
    const button = figure.querySelector('.process__step-link');
    const label = figure.querySelector('.process__hint-label--initial');
    const icon = figure.querySelector('.process__play-icon');
    if (!video || !button || !label || !icon) return;

    const subject = (button.getAttribute('aria-label') || (isPortuguese ? 'a animação' : 'animation'))
      .replace(/^(?:Play animation:|Ver animação:)\s*/i, '')
      .replace(/^(?:Play|Reproduzir)\s+/i, '')
      .replace(/^the\s+|\s+animation$/gi, '')
      .replace(/^(?:a\s+)?animação\s+(?:de|do|da)\s+/i, '');
    const pauseIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    pauseIcon.setAttribute('class', 'process__icon-pause');
    pauseIcon.setAttribute('viewBox', '0 0 20 20');
    pauseIcon.setAttribute('aria-hidden', 'true');
    const pausePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pausePath.setAttribute('d', 'M6 4h3v12H6zm5 0h3v12h-3z');
    pausePath.setAttribute('fill', 'currentColor');
    pauseIcon.append(pausePath);
    icon.append(pauseIcon);

    video.muted = true;
    video.playsInline = true;
    video.setAttribute('webkit-playsinline', '');
    let state = 'idle';
    let wantsPlayback = false;
    let request = 0;
    let status;

    const render = (nextState) => {
      state = nextState;
      figure.dataset.processPlayback = state;
      figure.classList.toggle('is-playing', state === 'playing');
      figure.classList.toggle('is-revealed', state === 'ended');
      label.textContent = labels[state];
      // Keep the visible label verbatim in the accessible name for voice control.
      button.setAttribute('aria-label', `${labels[state]}: ${subject}`);
    };
    const pause = () => {
      wantsPlayback = false;
      request += 1;
      video.pause();
      if (state !== 'ended' && state !== 'error') render(video.currentTime > 0 ? 'paused' : 'idle');
    };
    const fail = () => {
      wantsPlayback = false;
      request += 1;
      video.pause();
      render('error');
      if (!status) {
        status = document.createElement('p');
        status.className = 'process__playback-status';
        status.setAttribute('role', 'status');
        figure.append(status);
      }
      status.textContent = isPortuguese
        ? 'Não foi possível carregar a animação. Tente novamente.'
        : 'This animation could not load. Try again.';
    };
    players.push({ figure, pause, isActive: () => wantsPlayback });

    button.addEventListener('click', () => {
      if (wantsPlayback) {
        pause();
        return;
      }
      players.forEach((player) => { if (player.figure !== figure && player.isActive()) player.pause(); });
      if (status) status.textContent = '';
      if (state === 'error') video.load();
      if (state === 'ended' || video.ended) {
        try { video.currentTime = 0; } catch (_) {}
      }
      wantsPlayback = true;
      const currentRequest = ++request;
      render('loading');
      try {
        const playback = video.play();
        if (playback && typeof playback.catch === 'function') {
          playback.catch(() => {
            // A cancelled request must not overwrite a newer click's state.
            if (currentRequest === request && wantsPlayback) fail();
          });
        }
      } catch (_) {
        if (currentRequest === request && wantsPlayback) fail();
      }
    });
    video.addEventListener('playing', () => {
      if (!wantsPlayback || document.hidden) {
        pause();
        return;
      }
      render('playing');
    });
    video.addEventListener('waiting', () => { if (wantsPlayback) render('loading'); });
    video.addEventListener('pause', () => {
      if (!video.paused || video.ended || state === 'error') return;
      wantsPlayback = false;
      request += 1;
      render(video.currentTime > 0 ? 'paused' : 'idle');
    });
    video.addEventListener('ended', () => {
      wantsPlayback = false;
      request += 1;
      render('ended');
    });
    video.addEventListener('error', fail);
    render('idle');
  });

  if (!players.length) return;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) players.forEach((player) => { if (player.isActive()) player.pause(); });
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.1) return;
        const player = players.find((item) => item.figure === entry.target);
        if (player?.isActive()) player.pause();
      });
    }, { threshold: [0, 0.1] });
    players.forEach((player) => observer.observe(player.figure));
  }
})();


/* — Local Mastery: three magazine-style tabs (Area / Permits / Climate).
     One tab click swaps the map + caption + lede + quote together,
     with caption immediate, lede +200ms, quote +400ms (transition-delay
     does the staggering — JS just toggles classes). Clicking the active
     tab a second time returns to the overview state. */
/* Local Mastery widget was collapsed to a single static map +
   caption + lede + quote. The four-state tab/arrow/click-to-
   advance controllers that used to live here (initLocalMastery
   IIFE + arrow-nav handler further down) were removed in the
   same commit. */

/* — Magnetic primary buttons. Listens at the document level so
     buttons drift toward the cursor when it enters an 80 px buffer
     around them — the classic "magnetic pull". Once near, the
     button gets:
       --translate-x/y → magnetic drift toward cursor
       --rotate-x/y    → 3D tilt (±6° / ±8°)
       --shine-x/y     → radial reflection follows the pointer
     When the cursor leaves the buffer, all six custom properties
     are removed and the button springs back to rest. rAF-coalesced
     so a single mousemove update covers every button per frame. */
(function initMagneticButtons() {
  if (document.body.classList.contains('atelier-refined')) return;
  const buttons = Array.from(document.querySelectorAll(
    '.nav__cta, .contact__submit, .footer__outro-cta, .btn-glass'
  ));
  if (!buttons.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let frame = null;
  let lastEvent = null;
  const MAGNET_RADIUS = 70;     /* px buffer beyond button edges */
  const PULL_STRENGTH = 0.16;   /* 0–1, how much the button drifts */
  const MAX_TILT_X = 4;         /* degrees */
  const MAX_TILT_Y = 4;
  const VARS = [
    '--shine-x','--shine-y','--rotate-x','--rotate-y',
    '--translate-x','--translate-y',
  ];

  function updateAll() {
    frame = null;
    if (!lastEvent) return;
    const e = lastEvent;

    buttons.forEach((btn) => {
      const r = btn.getBoundingClientRect();
      if (!r.width || !r.height) return;

      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const halfW = r.width / 2;
      const halfH = r.height / 2;

      const isNear =
        Math.abs(dx) < halfW + MAGNET_RADIUS &&
        Math.abs(dy) < halfH + MAGNET_RADIUS;

      if (!isNear) {
        VARS.forEach((p) => btn.style.removeProperty(p));
        return;
      }

      /* Magnetic pull — translate toward cursor centre. */
      const tx = dx * PULL_STRENGTH;
      const ty = dy * PULL_STRENGTH;

      /* Mouse position relative to button (for shine + tilt). Clamped
         so values stay reasonable when the cursor is in the buffer
         but outside the visible button. */
      const xRatio = (e.clientX - r.left) / r.width;
      const yRatio = (e.clientY - r.top)  / r.height;
      const shineX = Math.max(0, Math.min(100, xRatio * 100));
      const shineY = Math.max(0, Math.min(100, yRatio * 100));
      const tiltY = Math.max(-MAX_TILT_Y, Math.min(MAX_TILT_Y,
                              (xRatio - 0.5) * MAX_TILT_Y * 2));
      const tiltX = Math.max(-MAX_TILT_X, Math.min(MAX_TILT_X,
                              (0.5 - yRatio) * MAX_TILT_X * 2));

      btn.style.setProperty('--shine-x',     `${shineX}%`);
      btn.style.setProperty('--shine-y',     `${shineY}%`);
      btn.style.setProperty('--rotate-x',    `${tiltX}deg`);
      btn.style.setProperty('--rotate-y',    `${tiltY}deg`);
      btn.style.setProperty('--translate-x', `${tx}px`);
      btn.style.setProperty('--translate-y', `${ty}px`);
    });
  }

  document.addEventListener('mousemove', (e) => {
    lastEvent = e;
    if (!frame) frame = requestAnimationFrame(updateAll);
  }, { passive: true });
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
  if (contact) contact.scrollIntoView({ behavior: motionPreference.matches ? 'auto' : 'smooth', block: 'start' });
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
if (motionPreference.matches) {
  document.querySelectorAll('.studio__people-grid, .studio__triptych').forEach((el) => el.classList.add('is-revealed'));
}
if (gsap && ScrollTrigger && !motionPreference.matches) {
  const createSectionTrigger = (options) => {
    const target = document.querySelector(options.trigger);
    if (target) ScrollTrigger.create({ ...options, trigger: target });
  };
  createSectionTrigger({
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

  /* /studio/ §08 Facts grid — count-up animation on the four big
     serif numbers (25 / 8 / 7 / 72) when the grid enters viewport.
     Markup ships final values so fast scrollers or no-GSAP visitors
     see correct numbers either way. /services/ uses the homepage
     .stats markup directly so it's handled by the .stats trigger
     above, not here. */
  createSectionTrigger({
    trigger: '.studio__facts-grid',
    start: 'top 85%',
    once: true,
    onEnter: () => {
      document.querySelectorAll('.studio__facts-number').forEach((el) => {
        const target = parseInt(el.dataset.factsCount, 10);
        const digit = el.querySelector('.studio__facts-digit');
        if (!digit || isNaN(target) || target === 0) return;

        digit.textContent = '0';
        const obj = { value: 0 };
        gsap.to(obj, {
          value: target,
          duration: 1.1,
          ease: 'power2.out',
          snap: { value: 1 },
          onUpdate: () => { digit.textContent = obj.value | 0; },
        });
      });
    },
  });

  /* /studio/ §06 Bench — staggered portrait reveal. Adds
     .is-revealed to the grid when it enters viewport; CSS handles
     the per-cell stagger via :nth-child transition-delay. */
  createSectionTrigger({
    trigger: '.studio__people-grid',
    start: 'top 80%',
    once: true,
    onEnter: (self) => self.trigger.classList.add('is-revealed'),
  });

  /* /studio/ §07 Triptych — sequential frame reveal. Same
     .is-revealed pattern; CSS staggers the three frames 200 ms
     apart so the visitor reads them left-to-right as a process. */
  createSectionTrigger({
    trigger: '.studio__triptych',
    start: 'top 80%',
    once: true,
    onEnter: (self) => self.trigger.classList.add('is-revealed'),
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
  if (tile.closest('[data-transformations-controls]')) return;
  const video = tile.querySelector('[data-tile-video]');
  if (!video) return;

  // Hard-set playback flags — same belt-and-braces as the intro.
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('webkit-playsinline', '');

  video.addEventListener('error', () => showMediaError(video));

  // Click-to-reveal / click-to-restart — the magic.
  // If the tile is already revealed (animation finished, overlay
  // showing), clicking it strips the revealed state and replays from
  // frame 0. The "View Project" pill (sibling of the trigger) keeps
  // its own click path to the project page, untouched.
  const play = (e) => {
    if (e) e.preventDefault();
    // If currently mid-play, ignore — let the morph finish naturally.
    if (!video.paused && !video.ended) return;
    tile.classList.remove('is-revealed');
    tile.classList.add('is-playing');
    try { video.currentTime = 0; } catch (_) {}
    const p = video.play();
    if (p && typeof p.catch === 'function') p.catch(() => {
      showMediaError(video);
    });
  };

  // The button wrapper is the natural click + keyboard target.
  // Bind ONLY to .tile__link — falling back to the whole tile would
  // also intercept clicks on the post-reveal "View the project" link.
  const btn = tile.querySelector('.tile__link');
  if (btn) btn.addEventListener('click', play);

  // When the morph completes, video sits on its true last frame
  // (the "after" state). Drop is-playing and mark is-revealed so the
  // overlay + View Project pill surface.
  video.addEventListener('ended', () => {
    tile.classList.remove('is-playing');
    tile.classList.add('is-revealed');
  });
});


// =====================================================================
// Testimonials — viewport-aware. Mobile (<=1023): single-card carousel
// with .is-active fade + counter. Desktop (>=1024): horizontal scroll-
// snapped row of three cards; arrows revealed only when count > 3 via
// .has-overflow class on the section root.
// =====================================================================
(() => {
  const section = document.querySelector('[data-testimonials-section]');
  const list = document.querySelector('[data-testimonials]');
  if (!section || !list) return;
  const items = Array.from(list.querySelectorAll('.testimonial'));
  if (items.length < 1) return;
  const arrows = Array.from(document.querySelectorAll('[data-testimonials-nav] [data-direction]'));
  const counter = document.querySelector('[data-testimonials-count]');

  // Mobile state
  let idx = items.findIndex((el) => el.classList.contains('is-active'));
  if (idx < 0) {
    idx = 0;
    items[0].classList.add('is-active');
  }
  if (counter) counter.textContent = `${idx + 1} / ${items.length}`;

  const desktopMQ = window.matchMedia('(min-width: 1024px)');

  const updateOverflow = () => {
    if (desktopMQ.matches && items.length > 3) {
      section.classList.add('has-overflow');
    } else {
      section.classList.remove('has-overflow');
    }
  };
  updateOverflow();
  window.addEventListener('resize', updateOverflow);

  const navigate = (dir) => {
    if (desktopMQ.matches) {
      // Desktop: scroll the snapped row by one card width.
      const first = items[0];
      const rect = first.getBoundingClientRect();
      const gap = 32;
      const step = rect.width + gap;
      list.scrollBy({ left: dir * step, behavior: motionPreference.matches ? 'auto' : 'smooth' });
    } else {
      // Mobile: cycle .is-active.
      items[idx].classList.remove('is-active');
      idx = (idx + dir + items.length) % items.length;
      items[idx].classList.add('is-active');
      if (counter) counter.textContent = `${idx + 1} / ${items.length}`;
    }
  };

  arrows.forEach((arrow) => {
    arrow.addEventListener('click', () => {
      const dir = parseInt(arrow.dataset.direction, 10) || 1;
      navigate(dir);
    });
  });
})();

// =====================================================================
// Craft pillars carousel — mobile only (CSS gates the dot visibility).
// On desktop the three pillars stay as a 3-column grid; the JS still
// runs but the .craft__nav is display:none above 760px so users only
// reach the carousel state at mobile widths.
// =====================================================================
(() => {
  const grid = document.querySelector('[data-craft]');
  if (!grid) return;
  const items = Array.from(grid.querySelectorAll('.craft__cell'));
  const arrows = Array.from(document.querySelectorAll('[data-craft-nav] [data-direction]'));
  const counter = document.querySelector('[data-craft-count]');
  if (items.length < 2) return;
  let idx = items.findIndex((el) => el.classList.contains('is-active'));
  if (idx < 0) idx = 0;
  if (counter) counter.textContent = `${idx + 1} / ${items.length}`;

  const setActive = (next) => {
    items[idx].classList.remove('is-active');
    idx = (next + items.length) % items.length;
    items[idx].classList.add('is-active');
    if (counter) counter.textContent = `${idx + 1} / ${items.length}`;
  };

  arrows.forEach((arrow) => {
    arrow.addEventListener('click', () => {
      const dir = parseInt(arrow.dataset.direction, 10) || 1;
      setActive(idx + dir);
    });
  });
})();


// =====================================================================
// (Removed: the process-steps mobile carousel. The four
// <li class="process__step"> now stack vertically at every viewport;
// the 1/4 counter + prev/next arrows were dropped from the markup.)
// =====================================================================

// =====================================================================
// (Removed: the Cascais map tap-to-advance + arrow nav handler.
// The map widget was collapsed to a single static frame, so the
// advance + counter logic no longer has anything to drive.)


// Decorative background video is optional and can always be paused.
(() => {
  document.querySelectorAll('video[autoplay]').forEach((video) => {
    const pt = document.documentElement.lang.startsWith('pt');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'video-motion-toggle';
    let manuallyPaused = false;
    const sync = () => {
      button.textContent = video.paused ? (pt ? 'Reproduzir animação' : 'Play animation') : (pt ? 'Pausar animação' : 'Pause animation');
    };
    const applyPreference = () => {
      if (motionPreference.matches) {
        video.autoplay = false;
        video.pause();
      } else if (!manuallyPaused) {
        video.play().catch(sync);
      }
      sync();
    };
    button.addEventListener('click', () => {
      if (video.paused) { manuallyPaused = false; video.play().catch(sync); }
      else { manuallyPaused = true; video.pause(); }
      sync();
    });
    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);
    video.insertAdjacentElement('afterend', button);
    motionPreference.addEventListener('change', applyPreference);
    applyPreference();
  });
  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) {
      if (lenis) { lenis.destroy(); lenis = undefined; window.__lenis = undefined; }
      document.querySelectorAll('[data-living-portrait]').forEach((video) => video.pause());
    }
  });
})();

// Preserve native field validation and retain the enquiry on delivery failure.
// A success page is reached only after the form endpoint accepts the request.
(() => {
  document.querySelectorAll('form[data-netlify]').forEach((form) => {
    const pt = document.documentElement.lang.startsWith('pt');
    const status = document.createElement('p');
    status.className = 'form-delivery-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    form.append(status);
    let sending = false;
    form.addEventListener('submit', async (event) => {
      if (event.defaultPrevented) return;
      event.preventDefault();
      if (sending || !form.reportValidity()) return;
      sending = true;
      const submitters = [...form.querySelectorAll('button[type="submit"], input[type="submit"]')];
      const priorDisabled = submitters.map((button) => button.disabled);
      submitters.forEach((button) => { button.disabled = true; });
      form.setAttribute('aria-busy', 'true');
      status.textContent = pt ? 'A enviar a sua mensagem…' : 'Sending your message…';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      try {
        const data = new URLSearchParams(new FormData(form));
        if (!data.has('form-name')) data.set('form-name', form.name);
        const response = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: data.toString(),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Form endpoint did not accept the request');
        // Endpoint acceptance is distinct from inbox delivery or a qualified lead.
        form.dispatchEvent(new CustomEvent('mh:enquiry-accepted', { bubbles: true }));
        window.location.assign(form.action);
      } catch (error) {
        status.textContent = pt
          ? 'Não conseguimos confirmar o envio. Os seus dados continuam aqui. Tente novamente ou contacte-nos por telefone ou email.'
          : 'We could not confirm delivery. Your details are still here. Please try again or contact us by phone or email.';
      } finally {
        clearTimeout(timeout);
        sending = false;
        form.removeAttribute('aria-busy');
        submitters.forEach((button, index) => { button.disabled = priorDisabled[index]; });
      }
    });
  });
})();
