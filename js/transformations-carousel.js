// =====================================================================
// Homepage "Six homes Maja wants to show you" — carousel.
//
// Default mode (homepage): mobile-only carousel. Below 768px, all
// .tile elements are hidden except .is-active; prev/next buttons
// cycle through the six transformations. Desktop keeps the original
// 2×3 grid layout untouched.
//
// Solo mode (profile / studio page, opted in via
// data-transformations-carousel="solo"): one-tile-at-a-time on ALL
// viewports. Click on the tile plays the morph reveal exactly like
// the homepage; the arrows navigate between slides. When navigating
// away from a slide we reset its video to frame 0 and drop any
// reveal/playing state so the next visit starts from "before".
// =====================================================================
(function () {
  const carousel = document.querySelector('[data-transformations-carousel]');
  if (!carousel) return;

  const tiles = Array.from(carousel.querySelectorAll('.tile'));
  const prev = document.querySelector('[data-transformations-prev]');
  const next = document.querySelector('[data-transformations-next]');
  const currentLabel = document.querySelector('[data-transformations-current]');
  const totalLabel = document.querySelector('[data-transformations-total]');
  const isSolo = carousel.getAttribute('data-transformations-carousel') === 'solo';

  if (tiles.length === 0 || !prev || !next) return;

  let activeIndex = tiles.findIndex((t) => t.classList.contains('is-active'));
  if (activeIndex < 0) {
    activeIndex = 0;
    tiles[0].classList.add('is-active');
  }

  if (totalLabel) totalLabel.textContent = String(tiles.length);

  const setActive = (newIndex) => {
    const target = ((newIndex % tiles.length) + tiles.length) % tiles.length;
    if (target === activeIndex) return;
    const outgoing = tiles[activeIndex];
    outgoing.classList.remove('is-active');
    // In solo mode, also drop any reveal/playing state and reset the
    // outgoing video to frame 0 so the next visit starts from "before".
    // (Homepage mobile carousel intentionally keeps its existing
    // behavior unchanged.)
    if (isSolo) {
      outgoing.classList.remove('is-playing', 'is-revealed');
      const outgoingVideo = outgoing.querySelector('[data-tile-video]');
      if (outgoingVideo) {
        try { outgoingVideo.pause(); } catch (_) {}
        try { outgoingVideo.currentTime = 0; } catch (_) {}
      }
    }
    tiles[target].classList.add('is-active');
    activeIndex = target;
    if (currentLabel) currentLabel.textContent = String(activeIndex + 1);
  };

  prev.addEventListener('click', () => setActive(activeIndex - 1));
  next.addEventListener('click', () => setActive(activeIndex + 1));
})();
