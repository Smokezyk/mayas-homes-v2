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

/* The master is door-entry (5.04s) + kitchen-zoom-in (5.04s)
   stitched losslessly = 10.08s. The interior is fully revealed
   at the very end of the kitchen-zoom segment. We trigger the
   reveal a hair before the natural end for crisp timing. */
const REVEAL_TIME_S = 9.9;

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
         duration: 1.5s, ease: power2.out — */
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
       paused on the final decoded frame — browsers do this by
       default after `ended`, but we pin it explicitly. — */
  video.addEventListener('ended', () => {
    try { video.pause(); } catch (_) {}
    if (!revealed) crystallise();
  });

  /* — Skip button: jump straight to the reveal moment. — */
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      if (revealed) return;
      try { video.currentTime = REVEAL_TIME_S; } catch (_) {}
      crystallise();
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
