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

   Auto-skip:
     - If sessionStorage.mh_intro_seen === '1' (the user has already
       seen the intro in this tab/session), or
     - If the URL carries a hash anchor (deep-link to a section),
     the intro is bypassed instantly: the page snaps into the unlocked,
     post-intro state on load. New tabs / new browser windows get a
     fresh sessionStorage and so see the intro again on first visit.
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

/* — Auto-skip conditions —
   1. The user has already seen the intro in this browser session.
   2. The URL has a hash anchor (deep-link navigation — the user is
      jumping to a section and doesn't need the cinematic from the top).
   In either case, snap to the post-intro state immediately rather than
   making the user sit through ~8s of video again. */
let introAlreadySeenThisSession = false;
try {
  introAlreadySeenThisSession = sessionStorage.getItem('mh_intro_seen') === '1';
} catch (_) {}
const hasHashAnchor =
  window.location.hash && window.location.hash.length > 1;
const shouldAutoSkip = introAlreadySeenThisSession || hasHashAnchor;

if (!introEl || !video) {
  // No intro markup — nothing to do.
} else {
  /* — Lock the page scroll. — */
  root.classList.add('is-intro');

  if (shouldAutoSkip) {
    /* Snap into the unlocked state: park the video on its last frame,
       reveal the brand without animation, unlock scroll, and dispatch
       intro:end so the rest of the app (nav etc.) responds normally.
       Mirrors what the skip button does, but happens before anything
       has had a chance to play. */
    if (gsap) gsap.killTweensOf([brand, cue, skipBtn].filter(Boolean));

    /* Park the video on its final frame, paused. */
    const parkVideo = () => {
      try {
        if (isFinite(video.duration)) video.currentTime = video.duration;
        video.pause();
      } catch (_) {}
    };
    if (video.readyState >= 1) parkVideo();
    else video.addEventListener('loadedmetadata', parkVideo, { once: true });

    /* Snap brand to revealed state, no animation. */
    if (brand) {
      brand.style.transition = 'none';
      brand.style.opacity = '1';
      brand.style.filter = 'blur(0px)';
    }

    /* Show the floating nav. */
    const navEl = document.querySelector('[data-nav]');
    if (navEl) navEl.classList.add('is-visible');

    /* Show the cue UNLESS we're deep-linking to a section — the cue
       implies "scroll to explore" which doesn't apply if the user is
       already past the hero. */
    if (cue) {
      cue.style.transition = 'none';
      cue.style.opacity = hasHashAnchor ? '0' : '1';
    }

    /* Hide the skip button — irrelevant in auto-skip mode. */
    if (skipBtn) skipBtn.setAttribute('hidden', '');

    /* Unlock scroll & broadcast. */
    root.classList.remove('is-intro');
    window.dispatchEvent(new CustomEvent('intro:end'));
  } else {
    /* — Genuine first visit: tell the rest of the app the intro is starting. — */
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
      /* Mark this session as having seen the intro — refresh won't
         replay it. New tabs get a fresh session and will see it again. */
      try { sessionStorage.setItem('mh_intro_seen', '1'); } catch (_) {}
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

        // Mark the session — refresh after skip shouldn't replay either.
        try { sessionStorage.setItem('mh_intro_seen', '1'); } catch (_) {}

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
}
