// VERO.uz uslubidagi brend taqdimoti va spiral animatsiyasi
// 3 ta uchburchak bo'laklari aylanib, markazga birlashadi va "nevo GROUP" so'zi ochiladi.

export function initIntroSplash() {
  if (sessionStorage.getItem('nevo_splash_done')) return;

  const splash = document.createElement('div');
  splash.id = 'nevo-intro-splash';
  splash.className = 'vero-intro-overlay';
  splash.setAttribute('aria-hidden', 'true');
  splash.innerHTML = `
    <div class="vero-intro-stage">
      <div class="vero-intro-center-group" id="vero-center-group">
        <!-- 3 Pieces of Triangle Logo -->
        <div class="vero-pieces-container" id="vero-pieces-wrap">
          <img src="/anim/nevo-piece-0.png" class="vero-piece-img" id="piece-0" alt="Nevo Piece 0">
          <img src="/anim/nevo-piece-1.png" class="vero-piece-img" id="piece-1" alt="Nevo Piece 1">
          <img src="/anim/nevo-piece-2.png" class="vero-piece-img" id="piece-2" alt="Nevo Piece 2">
        </div>
        <!-- Wordmark nevo GROUP -->
        <div class="vero-wordmark-wrap" id="vero-wordmark-wrap">
          <img src="/anim/nevo-word.svg" class="vero-wordmark-img" alt="nevo GROUP">
        </div>
      </div>
      <div class="vero-intro-progress-bar">
        <div class="vero-intro-progress-fill" id="vero-progress-fill"></div>
      </div>
    </div>
  `;

  document.body.appendChild(splash);
  document.body.style.overflow = 'hidden';

  const piecesConfig = [
    { el: splash.querySelector('#piece-0'), a0: 2.8, r0: 360, sweep: -2.4, delay: 0, rot0: -110 },
    { el: splash.querySelector('#piece-1'), a0: -1.4, r0: 420, sweep: 2.1, delay: 0.12, rot0: 90 },
    { el: splash.querySelector('#piece-2'), a0: 0.7, r0: 380, sweep: -2.8, delay: 0.24, rot0: 140 }
  ];

  const wordmarkWrap = splash.querySelector('#vero-wordmark-wrap');
  const progressFill = splash.querySelector('#vero-progress-fill');
  const startTime = performance.now();
  const totalDuration = 2400; // ms

  function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }

  function clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
  }

  let animId;

  function render(now) {
    const elapsed = (now - startTime) / 1000;
    const progress = clamp(elapsed / 2.0, 0, 1);

    if (progressFill) {
      progressFill.style.width = `${progress * 100}%`;
    }

    // Animate 3 pieces along spiral trajectory
    piecesConfig.forEach(p => {
      const raw = clamp((elapsed - p.delay) / 1.05, 0, 1);
      const eased = easeOutCubic(raw);
      const angle = p.a0 + p.sweep * eased;
      const radius = p.r0 * (1 - eased);
      const dx = Math.cos(angle) * radius;
      const dy = Math.sin(angle) * radius;
      const rot = p.rot0 * (1 - eased);
      const opacity = clamp(raw * 3, 0, 1);

      if (p.el) {
        p.el.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) rotate(${rot.toFixed(2)}deg)`;
        p.el.style.opacity = opacity.toFixed(3);
      }
    });

    // Reveal wordmark after pieces assemble (around elapsed >= 0.9s)
    if (elapsed >= 0.85 && wordmarkWrap && !wordmarkWrap.classList.contains('revealed')) {
      wordmarkWrap.classList.add('revealed');
    }

    if (elapsed < 2.3) {
      animId = requestAnimationFrame(render);
    } else {
      finishSplash();
    }
  }

  function finishSplash() {
    splash.classList.add('fade-out');
    sessionStorage.setItem('nevo_splash_done', '1');
    setTimeout(() => {
      document.body.style.overflow = '';
      splash.remove();
    }, 450);
  }

  // Fallback skip on click or key
  splash.addEventListener('click', () => {
    cancelAnimationFrame(animId);
    finishSplash();
  });

  animId = requestAnimationFrame(render);
}
