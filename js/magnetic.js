// Magnetic hover — elements tagged [data-magnetic] drift toward the cursor
// when it enters a 90 px buffer beyond their natural bounds, and ease back
// to neutral on leave. STRENGTH 0.4 = 40% of the cursor offset; tuned to
// read as charming attention without feeling sticky.

(function () {
  const elements = document.querySelectorAll('[data-magnetic]');
  if (!elements.length) return;

  const STRENGTH = 0.4;
  const RANGE = 90;

  elements.forEach((el) => {
    function onMove(e) {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDist = Math.max(rect.width, rect.height) / 2 + RANGE;

      if (distance < maxDist) {
        const factor = 1 - (distance / maxDist);
        el.style.transform = `translate(${dx * STRENGTH * factor}px, ${dy * STRENGTH * factor}px)`;
        el.style.transition = 'transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1)';
      } else {
        el.style.transform = 'translate(0, 0)';
      }
    }

    function onLeave() {
      el.style.transform = 'translate(0, 0)';
      el.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
    }

    document.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
  });
})();
