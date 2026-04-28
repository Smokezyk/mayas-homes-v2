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
  /* Glass kicks in as soon as the user starts scrolling — synced with
     the brand-flight window (0 → 100 px). Header is transparent at
     scrollY 0 and gains the glassmorphism the moment scroll begins. */
  const GLASS_AT_Y = () => 30;

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

    /* The hero wordmark stays VISIBLE while it scales + translates
       toward the top-left. The opacity handoff only happens in the
       last sliver of the timeline so it reads as a single element
       arriving in the header rather than two crossfading. */

    // Whole window: scale + translate the hero brand toward the header.
    tl.to(heroBrand, {
      scale: 0.32,
      xPercent: -30,
      yPercent: -32,
      ease: 'power2.in',
    }, 0);

    // Final 15%: hero brand snaps out, nav wordmark snaps in.
    tl.to(heroBrand, { opacity: 0, ease: 'none' }, 0.85);
    tl.to(navBrand,  { opacity: 1, ease: 'none' }, 0.85);

    // Pill expansion runs across the full window (so the header
    // already has space when the wordmark lands).
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
