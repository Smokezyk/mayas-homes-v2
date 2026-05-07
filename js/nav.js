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

   FLIP-style continuous motion. On first scroll past the intro
   section: clone the hero brand as a fixed-position element,
   hide the original hero brand and the nav brand, animate the
   clone along a single tweened path (translate + scale) into the
   nav slot, and on complete reveal the real nav brand and remove
   the clone. The user sees one element traveling from centre to
   corner — no fade, no dual-state crossfade. Fires once.
   ========================================================= */
{
  const heroBrand     = document.querySelector('.intro__name');
  const navBrand      = document.querySelector('[data-nav-brand]');
  const navBrandLink  = document.querySelector('.nav__brand');
  const introSection  = document.querySelector('.intro');
  const navEl         = document.querySelector('[data-nav]');
  const gsap          = window.gsap;

  if (gsap && heroBrand && navBrand && navBrandLink && introSection) {

    let fired = false;

    const measureNavRect = () => {
      // Force the nav into its seated state and the brand slot to
      // its final width so getBoundingClientRect() returns the
      // resting target — not the tucked pre-intro position above
      // the viewport.
      const savedMW = navBrandLink.style.maxWidth;
      const savedOp = navBrand.style.opacity;
      const savedVis = navBrand.style.visibility;
      const navHadVisible = navEl ? navEl.classList.contains('is-visible') : true;

      navBrandLink.style.maxWidth = '16em';
      navBrand.style.opacity = '1';
      navBrand.style.visibility = 'visible';
      if (navEl) navEl.classList.add('is-visible');

      void navBrand.offsetHeight; // layout flush

      const rect = navBrand.getBoundingClientRect();

      navBrandLink.style.maxWidth = savedMW;
      navBrand.style.opacity = savedOp;
      navBrand.style.visibility = savedVis;
      if (navEl && !navHadVisible) navEl.classList.remove('is-visible');

      return rect;
    };

    const flyWordmark = () => {
      if (fired) return;
      fired = true;

      const heroRect = heroBrand.getBoundingClientRect();
      const navRect  = measureNavRect();
      if (!heroRect.width || !navRect.width) {
        // Geometry not ready — fall back to a hard swap.
        heroBrand.style.visibility = 'hidden';
        navBrand.style.opacity = '1';
        return;
      }

      const heroStyles = getComputedStyle(heroBrand);
      const navStyles  = getComputedStyle(navBrand);

      // Clone the hero brand and lift it into the layout root.
      const clone = heroBrand.cloneNode(true);
      clone.style.position = 'fixed';
      clone.style.top    = `${heroRect.top}px`;
      clone.style.left   = `${heroRect.left}px`;
      clone.style.width  = `${heroRect.width}px`;
      clone.style.height = `${heroRect.height}px`;
      clone.style.margin = '0';
      clone.style.fontSize       = heroStyles.fontSize;
      clone.style.fontFamily     = heroStyles.fontFamily;
      clone.style.fontWeight     = heroStyles.fontWeight;
      clone.style.letterSpacing  = heroStyles.letterSpacing;
      clone.style.color          = heroStyles.color;
      clone.style.lineHeight     = heroStyles.lineHeight;
      clone.style.textAlign      = 'center';
      clone.style.zIndex          = '50';
      clone.style.pointerEvents   = 'none';
      clone.style.transformOrigin = 'top left';
      clone.style.willChange      = 'transform, font-size';
      document.body.appendChild(clone);

      heroBrand.style.visibility = 'hidden';
      navBrand.style.visibility  = 'hidden';

      // Match the nav slot size at the same anchor. We translate the
      // clone's top-left corner onto the nav brand's top-left and
      // tween the font-size from hero to nav so glyph metrics agree
      // when the swap fires.
      const translateX = navRect.left - heroRect.left;
      const translateY = navRect.top  - heroRect.top;
      const scaleX     = navRect.width / heroRect.width;

      gsap.to(clone, {
        x: translateX,
        y: translateY,
        scale: scaleX,
        fontSize: navStyles.fontSize,
        letterSpacing: navStyles.letterSpacing,
        duration: 1.0,
        ease: 'power2.inOut',
        onComplete: () => {
          navBrand.style.visibility = '';
          navBrand.style.opacity    = '1';
          clone.remove();
        },
      });
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
          flyWordmark();
          observer.disconnect();
        }
      });
    }, { threshold: 0 });
    observer.observe(introSection);

    /* Click the wordmark in the header to scroll smoothly back to
       the top of the page. The nav wordmark stays in place — once
       it has flown into position, it does not reverse. Override the
       generic [href^="#"] handler in main.js so the scroll target
       is unambiguously absolute Y=0. */
    navBrandLink.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      const lenis = window.__lenis;
      if (lenis && typeof lenis.scrollTo === 'function') {
        lenis.scrollTo(0, { duration: 1.0, force: true, lock: true });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, true);
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
