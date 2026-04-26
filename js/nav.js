/* =========================================================
   Floating glass-morphism nav.

   Two phases:
     A. Pre-intro: nav is hidden until the cinematic intro
        completes. The intro state machine adds `is-visible`
        as the brand text crystallises (the "UI Transition").
     B. Post-intro: nav is anchored. It stays visible at the
        top of the page (logo always present), tucks away on
        scroll-down, and re-appears on scroll-up.
   ========================================================= */

const nav = document.querySelector('[data-nav]');
if (nav) {
  let lastY = window.scrollY;
  let visible = nav.classList.contains('is-visible');
  let introDone = false;

  const HIDE_DELTA = 6;
  const SHOW_DELTA = 4;
  const TOP_ANCHOR_Y = 80;        // always visible above this scrollY post-intro

  const setVisible = (next) => {
    if (next === visible) return;
    visible = next;
    nav.classList.toggle('is-visible', next);
  };

  // Once the cinematic intro is done, the nav is anchored.
  window.addEventListener('intro:end', () => {
    introDone = true;
    setVisible(true);
  });

  const onScroll = () => {
    const y = window.scrollY;
    const dy = y - lastY;

    if (introDone) {
      // Anchored: visible near the top, hides only on downward scroll
      // past the anchor zone.
      if (y < TOP_ANCHOR_Y) {
        setVisible(true);
      } else if (dy > HIDE_DELTA) {
        setVisible(false);
      } else if (dy < -SHOW_DELTA) {
        setVisible(true);
      }
    } else {
      // Pre-intro: do nothing. The intro state machine controls
      // the first reveal via `is-visible`.
    }

    lastY = y;
  };

  window.addEventListener('scroll', onScroll, { passive: true });

  // Show nav on focus-in (keyboard users).
  document.addEventListener('focusin', (e) => {
    if (introDone && nav.contains(e.target) === false) {
      setVisible(true);
    }
  });
}
