/* =========================================================
   CINEMATIC INTRO — gated state machine.

   First-session visit: hero shows a centred Enter / Skip pair,
   the doors-opening video is paused, the brand text is hidden.

     Click Enter → state 'playing'. Video plays through. On video
                   end, state 'revealed'. Brand text fades in.
                   sessionStorage flag is set.
     Click Skip  → state 'revealed' immediately. Video snaps to
                   its final frame so the frozen frame is the
                   hero background. sessionStorage flag is set.

   Subsequent visits in the same session (or any visit with a
   hash anchor in the URL): bypass the gate, snap straight to the
   revealed state. The frozen final frame is the hero background;
   the typography is composed on top.
   ========================================================= */

const root      = document.documentElement;
const introEl   = document.querySelector('[data-intro]');
const heroVideo = document.querySelector('[data-hero-master]');
const cue       = document.querySelector('[data-cue]');
const enterBtn  = document.querySelector('[data-intro-action="enter"]');
const skipBtn   = document.querySelector('[data-intro-action="skip"]');

let introAlreadySeen = false;
try {
  introAlreadySeen = sessionStorage.getItem('mh_intro_seen') === '1';
} catch (_) {}
const hasHashAnchor =
  window.location.hash && window.location.hash.length > 1;

if (!introEl) {
  // No intro markup — nothing to do.
} else {
  let unlocked = false;

  const setState = (state) => {
    introEl.dataset.introState = state;
  };

  /* Seek the hero video to its last decoded frame and pause. If
     metadata hasn't loaded yet, defer the seek until `loadedmetadata`
     fires — otherwise duration is NaN and the seek silently no-ops,
     leaving the user staring at frame 0 on a seen-refresh. */
  const snapVideoToEnd = () => {
    if (!heroVideo) return;
    const seek = () => {
      try {
        if (isFinite(heroVideo.duration) && heroVideo.duration > 0) {
          heroVideo.currentTime = heroVideo.duration;
        }
        heroVideo.pause();
      } catch (_) {}
    };
    /* readyState >= 1 = HAVE_METADATA. */
    if (heroVideo.readyState >= 1) {
      seek();
    } else {
      heroVideo.addEventListener('loadedmetadata', seek, { once: true });
    }
  };

  const unlockPage = () => {
    if (unlocked) return;
    unlocked = true;
    root.classList.remove('is-intro');
    window.dispatchEvent(new CustomEvent('intro:end'));

    if (cue) {
      cue.style.transition = 'opacity 0.9s ease';
      requestAnimationFrame(() => { cue.style.opacity = '1'; });
    }
  };

  const reveal = () => {
    setState('revealed');
    introEl.classList.add('intro--settled');
    try { sessionStorage.setItem('mh_intro_seen', '1'); } catch (_) {}
    unlockPage();
  };

  const playIntro = () => {
    setState('playing');
    if (heroVideo) {
      heroVideo.muted = true;
      heroVideo.playsInline = true;
      heroVideo.setAttribute('webkit-playsinline', '');
      const p = heroVideo.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});

      heroVideo.addEventListener('ended', () => {
        try { heroVideo.pause(); } catch (_) {}
        reveal();
      }, { once: true });

      /* Safety failsafe: if the video stalls and never fires `ended`,
         force-reveal after 30 s so the user is never stuck on a black
         frame. */
      setTimeout(() => { if (!unlocked) reveal(); }, 30000);
    } else {
      /* No video for some reason — reveal after a brief moment. */
      setTimeout(reveal, 600);
    }
  };

  /* — Lock page scroll for the duration of the intro. — */
  root.classList.add('is-intro');
  window.dispatchEvent(new CustomEvent('intro:start'));

  if (introAlreadySeen || hasHashAnchor) {
    /* Bypass the gate: snap straight to the revealed state.
       Hash deep-link also suppresses the 'Scroll to explore' cue. */
    snapVideoToEnd();
    if (hasHashAnchor && cue) cue.style.opacity = '0';
    reveal();
  } else {
    /* First-session visit: keep the video paused, show the gate. */
    setState('gate');
    if (heroVideo) {
      heroVideo.addEventListener('loadedmetadata', () => {
        try { heroVideo.pause(); } catch (_) {}
      }, { once: true });
      try { heroVideo.pause(); } catch (_) {}
    }
    if (enterBtn) enterBtn.addEventListener('click', playIntro, { once: true });
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        snapVideoToEnd();
        reveal();
      }, { once: true });
    }
  }
}
