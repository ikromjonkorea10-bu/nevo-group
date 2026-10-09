import { MAIN_PHONE, TELEGRAM_URL } from '../data/content.js';
import { icon } from '../icons.js';

export function renderMaintenanceScreen() {
  return `
    <div class="maintenance-screen-wrap">
      <div class="maintenance-bg-glow"></div>
      
      <div class="maintenance-card">
        <!-- Brand Header -->
        <div class="maintenance-brand">
          <img src="/brand/nevo-logo.webp" alt="NEVO GROUP" class="maintenance-logo" onerror="this.src='/brand/nevo-logo-sm.png';">
          <div class="maintenance-brand-name">NEVO GROUP</div>
          <div class="maintenance-brand-tag">MUVAFFAQIYATLI MUHANDISLIK TIZIMLARI</div>
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
