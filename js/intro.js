/* =========================================================
   Intro overlay — bathroom transformation video.

   Plays once per session, autoplay muted. SKIP button fades in after
   2 s (CSS transition delay, gated by .is-loaded). When the video ends
   OR the user clicks SKIP OR an 8 s safety timeout fires, the overlay
   fades out (1.2 s) and is removed from the DOM. sessionStorage flag
   ensures it doesn't replay on subsequent navigations in the same tab.
   ========================================================= */
(function () {
  const overlay = document.getElementById('introOverlay');
  const video = document.getElementById('introVideo');
  const skipButton = document.getElementById('introSkip');

  if (!overlay || !video) return;

  // Already seen this session — skip directly.
  if (sessionStorage.getItem('mayasHomesIntroSeen')) {
    overlay.classList.add('is-hidden');
    return;
  }

  // Lock body scroll while the intro plays.
  document.body.classList.add('intro-active');

  // Surface the SKIP button (its CSS transition has a 2 s delay).
  overlay.classList.add('is-loaded');

  let dismissed = false;
  function dismissIntro() {
    if (dismissed) return;
    dismissed = true;
    overlay.classList.add('is-fading');
    document.body.classList.remove('intro-active');
    try {
      sessionStorage.setItem('mayasHomesIntroSeen', 'true');
    } catch (_) {}
    setTimeout(() => {
      overlay.classList.add('is-hidden');
    }, 1200);
  }

  video.addEventListener('ended', dismissIntro);
  if (skipButton) skipButton.addEventListener('click', dismissIntro);

  // Safety net: if the video stalls or autoplay is blocked, dismiss
  // after 8 s so visitors are never stuck on a black frame.
  setTimeout(() => {
    if (!dismissed) dismissIntro();
  }, 8000);

  // Some browsers block autoplay even on muted video — surface SKIP
  // immediately if play() rejects so the visitor can dismiss manually.
  const playAttempt = video.play();
  if (playAttempt && typeof playAttempt.catch === 'function') {
    playAttempt.catch(() => {
      overlay.classList.add('is-loaded');
    });
  }
})();
