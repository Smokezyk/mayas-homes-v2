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
  /* Glass kicks in once the user has scrolled past ~80% of the
     hero (one viewport). Cleaner than waiting for the full 100vh. */
  const GLASS_AT_Y = () => Math.max(window.innerHeight * 0.8, 600);

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

    /* Gradual flight from scroll = 0 → ~60% of viewport.
       At the top: hero brand in the centre, pill compact.
       Halfway through the window: hero brand half-faded, pill mid-grown.
       At the end (scroll ~ 0.6 × viewport): hero brand gone,
       pill fully holding MAYA'S HOMES. Reversal is automatic. */
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: () => `+=${Math.round(window.innerHeight * 0.6)}`,
        scrub: 0.4,
        invalidateOnRefresh: true,
      },
    });

    // Hero brand drifts toward the top-left, scaling and fading out.
    tl.to(heroBrand, {
      scale: 0.42,
      opacity: 0,
      xPercent: -22,
      yPercent: -22,
      ease: 'power2.in',
    }, 0);

    // Nav wordmark fades in over the same window.
    tl.to(navBrand, {
      opacity: 1,
      ease: 'power2.out',
    }, 0);

    // Pill expands in lockstep — max-width tweens with the same
    // scrub, so the header grows/shrinks as the wordmark
    // appears/disappears. Bidirectional via scrub reversal.
    if (navBrandLink) {
      tl.to(navBrandLink, {
        maxWidth: '16em',
        ease: 'power2.out',
      }, 0);
    }

    // Refresh after the intro lifts the scroll lock — the page can
    // finally scroll, so ScrollTrigger needs to re-measure.
    window.addEventListener('intro:end', () => {
      requestAnimationFrame(() => ScrollTrigger.refresh());
    });
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
