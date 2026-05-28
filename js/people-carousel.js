// =====================================================================
// Eight Hands · One Signature — single-person carousel.
// Replaces the 4×2 grid with a one-at-a-time view; prev/next buttons
// cycle through the studio's bench (Bogdan → Iurie → Yurii → Vlad →
// Ivan → Artur → Jhon → Lukas), looping at both ends. Counter under
// the arrows reads "n / total".
// =====================================================================
(function () {
  const carousel = document.querySelector('[data-people-carousel]');
  if (!carousel) return;

  const people = Array.from(carousel.querySelectorAll('.studio__person'));
  const prev = carousel.querySelector('[data-people-prev]');
  const next = carousel.querySelector('[data-people-next]');
  const currentLabel = carousel.querySelector('[data-people-current]');
  const totalLabel = carousel.querySelector('[data-people-total]');

  if (people.length === 0 || !prev || !next) return;

  // Ensure exactly one person starts active.
  let activeIndex = people.findIndex((p) => p.classList.contains('is-active'));
  if (activeIndex < 0) {
    activeIndex = 0;
    people[0].classList.add('is-active');
  }

  if (totalLabel) totalLabel.textContent = String(people.length);

  const setActive = (newIndex) => {
    const next = ((newIndex % people.length) + people.length) % people.length;
    if (next === activeIndex) return;
    people[activeIndex].classList.remove('is-active');
    people[next].classList.add('is-active');
    activeIndex = next;
    if (currentLabel) currentLabel.textContent = String(activeIndex + 1);
  };

  prev.addEventListener('click', () => setActive(activeIndex - 1));
  next.addEventListener('click', () => setActive(activeIndex + 1));

  // Keyboard ← / → when the carousel is focused/visible.
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { setActive(activeIndex - 1); }
    if (e.key === 'ArrowRight') { setActive(activeIndex + 1); }
  });
})();
