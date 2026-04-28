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

    /* The nav wordmark is permanently visible (CSS), so MAYA'S HOMES
       is always on screen — either in the centred hero or in the
       header (or both during the brief travel).

       Hero wordmark scales + translates toward the header and fades
       at the end of the window. Nav wordmark stays put. */

    tl.to(heroBrand, {
      scale: 0.3,
      x: '-42vw',
      y: '-45vh',
      ease: 'power2.in',
    }, 0);

    // 80 → 100%: hero brand fades out as it arrives at the header.
    tl.to(heroBrand, { opacity: 0, duration: 0.2, ease: 'none' }, 0.8);

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
