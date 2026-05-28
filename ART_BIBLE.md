# Maya's Homes V2 — Art Bible

**Status:** Living design system, locked v2.1
**Source of truth:** `/Users/lukasbot/Desktop/Mayas-Homes-V2/index.html` is the canonical implementation. Every other page must align to it. When the bible and the home page conflict, the home page wins and this document is corrected.
**Companion files:** `STUDIO_PAGE_SPEC.md` (content spec), `CREATIVE_DIRECTION.md` (kinetic strategy), `Mayas-Homes_Site-Architecture.md` (page structure)
**Version history:**
- v2.1 (2026-05-10) — Amended after a studio page audit. Corrected §2.5 (every page carries the Home link in the drawer, not just the home page). Added eyebrow exceptions for pull-quote dividers and olive accent panels in §3 Rule 1, with cross-references in §8.5 and §8.6. Documented both section-closer variants (minimal and full) in §3 Rule 5 and §7.3. Added §6.5 documenting the `.wrap` markup utility. Updated implementation checklist accordingly.
- v2.0 (2026-05-10) — Comprehensive rewrite after a full read of the home page implementation. Corrected the typography rule (three families, not two — Inter is the body face). Added shared-chrome boilerplate documentation, BEM convention, asset versioning, script architecture, the data-attribute API, the home page section catalog, and an expanded implementation checklist.
- v1.1 (2026-05-09) — Container token corrected from 1200px to 1480px. Studio page audit added.
- v1.0 — Initial draft.

---

## 0. Purpose of this document

The site is being built page by page through Antigravity prompts. Without a locked design system each page drifts: paddings diverge, fonts shift, eyebrows go missing, footers disagree, and the visitor sees two sites stitched together. This document records every convention the home page has set so future pages match it.

The rules of engagement:

- **The home page is canonical.** When the bible disagrees with the home page, fix the bible.
- **Update the bible before the page.** If a future change wants to violate one of these rules, this document gets edited first. Drift starts the moment a page is built without a corresponding bible entry.
- **Reference values, don't paraphrase them.** When prescribing changes, quote the exact token name (`--container-max`) or the exact computed value pulled from DevTools. Memory drifts; code doesn't.
- **Inspect, don't assume.** Any prompt that touches alignment, padding, or proportion must brief Antigravity to inspect the home page in DevTools first. The bible is the second reference; the running home page is the first.

---

## 1. Brand thesis

Maya's Homes is a single-craftsperson Mediterranean luxury renovation studio in Cascais, Portugal, founded and run by Maja Milič. Every visual decision must serve one of these four truths. If a decision doesn't, it's wrong, regardless of how good it looks in isolation.

- **The hand.** Real human hands draw, lay, finish. No subcontractors. The same hand that draws is the hand that builds. The site enforces this through the editorial register — every "trade" image is real, no stock; every photograph of a tool or a corner is a real photograph from a real Maya's Homes project.
- **The time.** The practice is unhurried. Rooms reveal themselves over months. Materials are tested over years. The site is paced accordingly: long scroll, slow loops, generous whitespace, no rushed transitions.
- **The place.** Cascais — Mediterranean light, coastal stone, calçada underfoot, the Atlantic. The place is in the work and in the photography. The site features Cascais, Estoril, Sintra, Lisbon — never generic "Portugal" stock.
- **The address.** The studio is a house. One address, one team, one signature. The site speaks of "the studio" and "Maya's Homes" — never "we / our / us" — because there is one practitioner. This rule is absolute and must be strictly enforced even in narrative project case studies.

### 1.1 The Emotional Registers

While the brand thesis remains constant, the site deliberately shifts its tone and pacing across different page archetypes. Do not try to force every page into the same "templatey" vibe.
- **The Homepage (The Confident Manifesto):** Authoritative, bold, and commercial-yet-boutique. Pacing is fast, using strong proof points, hard stats, and rules.
- **The Studio Page (The Intimate Memoir):** Personal, transparent, and slow-paced. It drops the "company" mask to show the actual humans (Maja and the tradespeople) behind the work.
- **The Project Pages (Architectural Features):** Treated as standalone editorial features rather than standard portfolio items. They lean into the unique personality of each home.

---

## 2. The shared chrome — boilerplate every page must carry

Approximately 200 lines of every page on the site are byte-identical boilerplate. These are the elements that make the site feel like one site rather than seven.

### 2.1 The `<head>` block

Every page declares the same head structure. Only the per-page values change (title, description, canonical URL, OG image).

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#F4EFE6" />

  <title>[Page-specific title] · Maya's Homes</title>
  <meta name="description" content="[Page-specific 1-2 sentence description]" />
  <link rel="canonical" href="https://mayashomes.com/[path]/" />

  <meta property="og:type" content="website" />  <!-- or "article" for project detail / journal -->
  <meta property="og:title" content="[OG title]" />
  <meta property="og:description" content="[OG description]" />
  <meta property="og:image" content="https://mayashomes.com/assets/images/[page-hero].webp" />
  <meta property="og:locale" content="en_GB" />

  <link rel="icon" type="image/png" href="/logo/mayas-homes-mark.png" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,400&family=Inter:wght@300;400;500;600&family=Sacramento&family=IBM+Plex+Mono:wght@300;400;500&display=swap" rel="stylesheet" />

  <link rel="stylesheet" href="/css/index.css?v=247" />
  <link rel="stylesheet" href="/css/animations.css?v=247" />
</head>
```

Title format: `[Page name] · Maya's Homes` — middle dot, not en-dash, not pipe. The home page is the exception (`Maya's Homes — Boutique Renovation in Cascais & Estoril`).

The home page additionally carries a `<script type="application/ld+json">` block with `GeneralContractor` schema. That goes on the home only.

### 2.2 The body opening and page-class

Every page declares its own page-class on `<body>` so stylesheets can target page-specific behavior without fragile selectors.

```html
<body class="page-[name]">
```

Examples: `page-home`, `page-studio`, `page-projects`, `page-projects-detail`, `page-services`, `page-process`, `page-local`, `page-journal`, `page-journal-entry`, `page-contact`. The home page already uses `page-home`. Subpages currently leave it bare — that's a gap to close on every new page.

### 2.3 The intro overlay (home only)

The home page opens with a one-time-per-session intro video gate. Other pages do not include it.

```html
<div class="intro-overlay" id="introOverlay">
  <div class="intro-video-wrapper">
    <video class="intro-video" id="introVideo"
           src="/assets/videos/[intro-video].mp4"
           autoplay muted playsinline preload="auto"></video>
  </div>
  <button class="intro-skip" id="introSkip" type="button" aria-label="Skip intro">SKIP</button>
</div>
```

`js/intro.js` handles the show-once-per-session logic via `sessionStorage`. Don't include this block on subpages.

### 2.4 The floating nav header

Identical markup on every page. The only thing that varies is which primary-nav `<a>` carries `class="is-current"`.

```html
<header class="floating-nav" data-nav>
  <a class="nav-brand" href="/" aria-label="Maya's Homes — home">
    <img src="/logo/mayas-homes-mark.png?v=236" alt="" class="nav-mark" />
    <span class="nav-wordmark" data-nav-brand data-wordmark-target>Maya&rsquo;s Homes</span>
  </a>

  <nav class="nav-links" aria-label="Primary">
    <a href="/studio/">Studio</a>
    <a href="/projects/">Projects</a>
    <a href="/services/">Services</a>
    <a href="/process/">Process</a>
    <a href="/local/">Local</a>
    <a href="/journal/">Journal</a>
    <a href="/contact/">Contact</a>
  </nav>

  <div class="nav-tools">
    <a class="nav-social" href="https://facebook.com/mayashomes" target="_blank" rel="noopener" aria-label="Facebook">[svg]</a>
    <a class="nav-social" href="https://www.instagram.com/mayas.homes/" target="_blank" rel="noopener" aria-label="Instagram">[svg]</a>
    <a class="nav-social" href="https://wa.me/351913037527" target="_blank" rel="noopener" aria-label="WhatsApp">[svg]</a>

    <button class="nav-menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" data-menu-open>
      <span class="nav-menu-icon" aria-hidden="true"><span></span><span></span><span></span></span>
    </button>
  </div>

  <a class="nav-cta btn-silver" href="/contact/" data-magnetic>Begin a Project</a>
