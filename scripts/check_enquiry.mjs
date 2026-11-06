// Dependency-free regression checks. Network and browser APIs are simulated;
// these checks never submit an enquiry or load analytics.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const main = read('js/main.js');
const start = main.indexOf('// Preserve native field validation and retain the enquiry on delivery failure.');
assert.notEqual(start, -1, 'Locate the actual isolated form handler in main.js');
const handler = main.slice(start);
const analytics = read('js/enquiry-analytics.js');
const pages = ['index.html', 'pt/index.html', 'contact/index.html', 'pt/contact/index.html'];

function harness(page = pages[0], options = {}) {
  const html = read(page);
  const sourceTag = html.match(/<form\b[^>]*name="contact"[^>]*>/)?.[0];
  assert.ok(sourceTag, `${page}: contact form exists`);
  // Reproduce Netlify's removal of its own build attributes.
  const tag = sourceTag.replace(/\s(?:data-netlify|netlify-honeypot)="[^"]*"/g, '');
  assert.match(tag, /\sdata-enquiry-form(?:\s|>)/, `${page}: durable marker survives processing`);
  assert.doesNotMatch(tag, /data-netlify/);
  const language = html.match(/<html[^>]*lang="([^"]+)"/)[1];
  const action = tag.match(/action="([^"]+)"/)[1];
  assert.equal(action, page.startsWith('pt/') ? '/pt/contact/thanks/' : '/contact/thanks/');
  const events = {}, submissions = [], hits = [], navigations = [], timers = new Map();
  const button = { disabled: false };
  const fields = [['form-name', 'contact'], ['bot-field', ''], ['name', 'TEST NAME'],
    ['email', 'test@example.invalid'], ['message', 'TEST MESSAGE'],
    ['property-stage', 'PRIVATE STAGE'], ['scope', 'PRIVATE SCOPE']];
  const form = {
    name: 'contact', action, fields, attrs: {}, valid: options.valid !== false,
    matches: (selector) => selector === 'form[data-enquiry-form]',
    reportValidity() { return this.valid; },
    append(status) { this.status = status; },
    setAttribute(key, value) { this.attrs[key] = value; },
    removeAttribute(key) { delete this.attrs[key]; },
    querySelectorAll: () => [button],
    querySelector() { throw new Error('Analytics must not read free-text form fields'); },
    addEventListener(name, callback) { this[name] = callback; },
    dispatchEvent(event) { event.target = this; events[event.type]?.(event); }
  };
  const document = {
    documentElement: { lang: language },
    querySelectorAll: (selector) => form.matches(selector) ? [form] : [],
    createElement: () => ({ textContent: '', setAttribute() {} }),
    addEventListener(name, callback) { events[name] = callback; }
  };
  const window = {
    location: { hostname: options.host || 'mayashomes.com', protocol: 'https:',
      pathname: page.startsWith('pt/') ? '/pt/contact/' : '/contact/',
      assign: (url) => navigations.push(url) },
    gtag: (...args) => hits.push(args)
  };
  const context = vm.createContext({ document, window, URL, URLSearchParams, AbortController,
    localStorage: { getItem: () => options.consent || 'granted' },
    FormData: class { constructor(value) { return value.fields; } },
    CustomEvent: class { constructor(type) { this.type = type; } },
    fetch: (...args) => { submissions.push(args); return options.fetch ? options.fetch(...args) : Promise.resolve({ ok: true }); },
    setTimeout: (callback, delay) => { timers.set(1, { callback, delay }); return 1; },
    clearTimeout: (id) => timers.delete(id)
  });
  vm.runInContext(analytics, context);
  vm.runInContext(handler, context);
  assert.equal(typeof form.submit, 'function', `${page}: handler binds after Netlify processing`);
  return { form, button, submissions, hits, navigations, timers,
    submit: () => form.submit({ defaultPrevented: false, preventDefault() {} }) };
}

test('all four processed forms accept once and send only safe analytics context', async () => {
  for (const page of pages) {
    const h = harness(page);
    await h.submit();
    assert.equal(h.submissions.length, 1);
    assert.equal(h.submissions[0][1].method, 'POST');
    assert.equal(new URLSearchParams(h.submissions[0][1].body).get('form-name'), 'contact');
    assert.deepEqual(h.navigations, [h.form.action]);
    assert.equal(h.hits.length, 1);
    assert.equal(h.hits[0][1], 'enquiry_endpoint_accepted');
    assert.deepEqual(Object.keys(h.hits[0][2]).sort(),
      ['form_id', 'page_area', 'page_location', 'page_referrer', 'site_language', 'source_project']);
    assert.equal(h.hits[0][2].site_language, page.startsWith('pt/') ? 'pt' : 'en');
    assert.equal(h.button.disabled, false);
    assert.equal(h.timers.size, 0);
  }
});

test('invalid fields do not submit or record acceptance', async () => {
  const h = harness(pages[0], { valid: false });
  await h.submit();
  assert.equal(h.submissions.length, 0);
  assert.equal(h.hits.length, 0);
  assert.equal(h.navigations.length, 0);
});

test('concurrent clicks produce one request', async () => {
  let resolve;
  const h = harness(pages[0], { fetch: () => new Promise((done) => { resolve = done; }) });
  const first = h.submit();
  assert.equal(h.button.disabled, true);
  await h.submit();
  assert.equal(h.submissions.length, 1);
  resolve({ ok: true });
  await first;
  assert.equal(h.hits.length, 1);
  assert.equal(h.navigations.length, 1);
});

test('HTTP/network failures retain fields, show status and allow retry', async () => {
  for (const fetch of [async () => ({ ok: false }), async () => { throw new Error('offline'); }]) {
    const h = harness(pages[2], { fetch });
    const before = JSON.stringify(h.form.fields);
    await h.submit();
    assert.match(h.form.status.textContent, /could not confirm delivery/);
    assert.equal(JSON.stringify(h.form.fields), before);
    assert.equal(h.button.disabled, false);
    assert.equal(h.form.attrs['aria-busy'], undefined);
    assert.equal(h.hits.length, 0);
    assert.equal(h.navigations.length, 0);
    await h.submit();
    assert.equal(h.submissions.length, 2);
  }
});

test('timeout preserves Portuguese failure feedback without recording acceptance', async () => {
  const h = harness(pages[3], { fetch: (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('aborted')));
  }) });
  const pending = h.submit();
  assert.equal(h.timers.get(1).delay, 20000);
  h.timers.get(1).callback();
  await pending;
  assert.match(h.form.status.textContent, /Não conseguimos confirmar o envio/);
  assert.equal(h.hits.length, 0);
  assert.equal(h.navigations.length, 0);
  assert.equal(h.button.disabled, false);
});

test('denied consent and preview hosts never send analytics; form still works', async () => {
  for (const options of [{ consent: 'denied' }, { host: 'preview.netlify.app' }]) {
    const h = harness(pages[0], options);
    await h.submit();
    assert.equal(h.submissions.length, 1);
    assert.equal(h.navigations.length, 1);
    assert.equal(h.hits.length, 0);
  }
});
