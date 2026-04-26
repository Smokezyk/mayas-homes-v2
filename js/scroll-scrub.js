/* =========================================================
   CINEMATIC INTRO — two-stage handover state machine.

   Stages:
     1. Video 1 (door-entry) plays, autoplaying on load.
     2. ~0.1s before V1 ends, V1 is hidden and V2 (kitchen-zoom-in)
        starts playing from frame 0.
     3. V2 plays through; we poll currentTime per animation frame
        and freeze the moment we hit the actual last frame.
     4. Crystallise the brand in (blur 5px → 0 + opacity 0 → 1, power2.inOut).
     5. Reveal the "Scroll to Explore" cue, unlock the page scroll.
   ========================================================= */

const { gsap } = window;

const root         = document.documentElement;
const introEl      = document.querySelector('[data-intro]');
const v1           = document.querySelector('[data-intro-1]');
const v2           = document.querySelector('[data-intro-2]');
const brand        = document.querySelector('[data-brand]');
const cue          = document.querySelector('[data-cue]');
const skipBtn      = document.querySelector('[data-intro-skip]');

const FALLBACK_SRC   = 'assets/videos/hero-transformation.mp4';
const CUT_OFFSET_S   = 0.10;     // hide V1 this far before its natural end
const END_TOLERANCE  = 0.04;     // V2 considered "ended" this close to duration
const STALL_FRAMES   = 180;      // ~3s at 60fps with no currentTime progress