</header>
```

Primary nav order is locked: **Studio · Projects · Services · Process · Local · Journal · Contact**. Don't reorder. Don't drop items. Don't add items without updating this document.

The wordmark on every page carries `data-wordmark-target`, which is the receiver for the home page's hero-into-nav wordmark animation. The home page's hero block carries the matching `data-wordmark-source`. On non-home pages the source is absent and the target stays inert — that's correct.

### 2.5 The nav drawer aside

The mobile drawer markup is byte-identical across pages. Same rule: only `class="is-current"` moves.

```html
<aside class="nav-drawer" data-drawer hidden>
  <div class="nav-drawer__inner">
    <button class="nav-drawer__close" type="button" aria-label="Close menu" data-menu-close>[svg]</button>

    <nav class="nav-drawer__links" aria-label="Primary">
      <a href="/">Home</a>
      <a href="/studio/" class="is-current">Studio</a>
      <a href="/projects/">Projects</a>
      <a href="/services/">Services</a>
      <a href="/process/">Process</a>
      <a href="/local/">Local</a>
      <a href="/journal/">Journal</a>
      <a href="/contact/">Contact</a>
    </nav>

    <div class="nav-drawer__footer">
      <p class="nav-drawer__invite">All of your dreams<br>brought to life.</p>
      <a class="btn-silver" href="/contact/">Begin a Project</a>
    </div>
  </div>
</aside>
```

The Home link is present in every page's drawer. On the home page itself, the Home link carries `class="is-current"` and no other link does. On every subpage, the Home link is present without `is-current`, and the active page's link gets `is-current` instead. Only the `is-current` class moves between pages — the link list itself never shrinks.

### 2.6 The footer

Two zones, byte-identical across pages. Top zone is `.footer__details`; bottom zone is `.footer__credentials`.

```html
<footer class="footer">

  <div class="footer__details">

    <div class="footer__brand">
      <div class="footer__brand-row">
        <img class="footer__logo" src="/logo/mayas-homes-mark.png?v=236" alt="Maya's Homes" width="40" height="40" />
        <p class="footer__wordmark">Maya&rsquo;s Homes</p>
      </div>
      <p class="footer__tagline">Boutique renovation in Cascais and Greater Lisbon.</p>
      <ul class="footer__social" aria-label="Social media">
        <!-- 5 social icons: Instagram, Pinterest, LinkedIn, WhatsApp, Facebook -->
      </ul>
    </div>

    <nav class="footer__nav" aria-label="Footer navigation">
      <p class="footer__nav-label">Site</p>
      <ul>
        <li><a href="/studio/">Studio</a></li>
        <li><a href="/projects/">Projects</a></li>
        <li><a href="/services/">Services</a></li>
        <li><a href="/process/">Process</a></li>
        <li><a href="/local/">Local</a></li>
        <li><a href="/journal/">Journal</a></li>
        <li><a href="/contact/">Contact</a></li>
      </ul>
    </nav>

    <div class="footer__contact">
      <p class="footer__contact-label">Reach Maja</p>
      <ul>
        <li><span class="footer__contact-key">Email</span><a href="mailto:maja.milic@mayashomes.com" class="footer__contact-value">maja.milic@mayashomes.com</a></li>
        <li><span class="footer__contact-key">WhatsApp</span><a href="https://wa.me/351913037527" class="footer__contact-value">+351 913 037 527</a></li>
        <li><span class="footer__contact-key">Studio</span><span class="footer__contact-value">Alcabideche &middot; Cascais &middot; Portugal</span></li>
        <li><span class="footer__contact-key">Hours</span><span class="footer__contact-value">Mon&ndash;Fri &middot; 8&nbsp;&mdash;&nbsp;5 WET</span></li>
      </ul>
    </div>

  </div>

  <div class="footer__credentials">
    <p class="footer__credentials-line footer__credentials-line--left">
      &copy; <span data-year>2026</span> Maya&rsquo;s Homes &middot; Founded by Maja Mili&ccaron;
    </p>
    <p class="footer__credentials-line footer__credentials-line--center">
      Licensed renovation contractor &middot; IMPIC 97976&#8209;PAR &middot; AMI 18698
    </p>
    <p class="footer__credentials-line footer__credentials-line--right">
      Maya&rsquo;s Care opening soon
      <a href="#contact" class="footer__credentials-link">→</a> &middot;
      <a href="/privacy" class="footer__credentials-link" data-todo="future-page" aria-disabled="true" tabindex="-1">Privacy</a> &middot;
      <a href="/terms" class="footer__credentials-link" data-todo="future-page" aria-disabled="true" tabindex="-1">Terms</a>
    </p>
  </div>

</footer>
```

The `data-year` span is updated by `js/main.js`. The `data-todo="future-page"` markers on Privacy and Terms are deliberate; remove them when those pages ship.

Official numbers:
- IMPIC license: `97976-PAR` (use the non-breaking hyphen entity `&#8209;` to keep it on one line)
- AMI license: `18698`
- Founder name: `Maja Milič` (use `Mili&ccaron;` HTML entity for the č)
- Email: `maja.milic@mayashomes.com`
- WhatsApp: `+351 913 037 527`
- Studio address (public): `Alcabideche · Cascais · Portugal` — never publish the street address

### 2.7 The script block at end of body

Order is load-bearing: vendor libraries first, then app modules in the precise order shown. `main.js` wires Lenis ↔ ScrollTrigger before `scroll-scrub.js` creates triggers.

```html
<!-- Self-hosted vendor libs -->
<script src="vendor/gsap.min.js?v=236"></script>
<script src="vendor/ScrollTrigger.min.js?v=236"></script>
<script src="vendor/lenis.min.js?v=236"></script>

<!-- App modules — order matters -->
<script src="js/main.js?v=236" type="module"></script>
<script src="js/scroll-scrub.js?v=236" type="module"></script>
<script src="js/nav.js?v=236" type="module"></script>
<script src="/js/nav-drawer.js?v=236" defer></script>
<script src="js/magnetic.js?v=236"></script>
<script src="js/scroll-brand.js" defer></script>
<script src="js/intro.js" defer></script>
```

Subpages may not need `intro.js` (the intro overlay is home-only) but loading it is harmless — it does nothing if the overlay element is absent. Keep the full script block on every page for consistency.

`js/projects-slideshow.js` is project-grid-specific and currently loaded inline by pages that need it. When new slideshows ship, follow the same pattern (inline-loaded only on pages that use them).

---

## 3. The section pattern — every major section follows this skeleton

This is the most-used pattern on the site. Every editorial section on the home page repeats it.

```html
<section class="[name]" id="[name]">
  <header class="[name]__head">
    <p class="eyebrow">— [LABEL]</p>
    <h2 class="display">[Headline].</h2>
    <p class="[name]__lede">[Optional supporting line]</p>
  </header>

  [section body — varies by section type]

  <div class="section-closer section-closer--minimal">
    <a href="/[deeper-page]/" class="section-closer__link">
      <span>[Pull-forward copy]</span>
      <span class="section-closer__arrow" aria-hidden="true">→</span>
    </a>
  </div>
</section>
```

Five rules govern the pattern.

**Rule 1 — Eyebrow is mandatory on every section header except for two pattern-specific exceptions: pull-quote divider sections (see §8.5) and olive accent panel sections (see §8.6).** Those two patterns are inherently single-moment compositions where the quote IS the section's identity, and adding an eyebrow above the quote dilutes the dramatic effect. Every other section — heroes excluded per §8.1, but every body section that follows: bio, intro, gallery, grid, slideshow, form, letter, credentials, marquee — carries an eyebrow. The `<p class="eyebrow">` carries an em-dash + space prefix (`— THE LABEL`) and the Plex Mono uppercase styling is applied via CSS `text-transform`. **Source text is title-case** (`— The Approach`, `— The Craft`, `— What Maya's Homes offers`) — the CSS handles the uppercase rendering. Don't write the source in all-caps.

**Rule 2 — One H2 per section.** The `.display` headline is the section's identity. Don't double up. If a section has subheadings, they are H3 with section-namespaced classes.

**Rule 3 — Lede is optional but encouraged.** A 1–2 sentence lede in `<p class="[name]__lede">` sits below the headline. It carries the section's argument before the body content. Write it in third-person Maja voice.

**Rule 4 — BEM naming is strict.** The section's class is the namespace. Every child element uses double-underscore: `.manifesto`, `.manifesto__head`, `.manifesto__copy`, `.manifesto__lede`, `.manifesto__pillars`, `.manifesto__portrait`. Modifiers use double-hyphen: `.section-closer--minimal`, `.process__step--reverse`, `.tile--landscape`. New components introduced for new sections must follow the same convention.

**Rule 5 — The section closer pulls the visitor forward.** Most major sections end with a closer linking to a deeper page. Two variants are in use across the site.

Variant A — minimal closer (the home page default):

```html
<div class="section-closer section-closer--minimal">
  <a href="/[path]/" class="section-closer__link">
    <span>[Editorial pull-forward copy]</span>
    <span class="section-closer__arrow" aria-hidden="true">→</span>
  </a>
</div>
```

Variant B — full closer (used at the close of high-stakes editorial sections like the studio letter):

```html
<div class="section-closer">
  <p class="section-closer__eyebrow">— [Eyebrow label]</p>
  <a href="/[path]/" class="section-closer__link">
    <span>[Editorial pull-forward copy]</span>
    <span class="section-closer__arrow" aria-hidden="true">→</span>
  </a>
