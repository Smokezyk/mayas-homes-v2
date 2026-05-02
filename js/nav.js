/* =========================================================
   Floating glass-morphism nav.

   Phases:
     A. Pre-intro: nav is hidden until the cinematic intro
        completes. The intro state machine adds `is-visible`
        as the brand text crystallises (the "UI Transition").
     B. Post-intro: nav is anchored. Stays visible at top, tucks
        away on scroll-down, returns on scroll-up.
     C. Past hero: gains full glassmorphism (70% bone + blur)
        via `is-scrolled`. Floats translucently over the hero.

   Plus: magnetic hover on the CTA button — translates toward
   the cursor by 25% of the offset for a luxe interactive feel.
   ========================================================= */

const nav = document.querySelector('[data-nav]');
if (nav) {
  let lastY = window.scrollY;
  let visible = nav.classList.contains('is-visible');
  let scrolled = false;
  let introDone = false;

  const HIDE_DELTA = 6;
  const SHOW_DELTA = 4;
  const TOP_ANCHOR_Y = 80;        // always visible above this scrollY post-intro
  /* Glass appears AT the moment the brand locks into the header —
     the end of the 100 px flight. Until then the header is fully
     transparent so the wordmark "lands" cleanly into a settled pill. */
  const GLASS_AT_Y = () => 90;

  const setVisible = (next) => {
    if (next === visible) return;
    visible = next;
    nav.classList.toggle('is-visible', next);
  };

  const setScrolled = (next) => {
    if (next === scrolled) return;
    scrolled = next;
    nav.classList.toggle('is-scrolled', next);
  };

  // Once the cinematic intro is done, the nav is anchored.
  window.addEventListener('intro:end', () => {
    introDone = true;
    setVisible(true);
  });

  // Catch-up: on a seen-refresh, scroll-scrub.js dispatches 'intro:end'
  // SYNCHRONOUSLY while it evaluates — before nav.js has a chance to
  // attach the listener above. Check the current state on init and
  // surface the nav immediately if the intro has already completed.
  if (!document.documentElement.classList.contains('is-intro')) {
    introDone = true;
    setVisible(true);
  }

  const onScroll = () => {
    const y = window.scrollY;
    const dy = y - lastY;

    // Glass: on/off depending on whether we've passed the hero.
    setScrolled(y > GLASS_AT_Y());

    if (introDone) {
      if (y < TOP_ANCHOR_Y) {
        setVisible(true);
      } else if (dy > HIDE_DELTA) {
        setVisible(false);
      } else if (dy < -SHOW_DELTA) {
        setVisible(true);
      }
    }

    lastY = y;
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  // Recheck glass state on resize (viewport height changes).
  window.addEventListener('resize', onScroll, { passive: true });

  // Show nav on focus-in (keyboard users).
  document.addEventListener('focusin', (e) => {
    if (introDone && nav.contains(e.target) === false) {
      setVisible(true);
    }
  });

  /* Mobile menu toggle. The hamburger only renders <768px via
     CSS; tapping it flips .is-open on .nav, which (in CSS) shows
     a full-bleed cream drawer with the nav links. Body scroll is
     locked while the drawer is open so the underlying page
     doesn't move. Tapping any link, the X button, or pressing
     ESC closes the drawer. */
  const menuToggle = nav.querySelector('.nav__menu-toggle');
  const navLinks = nav.querySelector('.nav__links');
  if (menuToggle && navLinks) {
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    };
    menuToggle.addEventListener('click', () => {
      setOpen(!nav.classList.contains('is-open'));
    });
    navLinks.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) setOpen(false);
    });
  }
}

