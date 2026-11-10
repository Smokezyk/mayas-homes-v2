// Run the complete shipped consent script with a minimal DOM and no network.
// These checks verify configuration and consent behaviour, not GA4 receipt.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/consent.js', import.meta.url), 'utf8');
const approvedQuery = '?utm_source=google&utm_medium=organic&utm_campaign=gbp';

function harness(options = {}) {
  const url = new URL(options.url || `https://mayashomes.com/${approvedQuery}`);
  const writes = [], cookies = [], elements = [];
  let consent = Object.hasOwn(options, 'consent') ? options.consent : 'granted';
  let reloads = 0;
  const document = { documentElement: { lang: 'en' }, readyState: 'complete' };
  function createElement(tagName) {
    const element = {
      tagName, children: [], className: '', attrs: {}, events: {},
      classList: { add() {} },
      appendChild(child) { this.children.push(child); child.parentNode = this; return child; },
      removeChild(child) { this.children.splice(this.children.indexOf(child), 1); child.parentNode = null; },
      setAttribute(key, value) { this.attrs[key] = value; },
      addEventListener(name, callback) { this.events[name] = callback; },
      focus() { document.activeElement = this; },
      querySelector(selector) {
        assert.equal(selector, 'button');
        return this.children.find(child => child.tagName === 'button')
          || this.children.flatMap(child => child.children || []).find(child => child.tagName === 'button');
      }
    };
    elements.push(element);
    return element;
  }
  document.head = createElement('head');
  document.body = createElement('body');
  const footer = createElement('footer');
  document.body.appendChild(footer);
  document.createElement = createElement;
  document.createTextNode = text => ({ textContent: text });
  document.getElementById = id => elements.find(element => element.id === id) || null;
  document.contains = element => Boolean(element.parentNode);
  document.querySelector = selector => {
    if (selector === 'link[rel=canonical]') {
      return options.noCanonical ? null : { href: 'https://mayashomes.com/' };
    }
    if (selector === '.footer__credentials-legal' || selector === 'footer') return footer;
    throw new Error(`Unexpected selector: ${selector}`);
  };
  document.referrer = options.referrer || 'https://www.google.com/search?q=PRIVATE_SEARCH';
  Object.defineProperty(document, 'cookie', {
    get: () => '_ga=existing; _ga_0W5WYQL10G=existing; preference=keep',
    set: value => cookies.push(value)
  });
  const location = {
    hostname: url.hostname, protocol: url.protocol, origin: url.origin,
    pathname: url.pathname, search: url.search, reload: () => { reloads += 1; }
  };
  const window = { location };
  vm.runInNewContext(source, {
    document, window, location, URL, URLSearchParams,
    localStorage: {
      getItem(key) { assert.equal(key, 'mh-consent'); return consent; },
      setItem(key, value) { writes.push([key, value]); consent = value; }
    },
    setTimeout: callback => callback()
  });
  return {
    window, writes, cookies,
    get reloads() { return reloads; },
    get scripts() { return document.head.children.filter(element => element.tagName === 'script'); },
    get configs() { return (window.dataLayer || []).map(args => [...args]).filter(args => args[0] === 'config'); },
    click(className) {
      const button = elements.findLast(element => element.className.split(' ').includes(className));
      assert.ok(button, `Find ${className}`);
      button.events.click();
    }
  };
}

const plain = value => JSON.parse(JSON.stringify(value));
const campaignFields = config => Object.fromEntries(Object.entries(config).filter(([key]) => key.startsWith('campaign_')));

test('approved GBP tuple sends explicit fixed campaign labels while keeping URL and referrer clean', () => {
  const h = harness();
  assert.equal(h.scripts.length, 1);
  assert.equal(h.configs.length, 1);
  assert.equal(h.configs[0][1], 'G-0W5WYQL10G');
  assert.deepEqual(plain(h.configs[0][2]), {
    page_location: 'https://mayashomes.com/', page_referrer: 'https://www.google.com',
    allow_google_signals: false, allow_ad_personalization_signals: false,
    campaign_source: 'google', campaign_medium: 'organic', campaign_name: 'gbp'
  });
  assert.deepEqual(h.writes, []);
  assert.deepEqual(h.cookies, []);
});

