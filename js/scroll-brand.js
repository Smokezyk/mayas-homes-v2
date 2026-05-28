/* =========================================================
   Hero wordmark ↔ nav brand-text — progressive scroll-tied morph.

   At scrollY 0:        hero wordmark full size, nav text invisible.
   At scrollY = 33% h:  hero wordmark fully scaled down + faded out,
                        nav text fully visible.
   In between:          smooth eased interpolation each rAF tick,
                        opacity + transform set inline so CSS
                        transitions don't lag behind scroll.
   ========================================================= */
(function () {
  'use strict';

  if (!document.body.classList.contains('page-home')) return;

  const heroSection = document.querySelector('.home-hero, .intro');
  const heroBrand = document.querySelector('.hero-brand, .intro__name');
  const navBrandText = document.querySelector(
    '.nav-brand-text, .nav-brand .nav-wordmark'
  );

  if (!heroSection || !heroBrand || !navBrandText) {
    console.warn('[scroll-brand] Missing element:', {
      heroSection: !!heroSection,
      heroBrand: !!heroBrand,
      navBrandText: !!navBrandText,
    });
    return;
  }

  let ticking = false;
  let cachedHeroHeight = heroSection.offsetHeight;

  window.addEventListener(
    'resize',
    () => {
      cachedHeroHeight = heroSection.offsetHeight;
    },
    { passive: true }
  );

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function updateScrollProgress() {
    const scrollY = window.scrollY || window.pageYOffset;
    const triggerEnd = cachedHeroHeight * 0.33;

    let progress = scrollY / triggerEnd;
    if (progress < 0) progress = 0;
    else if (progress > 1) progress = 1;

    const eased = easeOutCubic(progress);

    // Hero wordmark: fades + scales + lifts.
    const heroOpacity = 1 - eased;
    const heroScale = 1 - eased * 0.7;
    const heroTranslateY = -eased * 30;
    heroBrand.style.opacity = heroOpacity;
    heroBrand.style.transform = `scale(${heroScale}) translateY(${heroTranslateY}px)`;

    // Nav wordmark: fades in + settles down to translateY(0).
    const navOpacity = eased;
    const navTranslateY = (1 - eased) * -6;
    navBrandText.style.opacity = navOpacity;
    navBrandText.style.transform = `translateY(${navTranslateY}px)`;
    navBrandText.style.pointerEvents = eased > 0.5 ? 'auto' : 'none';

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updateScrollProgress);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  updateScrollProgress();

  console.log(
    '[scroll-brand] progressive scroll animation initialized — completes at scrollY =',
    Math.round(cachedHeroHeight * 0.33),
    'px'
  );
})();
