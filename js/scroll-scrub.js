/* =========================================================
   CINEMATIC INTRO — single stitched master video.

   The two source clips (door-entry, kitchen-zoom-in) have been
   stitched into ONE file (hero-cinematic-master.mp4) so the
   transition is part of the encoded video itself — no JS handover,
   no possibility of a stutter or hang.

   Behaviour:
     1. Master video autoplays once through (no loop).
     2. Body scroll is locked until the video reaches the timestamp
        where the interior is fully revealed (REVEAL_TIME_S).
     3. At that timestamp:
          - The hero text crystallises in (blur 10px → 0, ease-out).
          - The nav (logo) soft-fades into the top-left.
          - Scroll unlocks.
          - The "Scroll to Explore" cue fades in.
     4. Video plays through to its last frame and freezes there.
   ========================================================= */

const { gsap } = window;

const root      = document.documentElement;
const introEl   = document.querySelector('[data-intro]');
const video     = document.querySelector('[data-hero-master]');
const brand     = document.querySelector('[data-brand]');
const cue       = document.querySelector('[data-cue]');
const skipBtn   = document.querySelector('[data-intro-skip]');
const nameEl    = document.querySelector('.intro__name');

/* — Split MAYA'S HOMES into per-character spans for the architectural
     build animation. Aria-label preserves the readable text for
     screen readers while the visual spans are decorative. — */
const nameChars = [];
if (nameEl) {
  const original = nameEl.textContent.trim();
  nameEl.setAttribute('aria-label', original);
  nameEl.textContent = '';
  for (const ch of original) {
    const span = document.createElement('span');
    span.className = 'intro__name-char';
    span.setAttribute('aria-hidden', 'true');
    // U+00A0 non-breaking space preserves visible spacing between words.
    span.textContent = ch === ' ' ? ' ' : ch;
    nameEl.appendChild(span);
    nameChars.push(span);
  }
}

/* The master (introvidfinal.mp4) is a single pre-stitched cinematic,
   ~15.04s long. Interior is fully revealed on the final frame; we
   trigger the reveal a hair before the natural end for crisp timing.
   Video has no loop — it freezes on the last frame as the
   marble-backsplash background. */
const REVEAL_TIME_S = 14.9;

