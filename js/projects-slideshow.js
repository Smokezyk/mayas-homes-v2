/* =========================================================
   Studio §05 — Maja's Selection slideshow.

   Prev / next chevrons cycle the active card with wrap-around
   (after #6 → #1, before #1 → #6). Each card holds a <video>
   element that uses the project's hero image as its poster.
   When a card becomes active, its video plays (autoplay, muted,
   looped). When inactive, it pauses to save resources.

   Each <video> carries data-project-video which JS reads to set
   src lazily. While the attribute is empty, the poster image
   shows and never plays — clean fallback until the per-project
   before/after files exist on disk.

   The card-image button (data-project-trigger) is a no-op
   placeholder for the future expanded before/after modal.
   ========================================================= */
(function () {
  'use strict';

  const showcase = document.querySelector('.studio__work-showcase');
  const cards = Array.from(document.querySelectorAll('.studio__work-card'));
  const arrows = document.querySelectorAll('.studio__work-arrow');
  const triggers = document.querySelectorAll('[data-project-trigger]');

  if (!showcase || cards.length === 0) return;

  let activeIndex = 0;

  function ensureVideoSrc(video) {
    if (!video) return;
    const src = video.dataset.projectVideo;
    if (src && !video.src) {
      video.src = src;
      try { video.load(); } catch (_) {}
    }
  }

  function playCardVideo(card) {
    const video = card && card.querySelector('.studio__work-card-video');
    if (!video) return;
    ensureVideoSrc(video);
    if (!video.src) return; // no source wired yet → poster stays
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {}); // autoplay blocked on some browsers — silent
    }
  }

  function pauseCardVideo(card) {
    const video = card && card.querySelector('.studio__work-card-video');
    if (!video) return;
    try {
      video.pause();
      video.currentTime = 0;
    } catch (_) {}
  }

  function activateProject(index) {
    const total = cards.length;
    const nextIndex = ((index % total) + total) % total;

    cards.forEach((card, i) => {
      const becomingActive = i === nextIndex;
      card.classList.toggle('studio__work-card--active', becomingActive);
      if (becomingActive) {
        playCardVideo(card);
      } else {
        pauseCardVideo(card);
      }
    });
    showcase.dataset.activeProject = String(nextIndex);
    activeIndex = nextIndex;
  }

  // Kick off the initial active card's video on first paint.
  const initialActive = cards.find((c) => c.classList.contains('studio__work-card--active')) || cards[0];
  if (initialActive) playCardVideo(initialActive);

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

  // Card-image trigger — placeholder for the future expanded
  // before/after modal. data-project-href on the parent <article>
  // tells the eventual handler which project to open.
  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const card = trigger.closest('.studio__work-card');
      const projectHref = card ? card.dataset.projectHref : '';
      console.log('[studio-slideshow] card trigger fired —', projectHref || '(no href)');
    });
  });
})();