test('query ordering and encoding are accepted; unrelated free-text parameters and fragments never pass through', () => {
  const h = harness({ url: 'https://mayashomes.com/?email=PRIVATE_EMAIL&utm_campaign=%67bp&utm_medium=organic&utm_source=google&utm_content=PRIVATE_CONTENT#PRIVATE_FRAGMENT' });
  assert.equal(h.configs[0][2].campaign_name, 'gbp');
  assert.doesNotMatch(JSON.stringify(h.configs), /PRIVATE|utm_|email|fragment/i);
});

test('missing, partial, unknown, case-mismatched and duplicate campaign values are not attributed to GBP', () => {
  for (const query of [
    '', '?utm_source=google', '?utm_source=google&utm_medium=organic',
    approvedQuery.replace('gbp', 'PRIVATE_EMAIL'), approvedQuery.replace('organic', 'cpc'),
    approvedQuery.replace('google', 'Google'),
    `${approvedQuery}&utm_source=google`, `${approvedQuery}&utm_medium=organic`,
    `${approvedQuery}&utm_campaign=gbp`, `${approvedQuery}&utm_campaign=PRIVATE_CAMPAIGN`
  ]) {
    const h = harness({ url: `https://mayashomes.com/${query}` });
    assert.equal(h.configs.length, 1);
    assert.deepEqual(campaignFields(h.configs[0][2]), {}, query);
    assert.doesNotMatch(JSON.stringify(h.configs), /PRIVATE|utm_/);
  }
});

test('declined and undecided visitors never load analytics or persist campaign data', () => {
  for (const consent of ['denied', null]) {
    const h = harness({ consent });
    assert.equal(h.scripts.length, 0);
    assert.equal(h.configs.length, 0);
    assert.deepEqual(h.writes, []);
    assert.deepEqual(h.cookies, []);
  }
});

test('explicit acceptance loads once and withdrawal disables analytics and clears only GA cookies', () => {
  const h = harness({ consent: null });
  h.click('mh-consent__accept');
  assert.equal(h.configs.length, 1);
  assert.equal(h.configs[0][2].campaign_name, 'gbp');
  h.window.mhResetConsent();
  h.click('mh-consent__accept');
  assert.equal(h.scripts.length, 1);
  assert.equal(h.configs.length, 1);
  h.window.mhResetConsent();
  h.click('mh-consent__decline');
  assert.equal(h.window['ga-disable-G-0W5WYQL10G'], true);
  assert.equal(h.reloads, 1);
  assert.ok(h.cookies.length > 0);
  assert.ok(h.cookies.every(value => /^_ga(?:_|=)/.test(value)));
  assert.ok(h.writes.every(([key]) => key === 'mh-consent'));
  assert.deepEqual(h.writes.at(-1), ['mh-consent', 'denied']);
});

test('preview, local, HTTP and lookalike hosts cannot load analytics even with consent', () => {
  for (const base of ['https://preview.netlify.app/', 'http://127.0.0.1/', 'http://mayashomes.com/', 'https://mayashomes.com.example/']) {
    const h = harness({ url: base + approvedQuery });
    assert.equal(h.scripts.length, 0, base);
    assert.equal(h.configs.length, 0, base);
  }
});

test('www production host is allowed and missing canonical still strips query and fragment', () => {
  const h = harness({ url: `https://www.mayashomes.com/pt/${approvedQuery}#PRIVATE_FRAGMENT`, noCanonical: true });
  assert.equal(h.configs.length, 1);
  assert.equal(h.configs[0][2].page_location, 'https://www.mayashomes.com/pt/');
  assert.equal(h.configs[0][2].campaign_name, 'gbp');
});
