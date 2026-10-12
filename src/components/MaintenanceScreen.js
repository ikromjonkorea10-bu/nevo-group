import { MAIN_PHONE, TELEGRAM_URL } from '../data/content.js';
import { icon } from '../icons.js';

export function renderMaintenanceScreen() {
  return `
    <div class="maintenance-screen-wrap">
      <!-- Full Commercial Video Background -->
      <div class="maintenance-video-layer" aria-hidden="true">
        <video
          class="maintenance-video-el"
          id="maintenance-bg-video"
          autoplay
          muted
          loop
          playsinline
          webkit-playsinline
          x5-playsinline
          poster="/videos/home-hero-poster.webp"
          preload="auto"
        >
          <source src="/videos/home-hero.mp4" type="video/mp4" />
          <source src="/videos/home-hero-720.mp4" type="video/mp4" media="(max-width: 768px)" />
          <source src="/videos/home-hero.webm" type="video/webm" />
        </video>
        <div class="maintenance-video-overlay"></div>
      </div>

      <div class="maintenance-bg-glow"></div>

      <button type="button" class="maintenance-sound-btn" id="maintenance-sound-btn" aria-label="Ovozni yoqish / o'chirish">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path class="snd-waves" d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/><path class="snd-mute" d="m17 9 5 6m0-6-5 6"/></svg>
        <span class="maintenance-sound-label">Ovoz</span>
      </button>
      
      <div class="maintenance-card">
        <!-- Brand Header -->
        <div class="maintenance-brand">
          <img src="/brand/nevo-logo.webp" alt="NEVO GROUP" class="maintenance-logo" onerror="this.src='/brand/nevo-logo-sm.png';">
          <div class="maintenance-brand-name">NEVO GROUP</div>
          <div class="maintenance-brand-tag">SANTEXNIKA VA QURILISH MOLLARI</div>
        </div>

        <!-- Status Indicator -->
        <div class="maintenance-status-badge">
          <span class="maintenance-pulse-dot"></span>
          <span>Rejaviy texnik profilaktika va modernizatsiya</span>
        </div>

        <h1 class="maintenance-title">Veb-platformamiz yangilanmoqda</h1>

        <p class="maintenance-desc">
          Hurmatli mijozlar va hamkorlar! NEVO GROUP rasmiy axborot va savdo tizimida keng qamrovli modernizatsiya hamda assortimentni yangilash ishlari olib borilmoqda. Tez orada yangilangan qulayliklar va yangi mahsulotlar bilan xizmatingizda bo'lamiz.
        </p>

        <!-- Direct Contacts during maintenance -->
        <div class="maintenance-contacts">
          <div class="maintenance-contact-item">
            <span class="maintenance-contact-label">Tezkor aloqa va buyurtmalar:</span>
            <a href="tel:${MAIN_PHONE.tel}" class="maintenance-contact-btn phone-btn">
              ${icon('phone', '', 18)}
              <span>${MAIN_PHONE.label}</span>
            </a>
          </div>

          ${TELEGRAM_URL ? `
            <div class="maintenance-contact-item">
              <span class="maintenance-contact-label">Telegram orqali so'rov yuborish:</span>
              <a href="${TELEGRAM_URL}" target="_blank" rel="noopener" class="maintenance-contact-btn tg-btn">
                ${icon('message-circle', '', 18)}
                <span>@Nevo_Group</span>
              </a>
            </div>
          ` : ''}
        </div>

        <!-- Office address info -->
        <div class="maintenance-info-footer">
          <div class="maintenance-info-row">
            ${icon('map-pin', '', 16)}
            <span>Toshkent shahri, Chilonzor tumani · Markaziy savdo ombori ish rejimida</span>
          </div>
          <div class="maintenance-info-row">
            ${icon('clock', '', 16)}
            <span>Ish vaqti: Dushanba — Shanba, 09:00 — 18:00</span>
          </div>
        </div>

        <!-- Discreet Admin / Client Access Toggle -->
        <div class="maintenance-secret-access">
          <button type="button" class="maintenance-secret-link" onclick="window.__promptMaintenanceUnlock()" aria-label="Administrator kirishi">
            🔒
          </button>
        </div>
      </div>
    </div>
  `;
}

export function initMaintenanceUnlock() {
  const vid = document.getElementById('maintenance-bg-video');
  const snd = document.getElementById('maintenance-sound-btn');

  if (vid) {
    vid.muted = true;
    const play = () => {
      vid.play().catch(() => {});
    };
    play();
    document.addEventListener('click', play, { once: true });
    document.addEventListener('touchstart', play, { once: true });

    if (snd) {
      snd.addEventListener('click', () => {
        vid.muted = !vid.muted;
        const on = !vid.muted;
        snd.classList.toggle('is-on', on);
        snd.setAttribute('aria-pressed', String(on));
        const lbl = snd.querySelector('.maintenance-sound-label');
        if (lbl) lbl.textContent = on ? "Ovozni o'chirish" : 'Ovoz';
        if (on) vid.play().catch(() => {});
      });
    }
  }

  window.__promptMaintenanceUnlock = () => {
    const key = window.prompt("Kirish paroli yoki kalit so'zni kiriting:");
    if (key === 'nevo' || key === 'nevo2026' || key === '1234' || key === 'admin') {
      localStorage.setItem('nevo_admin_preview', '1');
      window.location.reload();
    } else if (key !== null) {
      alert("Parol noto'g'ri!");
    }
  };
}
