/* =========================================================
   CINEMATIC INTRO — typographic build, no video.

   The wordmark builds letter-by-letter (each letter wrapped in a
   span at runtime, with cascading delays). After the wordmark
   completes, the guarantee lines and hook fade in sequentially.
   Once the last line is in place, scroll unlocks.

   Same skip button + sessionStorage auto-skip on refresh as the
   prior video-based intro.
   ========================================================= */

const root       = document.documentElement;
const introEl    = document.querySelector('[data-intro]');
const wordmark   = document.querySelector('[data-build-text]');
const buildLines = document.querySelectorAll('[data-build-line]');
const cue        = document.querySelector('[data-cue]');
const skipBtn    = document.querySelector('[data-intro-skip]');

/* The hero now settles on arrival for every visit — no build animation
   plays. shouldAutoSkip is always true; sessionStorage / hash-anchor
   logic kept around as no-ops for parity with the prior intro state
   machine. */
const hasHashAnchor =
  window.location.hash && window.location.hash.length > 1;
const shouldAutoSkip = true;

if (!introEl) {
  // No intro markup — nothing to do.
} else {
  /* Settled-on-arrival: the typography lands directly on its composed
     state from the first paint. The doors-opening hero video plays
     beneath via its native `autoplay`. When the video ends, it
     freezes on its last decoded frame — that frozen frame becomes
     the persistent hero background under the typography. */
  introEl.classList.add('intro--settled');

  /* Belt-and-braces: explicit pause on ended in case any browser
     quirk would otherwise rewind / loop the video. */
  const heroVideo = document.querySelector('[data-hero-master]');
  if (heroVideo) {
    heroVideo.addEventListener('ended', () => {
      try { heroVideo.pause(); } catch (_) {}
    });
  }

  root.classList.add('is-intro');
  window.dispatchEvent(new CustomEvent('intro:start'));

  let unlocked = false;

  /* — Letter-by-letter build of the wordmark. Each character becomes
       a .build-letter span with its own animation-delay. Spaces are
       replaced with non-breaking spaces so they don't collapse. — */
  let wordmarkLetterCount = 0;
  if (wordmark) {
    const text = wordmark.textContent;
    wordmark.textContent = '';
    [...text].forEach((char, i) => {
      const span = document.createElement('span');
      span.className = 'build-letter';
      span.textContent = char === ' ' ? ' ' : char;
      span.style.animationDelay = `${300 + i * 70}ms`;
      wordmark.appendChild(span);
      wordmarkLetterCount += 1;
    });
  }

  /* — Total wordmark duration: initial 300 ms + cascade + 600 ms tail. — */
  const wordmarkDuration =
    wordmarkLetterCount > 0 ? 300 + wordmarkLetterCount * 70 + 600 : 0;

  /* — Build lines fade in after the wordmark, 250 ms apart. — */
  buildLines.forEach((line, i) => {
    line.style.animationDelay = `${wordmarkDuration + 200 + i * 250}ms`;
  });

  /* — Total intro duration: wordmark + lines + buffer. — */
  const totalIntroDuration =
    wordmarkDuration + 200 + (buildLines.length * 250) + 700;

  const unlockPage = () => {
    if (unlocked) return;
    unlocked = true;
    root.classList.remove('is-intro');
    /* Mark the hero as having reached its composed final state.
       Whether the user watched the build or auto-skipped, the
       resting state is the same — wordmark + build lines + soft
       backsplash, locked visible. */
    introEl.classList.add('intro--settled');
    /* Mark this session as having seen the intro — refresh won't
       replay it. New tabs get a fresh session and will see it again. */
    try { sessionStorage.setItem('mh_intro_seen', '1'); } catch (_) {}
    window.dispatchEvent(new CustomEvent('intro:end'));

    if (skipBtn) {
      skipBtn.style.transition = 'opacity 0.4s ease';
      skipBtn.style.opacity = '0';
      setTimeout(() => skipBtn.setAttribute('hidden', ''), 400);
    }

    if (cue) {
      cue.style.transition = 'opacity 0.9s ease';
      requestAnimationFrame(() => { cue.style.opacity = '1'; });
    }
  };

  /* — Snap every animated element straight to its final state. — */
  const snapToFinal = () => {
    if (wordmark) {
      wordmark.querySelectorAll('.build-letter').forEach((span) => {
        span.style.animation = 'none';
        span.style.opacity = '1';
        span.style.transform = 'none';
        span.style.filter = 'none';
      });
    }
    buildLines.forEach((line) => {
      line.style.animation = 'none';
      line.style.opacity = '1';
      line.style.transform = 'none';
    });
  };

  if (shouldAutoSkip) {
    /* Mark settled state BEFORE snap so the .intro--settled CSS rules
       win on first paint — no flicker of the pre-animation state. */
    introEl.classList.add('intro--settled');
    snapToFinal();
    if (skipBtn) skipBtn.setAttribute('hidden', '');
    /* Hash deep-link skips the 'Scroll to explore' cue too — the user
       isn't at the top of the page anymore. */
    if (cue && hasHashAnchor) cue.style.opacity = '0';
    unlockPage();
  } else {
    /* Schedule unlock after the full build animation completes. */
    setTimeout(unlockPage, totalIntroDuration);
  }

  /* — Skip button: cut to the final state instantly. — */
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      if (unlocked) return;
      snapToFinal();
      try { sessionStorage.setItem('mh_intro_seen', '1'); } catch (_) {}
      unlockPage();
    });
  }
}
