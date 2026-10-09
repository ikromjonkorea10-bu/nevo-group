// NEVO GROUP — Rasmiy Brend Taqdmoti va Kirish Animatsiyasi
// NEVO ning haqiqiy oltin medalyon emblemasi bilan hashamatli 3D ochilish

export function initIntroSplash() {
  if (sessionStorage.getItem('nevo_splash_done')) return;

  const splash = document.createElement('div');
  splash.id = 'nevo-intro-splash';
  splash.className = 'nevo-intro-overlay';
  splash.setAttribute('aria-hidden', 'true');
  splash.innerHTML = `
    <div class="nevo-intro-ambient-glow"></div>
    <div class="nevo-intro-stage">
      <!-- Gold Rotating Orbit Rings -->
      <div class="nevo-orbit-ring ring-outer"></div>
      <div class="nevo-orbit-ring ring-inner"></div>

      <!-- Real Official NEVO Emblem -->
      <div class="nevo-emblem-wrap" id="nevo-emblem-box">
        <img src="/brand/nevo-logo.png" alt="NEVO GROUP" class="nevo-emblem-img" id="nevo-emblem-img">
        <span class="nevo-emblem-shine"></span>
      </div>

      <!-- Brand Typography -->
      <div class="nevo-intro-typography" id="nevo-intro-text">
        <div class="nevo-intro-brand-title">NEVO GROUP</div>
        <div class="nevo-intro-brand-sub">MUVAFFAQIYATLI MUHANDISLIK TIZIMLARI</div>
      </div>

      <!-- Progress Fill Line -->
      <div class="nevo-intro-progress-bar">
        <div class="nevo-intro-progress-fill" id="nevo-progress-fill"></div>
      </div>
    </div>
  `;

  document.body.appendChild(splash);
  document.body.style.overflow = 'hidden';

  const emblemBox = splash.querySelector('#nevo-emblem-box');
  const introText = splash.querySelector('#nevo-intro-text');
  const progressFill = splash.querySelector('#nevo-progress-fill');
  const startTime = performance.now();

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

    // Zoom & reveal emblem with shine
    if (emblemBox) {
      if (elapsed < 0.6) {
        const t = elapsed / 0.6;
        emblemBox.style.transform = `scale(${(0.8 + 0.2 * t).toFixed(3)})`;
        emblemBox.style.opacity = t.toFixed(2);
      } else {
        emblemBox.style.transform = `scale(1)`;
        emblemBox.style.opacity = '1';
      }
    }

    // Reveal text
    if (elapsed >= 0.7 && introText && !introText.classList.contains('revealed')) {
      introText.classList.add('revealed');
    }

    if (elapsed < 2.2) {
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

  splash.addEventListener('click', () => {
    cancelAnimationFrame(animId);
    finishSplash();
  });

  animId = requestAnimationFrame(render);
}
