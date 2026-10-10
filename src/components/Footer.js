import { icon } from '../icons.js';
import { getCatalog } from '../lib/catalog.js';
import { esc } from '../lib/format.js';
import { CONTACTS, INSTAGRAM_URL, TELEGRAM_URL } from '../data/content.js';
import { t } from '../lib/i18n.js';

export function renderFooter() {
  const { categories } = getCatalog();
  return `
    <footer class="main-footer">
      <div class="shell">
        <div class="footer-top-grid">
          <div class="footer-brand">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
              <img src="/brand/nevo-logo.webp" alt="NEVO GROUP" width="36" height="36" style="height: 36px; width: auto;" onerror="this.src='/brand/nevo-logo-sm.png';">
              <h4 style="margin: 0; font-size: 20px; font-weight: 800;">NEVO GROUP</h4>
            </div>
            <p>${t('brandSub')}</p>
            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 14px; color: var(--muted);">
              <div style="display: flex; align-items: center; gap: 8px;">
                ${icon('map-pin', '', 16)}
                <span>${t('deliveryTop')}</span>
              </div>
              ${CONTACTS.phones.map((p) => `
                <a href="tel:${p.tel}" style="display: flex; align-items: center; gap: 8px; color: inherit;">
                  ${icon('phone', '', 16)}
                  <span>${p.label}</span>
                </a>
              `).join('')}
              <a href="${INSTAGRAM_URL}" target="_blank" rel="noopener" style="display: flex; align-items: center; gap: 8px; color: inherit;">
                ${icon('instagram', '', 16)}
                <span>@${CONTACTS.instagram}</span>
              </a>
              ${TELEGRAM_URL ? `
                <a href="${TELEGRAM_URL}" target="_blank" rel="noopener" style="display: flex; align-items: center; gap: 8px; color: inherit;">
                  ${icon('message-circle', '', 16)}
                  <span>@${CONTACTS.telegram}</span>
                </a>
              ` : ''}
            </div>
          </div>

          <div class="footer-col">
            <h5>${t('catalogBtn')}</h5>
            <ul class="footer-links-list">
              ${categories.length ? categories.map(c => `
                <li><a href="/katalog/${esc(c.slug)}">${esc(c.name)}</a></li>
              `).join('') : `<li><a href="/katalog">${t('fullCatalog')}</a></li>`}
            </ul>
          </div>

          <div class="footer-col">
            <h5>${t('quickOverview')}</h5>
            <ul class="footer-links-list">
              <li><a href="/katalog">${t('fullCatalog')}</a></li>
              <li><a href="/tanlash">${t('findForMe')}</a></li>
              <li><a href="/katta-buyurtma">${t('bulkOrderMenu')}</a></li>
              <li><a href="/savat">${t('navCart')}</a></li>
              <li><a href="/aloqa">${t('howToOrder')}</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h5>${t('contactUs')}</h5>
            <p style="font-size: 14px; color: var(--muted); margin-bottom: 16px; line-height: 1.5;">
              ${t('heroConsultSub')}
            </p>
            <a href="/aloqa" class="btn-primary" style="width: 100%; justify-content: center;">
              ${t('contactUs')}
            </a>
          </div>
        </div>

        <div class="footer-disclaimer-box">
          <p>${t('footerDisclaimer')}</p>
          <p>© 2026 NEVO GROUP. ${t('allRightsReserved')}</p>
        </div>
      </div>
    </footer>
  `;
}
