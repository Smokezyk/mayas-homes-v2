// The native link also works without JavaScript. Avoid covering footer details.
(function () {
  'use strict';
  var link = document.querySelector('.whatsapp-contact');
  var footer = document.querySelector('footer');
  if (!link || !footer || !('IntersectionObserver' in window)) return;
  var observer = new IntersectionObserver(function (entries) {
    link.classList.toggle('is-footer-visible', entries[0].isIntersecting);
  });
  observer.observe(footer);
})();
