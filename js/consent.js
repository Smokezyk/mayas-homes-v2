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
      title: 'A note on cookies.',
      text: 'With your permission, we use Google Analytics to understand how this website is used. You can decline or change your choice at any time. Read our ',
      privacyLabel: 'Privacy Policy',
      privacyHref: '/privacy/',
      tail: '.',
      accept: 'Accept',
      decline: 'Decline',
      settings: 'Cookie settings'
    },
    pt: {
      aria: 'Aviso de cookies',
      title: 'Sobre os cookies.',
      text: 'Com a sua autorização, usamos o Google Analytics para perceber como este sítio é utilizado. Pode recusar ou alterar a sua escolha a qualquer momento. Consulte a nossa ',
      privacyLabel: 'Política de Privacidade',
      privacyHref: '/pt/privacy/',
      tail: '.',
      accept: 'Aceitar',
      decline: 'Recusar',
      settings: 'Preferências de cookies'
    }
  };
  var t = isPT ? COPY.pt : COPY.en;

  // ── GA4 loader — only ever called after explicit consent ──────────
  function loadGA4() {
    // Never collect analytics from local or hosted review copies.
    if (location.protocol !== 'https:' || !['mayashomes.com', 'www.mayashomes.com'].includes(location.hostname)) return;
    window['ga-disable-' + GA4_ID] = false;
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
    var canonical = document.querySelector('link[rel=canonical]');
    var pageLocation = canonical ? canonical.href : location.origin + location.pathname;
    var referrerOrigin = '';
    try { if (document.referrer) referrerOrigin = new URL(document.referrer).origin; } catch (e) {}
    gtag('config', GA4_ID, {
      page_location: pageLocation,
      page_referrer: referrerOrigin,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
  }

  function readConsent() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function writeConsent(v) {
    try { localStorage.setItem(STORAGE_KEY, v); } catch (e) {}
  }

  var settingsButton;
  var activeBanner;
  var returnFocus;

  // A settings visit preserves the current choice until a new one is made.
  window.mhResetConsent = function () {
    render(true);
  };

  function clearAnalyticsCookies() {
    window['ga-disable-' + GA4_ID] = true;
    document.cookie.split(';').forEach(function (cookie) {
      var name = cookie.split('=')[0].trim();
      if (!/^_ga(?:_|$)/.test(name)) return;
      document.cookie = name + '=; Max-Age=0; path=/';
      var labels = location.hostname.split('.');
      while (labels.length > 1) {
        document.cookie = name + '=; Max-Age=0; path=/; domain=' + labels.join('.');
        labels.shift();
      }
    });
  }

  // ── No decision yet — render the banner ───────────────────────────
  function injectStyles() {
    if (document.getElementById('mh-consent-style')) return;
    var css = [
      '.mh-consent,.mh-consent *{box-sizing:border-box;}',
      '.mh-consent{position:fixed;z-index:2147483000;left:24px;right:24px;',
      'bottom:max(24px,env(safe-area-inset-bottom));width:calc(100% - 48px);max-width:1080px;margin-inline:auto;',
      'display:grid;grid-template-columns:150px minmax(0,1fr) auto;align-items:center;gap:28px;',
      'max-height:calc(100vh - 48px);max-height:calc(100dvh - 48px);overflow-y:auto;',
      'background:#F7F3EB;border:1px solid rgba(38,78,74,.19);border-radius:16px;',
      'box-shadow:0 8px 32px rgba(38,49,40,.08);padding:26px 30px;color:#292d26;',
      "font-family:var(--sans,'Plus Jakarta Sans',sans-serif);",
      'transition:opacity .28s cubic-bezier(.22,1,.36,1),transform .28s cubic-bezier(.22,1,.36,1);}',
      '.mh-consent.is-out{opacity:0;transform:translateY(8px);pointer-events:none;}',
      ".mh-consent__title{font-family:'Bodoni Moda',Georgia,serif;font-size:27px;font-weight:400;line-height:1.18;letter-spacing:-.025em;color:#264E4A;margin:0;}",
      '.mh-consent__text{font-size:12px;font-weight:400;line-height:1.8;letter-spacing:0;margin:0;color:#535a50;}',
      '.mh-consent__text a{color:#264E4A;text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1px;}',
      '.mh-consent__actions{display:grid;grid-template-columns:repeat(2,minmax(96px,1fr));gap:10px;}',
      '.mh-consent__btn{font:inherit;font-size:12px;font-weight:500;line-height:1.3;letter-spacing:0;',
      'text-transform:none;cursor:pointer;border-radius:999px;min-height:46px;padding:13px 19px;',
      'color:#264E4A;background:transparent;border:1px solid rgba(38,78,74,.48);',
      'transition:color .2s cubic-bezier(.22,1,.36,1),background-color .2s cubic-bezier(.22,1,.36,1);}',
      '@media (hover:hover){.mh-consent__btn:hover{background:#264E4A;color:#F7F3EB;}}',
      '.mh-consent-settings{font:inherit;font-size:12px;color:inherit;background:none;border:0;padding:12px 0;cursor:pointer;text-decoration:underline;}',
      '.mh-consent-settings:focus-visible,.mh-consent__btn:focus-visible,.mh-consent__text a:focus-visible{outline:2px solid #264E4A;outline-offset:4px;}',
      '.mh-consent-settings-wrap{padding:0 24px 20px;background:#F7F3EB;color:#000;}',
      '.mh-consent__btn:active{background:#264E4A;color:#F7F3EB;}',
      '@media (max-width:900px){.mh-consent{grid-template-columns:minmax(0,1fr) auto;gap:12px 28px;}',
      '.mh-consent__title{grid-column:1;}.mh-consent__text{grid-column:1;}',
      '.mh-consent__actions{grid-column:2;grid-row:1 / span 2;}}',
      '@media (max-width:600px){.mh-consent{left:12px;right:12px;width:calc(100% - 24px);bottom:max(12px,env(safe-area-inset-bottom));',
      'display:block;padding:22px 24px;border-radius:14px;max-height:calc(100dvh - 24px - env(safe-area-inset-bottom));}',
      '.mh-consent__title{font-size:26px;margin-bottom:12px;}.mh-consent__text{font-size:12px;line-height:1.75;}',
      '.mh-consent__actions{margin-top:20px;}.mh-consent__btn{min-height:46px;}}',
      '@media (prefers-reduced-motion:reduce){.mh-consent,.mh-consent__btn{transition:none;}}'
    ].join('');
    var style = document.createElement('style');
    style.id = 'mh-consent-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function render(fromSettings) {
    if (activeBanner) {
      activeBanner.querySelector('button').focus();
      return;
    }
    injectStyles();
    returnFocus = fromSettings ? document.activeElement : null;

    var banner = document.createElement('div');
    banner.className = 'mh-consent';
    activeBanner = banner;
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', t.aria);
    banner.setAttribute('aria-describedby', 'mh-consent-description');

    var title = document.createElement('h2');
    title.className = 'mh-consent__title';
    title.textContent = t.title;

    var p = document.createElement('p');
    p.id = 'mh-consent-description';
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
    banner.appendChild(title);
    banner.appendChild(p);
    banner.appendChild(actions);
    document.body.appendChild(banner);
    if (fromSettings) accept.focus();

    function dismiss() {
      banner.classList.add('is-out');
      activeBanner = null;
      if (returnFocus && document.contains(returnFocus)) returnFocus.focus();
      setTimeout(function () { if (banner.parentNode) banner.parentNode.removeChild(banner); }, 420);
    }

    accept.addEventListener('click', function () {
      writeConsent('granted');
      loadGA4();
      dismiss();
    });
    decline.addEventListener('click', function () {
      writeConsent('denied');
      clearAnalyticsCookies();
      dismiss();
      // Unload an already-running analytics script after withdrawal.
      if (window.__mhGA4Loaded) location.reload();
    });
  }

  function init() {
    injectStyles();
    settingsButton = document.createElement('button');
    settingsButton.type = 'button';
    settingsButton.className = 'mh-consent-settings';
    settingsButton.textContent = t.settings;
    settingsButton.addEventListener('click', function () { render(true); });
    var footer = document.querySelector('.footer__credentials-legal') || document.querySelector('footer');
    if (!footer) {
      footer = document.createElement('div');
      footer.className = 'mh-consent-settings-wrap';
      document.body.appendChild(footer);
    }
    footer.appendChild(document.createTextNode(' '));
    footer.appendChild(settingsButton);
    var prior = readConsent();
    if (prior === 'granted') loadGA4();
    else if (prior !== 'denied') render(false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
