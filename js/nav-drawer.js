// Accessible modal navigation; keep all background content inert while open.
(function () {
  const toggle = document.querySelector('[data-menu-open]');
  const closeBtn = document.querySelector('[data-menu-close]');
  const drawer = document.querySelector('[data-drawer]');
  if (!toggle || !drawer) return;
  const pt = document.documentElement.lang.startsWith('pt');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let opened = false;
  let previousFocus;
  let hideTimer;
  const background = new Map();
  drawer.id ||= 'navigation-drawer';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-label', pt ? 'Navegação principal' : 'Main navigation');
  toggle.setAttribute('aria-controls', drawer.id);
  const focusable = () => [...drawer.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]')]
    .filter((el) => el.getClientRects().length && !el.closest('[hidden]'));
  const open = () => {
    if (opened) return;
    clearTimeout(hideTimer);
    opened = true;
    previousFocus = document.activeElement;
    drawer.hidden = false;
    drawer.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', pt ? 'Fechar menu' : 'Close menu');
    document.body.classList.add('nav-locked');
    // Handle both a body child drawer and templates nesting it in a wrapper.
    let branch = drawer;
    while (branch.parentElement) {
      [...branch.parentElement.children].forEach((el) => {
        if (el === branch || ['SCRIPT', 'STYLE', 'LINK'].includes(el.tagName)) return;
        background.set(el, el.inert);
        el.inert = true;
      });
      if (branch.parentElement === document.body) break;
      branch = branch.parentElement;
    }
    (closeBtn || focusable()[0])?.focus();
  };
  const close = () => {
    if (!opened) return;
    opened = false;
    drawer.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', pt ? 'Abrir menu' : 'Open menu');
    document.body.classList.remove('nav-locked');
    background.forEach((wasInert, el) => { el.inert = wasInert; });
    background.clear();
    if (previousFocus?.isConnected && previousFocus.getClientRects().length) previousFocus.focus();
    hideTimer = setTimeout(() => { if (!opened) drawer.hidden = true; }, motion.matches ? 0 : 450);
  };
  toggle.addEventListener('click', () => opened ? close() : open());
  closeBtn?.addEventListener('click', close);
  drawer.addEventListener('click', (event) => { if (event.target.closest('a[href]')) close(); });
  document.addEventListener('keydown', (event) => {
    if (!opened) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key === 'Tab') {
      const items = focusable();
      const first = items[0], last = items[items.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || !drawer.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !drawer.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    }
  });
  // Match the shared CSS breakpoint; a tablet menu remains usable up to 1100px.
  window.addEventListener('resize', () => { if (window.matchMedia('(min-width: 1101px)').matches) close(); });
})();
