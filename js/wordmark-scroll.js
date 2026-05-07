// Hero "MAYA'S HOMES" → floating-nav wordmark — scroll-tied morph.
// Source becomes position: fixed at its hero viewport position. As the user
// scrolls, the page scrolls normally, but the source stays fixed and is
// translated/scaled via scroll-progress toward the nav slot. Reverses cleanly
// on scroll-up. Desktop only.

(function () {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('[wordmark-scroll] gsap or ScrollTrigger missing — animation skipped');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  async function setup() {
    // Wait for fonts so source font-size measurement is stable
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    // Wait for next paint to ensure layout is settled
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));

    const source = document.querySelector('[data-wordmark-source]');
    const target = document.querySelector('[data-wordmark-target]');
    const intro = document.querySelector('.intro');
    if (!source || !target || !intro) return;

    // Mobile skip — show static nav wordmark from page load, no animation
    if (!window.matchMedia('(min-width: 1024px)').matches) {
      target.style.opacity = '1';
      return;
    }

    // CRITICAL: measure at scroll = 0 with no prior transforms on the source.
    // If the page is currently scrolled or any transform is lingering from
    // a previous run, the rects will be wrong.
    if (window.scrollY > 0) {
      window.scrollTo(0, 0);
      await new Promise((r) => requestAnimationFrame(r));
    }
    gsap.set(source, { clearProps: 'all' });
    await new Promise((r) => requestAnimationFrame(r));

    const sourceRect = source.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const sourceStyle = getComputedStyle(source);
    const targetStyle = getComputedStyle(target);
    const sourceFont = parseFloat(sourceStyle.fontSize);
    const targetFont = parseFloat(targetStyle.fontSize);

    // Hide static nav target while source is in flight
    target.style.opacity = '0';

    // Pin the source as a fixed-position element at its current viewport spot.
    // This decouples it from page scroll — the page can scroll freely beneath
    // it, while the source stays where it is and morphs via transform.
    gsap.set(source, {
      position: 'fixed',
      top: sourceRect.top,
      left: sourceRect.left,
      width: sourceRect.width,
      height: sourceRect.height,
      margin: 0,
      transformOrigin: 'center center',
      zIndex: 70,
      pointerEvents: 'none',
      willChange: 'transform'
    });

    // Deltas needed to land the source's center on the target's center.
    // Captured at setup; recomputed on resize via onRefresh below.
    const deltas = {
      x: (targetRect.left + targetRect.width / 2) - (sourceRect.left + sourceRect.width / 2),
      y: (targetRect.top + targetRect.height / 2) - (sourceRect.top + sourceRect.height / 2),
      scale: targetFont / sourceFont,
      color: targetStyle.color
    };

    // Scroll-tied tween — page scrolls normally, source morphs via transform.
    // No `pin: true` — the page is free to scroll throughout the trigger range.
    gsap.to(source, {
      x: deltas.x,
      y: deltas.y,
      scale: deltas.scale,
      color: deltas.color,
      ease: 'none',
      scrollTrigger: {
        trigger: intro,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.5,
        invalidateOnRefresh: true,
        onRefresh: () => {
          // Recalculate target position on resize (nav layout may shift).
          // Subtract the source's current applied transform so we measure its
          // untransformed reference point.
          const sRect = source.getBoundingClientRect();
          const tRect = target.getBoundingClientRect();
          const currentX = parseFloat(gsap.getProperty(source, 'x')) || 0;
          const currentY = parseFloat(gsap.getProperty(source, 'y')) || 0;
          const sourceUntransformedCenterX = sRect.left + sRect.width / 2 - currentX;
          const sourceUntransformedCenterY = sRect.top + sRect.height / 2 - currentY;
          deltas.x = (tRect.left + tRect.width / 2) - sourceUntransformedCenterX;
          deltas.y = (tRect.top + tRect.height / 2) - sourceUntransformedCenterY;
        },
        onLeave: () => {
          // Source has fully docked — hand off to static nav target
          target.style.opacity = '1';
          source.style.visibility = 'hidden';
        },
        onEnterBack: () => {
          // User scrolled back into the morph range — un-dock,
          // show source again so the scrub can reverse it back to hero
          target.style.opacity = '0';
          source.style.visibility = '';
        }
      }
    });
  }

  // Run after full layout settles
  if (document.readyState === 'complete') {
    setup();
  } else {
    window.addEventListener('load', setup);
  }
})();