if (!introEl || !video) {
  // No intro markup — nothing to do.
} else {
  /* — Lock the page scroll & tell the rest of the app. — */
  root.classList.add('is-intro');
  window.dispatchEvent(new CustomEvent('intro:start'));

  /* — Hard-set the playback flags. — */
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('webkit-playsinline', '');
  if ('preservesPitch' in video) video.preservesPitch = false;

  /* — Make sure autoplay actually fires (some browsers stall). — */
  const tryPlay = () => {
    const p = video.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  };
  if (video.readyState >= 2) tryPlay();
  else video.addEventListener('loadeddata', tryPlay, { once: true });
  // First user gesture as a safety net.
  window.addEventListener('pointerdown', tryPlay, { once: true });

  /* — State — */
  let revealed = false;
  let unlocked = false;

  /* — Crystallize text reveal:
         filter: blur(10px) opacity 0  →  filter: blur(0px) opacity 1
         duration: 1.5s, ease: power2.out
       — runs in parallel with the architectural build for MAYA'S HOMES,
       which assembles per-character with alternating Y offsets,
       then locks in (color resolves, stroke fades). */
  const crystallise = () => {
    if (revealed) return;
    revealed = true;

    if (gsap && brand) {
      gsap.fromTo(brand,
        { opacity: 0, filter: 'blur(10px)' },
        { opacity: 1, filter: 'blur(0px)', duration: 1.5, ease: 'power2.out',
          onComplete: () => unlockPage() });
    } else if (brand) {
      brand.style.transition = 'opacity 1.5s ease-out, filter 1.5s ease-out';
      brand.style.opacity = '1';
      brand.style.filter = 'blur(0px)';
      setTimeout(unlockPage, 1500);
    }

    /* Architectural build for MAYA'S HOMES — kicks in as the hook
       settles. Two phases:
         (1) Assembly: each char from alternating Y offsets, opacity
             0 → 1, expo.out for that "mechanical, heavy" snap.
         (2) Lock: CSS class .is-locked toggles color: transparent →
             #000 and stroke: dark → transparent, both eased over
             ~620ms. Total architectural sequence ≈ 1.7s. */
    if (gsap && nameChars.length) {
      gsap.fromTo(nameChars,
        { y: (i) => i % 2 === 0 ? 22 : -22, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          stagger: 0.045,
          ease: 'expo.out',
          delay: 1.0,                                  // start as hook settles
          onComplete: () => nameEl.classList.add('is-locked'),
        });
    } else if (nameEl && nameChars.length) {
      // No GSAP — snap reveal after a short delay.
      setTimeout(() => {
        nameChars.forEach((c) => { c.style.opacity = '1'; });
        nameEl.classList.add('is-locked');
      }, 1100);
    }

    /* Logo UI Transition: nav (logo) soft-fades into the top-left
       at the exact moment the brand crystallises. */
    const navEl = document.querySelector('[data-nav]');
    if (navEl) {
      requestAnimationFrame(() => navEl.classList.add('is-visible'));
    }
  };

  /* — Unlock page scroll + reveal cue. — */
  const unlockPage = () => {
    if (unlocked) return;
    unlocked = true;
    root.classList.remove('is-intro');
    window.dispatchEvent(new CustomEvent('intro:end'));

    if (skipBtn) {
      if (gsap) {
        gsap.to(skipBtn, {
          opacity: 0, duration: 0.4,
          onComplete: () => skipBtn.setAttribute('hidden', ''),
        });
      } else {
        skipBtn.setAttribute('hidden', '');
      }
    }

    if (cue) {
      if (gsap) {
        gsap.fromTo(cue,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.9, ease: 'power2.inOut', delay: 0.1 });
      } else {
        cue.style.transition = 'opacity 0.9s ease';
        cue.style.opacity = '1';
      }
    }
  };

  /* — Timestamp watcher: when the master reaches REVEAL_TIME_S,
       crystallise the brand, which chains into unlockPage. — */
  video.addEventListener('timeupdate', () => {
    if (!revealed && video.currentTime >= REVEAL_TIME_S) {
      crystallise();
    }
  });

  /* — Backup: if `timeupdate` somehow misses the threshold, the
       `ended` event will catch it. Also ensures the video stays
       paused on the final decoded frame — browsers do this by
       default after `ended`, but we pin it explicitly. — */
  video.addEventListener('ended', () => {
    try { video.pause(); } catch (_) {}
    if (!revealed) crystallise();
  });

  /* — Skip button: cut INSTANTLY to the final state.
       No animation — just jump the video to its last frame and snap
       every UI element into the revealed/unlocked configuration. — */
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      if (unlocked) return;

      // Mark state up front so any in-flight watchers no-op.
      revealed = true;
      unlocked = true;

      // Cancel any GSAP tweens that might be running on these targets.
      if (gsap) gsap.killTweensOf([brand, cue, skipBtn, ...nameChars].filter(Boolean));

      // Park the video on its very last frame, paused.
      try {
        if (isFinite(video.duration)) video.currentTime = video.duration;
        video.pause();
      } catch (_) {}

      // Snap the brand to its final state — no transition.
      if (brand) {
        brand.style.transition = 'none';
        brand.style.opacity = '1';
        brand.style.filter = 'blur(0px)';
      }

      // Snap MAYA'S HOMES chars to fully assembled + locked state.
      nameChars.forEach((c) => {
        c.style.transition = 'none';
        c.style.transform = 'translateY(0)';
        c.style.opacity = '1';
        c.style.color = '#000';
        c.style.webkitTextStrokeColor = 'transparent';
      });
      if (nameEl) nameEl.classList.add('is-locked');

      // Snap the nav (logo) into view.
      const navEl = document.querySelector('[data-nav]');
      if (navEl) navEl.classList.add('is-visible');

      // Snap the cue in.
      if (cue) {
        cue.style.transition = 'none';
        cue.style.opacity = '1';
      }

      // Hide the skip button itself.
      skipBtn.setAttribute('hidden', '');

      // Unlock scroll & broadcast.
      root.classList.remove('is-intro');
      window.dispatchEvent(new CustomEvent('intro:end'));
    });
  }

  /* — Failsafe: if for some reason `timeupdate` never fires (rare),
       force the reveal after 15s so the user is never trapped. — */
  setTimeout(() => {
    if (!revealed) {
      console.warn('[intro] failsafe reveal fired (timeupdate never crossed threshold).');
      crystallise();
    }
  }, 15000);
}
