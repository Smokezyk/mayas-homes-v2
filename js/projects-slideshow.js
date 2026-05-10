/* =========================================================
   Studio §05 — Maya's Selection slideshow.
   Prev / next chevrons cycle the active card with wrap-around
   (after #6 → #1, before #1 → #6). The card image is a
   button that will trigger a before/after transformation
   animation per project; until those videos exist, the
   trigger is a no-op placeholder logging the project route.
   ========================================================= */
(function () {
  'use strict';

  const showcase = document.querySelector('.studio__work-showcase');
  const cards = Array.from(document.querySelectorAll('.studio__work-card'));
  const arrows = document.querySelectorAll('.studio__work-arrow');
  const triggers = document.querySelectorAll('[data-project-trigger]');

  if (!showcase || cards.length === 0) return;

  let activeIndex = 0;

  function activateProject(index) {
    const total = cards.length;
    // Wrap-around in both directions.
    const nextIndex = ((index % total) + total) % total;

    cards.forEach((card, i) => {
      card.classList.toggle('studio__work-card--active', i === nextIndex);
    });
    showcase.dataset.activeProject = String(nextIndex);
    activeIndex = nextIndex;
  }

  arrows.forEach((arrow) => {
    arrow.addEventListener('click', () => {
      const direction = parseInt(arrow.dataset.direction, 10) || 1;
      activateProject(activeIndex + direction);
    });
  });

  // Card-image trigger — placeholder for the future before/after
  // transformation animation. Each card's parent <article> carries
  // data-project-href so the eventual handler knows which project
  // route to open / which video to play. For now, log and do nothing
  // visible.
  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const card = trigger.closest('.studio__work-card');
      const projectHref = card ? card.dataset.projectHref : '';
      // Future: open before/after modal scoped to projectHref.
      console.log('[studio-slideshow] card trigger fired —', projectHref || '(no href)');
    });
  });

  // Keyboard navigation: ←/→ when focus is on an arrow.
  arrows.forEach((arrow) => {
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
})();