</div>
```

Variant A is the default. Used at the end of every body section on the home page that bridges to a deeper page — manifesto closing toward /studio/, projects closing toward /projects/, process closing toward /process/. Visitors are being navigated, not commanded. Variant B is reserved for sections where the close itself carries weight — the studio's signed letter, future essay-format pages, anywhere the visitor is being asked to take a meaningful next step rather than just continuing through the site. Variant B's internal eyebrow gives the closer typographic gravity. Don't use Variant B more than once per page; it loses its weight if repeated.

The closer copy table below applies to both variants. The copy must be editorial pull-forward language, never utility:

| Section | Closer copy | Variant | Links to |
|---|---|---|---|
| `.manifesto` | "Meet the practice behind the work" | A | `/studio/` |
| `.projects` | "View all transformations" | A | `/projects/` |
| `.process` | "See the full process, week by week" | A | `/process/` |
| `.cascais` | "Read the studio's story" | A | `/studio/` |
| `.services` | "See every service in detail" | A | `/services/` |
| `.studio__letter` | "See what one hand has built" | B | `/projects/` |

Banned closer copy: "Learn more", "Click here", "Read more", "View more", "See more", "Explore", "Discover". The closer copy must reference the destination's actual content in editorial register.

Sections that are themselves the destination (e.g., the contact form) don't carry a closer.

---

## 4. Color system

### 4.1 Color tokens (verbatim from `:root` in `css/index.css`)

```css
:root {
  /* Foundation — warm, restrained, photographic */
  --bone:      #F4EFE6;   /* warm cream — the marble base */
  --bone-2:    #ECE5D8;   /* deeper bone — used on darker hairlines */
  --paper:     #F8F6EE;   /* lifted paper — figure backgrounds */
  --taupe:     #FAF5EC;   /* pale warm cream — body / canvas / closing sections */

  /* Text */
  --ink:       #2D2926;   /* primary warm charcoal */
  --ink-2:     #4A4540;   /* softer charcoal — secondary body */
  --mid:       #6B5F52;   /* mid taupe — meta and metadata */
  --soft:      #9A8E7E;   /* tertiary — captions, microcopy */

  /* Hairlines */
  --hairline:        rgba(45, 41, 38, 0.14);
  --hairline-strong: rgba(45, 41, 38, 0.30);

  /* Accent / wood tones (sparingly used) */
  --tobacco:   #8B6F47;
  --ochre:     #B98A4A;

  /* Tonal rhythm */
  --shadow:    #4A4E2E;   /* olive — dramatic accent panel */
  --chestnut:  #6B4530;   /* warm brown — the marble vein color */

  /* Cream-on-dark text variants */
  --bone-on-shadow:    #F4EFE6;
  --mid-on-shadow:     #CCC0AB;
  --bone-on-chestnut:  #F4EFE6;
  --mid-on-chestnut:   #D4C5B5;
}
```

### 4.2 Material backgrounds — the three-state rule

The core site has only three section-background states. No others.

- **Marble (Calacatta with chestnut vein)** — `--bone` base + the marble image. Used **only** for the page hero and the page footer.
- **Taupe** — `--taupe` (`#FAF5EC`). The default for every body section between hero and footer. Most of the site is taupe.
- **Olive accent panel** — `--shadow` (`#4A4E2E`). Used as a dramatic accent. **One olive section per page maximum.** Used for spine quotes and high-stakes principle moments.

The chestnut color exists only as a text accent or as the vein in the marble image. Chestnut is never a section background.

**Exception for Project Pages:** Because individual project case studies act as standalone "editorial features," they are explicitly allowed to break the three-state rule. Custom color palettes (e.g., a "rose screen") may be introduced on project pages to reflect the unique personality of the home, preventing the portfolio from feeling like a rigid corporate template.

### 4.3 Body-level texture (don't override on a page basis)

The `body` carries a fixed background image plus a SVG-noise overlay. Both inherit on every page automatically. Do not override.

```css
body {
  background-color: var(--bone);
  background-image: url('/assets/images/background-v3.png');
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml;utf8,<svg ...feTurbulence... />");
  opacity: 0.04;
  mix-blend-mode: overlay;
  pointer-events: none;
  z-index: 0;
}
```

The texture is the limestone substrate the whole site sits on. New page backgrounds should sit on top of the body, not replace it.

### 4.4 Color rules (non-negotiable)

1. Hero uses marble (bone + vein). No exceptions.
2. Footer uses marble. No exceptions.
3. Body sections use taupe by default.
4. Olive accents at most once per page.
5. No solid white. No pure grey. No off-cream that isn't a defined token.
6. Text colors: `--ink` for primary, `--ink-2` for secondary, `--mid` for metadata, `--soft` for tertiary captions.
7. Chestnut is a text accent or the marble vein — never a section background.
8. Tobacco and ochre are sparingly used as material accents, not as text colors.

---

## 5. Typography system

### 5.1 Three families (corrected)

The home page uses three type families. Earlier versions of this document said "two families" — that was wrong.

```css
--serif: 'Cormorant Garamond', 'Playfair Display', Georgia, 'Times New Roman', serif;
--sans:  'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
--mono:  'IBM Plex Mono', 'SFMono-Regular', Menlo, Consolas, 'Courier New', monospace;
```

Plus a fourth, used only as a visual flourish in specific places: `Sacramento` (script handwriting) — currently loaded but reserved for signature moments.

### 5.2 What goes in which family

- **Cormorant Garamond (`--serif`)** — `.display` headlines, italic editorial moments, italic Maja quotes, italic figure captions on the home page, the letter-from-Maja form, drop caps. Weights: 300, 400, 500, italic 400. Use 400 by default; 300 for very large display moments where a lighter cut reads better.
- **Inter (`--sans`)** — body paragraphs, the manifesto lede, eyebrows, project metadata, button labels, form labels, navigation links, footer text, breadcrumbs, microcopy. Weights: 300, 400, 500, 600. Use 400 by default; 500 for emphasis where italic isn't appropriate.
- **IBM Plex Mono (`--mono`)** — figcaptions, data lines (years, dimensions, license codes), section folios (§ 01), micro-labels, marginalia keys. Weights: 300, 400, 500. Use 400 by default.
- **Sacramento** — reserved. Don't use without consulting.

### 5.3 Type scale (fluid clamp() tokens)

```css
--fs-xs:   clamp(11px, 0.72vw, 12px);
--fs-sm:   clamp(13px, 0.92vw, 15px);
--fs-base: clamp(15px, 1.05vw, 17px);
--fs-lg:   clamp(18px, 1.3vw, 21px);
--fs-xl:   clamp(28px, 3vw, 44px);
--fs-2xl:  clamp(44px, 5.5vw, 88px);
--fs-3xl:  clamp(64px, 9vw, 168px);
```

Use the tokens, not raw px or rem values. New components should pick the closest token rather than introduce a fifth scale step.

Specific element sizes (referenced from the home page):

```
Hero brand wordmark      --fs-3xl
Page-hero headline       --fs-2xl
Section H2 (.display)    --fs-2xl
Section H3               --fs-xl
Lead paragraph           --fs-lg
Body paragraph           --fs-base, line-height 1.55–1.7 depending on column width
Italic subtitle          --fs-lg, italic
Eyebrow                  --fs-xs, letter-spacing 0.18em, text-transform: uppercase
Caption                  --fs-xs, letter-spacing 0.02em (mono)
Pull quote display       --fs-xl to --fs-2xl, italic
```

### 5.4 Type primitive classes

```css
.display {
  font-family: var(--serif);
  font-weight: 400;
  font-size: var(--fs-2xl);
}

.eyebrow {
  font-family: var(--mono);
  font-size: var(--fs-xs);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(45, 41, 38, 0.7);
  margin: 0 0 1rem 0;
}

figcaption {
  font-family: var(--mono);
  font-style: normal;
  letter-spacing: 0.02em;
}
```

### 5.5 Italics — when allowed

Italic Cormorant carries voice. It is reserved for:

