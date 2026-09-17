import { icon } from '../icons.js';
import { getCatalog } from '../lib/catalog.js';
import { esc } from '../lib/format.js';

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
            <p>Santexnika va qurilish mahsulotlari. 10 000+ mahsulot.</p>
            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 14px; color: var(--muted);">
              <div style="display: flex; align-items: center; gap: 8px;">
                ${icon('map-pin', '', 16)}
                <span>O'zbekiston bo'ylab yetkazib berish</span>
              </div>
              <a href="tel:+998952601100" style="display: flex; align-items: center; gap: 8px; color: inherit;">
                ${icon('phone', '', 16)}
                <span>+998 95 260 11 00</span>
              </a>
              <a href="tel:+998998631100" style="display: flex; align-items: center; gap: 8px; color: inherit;">
                ${icon('phone', '', 16)}
                <span>+998 99 863 11 00</span>
              </a>
              <a href="https://instagram.com/nevo_group_uzbekistan" target="_blank" rel="noopener" style="display: flex; align-items: center; gap: 8px; color: inherit;">
                ${icon('instagram', '', 16)}
                <span>@nevo_group_uzbekistan</span>
              </a>
            </div>
          </div>

          <div class="footer-col">
            <h5>Bo'limlar</h5>
            <ul class="footer-links-list">
              ${categories.length ? categories.map(c => `
                <li><a href="#bolim/${esc(c.slug)}">${esc(c.name)}</a></li>
              `).join('') : `<li><a href="#catalog">Butun katalog</a></li>`}
            </ul>
          </div>

          <div class="footer-col">
            <h5>Xaridorga</h5>
            <ul class="footer-links-list">
              <li><a href="#catalog">Butun katalog</a></li>
              <li><a href="#tanlash">Menga mos mahsulotni toping</a></li>
              <li><a href="#katta-buyurtma">Katta qurilish buyurtmasi</a></li>
              <li><a href="#savat">Savat</a></li>
              <li><a href="#aloqa">Qanday buyurtma beriladi</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h5>Savolingiz bormi?</h5>
            <p style="font-size: 14px; color: var(--muted); margin-bottom: 16px; line-height: 1.5;">
              Kerakli mahsulotni topishda yordam beramiz — yozing yoki qo'ng'iroq qiling.
            </p>
            <a href="#aloqa" class="btn-primary" style="width: 100%; justify-content: center;">
              Biz bilan bog'lanish
            </a>
          </div>
        </div>

        <div class="footer-disclaimer-box">
          <p>Narxlar va rasmlar NEVO GROUP praysidan olingan. Prays vaqti-vaqti bilan yangilanadi — aniq narx va mavjudlikni operatorimiz tasdiqlaydi.</p>
          <p>© 2026 NEVO GROUP. Barcha huquqlar himoyalangan.</p>
        </div>
      </div>
    </footer>
  `;
}
