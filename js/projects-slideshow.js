/* =========================================================
   Studio §05 — Maja's Selection slideshow.

   Prev / next chevrons cycle the active card with wrap-around
   (after #6 → #1, before #1 → #6). Each card holds a
   <video data-tile-video> with the project's transformation
   morph (same six videos used by the home page tiles).

   Click the photo → video plays from frame 0. The hint pill
   reads "Click to animate" before play, hides while the
   morph runs (.is-playing), then swaps to "Play again" once
   the video ends (.is-revealed). Click again replays.

   Mirrors js/main.js project-tiles handler exactly so the
   experience is identical to the home page transformations.
   ========================================================= */
(function () {
  'use strict';

  const showcase = document.querySelector('.studio__work-showcase');
  const cards = Array.from(document.querySelectorAll('.studio__work-card'));
  const arrows = document.querySelectorAll('.studio__work-arrow');
  const triggers = document.querySelectorAll('[data-project-trigger]');
  const dots = Array.from(document.querySelectorAll('[data-work-dots] .studio__work-dot'));

  if (!showcase || cards.length === 0) return;

  let activeIndex = 0;

  // Lock every card's video on frame 0 so the visible "before"
  // state is the actual first frame, not the poster or a blank
  // canvas. Same pattern js/main.js uses for the home tiles.
  cards.forEach((card) => {
    const video = card.querySelector('[data-tile-video]');
    if (!video) return;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('webkit-playsinline', '');
    const lockFrameZero = () => {
      try { video.currentTime = 0; } catch (_) {}
      try { video.pause(); } catch (_) {}
    };
    if (video.readyState >= 1) lockFrameZero();
    else video.addEventListener('loadedmetadata', lockFrameZero, { once: true });

    // When the morph completes, mark the card revealed so the
    // hint pill swaps from "Click to animate" → "Play again",
    // the video blurs+dims, the solved overlay fades in, and the
    // View Project pill (sibling of the trigger button) surfaces.
    video.addEventListener('ended', () => {
      const media = card.querySelector('.studio__work-card-media');
      if (media) {
        media.classList.remove('is-playing');
        media.classList.add('is-revealed');
      }
      card.classList.remove('is-playing');
      card.classList.add('is-revealed');
    });
  });

  function activateProject(index) {
    const total = cards.length;
    const nextIndex = ((index % total) + total) % total;
    cards.forEach((card, i) => {
      card.classList.toggle('studio__work-card--active', i === nextIndex);
      // Reset video + hint state on every card-swap so the next
      // card always starts on frame 0 with "Click to animate".
      const media = card.querySelector('.studio__work-card-media');
      if (media) {
        media.classList.remove('is-playing');
        media.classList.remove('is-revealed');
      }
      card.classList.remove('is-playing');
      card.classList.remove('is-revealed');
      const video = card.querySelector('[data-tile-video]');
      if (video) {
        try { video.pause(); } catch (_) {}
        try { video.currentTime = 0; } catch (_) {}
      }
    });
    showcase.dataset.activeProject = String(nextIndex);
    activeIndex = nextIndex;
    // Mirror the active state on the scroll-progress dots below
    // the card stage so the visitor sees their position in the
    // six-project sequence at a glance.
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === nextIndex));
    // Update the "n / total" counter (matches people-carousel pattern).
    const counterCurrent = document.querySelector('[data-work-current]');
    const counterTotal = document.querySelector('[data-work-total]');
    if (counterCurrent) counterCurrent.textContent = String(nextIndex + 1);
    if (counterTotal) counterTotal.textContent = String(total);
  }

  // Dot click → jump straight to that project. Skips the
   // increment+wrap logic since dots address absolute positions.
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const target = parseInt(dot.dataset.dotIndex, 10);
      if (!isNaN(target)) activateProject(target);
    });
  });

  arrows.forEach((arrow) => {
    arrow.addEventListener('click', () => {
      const direction = parseInt(arrow.dataset.direction, 10) || 1;
      activateProject(activeIndex + direction);
    });
    arrow.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        activateProject(activeIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        activateProject(activeIndex - 1);
      }
    });
  });

  // Click the photo → play the transformation video from frame 0.
  // If already playing, ignore. After playthrough the `ended`
  // listener above flips the hint to "Play again", blurs+dims the
  // frozen last frame, and fades in the "what changed" overlay +
  // View Project pill. Clicking again clears the reveal state,
  // resets to frame 0, and replays.
  triggers.forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      if (e) e.preventDefault();
      const card = trigger.closest('.studio__work-card');
      if (!card) return;
      const video = card.querySelector('[data-tile-video]');
      const media = card.querySelector('.studio__work-card-media');
      if (!video || !media) return;
      if (!video.paused && !video.ended) return; // already playing
      media.classList.remove('is-revealed');
      media.classList.add('is-playing');
      card.classList.remove('is-revealed');
      card.classList.add('is-playing');
      try { video.currentTime = 0; } catch (_) {}
      const p = video.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    });
  });
})();