- The brand mark `Maja Milič` (the founder's name as a typographic signature)
- Direct attributed quotes from Maja inside `<blockquote>` or `.process__quote`
- Italic subtitles like "Still here." or "All of your dreams brought to life."
- Pull quotes (always italic Cormorant)
- Italic body lines on project cards and Maja-spirit asides
- The signed letter at the close of the studio page
- Selected figure captions where the photograph deserves a voice line, not a metadata line

Italic budget: roughly **one italic line per scroll-screen**. If a section has three italics in a row, two of them are wrong.

### 5.6 Anti-vocabulary (banned phrases)

The brand voice rejects these words on sight, regardless of context:

> passionate, industry-leading, world-class, bespoke (more than once per page), journey, transform (as a verb in marketing copy), unlock, leverage, robust, seamless, holistic, curated (as adjective on Maya's Homes itself), elevated, premier, ultimate, dream-team, end-to-end, full-service, turnkey (acceptable only as a service-name in a service grid)

Replacement: write with specifics. Not "industry-leading craftsmanship" — "twenty-five years on the same coast." Not "transform your home" — "redrawn around how the family lives."

---

## 6. Layout system

### 6.1 Containers

```css
--container:        1480px;     /* default: --container-max */
--container-max:    1480px;     /* primary editorial envelope */
--container-narrow: 900px;      /* spine quotes, letters, pull quotes */
--container-prose:  720px;      /* pure text columns */
```

Use the tokens. Don't introduce intermediate widths.

### 6.2 Section padding rhythm

```css
--pad-section: clamp(96px, 12vw, 220px);   /* vertical */
--pad-x:       clamp(24px,  5vw,  96px);    /* horizontal */
--gutter:      clamp(16px,  1.5vw, 28px);   /* grid gaps */
```

Every editorial section uses these. The applied rule on `<section>`:

```css
section {
  padding: var(--pad-section) var(--pad-x);
}
```

If a section needs different spacing (e.g., the hero is full viewport, not padded), document the exception by section name.

### 6.3 Grid systems

The home page uses these grid ratios:

- **Two-column text-dominant** — `1.4fr / 1fr` (text left, image right). Used in `.manifesto__intro`.
- **Two-column image-dominant** — `1fr / 1.4fr` (image left, text right). Used in alternating `.process__step` and `.process__step--reverse` blocks.
- **Two-column rich** — `2fr / 3fr` (sticky head left, body right). Used in `.method__grid`.
- **Three-column** — equal columns for stats (`.stats__inner` 4-column variant), services (3-column on desktop, collapses on mobile).
- **Six-tile mixed grid** — two rows of three tiles each in `.projects__grid`, with shape modifiers `.tile--square`, `.tile--landscape`, `.tile--portrait` to vary proportions across the grid. This is the deliberate magazine-spread asymmetry.

Never use `1fr / 1fr` for editorial two-column layouts. Equal columns read corporate; the slight asymmetry of `1.4 / 1` reads editorial.

### 6.4 Vertical rhythm within a section

```
Eyebrow                 (mandatory)
↓ 1rem
Display headline (H2)
↓ 1.5rem
Lede paragraph (optional, slightly larger)
↓ 1.25rem
Body paragraphs (1.25rem between each)
↓ 2rem
Closing italic / pull quote / CTA
↓ section padding
Next section
```

Section closers (`.section-closer--minimal`) sit at the bottom of a section with their own breathing room — typically 4–6rem above and at the section's bottom padding.

### 6.5 The `.wrap` markup utility

The `.wrap` class is the markup utility that applies a container token to inner content. It's used inside `<section>` elements to constrain content to the editorial envelope while leaving the `<section>` itself full-bleed — so backgrounds, hairlines, marble panels, olive panels, and any full-width treatment continue to span the viewport while the text and figures within respect the editorial envelope.

**CRITICAL RULE:** Even when a page breaks the color rules to introduce a full-bleed custom background (like on project pages), the text inside that section **must still be constrained** by a `.wrap` or `.wrap--narrow`. If text is allowed to stretch beyond 70-80 characters wide on a large monitor, the layout breaks. Always constrain the typography, even when the background bleeds.

Variants in use:

- `.wrap` — applies `--container-max` (1480px). Default for editorial body sections.
- `.wrap--narrow` — applies `--container-narrow` (900px). Used for letters, spine quotes, hero intro text on subpages, anywhere editorial restraint is the design intent.
- `.wrap--prose` — applies `--container-prose` (720px). Used for pure-text columns where reading width matters.

Standard usage:

```html
<section class="[name]">
  <div class="wrap">
    [section content]
  </div>
</section>
```

For narrower content:

```html
<section class="[name]">
  <div class="wrap wrap--narrow">
    [section content]
  </div>
</section>
```

When a section needs the full-bleed treatment for one element (a horizontal marquee, a stats video background, a tabbed map) and the constrained envelope for another (the section header), put `.wrap` only around the elements that need constraining and leave the full-bleed element as a direct child of the `<section>`. The studio page's `.studio__details` marquee is the canonical example — the section header sits inside `.wrap`, the marquee track sits outside it.

---

## 7. Component patterns

Every component in this section is documented by class name, structural notes, and (where relevant) the data attribute that wires it to JavaScript.

### 7.1 Eyebrow

See §5.4. Used inside every section header. Em-dash prefix is part of the source text.

### 7.2 Display headline

```html
<h2 class="display">Headline.</h2>
```

Always serif (Cormorant), always 400 weight, always at the `--fs-2xl` token. Period at the end is the editorial signature — the home page uses declarative period-terminated headlines (`Twenty-five years. Ten people. One signature.`).

### 7.3 Section closer

Two variants are in use. See §3 Rule 5 for the when-to-use guidance.

Variant A — minimal closer (default):

```html
<div class="section-closer section-closer--minimal">
  <a href="/[path]/" class="section-closer__link">
    <span>[Editorial copy]</span>
    <span class="section-closer__arrow" aria-hidden="true">→</span>
  </a>
</div>
```

Variant B — full closer (high-stakes editorial closes):

```html
<div class="section-closer">
  <p class="section-closer__eyebrow">— [Eyebrow label]</p>
  <a href="/[path]/" class="section-closer__link">
    <span>[Editorial copy]</span>
    <span class="section-closer__arrow" aria-hidden="true">→</span>
  </a>
</div>
```

Variant A is the default for body sections that bridge to deeper pages. Variant B is reserved for editorial closes that need typographic gravity — currently used on the studio letter section. The arrow in both variants is a real Unicode arrow inside an aria-hidden span. The link is a plain anchor — the magnetic effect is reserved for the primary CTA, not the closer.

### 7.4 Pull quote

```html
<blockquote class="[section]__quote" data-[section]-quote>
  <p class="[section]__quote-text">&ldquo;[Quote text]&rdquo;</p>
  <cite class="[section]__quote-cite">— Maja Milič</cite>
</blockquote>
```

Italic Cormorant for the quote text, attribution in `<cite>` with em-dash prefix. Open and close with proper curly quotes (`&ldquo;` and `&rdquo;`).

### 7.5 Caption with hairline

Figure captions sit below their figure with a 1px hairline rule above:

```css
figcaption {
  font-family: var(--mono);
  font-size: var(--fs-xs);
  letter-spacing: 0.02em;
  border-top: 1px solid var(--hairline);
  padding-top: 0.5rem;
  margin-top: 0.75rem;
}
```

Caption format: `Subject — Location` or `Subject, Location` (em-dash, mono, sentence case).

### 7.6 Marginalia

A vertical key/value strip used for studio metadata (`Established 2019`, `In-house trades 10`, `Studio T5, Alcabideche`). Class pattern:

```html
<dl class="marginalia">
  <div class="marginalia__row">
    <dt class="marginalia__key">Established</dt>
    <dd class="marginalia__value">2019</dd>
  </div>
  <!-- additional rows -->
</dl>
```

Plex Mono keys (small, uppercase) and italic Cormorant values, separated by hairlines between rows.

### 7.7 Glassy nav pill

The floating nav uses `.floating-nav` with frosted-glass treatment: `backdrop-filter: blur(...)`, semi-transparent background, hairline border, soft inset highlight at the top edge, gentle outer drop shadow. Actual values live in `index.css`. Don't reinvent — reuse the class.

### 7.8 Glassy CTA button (`.btn-silver`)

```html
<a class="nav-cta btn-silver" href="/contact/" data-magnetic>Begin a Project</a>
```

Pill-shaped, Plex Mono uppercase text with letter-spacing 0.18em, frosted-glass treatment matching the nav pill. The `data-magnetic` attribute wires the cursor magnetic effect via `js/magnetic.js`.

Anywhere a primary CTA appears on the site, use `.btn-silver` and `data-magnetic`.

### 7.9 Glassy circular icon button

Used for prev/next arrows in slideshow components (`.testimonials__arrow`, `.craft__arrow`, `.process__phase-arrow`, `.local-mastery__arrow`). Same frosted-glass treatment, circular, ~50px diameter on desktop. The arrow icon is a `<svg>` chevron — line-only, 1.5px stroke, current color.

### 7.10 Slideshow with nav and count

The pattern is: a list of items where one carries `is-active`, plus an external nav block with prev/next buttons and a "1 / N" count.

```html
<ul class="[name]__grid" data-[name]>
  <li class="[item] is-active">[content]</li>
  <li class="[item]">[content]</li>
  <li class="[item]">[content]</li>
</ul>

<div class="[name]__nav" data-[name]-nav>
  <button type="button" class="[name]__arrow" data-direction="-1" aria-label="Previous [thing]">[svg]</button>
  <span class="[name]__count" data-[name]-count>1 / 3</span>
  <button type="button" class="[name]__arrow" data-direction="1" aria-label="Next [thing]">[svg]</button>
</div>
```

The home page uses this pattern in three places: testimonials, craft pillars, process phases. New slideshow components should match — same arrows, same count format, same `data-direction` values.

### 7.11 Card grid

Used for `.services__grid` and any future grid of equal-weight items.

```html
<div class="[name]__grid">
  <article class="[name]__card">
    <figure class="[name]__shot">
      <img src="..." alt="..." loading="lazy" decoding="async" />
    </figure>
    <h3 class="[name]__title">[Title]</h3>
    <p class="[name]__copy">[Body copy]</p>
  </article>
  <!-- repeat -->
</div>
```

`loading="lazy"` and `decoding="async"` are mandatory on all body-section `<img>` tags (not on hero or above-the-fold images).

### 7.12 Image with figcaption

```html
<figure class="[name]__shot">
  <img src="..." alt="[descriptive alt]" loading="lazy" decoding="async" />
  <figcaption>[Caption text]</figcaption>
</figure>
```

Alt text is real description, never decorative or empty unless the image is purely ornamental.

### 7.13 Section folio

A small `§ 01` marker in the top-right corner of major sections, set in Plex Mono.

```html
<span class="section-folio">§&nbsp;01</span>
```

```css
.section-folio {
  position: absolute;
  top: var(--pad-section);
  right: var(--pad-x);
  font-family: var(--mono);
  font-size: var(--fs-xs);
  color: var(--soft);
}
```

Selectively applied — not every section needs one. Use on major editorial sections where a magazine register is intentional.

### 7.14 Drop cap

First letter of the first paragraph in a major narrative section gets a Cormorant drop cap.

```html
<p class="lede has-drop-cap"><span class="drop-cap">M</span>aja was born...</p>
```

Drop caps are a magazine-layer move. Use sparingly. The previous studio page §02 had a drop cap removed because the chosen font cut didn't read well; if reintroducing, test against the actual font weight first.

### 7.15 Section break ornament

A horizontal `— § —` ornament between sections that need a typographic transition.

```html
<div class="section-break">
  <span aria-hidden="true">—&nbsp;§&nbsp;—</span>
</div>
```

Plex Mono, centered, with vertical breathing room above and below. Sparingly used.

---

## 8. Section types — the recurring composition patterns

### 8.1 Hero (marble + chestnut vein)

```html
<section class="[name]-hero" aria-label="[Subject] — hero">
  <div class="[name]-hero__brand">
    <h1 class="[name]-hero__name">[Wordmark or large headline]</h1>
    <p class="[name]-hero__hook">[Tagline]</p>
    <p class="[name]-hero__guarantee">[Guarantee or supporting line]</p>
  </div>
</section>
```

Marble background. `min-height: 100vh`. Center-aligned text on desktop (some pages may want left-aligned for editorial register). Hero is the only section that breaks the eyebrow rule — heroes don't carry an eyebrow. The wordmark or display headline is the section's identity.

### 8.2 Two-column spread (text + image)

See §6.3 grid ratios. Typical pattern: `.[name]__intro` wrapper containing `.[name]__copy` (text column) and `.[name]__portrait` or `.[name]__shot` (image column).

### 8.3 Three-column rich section

Container uses `--container-max`. Three columns: sticky-head + body + pull-out. The home page's `.method` section is the canonical example — `.method__head` (sticky on scroll) + `.method__body` (containing paragraphs and an inline blockquote).

### 8.4 Centered prose section

Container narrows to `--container-narrow` (900px) or `--container-prose` (720px). Eyebrow centered, headline centered, body centered. Use for letters, spine quotes, and pure-text moments where reading width matters.

### 8.5 Pull quote divider

A `--container-narrow` block sitting between two body sections, with hairlines above and below the italic Cormorant pull quote. Hanging punctuation on the open quote. Attribution below the quote in mono caps. Pull quote divider sections do NOT carry an eyebrow. The quote is the section's identity. See §3 Rule 1.

### 8.6 Olive accent panel

Full-bleed `background: var(--shadow)`. Cream text on olive. Used for the most dramatic principle moment on a page — typically a Maja quote that anchors the page's argument. **One per page.** Olive accent panel sections do NOT carry an eyebrow. The dramatic single-moment composition is the section's identity. See §3 Rule 1.

### 8.7 Sticky lock-up (`.method` pattern)

A section where the head column is sticky-positioned while the body column scrolls. Implemented via `position: sticky` on the head column with a top offset accounting for the floating nav height.

### 8.8 Tabbed map / state panel (`.cascais` / `.local-mastery` pattern)

A section with tabs that swap a primary visual and the supporting text in lockstep. The pattern uses `data-target` (on tabs), `data-state` (on swappable elements), and `data-active` (on the parent container). JS handles the swap by syncing the `data-active` attribute. Used for the Cascais local mastery tour; reusable for any "multiple views of one thing" pattern.

### 8.9 Slideshow with nav and count

See §7.10. Three current uses: testimonials, craft pillars, process phases.

### 8.10 Card grid

See §7.11. Used for services. The grid collapses to a single column on mobile.

### 8.11 Project tile grid (mixed shapes)

The home page's `.projects__grid` uses six tiles in three different shapes (`.tile--square`, `.tile--landscape`, `.tile--portrait`) arranged in two rows. Each tile carries a video poster, a hover state, a click-to-reveal "solved" copy block, and a separate `View Project` link. This is a high-effort pattern; replicate only on pages that legitimately need a project showcase, not on every page.

### 8.12 Footer

See §2.6. Identical across pages.

---

## 9. Magazine layer (selectively applied)

Apply 2–3 of these per page, not all of them. Each carries weight; using all at once dilutes them.

- Drop caps (§7.14)
- Pull quote dividers (§7.4, §8.5)
- Section folios (§7.13)
- Marginalia (§7.6)
- Refined captions with hairlines (§7.5)
- Hanging punctuation on pull quotes
- Section break ornaments (§7.15)
- Italic figure captions on photographs that deserve a voice line

The studio page is the kinetic / magazine-layer canvas — it carries more of these than other pages. The home page uses fewer but applies them with intent. Other pages should match the home page's restraint, not the studio page's density.

---

## 10. Kinetic / motion conventions

### 10.1 Wordmark scroll-coupled animation (home only)

The home page hero wordmark fades and scales down as the visitor scrolls, while a smaller wordmark appears in the nav next to the logo. Driven by `js/scroll-brand.js` reading `data-wordmark-source` (on the hero) and writing to `data-wordmark-target` (on the nav). The animation completes by ~33% of hero scroll.

Subpages don't carry the source attribute. The nav target stays inert.

### 10.2 IntersectionObserver triggers

Several elements use IntersectionObserver to play once when they enter the viewport: `data-living-portrait` (Maja portrait video), `data-tile-video` (project tile videos), `data-step-video` (process step videos), `[data-count]` (stats numbers count up). New observable elements should use the existing pattern — assign a data attribute, register it in `js/main.js` or `js/scroll-scrub.js`, observe with IntersectionObserver.

### 10.3 Video autoplay pattern

Every autoplay video on the site uses the same attribute set:

```html
<video src="..." poster="..." muted loop playsinline preload="metadata" loading="lazy"></video>
```

Plus `autoplay` on videos that play immediately (intro overlay, stats background) or reserved for click-triggered playback (`data-tile-video`, `data-step-video`). Always include the poster — it's the first-paint state and the fallback if video fails.

### 10.4 Magnetic CTA hover

The Begin a Project CTA carries `data-magnetic` and is wired by `js/magnetic.js` to subtly track the cursor on hover. Use on primary CTAs only; not on every link.

### 10.5 GSAP + Lenis + ScrollTrigger architecture

The site uses:

- **Lenis** — smooth-scroll layer. Initialized in `js/main.js`.
- **GSAP** — animation engine. Loaded as a vendor lib.
- **ScrollTrigger** — GSAP plugin for scroll-driven animation. Loaded as a vendor lib.

The order in `main.js` is: initialize Lenis → tell ScrollTrigger to use Lenis as the scroll source → only then are scroll triggers created (in `scroll-scrub.js`). Don't reorder.

### 10.6 Reduced motion

Every motion treatment must respect `prefers-reduced-motion: reduce`. Autoplay videos pause, scroll-coupled animations skip to their final state, marquees stop. Test new motion against the OS-level setting before considering it shipped.

---

## 11. Asset conventions

### 11.1 Cache-bust query parameter

Every internal asset URL carries `?v=N` where N is a single shared integer. The home page currently uses `v=247` on stylesheets and `v=236` on most other assets — that drift indicates stylesheets were bumped more recently. **Going forward, bump every asset's `v` parameter on every shipping change.** A single grep-and-replace of `?v=N` to `?v=N+1` is the convention.

### 11.2 File path conventions

```
/logo/                  Brand mark and logo files
/assets/images/         All photography (webp preferred, jpg fallback)
/assets/videos/         All video assets (mp4, H.264 baseline, +faststart)
/css/                   Stylesheets (index.css, animations.css)
/js/                    App JavaScript modules
/vendor/                Third-party libs (gsap, ScrollTrigger, lenis)
```

### 11.3 Image formats

Prefer `.webp` for production photography. Use `.jpg` only for assets that need it (e.g., browsers that don't support webp — increasingly rare). Prefer `.png` for the brand mark and any logo with transparency. Never ship `.png` for photographs (unnecessary file size).

### 11.4 Aspect ratios for editorial photography

- **3:2 horizontal** — the editorial standard for interior photography. Used on featured project hero shots and large image moments.
- **4:5 portrait** — used for portrait-shaped tiles and editorial portrait photographs.
- **1:1 square** — used for service-card thumbnails and detail crops.
- **16:9** — only for video. Avoid for stills.
- **21:9 / 2.35:1** — only for full-bleed banner moments.

When mixing aspect ratios in a grid, the variation is intentional (the home page's mixed-tile project grid). When matching aspect ratios across a slideshow, the consistency is intentional (the studio page's project showcase). Choose deliberately.

### 11.5 Video file conventions

H.264 baseline profile, MP4 container, +faststart flag set so the video begins streaming on first byte. Target file size: under 6 MB for hero videos, under 2 MB for inline loops. Always export at 16:9 unless the placement specifically calls for 9:16 vertical.

---

## 12. Voice (locked)

These rules are inviolable. They are stricter than the typography rules — no exceptions, ever.

1. **Maja in third person** for narrative content. "Maja walks the apartment with you." "She specs the stone." "She is on site every day."
2. **First person ONLY in attributed quotes**. `<blockquote><p>"I want to know how you live before I draw a line."</p><cite>— Maja Milič</cite></blockquote>` is correct. First-person prose outside a quotation is wrong.
3. **Visitor in second person** ("you", "your") freely throughout body copy.
4. **NO "we / our / us" anywhere on the site.** This is the single most violated rule when AI tools generate content. Search every shipping copy block for "we", "our", and "us". If they appear outside an attributed Maja quote, they are wrong.
5. **The studio is "Maya's Homes" or "the studio"** — never "we", never "the team", never "the practice's people" (unless referring specifically to the bench).

The brand thesis sits on the four truths in §1; voice protects them.

### 12.1 Phrases worth carrying

The home page has earned these signature lines. Reuse, echo, vary — but don't drop:

- "All of your dreams brought to life."
- "One Team. Zero Subcontractors. Twenty-five Years."
- "From three continents. One pair of hands."
- "Drawn and laid. One hand."
- "One number. The same names."
- "Maya's Homes never really leaves."
- "A bulb in year three. A hinge in year five."
- "Subcontracting would be easier and cheaper. It is also not how Maya's Homes works — and never will."

### 12.2 Italic budget

Roughly **one italic Cormorant line per scroll-screen**. If a section has three italics in a row, two of them are wrong. Italics are voice; voice is finite.

### 12.3 Maja vs Maya's spelling

- **Maja Milič** — the founder's personal name. With a J. Used for biographical and personal content, Maja quotes, the signed letter, the bio.
- **Maya's Homes** — the brand. With a Y. Used for the studio, the logo, all references to the practice.
- **Maja's Selection** — a personal-name use of the founder's selection. With a J (like Maja's name).

Don't mix. The brand is "Maya's"; the founder is "Maja". They are different.

---

## 13. Forms (Netlify pattern)

Every form on the site uses Netlify Forms. The pattern is:

```html
<form class="[name]__form" name="[form-name]" method="POST" data-netlify="true" netlify-honeypot="bot-field" novalidate>
  <input type="hidden" name="form-name" value="[form-name]" />
  <p class="[name]__honeypot" hidden aria-hidden="true">
    <label>Don't fill this out: <input name="bot-field" /></label>
  </p>

  <div class="[name]__field">
    <label class="[name]__label" for="[id]">[Field label]</label>
    <input class="[name]__input" type="[type]" id="[id]" name="[name]" required>
    <span class="[name]__error" data-error-for="[id]" aria-live="polite"></span>
  </div>

  <button type="submit" class="[name]__submit">
    <span>[CTA text]</span>
    <span aria-hidden="true">→</span>
  </button>
</form>

<div class="[name]__sent" data-[name]-sent hidden>
  <p class="[name]__sent-title">Message sent.</p>
  <p class="[name]__sent-body">[Acknowledgment copy]</p>
</div>
```

Required attributes: `data-netlify="true"`, `netlify-honeypot="bot-field"`, the hidden `form-name` input, the visually-hidden honeypot field. The success state is a separate hidden block toggled by JS on submit.

Form labels are mandatory. Inline placeholder-only forms are wrong on this site.

---

## 14. Data-attribute hooks (the JS API surface)

The site uses data attributes as the bridge between markup and JavaScript. New components should use the existing pattern: assign a data attribute, register it in the relevant JS module, observe or query by attribute. **Don't bind JavaScript to class names.** Classes are for styling; data attributes are for behavior.

Current attributes in use:

| Attribute | Where | What it does |
|---|---|---|
| `data-nav` | `.floating-nav` | Marks the floating nav for scroll-state changes (hidden on scroll, visible at top) |
| `data-drawer` | `.nav-drawer` | Marks the mobile drawer for open/close toggling |
| `data-menu-open` | `.nav-menu-toggle` | Click target that opens the drawer |
| `data-menu-close` | `.nav-drawer__close` | Click target that closes the drawer |
| `data-magnetic` | `.btn-silver` (CTA) | Wires the cursor-magnetic hover effect |
| `data-wordmark-source` | Hero `<h1>` (home only) | Source for wordmark scroll animation |
| `data-wordmark-target` | Nav `.nav-wordmark` | Target for wordmark scroll animation |
| `data-nav-brand` | Nav `.nav-wordmark` | Marks the nav brand wordmark |
| `data-brand` | `.intro__brand` | Container for hero brand block |
| `data-build-line` | Hero subtitle / guarantee | Lines that fade in on hero entrance |
| `data-living-portrait` | Maja portrait `<video>` | Plays once on viewport entry |
| `data-count` | `.stats__number` | Triggers count-up animation |
| `data-method-quote` | `.method__quote` | Reveals on scroll |
| `data-tile` | `.tile` | Project tile container |
| `data-tile-video` | Tile `<video>` | Tile transformation video, plays on click |
| `data-craft` | `.craft__grid` | Slideshow container |
| `data-craft-nav` | `.craft__nav` | Slideshow nav block |
| `data-craft-count` | `.craft__count` | Slideshow position display |
| `data-craft-quote` | `.craft__quote` | Reveals on scroll |
| `data-testimonials` | `.testimonials__grid` | Slideshow container |
| `data-testimonials-nav` | `.testimonials__nav` | Slideshow nav block |
| `data-testimonials-count` | `.testimonials__count` | Slideshow position display |
| `data-testimonials-section` | `.testimonials` | Section-level wrapper |
| `data-phases` | `.process__steps` | Process slideshow container |
| `data-phases-nav` | `.process__phases-nav` | Process nav block |
| `data-phase-count` | `.process__phase-count` | Process position display |
| `data-step` | `.process__visual` | Marks a step's visual frame |
| `data-step-video` | Process step `<video>` | Plays on click within the step |
| `data-target` | `.local-mastery__tab` | Tab destination state |
| `data-state` | `.local-mastery__caption`, `.local-mastery__map`, etc. | State name for sync |
| `data-active` | `.local-mastery` | Currently active state |
| `data-map-advance` | `.local-mastery__frame-button` | Click target that advances the map |
| `data-map-nav` | `.local-mastery__nav` | Map nav block |
| `data-map-count` | `.local-mastery__map-count` | Map position display |
| `data-direction` | Slideshow arrows | `-1` for prev, `1` for next |
| `data-error-for` | Form error message | References the field id |
| `data-contact-sent` | `.contact__sent` | Success state container |
| `data-notify-trigger` | Sister-practice link | Triggers the notify modal |
| `data-year` | Footer copyright span | Auto-updates to current year |
| `data-todo` | Privacy/Terms links | Marks unfinished pages |

When adding a new behavior, follow the same convention: pick a data attribute, document it here, wire it in the appropriate JS module.

---

## 15. Home page section catalog (composition reference)

The home page has eleven major sections under `<main id="top">`. Use this as a composition reference when designing new pages — not every new page needs all of these, but the ordering and rhythm should feel familiar.

1. **`.intro` — Hero.** Marble + chestnut vein. Wordmark + headline + guarantee. Full viewport height.
2. **`.manifesto#manifesto` — The Standard.** Two-column intro (text + Maja portrait video) + three-pillar ul. Closer to /studio/.
3. **`.stats` — At a glance.** Video-background band with four count-up numbers and IMPIC/AMI legal line.
4. **`.method#method` — The Approach.** Sticky lock-up, head + body with inline Maja quote.
5. **`.projects#projects` — The Transformations.** Six-tile mixed-shape grid with video posters, hover reveal, click-to-solve. Closer to /projects/.
6. **`.testimonials#testimonials` — In Their Words.** Single-active testimonial slideshow with prev/next nav and count.
7. **`.craft#craft` — The Craft.** Three-pillar slideshow with prev/next nav and count.
8. **`.process#process` — How Maya's Homes Works.** Four alternating-side process steps + result aside, each with a step video and Maja quote. Closer to /process/.
9. **`.cascais#cascais` — Local Mastery.** Tabbed map (overview, area, permits, climate) with synced caption + lede + quote per state. Closer to /studio/.
10. **`.services#services` — What Maya's Homes Offers.** Six-card grid + Maya's Care sister-practice aside. Closer to /services/.
11. **`.contact#contact` — Begin a Project.** Two-column intro + form, with direct-contact list.

Then the footer.

The pacing rule: every section has its own visual identity but they're stitched together by the section closer pull-forward and by the consistent eyebrow + display + lede pattern. New pages should pace themselves the same way — never two body-section types in a row that look identical.

---

## 15.5 Project page chassis (composition reference)

Every page under `/projects/{slug}/` follows a shared 10-section chassis. The home page is canonical for chrome and components; **Figueiras is canonical for the project page chassis** (`/projects/figueiras/index.html`). When chassis-upgrading a new project page, copy Figueiras' `<main>` and substitute project-specific content.

### 15.5.1 The ten sections (in order)

```
<main>
  <article class="project">
    1.  HERO BLEED       .project__hero.project__hero--bleed
                         <h1 class="sr-only"> + full-bleed image
    2.  BRIEF            .project__brief
                         .project__brief-inner (aside 1/3 + body 2/3)
                         aside: Scope · Typology · Location · Year
                         body: H2 (display) + 2 paragraphs prose
    3.  ORNAMENT         <div class="section-ornament">— § —</div>
    4.  BEFORE           .project__before
                         .project__before-grid (2×2 grid, sitewide default
                         as of 2026-05-22 — was 4-up wide spread before;
                         each photo now reads at ~50% container width
                         instead of ~25% width thumbnails)
    5.  DESIGN           .project__design
                         .project__design-pair (landscape rendering + portrait materials)
    6.  DURING           .project__during
                         .project__during-pair (small portrait + large landscape)
    7.  PULL QUOTE       <blockquote class="maja-quote project__quote">
                         renders as 100vh band when body.page-{project} is set
                         Sits BEFORE the After gallery — acts as a cinematic
                         curtain-drop into the reveal.
    8.  AFTER GALLERY    .project__after
                         single↔pair alternation: single, pair, single, pair, …
                         default = 13 photos in 9 slots (5 singles + 4 pairs)
                         The climax of the project's arc.
    9.  DETAILS          .project__details (2-col grid)
                         Numbers (Duration + Space) + Materials list
    10. CLOSER CTA       .project__closer-cta
                         eyebrow + display H2 + em-italic body + btn-silver
  </article>
</main>

<!-- still inside <main> but outside <article>: -->
11. UP-NEXT             <a class="project__upnext"> → next /projects/{slug}/
```

The Numbers section deliberately holds **only Duration and Space**. "Trades on bench" and "Permits" were both originally present but were removed sitewide (2026-05-22) because they didn't change between projects and read as filler.

**Section-order note (2026-05-22 revision):** The Pull Quote was originally section 8 (between After and Details). Per Gemini structural review, it moved to section 7 (between During and After). Reasoning: the 100vh band of saturated color + Maja-voice italic is the page's most cinematic moment; placed AFTER the gallery it reads as a denouement, placed BEFORE the gallery it acts as a curtain-drop that builds anticipation for the reveal. The arc now reads: Brief (the problem) → Before (the inheritance) → Design + During (the labor) → Quote (the editorial pause) → After (the reveal) → Details (the specs) → Closer (the invitation).

### 15.5.2 Per-project palette tokens

Each project declares its own palette inside `body.page-{project}` in `css/index.css`. The pattern (Figueiras as the example):

```css
body.page-figueiras {
  --project-anchor: #E8D8D6;   /* legacy: used to drive body bg; kept for potential future use */
  --project-fill:   #C8A9A3;   /* mid value of the same family */
  --project-accent: #A8857F;   /* the 100vh pull-quote band overlay */
  --project-trim:   #B98F4A;   /* warm/cool complement, secondary identity */
  --champagne-on-mauve: #F0DDB8;  /* band headline + body text — bespoke */
  --brass-on-mauve:    #D4B57E;   /* band cite — bespoke */
  --hero-aspect: auto;
}
```

The palette is **derived from the actual after photos, not inherited**.

**Colour-discipline rule (2026-05-22 revision):** the body bg of every project page is now the sitewide `--bone` (`#F4EFE6` cream), **not** the per-project `--project-anchor`. The earlier approach (each page tinted full-body with the project's pale anchor) made the page read as a stack of saturated colour rectangles ("cubed colours") and dulled the pull-quote band's impact — when the wallpaper is already tinted, the band's saturation has no neutral to land against.

The per-project identity now lives **only** in:
- Eyebrows (section eyebrows + brief eyebrow + closer eyebrow) — tinted with `--project-accent` or `--project-trim`
- Pull-quote band — 100vh full-saturation moment, the only colour wallpaper on the page
- Pull-quote band text — bespoke per-project champagne/cream/cite pairs
- Materials list + role-line italics — restrained tints

The `--project-anchor` variable is kept defined per project for potential future use (e.g., a section that wants a subtle tinted accent) but no longer drives the body bg.

Each project also declares two bespoke text-on-band variables (e.g. `--cream-on-sage` + `--dim-on-sage`) so the headline + cite typography on the band reads as project-specific, not borrowed from another project. The full table:

| Project       | Body anchor      | Band accent      | Band text          | Notes                                          |
|---------------|------------------|------------------|--------------------|------------------------------------------------|
| Vista         | (pale rose)      | rose             | dark ink           | the original chassis project                   |
| Belle Rivière | (warm linen)     | chestnut         | --bone-on-shadow   | uses the generic dark-band cream               |
| Figueiras     | pale mauve       | mauve            | champagne / brass  | first bespoke band-typography pair             |
| La Sala       | pale sage        | deep sage        | sage cream / dim-sage | monochromatic sage-on-sage                  |
| The Tasca     | warm oat-cream   | deep terracotta  | terracotta cream   | bespoke variant (see §15.5.5)                  |
| Rosa          | warm dove        | anthracite       | champagne / saddle | **first dark-band project**                    |

### 15.5.3 Pull-quote band CSS pattern (3 layers)

```css
body.page-{project} .project__quote {
  background:
    linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0.10) 100%),
    linear-gradient(rgba(R,G,B,0.78), rgba(R,G,B,0.78)),
    url('/assets/textures/{project}-texture.webp');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  /* ...inset shadows for depth */
}
```

The R,G,B values come from `--project-accent` at 0.78 opacity. Until a texture is supplied, the band uses a skeleton pattern: replace the texture URL layer with `var(--project-accent)` flat color, and add an SVG noise `::before` overlay to keep the band from reading as flat. When the user drops a texture file, swap to the 3-layer pattern and **drop the SVG noise `::before`** — the texture replaces it.

### 15.5.4 Asset conventions

**Hero bleed:**
- File: `/assets/images/{project}-bleed.webp` (or versioned `-v2.webp`, `-v3.webp` when user iterates)
- Encoding: `cwebp -q 82 -m 6` (resize to 2400w if source is wider)

**After-gallery:**
- Folder: `/assets/images/{Project-Name}/` (PascalCase or kebab-case matching the user's preference per project)
- Files: `#1.webp` through `#13.webp` (or `#16.webp` for Tasca)
- HTML paths URL-encode `#` as `%23`
- Encoding: `cwebp -q 90 -m 6 -resize 2400 0` → each ~200–800 KB, total ~5–10 MB

**Pull-quote texture:**
- File: `/assets/textures/{project}-texture.webp` or `{project}-{material}.webp` (e.g. `figueiras-plaster.webp`, `la-sala-texture.webp`, `the-tasca-texture.webp`)
- Encoding: `cwebp -q 82 -m 6 -resize 2400 0`

**Before / Design / During photos:** kept as JPEG (matching the V1 pattern). Direct `<img>` references — no folder convention.

### 15.5.5 Bespoke variants — when to depart from the chassis

The chassis is a default, not a cage. When a project's actual photos or narrative demand it, scope variants to `body.page-{project}` so other projects keep the default. The Tasca demonstrates the pattern:

- **No Design section** — the project's thesis is preservation/total rebuild, not designed-from-scratch. The "design choice" is the preservation, and that lives in the brief + after gallery.
- **Expanded During** — 7-photo single↔pair gallery instead of a 2-photo pair, using `project__detail` + `project__pair` building blocks at smaller scale.
- ~~**2×2 landscape Before grid**~~ — this was a Tasca-bespoke override originally; **as of 2026-05-22, 2×2 is the sitewide default** and the Tasca-bespoke CSS rule was removed. Every project now uses 2×2; the difference between Tasca and the others is just landscape-vs-portrait aspect of the child images, not the grid count.
- **16/11 After gallery** — instead of 13/9, because the project had more photos to show.

When a future project needs similar departures, follow the same pattern: scope the override to `body.page-{project}` and document the why in an inline comment.

### 15.5.6 Voice rules specific to project pages

- **Scope label:** "Turnkey renovation", never "Full renovation". See [project-scope-terminology] memory.
- **Location label:** neighbourhood, never street address. See [project-location-labels] memory.
- **Captions:** describe what's in the frame, not the studio's brand thesis. Avoid "the studio's own", "our team". See [feedback-avoid-studio-branding-in-captions] memory.
- **Section eyebrows:** plain ("— Before") is the default. Specific ("— Before · Tired finishes, good bones") is acceptable when the project's narrative earns it.
- **Closer CTA voice:** sibling lines across projects ("Yours might… The studio is good at…"). Each closer's hook is the project's defining move flipped into an invitation. See each `body.page-{project} .project__closer-cta` for the pattern.

### 15.5.7 The canonical-example mapping

Each project page is the studio's canonical proof for one capability. When the rest of the site (`/services/`, `/process/`, `/journal/`) talks about that capability, link to the matching project instead of writing generic copy:

| Capability                            | Canonical project                |
|---------------------------------------|----------------------------------|
| Velux / skylights / quality windows   | Vista                            |
| Inheriting + finishing a gutted job   | Belle Rivière                    |
| Restraint, open-plan from heavy       | Figueiras                        |
| Underfloor heating                    | La Sala                          |
| Big conversions (commercial → home)   | The Tasca                        |
| External areas / patio rebuilds       | Rosa                             |

When a service or process page is written, prefer inline links over generic claims:

> ✅ "Every Maya's Homes apartment ships with underfloor heating — [see La Sala for the install](/projects/la-sala/) where the silver-foil insulation panels are documented."
> ❌ "We do quality work including heating, insulation, and structural changes."

The mapping is also stored as a memory ([project-canonical-examples]) so future Claude sessions can apply it without re-deriving.

---

## 16. Implementation checklist (every new page must pass)

Run through this list before considering a new page done. If any item fails, the page isn't ready.

**Document skeleton**
- [ ] `<html lang="en">`, charset, viewport, theme-color present in head
- [ ] Title formatted `[Page] · Maya's Homes`
- [ ] Meta description, canonical, OG quartet (type, title, description, image, locale) present
- [ ] Favicon link to `/logo/mayas-homes-mark.png`
- [ ] Google Fonts preconnect + single fonts URL loading all four families
- [ ] `/css/index.css?v=N` and `/css/animations.css?v=N` loaded with current cache-bust integer
- [ ] `<body class="page-[name]">` declared
- [ ] Script block at end of body in correct order (vendor → main → scroll-scrub → nav → nav-drawer → magnetic → scroll-brand → intro)

**Shared chrome**
- [ ] Floating nav header is verbatim from the home page
- [ ] Active nav link carries `class="is-current"` in nav and drawer
- [ ] Nav drawer aside is verbatim from the home page; the Home link is present on every page (with `is-current` only on the home page itself)
- [ ] Begin a Project CTA carries `data-magnetic` and uses `.btn-silver`
- [ ] Footer is verbatim from the home page (both `.footer__details` and `.footer__credentials` zones)
- [ ] IMPIC and AMI numbers present in footer credentials center column

**Section structure**
- [ ] Hero uses marble + chestnut vein; no eyebrow
- [ ] Every other major section carries an eyebrow (`<p class="eyebrow">— LABEL</p>`)
- [ ] Eyebrows use em-dash + space prefix in title-case source text
- [ ] Each section has a single `<h2 class="display">` headline
- [ ] BEM naming: section class as namespace, double-underscore for elements
- [ ] Sections that bridge into deeper pages carry a section closer (Variant A `.section-closer--minimal` for default body sections, Variant B `.section-closer` with internal eyebrow for high-stakes editorial closes)
- [ ] Closer copy is editorial pull-forward language, never utility ("Learn more", "Click here", "Read more")
- [ ] No `<h1>` inside body sections — H1 belongs to the page hero only

**Typography**
- [ ] Body uses Inter (`--sans`) — never Cormorant for body
- [ ] Headlines use Cormorant (`--serif`) at `--fs-2xl` via `.display`
- [ ] Eyebrows and figcaptions use Plex Mono (`--mono`)
- [ ] Italic Cormorant only on quotes, attributed lines, brand mark, pull quotes, letters
- [ ] No banned anti-vocabulary (passionate, industry-leading, unlock, leverage, etc.)
- [ ] Italic budget respected (≤ 1 italic line per scroll-screen)

**Color**
- [ ] Hero background is marble; footer background is marble
- [ ] Body sections use `--taupe`; no other off-cream values
- [ ] At most one olive accent panel on the page
- [ ] Text colors only from defined tokens (`--ink`, `--ink-2`, `--mid`, `--soft`)
- [ ] Body-level texture untouched (don't override the fixed background image or noise overlay)

**Layout**
- [ ] Container uses `--container-max` (1480px) by default; narrower variants (`--container-narrow`, `--container-prose`) only where editorially justified
- [ ] Section padding follows `var(--pad-section) var(--pad-x)`
- [ ] Two-column grids use 1.4fr/1fr or 1fr/1.4fr; never 1fr/1fr
- [ ] Adjacent two-column sections alternate which side carries the image
- [ ] Vertical rhythm follows the spacing in §6.4

**Voice**
- [ ] Third-person Maja for narrative
- [ ] First person only inside attributed `<blockquote>` or `<cite>`
- [ ] Studio referenced as "Maya's Homes" or "the studio"
- [ ] No "we / our / us" found in any non-quoted body copy
- [ ] Maja vs Maya's spelling correct (J for the founder, Y for the brand)

**Magazine layer**
- [ ] At least 2 magazine-layer moves applied (drop cap / pull quote / folio / marginalia / refined captions / ornament)
- [ ] Italic figure captions used selectively, not on every figure

**Assets**
- [ ] All asset URLs carry `?v=N` cache-bust query parameter
- [ ] Body-section `<img>` tags carry `loading="lazy"` and `decoding="async"`
- [ ] All `<video>` tags carry `muted playsinline preload="metadata"` plus `poster` attribute
- [ ] Photography aspect ratios consistent within a grid or slideshow
- [ ] Real alt text on every image

**Behavior**
- [ ] Mobile breakpoint tested at 375px viewport width
- [ ] Active nav link visible on mobile in the drawer
- [ ] Forms (if any) follow the Netlify pattern with honeypot, hidden form-name input, and aria-live error spans
- [ ] All data attributes from §14 wired correctly if their components are present
- [ ] Reduced-motion preference respected (autoplay videos pause, scroll animations skip)

**DevTools verification**
- [ ] Section margins, padding, and container width measured against the home page within 4px tolerance
- [ ] Computed font-family on body resolves to Inter (not Cormorant or system default)
- [ ] Computed `background-image` on body shows the limestone texture loading correctly

If any item fails, the page isn't done. If a deliberate exception is needed for editorial reasons, document the exception in this file before shipping.

---

## 17. When to update this document

Update this bible whenever any of the following happens:

- A new component is introduced that other pages will share. Document it in §7.
- A new section pattern is invented. Document it in §8.
- A new data attribute is added. Document it in §14.
- A new color or type token is added to `:root`. Document it in §4 or §5.
- The cache-bust integer is bumped. Update the example in §2.1.
- The home page changes a structural pattern that other pages should follow. Update the relevant section and bump the version number.
- A page audit reveals drift from this document. Fix the page; if the drift was correct and the bible was wrong, fix the bible.

The bible is meant to be read often and updated often. A stale bible is worse than no bible — it produces confidently wrong prompts.

---

## 18. Anti-patterns (what the site is not)

These are the patterns that mark a contractor template, an agency capabilities deck, or a real-estate listing. The site rejects all of them.

- Hover-to-reveal text (words are not for hiding)
- Carousels of three things ("we couldn't decide")
- Scroll-jacking (visitors leave instantly when websites do this)
- Autoplay audio (default-on is not acceptable)
- Loading screens (the first paint is the first impression)
- 3D rotations of buildings (this is renovation, not architectural visualization)
- "Why choose us" lists
- Stock photography
- Smiling team photos
- Buzzword grids
- Decorative gradients on text
- Drop shadows under headlines
- Animated icons of houses, buildings, or paintbrushes
- Generic agency capability decks ("Design · Build · Deliver")
- Pricing badges, "starting from", or any monetary display on the public site

If a future change wants to introduce one of these, it doesn't ship without an explicit bible amendment.

---

*Document version 2.1 — locked 2026-05-10*
*Owner: Lukas / Maja*
*Source of truth: `/Users/lukasbot/Desktop/Mayas-Homes-V2/index.html`*