if (!introEl || !v1 || !v2) {
  // No intro markup — nothing to do.
} else {
  /* — 0. Lock the page scroll & tell the rest of the app. — */
  root.classList.add('is-intro');
  window.dispatchEvent(new CustomEvent('intro:start'));

  /* — Graceful fallback if either source 404s. — */
  const installFallback = (video, label) => {
    let fallbackTried = false;
    video.addEventListener('error', () => {
      if (!fallbackTried && !video.src.endsWith('hero-transformation.mp4')) {
        fallbackTried = true;
        console.warn(`[intro] ${label} missing, using fallback.`);
        video.src = FALLBACK_SRC;
        video.load();
        if (video === v1) v1.play().catch(() => {});
      }
    });
  };
  installFallback(v1, 'door-entry.mp4');
  installFallback(v2, 'kitchen-zoom-in.mp4');

  /* — Hard-set playback flags. — */
  [v1, v2].forEach((v) => {
    v.muted = true;
    v.playsInline = true;
    v.setAttribute('webkit-playsinline', '');
    if ('preservesPitch' in v) v.preservesPitch = false;
  });

  /* — 1. Make sure V1 actually starts. — */
  const startV1 = () => {
    const p = v1.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  };
  if (v1.readyState >= 2) startV1();
  else v1.addEventListener('loadeddata', startV1, { once: true });
  window.addEventListener('pointerdown', startV1, { once: true });

  /* — 2. Pre-decode V2's first frame. — */
  const prewarmV2 = () => {
    try { v2.currentTime = 0; } catch (_) {}
  };
  if (v2.readyState >= 1) prewarmV2();
  else v2.addEventListener('loadedmetadata', prewarmV2, { once: true });

  /* — 3. THE BAM. Hide V1 + start V2 from frame 0. — */
  let handed = false;
  let frozen = false;
  let unlocked = false;

  const performHandover = () => {
    if (handed) return;
    handed = true;

    // Hide V1 — V2 is the only visible layer from this moment on.
    v1.classList.add('is-out');

    // Anchor V2 to its actual frame 0, then start playback.
    try { v2.currentTime = 0; } catch (_) {}
    const p = v2.play();
    if (p && typeof p.then === 'function') {
      p.then(startV2Watch).catch(() => {
        console.warn('[intro] V2 autoplay blocked. Freezing on first frame.');
        freezeAndReveal({ force: true });
      });
    } else {
      startV2Watch();
    }
  };

  /* — 4. Watch V2 frame-by-frame. The freeze fires only when V2 has
         actually reached its true last frame (or stalled hard). — */
  let lastT = -1;
  let stallCount = 0;
  let watching = false;
  const startV2Watch = () => {
    if (watching) return;
    watching = true;
    lastT = -1;
    stallCount = 0;
    requestAnimationFrame(tickV2);
  };
  const tickV2 = () => {
    if (frozen) return;

    if (v2.duration > 0 && v2.currentTime >= v2.duration - END_TOLERANCE) {
      // V2 has played through to (or past) its last frame.
      freezeAndReveal();
      return;
    }

    // Stall guard — if currentTime hasn't moved in ~3s, force freeze.
    if (v2.currentTime === lastT) {
      stallCount++;
      if (stallCount > STALL_FRAMES) {
        console.warn('[intro] V2 stalled at', v2.currentTime, '/', v2.duration);
        freezeAndReveal({ force: true });
        return;
      }
    } else {
      stallCount = 0;
      lastT = v2.currentTime;
    }

    requestAnimationFrame(tickV2);
  };

  /* — 5. Schedule the cut a hair before V1's natural end. — */
  const scheduleCut = () => {
    if (!isFinite(v1.duration)) return;
    const ms = Math.max(0, (v1.duration - CUT_OFFSET_S) * 1000);
    setTimeout(performHandover, ms);
  };
  if (v1.readyState >= 1) scheduleCut();
  else v1.addEventListener('loadedmetadata', scheduleCut, { once: true });

  // Belt-and-braces: V1 ended also triggers handover.
  v1.addEventListener('ended', performHandover);

  /* — 6. Freeze V2 on its true last frame, reveal the brand. — */
  const freezeAndReveal = ({ force = false } = {}) => {
    if (frozen) return;
    // Refuse to freeze before V2 has meaningfully played, unless forced.
    if (!force && v2.duration > 0.5 && v2.currentTime < v2.duration / 2) {
      console.warn('[intro] freeze guarded — V2 only at', v2.currentTime.toFixed(2), '/', v2.duration.toFixed(2));
      return;
    }
    frozen = true;
    try { v2.pause(); } catch (_) {}

    // Logo UI transition: as the brand crystallises, the nav (logo)
    // soft-fades into the top-left, anchoring the navigation bar.
    const navEl = document.querySelector('[data-nav]');
    if (navEl) {
      // Fire on the next frame so the brand fade and the nav fade
      // start in the same composite — feels like one continuous reveal.
      requestAnimationFrame(() => navEl.classList.add('is-visible'));
    }

    if (gsap && brand) {
      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
      tl.fromTo(brand,
          { opacity: 0, filter: 'blur(5px)' },
          { opacity: 1, filter: 'blur(0px)', duration: 1.5 })
        .add(unlockPage, '+=0.45');
    } else {
      if (brand) {
        brand.style.transition = 'opacity 1.2s ease, filter 1.2s ease';
        brand.style.opacity = '1';
        brand.style.filter = 'blur(0px)';
      }
      setTimeout(unlockPage, 1500);
    }
  };

  /* — 7. Unlock scroll, fade the cue, hide the skip button. — */
  const unlockPage = () => {
    if (unlocked) return;
    unlocked = true;
    root.classList.remove('is-intro');
    window.dispatchEvent(new CustomEvent('intro:end'));

    if (skipBtn) {
      if (gsap) gsap.to(skipBtn, { opacity: 0, duration: 0.4, onComplete: () => skipBtn.setAttribute('hidden', '') });
      else skipBtn.setAttribute('hidden', '');
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

  /* — Skip button: jump straight to V2's true last frame + reveal.
       Critical: WAIT for the seek to complete (`seeked` event) before
       hiding V1, so the visible result is V2's actual last frame —
       not whatever frame V2 was paused on, and not V1's last frame. — */
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      if (frozen || handed) return;
      handed = true;

      const targetT = (isFinite(v2.duration) && v2.duration > 0.1)
        ? v2.duration - 0.05    // a hair shy of true end (avoids snap-back)
        : 0;

      let proceeded = false;
      const proceed = () => {
        if (proceeded) return;
        proceeded = true;
        v1.classList.add('is-out');     // V1 disappears AFTER V2 has its last frame
        try { v2.pause(); } catch (_) {}
        freezeAndReveal({ force: true });
      };

      // If V2 is already at (or essentially at) the target, just proceed.
      if (Math.abs(v2.currentTime - targetT) < 0.02) {
        proceed();
      } else {
        v2.addEventListener('seeked', proceed, { once: true });
        try { v2.currentTime = targetT; } catch (_) { proceed(); }
        // Failsafe: if `seeked` never fires (rare), proceed anyway.
        setTimeout(proceed, 500);
      }
    });
  }

  /* — Failsafe: 30s rescue. — */
  setTimeout(() => {
    if (!unlocked) {
      console.warn('[intro] failsafe unlock fired.');
      if (!frozen) freezeAndReveal({ force: true });
      else unlockPage();
    }
  }, 30000);
}