/* =========================================================
   BRAND FLIGHT — MAYA'S HOMES from hero centre to header top-left.

   Over the first 100px of scroll, a scrubbed GSAP timeline
   shrinks/translates/fades-out the hero brand while fading in the
   nav brand wordmark in the same window. The user perceives the
   wordmark migrating from the centre of the hero to the top-left
   of the page.
   ========================================================= */
{
  const heroBrand = document.querySelector('.intro__name');
  const navBrand  = document.querySelector('[data-nav-brand]');
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  if (gsap && ScrollTrigger && heroBrand && navBrand) {
    gsap.registerPlugin(ScrollTrigger);

    const navBrandLink = document.querySelector('.nav__brand');

    /* Smooth flight across the first 100 px of scroll. Reversal is
       automatic via scrub — same 100 px window in reverse takes the
       wordmark back into the hero centre. */
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: '+=100',
        scrub: 0.3,
        invalidateOnRefresh: true,
      },
    });

    /* Logo Transfer: the SAME element migrates from hero centre to
       header. No crossfade, no second wordmark. After the migration
       completes (scroll > 100px), ScrollTrigger pins the hero brand
       at its final header position so it stays there as the page
       continues to scroll. Reverse via scrub. */

    const navEl = document.querySelector('[data-nav]');

    const computeTarget = () => {
      if (!heroBrand || !navBrand || !navBrandLink) return { x: 0, y: 0, scale: 0.3 };

      const savedTransform = heroBrand.style.transform;
      heroBrand.style.transform = '';

      // Temporarily expand the nav wordmark slot AND force the nav
      // into its `is-visible` state so getBoundingClientRect() returns
      // the rect at the seated position — not 120 % above the viewport
      // (where the pre-intro / tucked-away transform parks it). Without
      // this, the brand flies to the tucked location on resize / refresh.
      const savedMW = navBrandLink.style.maxWidth;
      const savedOp = navBrand.style.opacity;
      const navHadVisible = navEl ? navEl.classList.contains('is-visible') : true;
      navBrandLink.style.maxWidth = '16em';
      navBrand.style.opacity = '1';
      if (navEl) navEl.classList.add('is-visible');

      // Force a layout flush before reading geometry.
      void navBrand.offsetHeight;

      const hero = heroBrand.getBoundingClientRect();
      const nav  = navBrand.getBoundingClientRect();

      heroBrand.style.transform = savedTransform;
      navBrandLink.style.maxWidth = savedMW;
      navBrand.style.opacity = savedOp;
      if (navEl && !navHadVisible) navEl.classList.remove('is-visible');

      const heroCx = hero.left + hero.width  / 2;
      const heroCy = hero.top  + hero.height / 2;
      const navCx  = nav.left  + nav.width   / 2;
      const navCy  = nav.top   + nav.height  / 2;

      return {
        x: navCx - heroCx,
        y: navCy - heroCy,
        scale: hero.width > 0 ? Math.max(nav.width / hero.width, 0.15) : 0.3,
      };
    };

    // Hero scales + translates to land precisely on the header slot.
    tl.to(heroBrand, {
      x:     () => computeTarget().x,
      y:     () => computeTarget().y,
      scale: () => computeTarget().scale,
      ease:  'power2.in',
    }, 0);

    // Pill grows so the header has the right slot size by the time
    // the brand arrives.
    if (navBrandLink) {
      tl.to(navBrandLink, {
        maxWidth: '16em',
        ease: 'power2.out',
      }, 0);
    }

    /* At the end of the migration the hero brand is sitting on top
       of the (still-invisible) nav wordmark with the same letter-
       spacing, the same scaled size. We swap them in the last 10%
       of the timeline — invisible to the user — so from then on the
       nav wordmark (which is fixed inside the floating nav pill)
       carries the brand. The pill stays anchored regardless of
       scroll, so MAYA'S HOMES truly stays in the header. */
    tl.to(heroBrand, { opacity: 0, duration: 0.1, ease: 'none' }, 0.9);
    tl.to(navBrand,  { opacity: 1, duration: 0.1, ease: 'none' }, 0.9);

    // Refresh after the intro lifts the scroll lock — the page can
    // finally scroll, so ScrollTrigger needs to re-measure.
    window.addEventListener('intro:end', () => {
      requestAnimationFrame(() => ScrollTrigger.refresh());
    });

    /* Click the wordmark in the header to fly back to the hero.
       Override the generic [href^="#"] handler in main.js so we can
       (a) scroll to absolute Y=0 (no element/offset ambiguity) and
       (b) force the scrub timeline to its start once the page
           settles, so the wordmark reliably reverse-flies into the
           hero centre instead of getting stuck in the header. */
    if (navBrandLink) {
      navBrandLink.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        const lenis = window.__lenis;
        const settle = () => {
          ScrollTrigger.update();
          tl.scrollTrigger && tl.scrollTrigger.refresh();
        };
        if (lenis && typeof lenis.scrollTo === 'function') {
          lenis.scrollTo(0, { duration: 1.0, force: true, lock: true, onComplete: settle });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setTimeout(settle, 1100);
        }
      }, true);
    }
  }
}

/* =========================================================
   MAGNETIC HOVER — CTA button drifts toward the cursor.
   ========================================================= */
const cta = document.querySelector('.nav__cta');
if (cta && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const STRENGTH = 0.28;          // how much the button follows the cursor
  let raf = 0;

  const onMove = (e) => {
    const rect = cta.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      cta.style.transform = `translate(${dx * STRENGTH}px, ${dy * STRENGTH}px)`;
    });
  };
  const onLeave = () => {
    if (raf) cancelAnimationFrame(raf);
    cta.style.transform = '';
  };

  cta.addEventListener('pointerenter', () => {
    cta.style.transition = 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1)';
  });
  cta.addEventListener('pointermove', onMove);
  cta.addEventListener('pointerleave', () => {
    cta.style.transition = 'transform 480ms cubic-bezier(0.16, 1, 0.3, 1)';
    onLeave();
  });
}
