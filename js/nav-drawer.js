// =====================================================================
// Floating-nav drawer — opens a full-bleed bone overlay with the seven
// nav links + the "Begin a Project" silver pill. Toggle is the
// hamburger inside the floating nav; close on X click, link click, or
// Escape key. Body scroll locks while open.
// =====================================================================
(function () {
  const toggle = document.querySelector('[data-menu-open]');
  const closeBtn = document.querySelector('[data-menu-close]');
  const drawer = document.querySelector('[data-drawer]');
  if (!toggle || !drawer) return;

  const open = () => {
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add('is-open'));
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('nav-locked');
  };

  const close = () => {
    drawer.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('nav-locked');
    setTimeout(() => { drawer.hidden = true; }, 450);
  };

  toggle.addEventListener('click', () => {
    drawer.classList.contains('is-open') ? close() : open();
  });

  if (closeBtn) closeBtn.addEventListener('click', close);

  drawer.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) close();
  });
})();
