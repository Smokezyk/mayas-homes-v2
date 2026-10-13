// =====================================================================
// Homepage "Six homes Maja wants to show you" — carousel.
//
// Default mode (homepage): mobile-only carousel. Below 768px, all
// .tile elements are hidden except .is-active; prev/next buttons
// cycle through the six transformations. Desktop keeps the original
// 2×3 grid layout untouched.
//
// Solo mode (profile / studio page, opted in via
// data-transformations-carousel="solo"): one-tile-at-a-time on ALL
// viewports. Click on the tile plays the morph reveal exactly like
// the homepage; the arrows navigate between slides. When navigating
// away from a slide we reset its video to frame 0 and drop any
// reveal/playing state so the next visit starts from "before".
// =====================================================================
(function () {
  const carousel = document.querySelector('[data-transformations-carousel]');
  if (!carousel) return;

  const tiles = Array.from(carousel.querySelectorAll('.tile'));
  const prev = document.querySelector('[data-transformations-prev]');
  const next = document.querySelector('[data-transformations-next]');
  const currentLabel = document.querySelector('[data-transformations-current]');
  const totalLabel = document.querySelector('[data-transformations-total]');
  const isSolo = carousel.getAttribute('data-transformations-carousel') === 'solo';

  if (tiles.length === 0 || !prev || !next) return;

  let activeIndex = tiles.findIndex((t) => t.classList.contains('is-active'));
  if (activeIndex < 0) {
    activeIndex = 0;
    tiles[0].classList.add('is-active');
  }

  if (totalLabel) totalLabel.textContent = String(tiles.length);

  const setActive = (newIndex) => {
    const target = ((newIndex % tiles.length) + tiles.length) % tiles.length;
    if (target === activeIndex) return;
    const outgoing = tiles[activeIndex];
    outgoing.classList.remove('is-active');
    const outgoingVideo = outgoing.querySelector('[data-tile-video]');
    // Hidden mobile slides should not keep playing. Keep the homepage's
    // current frame and reveal state; only solo mode resets the sequence.
    if (isSolo || (document.body.classList.contains('atelier-refined') && window.matchMedia('(max-width: 767px)').matches)) {
      try { outgoingVideo?.pause(); } catch (_) {}
    }
    // In solo mode, also drop any reveal/playing state and reset the
    // outgoing video to frame 0 so the next visit starts from "before".
    if (isSolo) {
      outgoing.classList.remove('is-playing', 'is-revealed');
      if (outgoingVideo) {
        try { outgoingVideo.currentTime = 0; } catch (_) {}
      }
    }
    tiles[target].classList.add('is-active');
    activeIndex = target;
    if (currentLabel) currentLabel.textContent = String(activeIndex + 1);
  };

  prev.addEventListener('click', () => setActive(activeIndex - 1));
  next.addEventListener('click', () => setActive(activeIndex + 1));
})();

// Homepage playback controls. These tiles opt out of the legacy click-to-reveal
// handler in main.js; every photo retains its source, crop and full sequence.
(function () {
  const tiles = Array.from(document.querySelectorAll('[data-transformations-controls]'));
  if (!tiles.length) return;
  const pt = document.documentElement.lang.startsWith('pt');
  const labels = pt
    ? { idle: 'Ver transformação', loading: 'A carregar…', playing: 'Pausar', paused: 'Continuar', ended: 'Repetir', error: 'Tentar novamente' }
    : { idle: 'Play transformation', loading: 'Loading…', playing: 'Pause', paused: 'Resume', ended: 'Replay', error: 'Try again' };
  const loadingAction = pt ? 'Cancelar carregamento' : 'Cancel loading';
  const players = [];
  tiles.forEach((tile) => {
    const video = tile.querySelector('[data-tile-video]');
    const button = tile.querySelector('.tile__link');
    const label = tile.querySelector('[data-playback-label]');
    const name = tile.querySelector('.tile__caption-title')?.textContent.trim() || '';
    if (!video || !button || !label) return;
    let state = 'idle';
    let request = 0;
    let wantsPlayback = false;
    const status = document.createElement('p');
    status.className = 'media-playback-status';
    status.setAttribute('role', 'status');
    tile.append(status);
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('webkit-playsinline', '');
    const render = (next) => {
      state = next;
      button.dataset.playbackState = next;
      label.textContent = labels[next];
      // Keep the exact visible label in the accessible name for voice control.
      const loadingHint = next === 'loading' ? `. ${loadingAction}` : '';
      button.setAttribute('aria-label', `${labels[next]} — ${name}${loadingHint}`);
      tile.classList.toggle('is-playing', next === 'playing' || next === 'loading');
      tile.classList.toggle('is-revealed', next === 'ended');
    };
    const pause = () => {
      if (!wantsPlayback && video.paused) return;
      wantsPlayback = false;
      request += 1;
      video.pause();
      if (state !== 'error') render(video.ended ? 'ended' : video.currentTime > 0 ? 'paused' : 'idle');
    };
    const fail = () => {
      wantsPlayback = false;
      request += 1;
      video.pause();
      render('error');
      status.textContent = pt
        ? 'Não foi possível reproduzir. Tente novamente ou explore o projeto abaixo.'
        : 'Playback was unavailable. Try again or explore the project below.';
    };
    button.addEventListener('click', () => {
      if (wantsPlayback) { pause(); return; }
      players.forEach((player) => { if (player.video !== video) player.pause(); });
      status.textContent = '';
      if (state === 'error') video.load();
      if (video.ended) video.currentTime = 0;
      wantsPlayback = true;
      const currentRequest = ++request;
      render('loading');
      const playResult = video.play();
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch(() => {
          if (currentRequest === request && wantsPlayback) fail();
        });
      }
    });
    video.addEventListener('playing', () => {
      if (!wantsPlayback) { video.pause(); return; }
      render('playing');
    });
    video.addEventListener('waiting', () => { if (wantsPlayback) render('loading'); });
    video.addEventListener('pause', () => {
      if (!video.ended && state !== 'error') {
        wantsPlayback = false;
        render(video.currentTime > 0 ? 'paused' : 'idle');
      }
    });
    video.addEventListener('ended', () => { wantsPlayback = false; render('ended'); });
    video.addEventListener('error', fail);
    players.push({ tile, video, pause });
    render('idle');
  });
  // Explicit playback works with reduced motion; nothing autoplays. Pause when
  // the visitor leaves a frame or the page, without rewinding their place.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) players.find((player) => player.tile === entry.target)?.pause();
      });
    }, { threshold: 0 });
    players.forEach((player) => observer.observe(player.tile));
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) players.forEach((player) => player.pause());
  });
})();
