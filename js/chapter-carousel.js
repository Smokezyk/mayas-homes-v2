// =====================================================================
// /services/ rotate-chapter mobile carousel.
// On mobile, the Kitchens chapter's 2-photo crossfade animation is
// disabled (it can leave images stuck at opacity 0 under reduced-motion
// conditions). Instead, prev/next buttons skip between the photos by
// toggling .is-active on each <img>. Desktop keeps the CSS animation.
// =====================================================================
(function () {
  const carousels = document.querySelectorAll('[data-chapter-carousel]');
  if (carousels.length === 0) return;

  carousels.forEach((carousel) => {
    const imgs = Array.from(carousel.querySelectorAll(':scope > img'));
    const prev = carousel.querySelector('[data-chapter-prev]');
    const next = carousel.querySelector('[data-chapter-next]');
    const currentLabel = carousel.querySelector('[data-chapter-current]');
    const totalLabel = carousel.querySelector('[data-chapter-total]');
    if (imgs.length === 0 || !prev || !next) return;

    let active = imgs.findIndex((img) => img.classList.contains('is-active'));
    if (active < 0) {
      active = 0;
      imgs[0].classList.add('is-active');
    }
    if (totalLabel) totalLabel.textContent = String(imgs.length);

    const setActive = (newIndex) => {
      const target = ((newIndex % imgs.length) + imgs.length) % imgs.length;
      if (target === active) return;
      imgs[active].classList.remove('is-active');
      imgs[target].classList.add('is-active');
      active = target;
      if (currentLabel) currentLabel.textContent = String(active + 1);
    };

    prev.addEventListener('click', () => setActive(active - 1));
    next.addEventListener('click', () => setActive(active + 1));
  });
})();
