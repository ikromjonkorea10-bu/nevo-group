// VERO.uz uslubidagi kirish animatsiyasi (Intro Splash & Slide Show)
// Sayt ochilganda brend taqdimoti va slayd ko'rinishida silliq ochiladi.

import { t } from '../lib/i18n.js';

export function initIntroSplash() {
  // Har bir sessiyada faqat birinchi marta (sahifa yangilanganda ham ko'rinadi)
  if (sessionStorage.getItem('nevo_splash_done')) return;

  const splash = document.createElement('div');
  splash.id = 'nevo-intro-splash';
  splash.className = 'intro-splash-overlay';
  splash.setAttribute('aria-hidden', 'true');
  splash.innerHTML = `
    <div class="intro-splash-bg-glow"></div>
    <div class="intro-splash-container">
      <div class="intro-splash-logo-wrap">
        <img src="/brand/nevo-logo.webp" alt="NEVO GROUP" class="intro-splash-logo" onerror="this.src='/brand/nevo-logo-sm.png';" />
      </div>
      <div class="intro-splash-brand">NEVO GROUP</div>
      <div class="intro-splash-tag">${t('splashSubtitle')}</div>
      <div class="intro-splash-slider">
        <div class="intro-slide active" id="splash-slide-text">
          <span class="slide-num">01</span> ${t('splashSlide1')}
        </div>
      </div>
      <div class="intro-splash-bar-wrap">
        <div class="intro-splash-bar" id="splash-progress-bar"></div>
      </div>
    </div>
  `;

  document.body.appendChild(splash);

  const slides = [
    { num: '01', text: t('splashSlide1') },
    { num: '02', text: t('splashSlide2') },
    { num: '03', text: t('splashSlide3') },
  ];

  let current = 0;
  const slideTextEl = document.getElementById('splash-slide-text');
  const slideInterval = setInterval(() => {
    current++;
    if (current < slides.length && slideTextEl) {
      slideTextEl.style.opacity = '0';
      slideTextEl.style.transform = 'translateY(6px)';
      setTimeout(() => {
        if (!slideTextEl) return;
        slideTextEl.innerHTML = `<span class="slide-num">${slides[current].num}</span> ${slides[current].text}`;
        slideTextEl.style.opacity = '1';
        slideTextEl.style.transform = 'translateY(0)';
      }, 140);
    }
  }, 440);

  setTimeout(() => {
    clearInterval(slideInterval);
    splash.classList.add('fade-out');
    sessionStorage.setItem('nevo_splash_done', '1');
    setTimeout(() => {
      splash.remove();
    }, 450);
  }, 1600);
}
