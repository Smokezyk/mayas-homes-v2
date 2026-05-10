/* =========================================================
   Studio §05 — Maja's Selection slideshow.

   Prev / next chevrons cycle the active card with wrap-around
   (after #6 → #1, before #1 → #6). Default state of each card
   shows the AFTER image (the finished room).

   Click the photo to play the develop-style before/after
   reveal: the BEFORE image cross-dissolves over the AFTER for
   ~1.6 s, holds for ~1 s, then fades back to the AFTER. The
   reveal is one-shot per click.

   For the reveal to actually do something visible, each card's
   <img class="studio__work-card-before"> must have its src
   filled in (either directly in HTML or via the
   data-project-before attribute). Until then the click toggles
   the class but no second image renders — the AFTER stays in
   view, no error logged. Drop the before-image files into
   /assets/images/ named:
     before-belle-riviere.webp
     before-rosa.webp
     before-vista.webp
     before-the-tasca.webp
     before-la-sala.webp
     before-figueiras.webp
   ...crop to 3:2 horizontal (e.g. 1500×1000), and the click
   reveal will activate automatically.
   ========================================================= */
(function () {
  'use strict';

  const showcase = document.querySelector('.studio__work-showcase');
  const cards = Array.from(document.querySelectorAll('.studio__work-card'));
  const arrows = document.querySelectorAll('.studio__work-arrow');
  const triggers = document.querySelectorAll('[data-project-trigger]');

  if (!showcase || cards.length === 0) return;

  let activeIndex = 0;

  // Lazy-set before-image src from data-project-before so empty
  // attributes don't trigger 404s. When the data attribute is
  // populated, the next click will pick it up.
  function ensureBeforeSrc(img) {
    if (!img) return;
    const src = img.dataset.projectBefore;
    if (src && !img.src) img.src = src;
  }

  function activateProject(index) {
    const total = cards.length;
    const nextIndex = ((index % total) + total) % total;
    cards.forEach((card, i) => {
      card.classList.toggle('studio__work-card--active', i === nextIndex);
      // Always reset before-state when leaving a card so the next
      // visit starts in the AFTER state.
      const media = card.querySelector('.studio__work-card-media');
      if (media) media.classList.remove('is-before-active');
    });
    showcase.dataset.activeProject = String(nextIndex);
    activeIndex = nextIndex;
  }

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

  // Click the photo → play before/after reveal once.
  // Sequence: fade BEFORE in (1.6 s) → hold (1 s) → fade BEFORE out (1.6 s).
  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const card = trigger.closest('.studio__work-card');
      const media = card && card.querySelector('.studio__work-card-media');
      const beforeImg = card && card.querySelector('.studio__work-card-before');
      if (!media || !beforeImg) return;
      ensureBeforeSrc(beforeImg);
      // Skip if no before src is wired up yet.
      if (!beforeImg.getAttribute('src')) return;
      // Don't restart mid-reveal.
      if (media.classList.contains('is-before-active')) return;

      media.classList.add('is-before-active');
      // CSS transition is 1.6 s in, hold 1 s on the BEFORE state,
      // then remove the class to let the 1.6 s transition out.
      window.setTimeout(() => {
        media.classList.remove('is-before-active');
      }, 1600 + 1000);
    });
  });
})();
