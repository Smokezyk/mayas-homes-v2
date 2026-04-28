/* =========================================================
   CINEMATIC INTRO — single stitched master video.

   Behaviour:
     1. Master video autoplays once through (no loop).
     2. Body scroll is locked until the video reaches the timestamp
        where the interior is fully revealed (REVEAL_TIME_S).
     3. At that timestamp:
          - The hero brand crystallises in (blur 10px → 0, ease-out).
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

/* The master (introvidfinal.mp4) is a single pre-stitched cinematic,
   ~8.04s long. Crystallise duration is 1.5s, so we fire it at 6.5s
   — brand is FULLY visible by the time the video freezes on the
   marble backsplash. No "coming in" effect after the video stops. */
const REVEAL_TIME_S = 6.5;

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
       The whole brand block (hook, guarantee lines, MAYA'S HOMES) fades
       in as one unit. No per-character build. — */
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
       paused on the final decoded frame. — */
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
      if (gsap) gsap.killTweensOf([brand, cue, skipBtn].filter(Boolean));

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

  /* — Failsafe: 30s rescue. — */
  setTimeout(() => {
    if (!unlocked) {
      console.warn('[intro] failsafe unlock fired.');
      if (!revealed) crystallise();
    }
  }, 30000);
}
