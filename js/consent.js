// =====================================================================
// Maya's Homes — GDPR cookie consent + consent-gated GA4.
//
// GA4 (G-0W5WYQL10G) does NOT load until the visitor clicks "Accept".
// On "Decline", nothing analytics-related is loaded and the choice is
// remembered. The banner is self-contained: it injects its own styles
// and markup, and localises EN/PT from <html lang>. No per-page HTML
// or CSS is required — every page just loads this one script.
//
// Storage: localStorage["mh-consent"] = "granted" | "denied".
// To let a visitor change their mind, call window.mhResetConsent().
// =====================================================================
(function () {
  'use strict';

  var GA4_ID = 'G-0W5WYQL10G';
  var STORAGE_KEY = 'mh-consent';

  var lang = (document.documentElement.lang || 'en').toLowerCase();
  var isPT = lang.indexOf('pt') === 0;

  var COPY = {
    en: {
      aria: 'Cookie notice',
      text: 'We use cookies only to understand how this site is used. Nothing is shared or sold. See our ',
      privacyLabel: 'Privacy Policy',
      privacyHref: '/privacy/',
      tail: '.',
      accept: 'Accept',
      decline: 'Decline'
    },
    pt: {
      aria: 'Aviso de cookies',
      text: 'Usamos cookies apenas para perceber como este sítio é utilizado. Nada é partilhado ou vendido. Consulte a nossa ',
      privacyLabel: 'Política de Privacidade',
      privacyHref: '/pt/privacy/',
      tail: '.',
      accept: 'Aceitar',
      decline: 'Recusar'
    }
  };
  var t = isPT ? COPY.pt : COPY.en;

  // ── GA4 loader — only ever called after explicit consent ──────────
  function loadGA4() {
    if (window.__mhGA4Loaded) return;
    window.__mhGA4Loaded = true;

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA4_ID, { anonymize_ip: true });
  }

  function readConsent() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function writeConsent(v) {
    try { localStorage.setItem(STORAGE_KEY, v); } catch (e) {}
  }

  // Allow a visitor to reopen the choice (e.g. from a privacy-page link).
  window.mhResetConsent = function () {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    location.reload();
  };

  // ── Decision already made — honour it, no banner ──────────────────
  var prior = readConsent();
  if (prior === 'granted') { loadGA4(); return; }
  if (prior === 'denied') { return; }

  // ── No decision yet — render the banner ───────────────────────────
  function injectStyles() {
    if (document.getElementById('mh-consent-style')) return;
    var css = [
      '.mh-consent{position:fixed;z-index:2147483000;left:clamp(16px,3vw,32px);',
      'bottom:clamp(16px,3vw,32px);max-width:418px;',
      'background:linear-gradient(135deg,rgba(255,255,255,0.94),rgba(244,239,230,0.94));',
      'backdrop-filter:blur(20px) saturate(1.2);-webkit-backdrop-filter:blur(20px) saturate(1.2);',
      'border:1px solid rgba(20,17,14,0.10);border-radius:14px;',
      'box-shadow:0 16px 48px rgba(0,0,0,0.16),0 4px 12px rgba(0,0,0,0.07);',
      'padding:20px 22px;color:#2a2622;',
      "font-family:'Inter',system-ui,-apple-system,sans-serif;",
      'transition:opacity .4s ease,transform .4s ease;}',
      '.mh-consent.is-out{opacity:0;transform:translateY(14px);pointer-events:none;}',
      '.mh-consent__text{font-size:13px;line-height:1.6;margin:0 0 16px;color:#4a443d;}',
      '.mh-consent__text a{color:#14110E;text-decoration:underline;text-underline-offset:2px;}',
      '.mh-consent__actions{display:flex;align-items:center;gap:16px;}',
      '.mh-consent__btn{font:inherit;font-size:11px;font-weight:500;letter-spacing:.12em;',
      'text-transform:uppercase;cursor:pointer;border-radius:999px;}',
      '.mh-consent__accept{padding:12px 26px;color:#F4EFE6;background:#14110E;',
      'border:1px solid #14110E;transition:transform .25s ease,opacity .25s ease;}',
      '.mh-consent__accept:hover{opacity:.88;}',
      '.mh-consent__accept:active{transform:scale(.97);}',
      '.mh-consent__decline{padding:12px 6px;background:none;border:0;color:#6b6359;',
      'text-decoration:underline;text-underline-offset:3px;transition:color .25s ease;}',
      '.mh-consent__decline:hover{color:#14110E;}',
      '@media (max-width:520px){.mh-consent{left:12px;right:12px;bottom:12px;max-width:none;}}',
      '@media (prefers-reduced-motion:reduce){.mh-consent{transition:none;}}'
    ].join('');
    var style = document.createElement('style');
    style.id = 'mh-consent-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function render() {
    injectStyles();

    var banner = document.createElement('div');
    banner.className = 'mh-consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', t.aria);

    var p = document.createElement('p');
    p.className = 'mh-consent__text';
    p.appendChild(document.createTextNode(t.text));
    var a = document.createElement('a');
    a.href = t.privacyHref;
    a.textContent = t.privacyLabel;
    p.appendChild(a);
    p.appendChild(document.createTextNode(t.tail));

    var actions = document.createElement('div');
    actions.className = 'mh-consent__actions';

    var accept = document.createElement('button');
    accept.type = 'button';
    accept.className = 'mh-consent__btn mh-consent__accept';
    accept.textContent = t.accept;

    var decline = document.createElement('button');
    decline.type = 'button';
    decline.className = 'mh-consent__btn mh-consent__decline';
    decline.textContent = t.decline;

    actions.appendChild(accept);
    actions.appendChild(decline);
    banner.appendChild(p);
    banner.appendChild(actions);
    document.body.appendChild(banner);

    function dismiss() {
      banner.classList.add('is-out');
      setTimeout(function () { if (banner.parentNode) banner.parentNode.removeChild(banner); }, 420);
    }

    accept.addEventListener('click', function () {
      writeConsent('granted');
      loadGA4();
      dismiss();
    });
    decline.addEventListener('click', function () {
      writeConsent('denied');
      dismiss();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
