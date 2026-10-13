// Consent-gated enquiry diagnostics. No fields containing personal data are read.
// A link click is not a conversation. An accepted HTTP response is not delivery
// to Maja's inbox, and neither event is automatically a qualified lead.
(function () {
  'use strict';

  var PRODUCTION_HOSTS = ['mayashomes.com', 'www.mayashomes.com'];
  var PROPERTY_STAGES = {
    'Looking for a property': 'looking',
    'Considering a property': 'considering',
    'Already own a property': 'owned'
  };
  var SERVICES = {
    'Not sure yet': 'unsure',
    'Design and complete renovation': 'complete_home',
    'Kitchen & Bathroom': 'kitchen_bathroom',
    'Structural Work': 'structural'
  };

  function allowed() {
    if (PRODUCTION_HOSTS.indexOf(window.location.hostname) === -1) return false;
    if (window.location.protocol !== 'https:') return false;
    if (window['ga-disable-G-0W5WYQL10G'] === true) return false;
    try {
      return localStorage.getItem('mh-consent') === 'granted' && typeof window.gtag === 'function';
    } catch (error) {
      return false;
    }
  }

  function context() {
    var path = window.location.pathname;
    var area = 'other';
    var project = path.match(/^\/(?:pt\/)?projects\/(vista|belle-riviere|the-tasca|rosa|la-sala|figueiras)\/?$/);
    if (/^\/(?:pt\/)?$/.test(path)) area = 'home';
    else if (/^\/(?:pt\/)?contact\/$/.test(path)) area = 'contact';
    else if (/^\/(?:pt\/)?projects\//.test(path)) area = 'projects';
    else if (/^\/(?:pt\/)?services\//.test(path)) area = 'services';
    else if (/^\/(?:pt\/)?profile\/$/.test(path)) area = 'profile';
    else if (/^\/(?:pt\/)?journal\//.test(path)) area = 'journal';
    var safePath = /^\/(?:pt\/)?(?:contact\/|profile\/|projects\/|services\/(?:kitchens-bathrooms\/)?|journal\/(?:piso-radiante\/)?)?$/.test(path) || project
      ? path : '/';
    return {
      page_area: area,
      site_language: /^pt/i.test(document.documentElement.lang) ? 'pt' : 'en',
      source_project: project ? project[1] : 'none',
      // Override auto-populated URL/referrer values: never send a query string,
      // fragment, free-text route, external referrer or enquiry field value.
      page_location: 'https://mayashomes.com' + safePath,
      page_referrer: ''
    };
  }

  function send(name, values) {
    if (!allowed()) return;
    try {
      window.gtag('event', name, Object.assign(context(), values));
    } catch (error) {
      // Analytics must never interfere with contact links or form completion.
    }
  }

  document.addEventListener('click', function (event) {
    if (!allowed()) return;
    var anchor = event.target.closest && event.target.closest('a[href]');
    if (!anchor) return;
    var url;
    try { url = new URL(anchor.href, window.location.href); } catch (error) { return; }
    var channel;
    if (url.protocol === 'tel:') channel = 'phone';
    else if (url.protocol === 'mailto:') channel = 'email';
    else if (['wa.me', 'api.whatsapp.com', 'web.whatsapp.com'].indexOf(url.hostname) !== -1) channel = 'whatsapp';
    if (channel) send('contact_click', { contact_channel: channel });
  });

  // Dispatched by the form handler only after response.ok. This intentionally
  // does not listen for a submit click or assume that a thanks-page view means
  // the hosting provider actually delivered an enquiry.
  document.addEventListener('mh:enquiry-accepted', function (event) {
    if (!allowed()) return;
    var form = event.target;
    if (!form || !form.matches || !form.matches('form[data-netlify]') || form.name !== 'contact') return;
    var stage = form.querySelector('input[name="property-stage"]:checked');
    var scope = form.querySelector('select[name="scope"]');
    send('enquiry_endpoint_accepted', {
      form_id: 'contact',
      property_stage: stage && PROPERTY_STAGES[stage.value] || 'unspecified',
      service_interest: scope && SERVICES[scope.value] || 'unspecified'
    });
  });
})();
