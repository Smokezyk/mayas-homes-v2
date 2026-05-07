/* Hero "MAYA'S HOMES" → floating-nav wordmark slow FLIP morph.
   Home page only — early returns when no [data-wordmark-source]
   exists. Plugin globals (gsap, ScrollTrigger, Flip) come from
   <script> tags loaded above this file. */
(function () {
  if (
    typeof gsap === 'undefined' ||
    typeof ScrollTrigger === 'undefined' ||
    typeof Flip === 'undefined'
  ) {
    console.warn('[wordmark-flip] gsap/ScrollTrigger/Flip not available — animation skipped');
    return;
  }
  gsap.registerPlugin(ScrollTrigger, Flip);

  const source = document.querySelector('[data-wordmark-source]');
  const target = document.querySelector('[data-wordmark-target]');
  const intro = document.querySelector('.intro');
  if (!source || !target || !intro) return;

  // Nav wordmark stays invisible until the FLIP hands off to it.
  target.style.opacity = '0';
  let flipped = false;

  function flipToNav() {
    if (flipped) return;
    flipped = true;

    const state = Flip.getState(source);
    const tRect = target.getBoundingClientRect();
    const tStyle = getComputedStyle(target);

    gsap.set(source, {
      position: 'fixed',
      top: tRect.top,
      left: tRect.left,
      width: tRect.width,
      height: tRect.height,
      fontSize: tStyle.fontSize,
      letterSpacing: tStyle.letterSpacing,
      lineHeight: tStyle.lineHeight,
      color: tStyle.color,
      zIndex: 70,
      margin: 0,
      transform: 'none'
    });

    Flip.from(state, {
      duration: 1.4,
      ease: 'power2.inOut',
      absolute: true,
      onComplete: () => {
        target.style.opacity = '1';
        source.style.visibility = 'hidden';
      }
    });
  }

  function flipBackToHero() {
    if (!flipped) return;
    flipped = false;
    target.style.opacity = '0';
    source.style.visibility = '';
    gsap.set(source, { clearProps: 'all' });
  }

  ScrollTrigger.create({
    trigger: intro,
    start: 'bottom 60%',
    onEnter: flipToNav,
    onLeaveBack: flipBackToHero
  });
})();
