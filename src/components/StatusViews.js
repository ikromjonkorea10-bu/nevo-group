import { icon } from '../icons.js';
import { esc } from '../lib/format.js';

export function renderProductCardSkeleton() {
  return `
    <div class="product-card skeleton-card" aria-hidden="true">
      <div class="product-img-wrap"><div class="skeleton skeleton-img"></div></div>
      <div class="product-card-body">
        <div class="skeleton skeleton-line" style="width: 40%;"></div>
        <div class="skeleton skeleton-line" style="width: 90%; height: 16px;"></div>
        <div class="skeleton skeleton-line" style="width: 70%; height: 16px;"></div>
        <div class="skeleton skeleton-line" style="width: 50%; height: 20px; margin-top: 12px;"></div>
        <div class="skeleton skeleton-btn"></div>
      </div>
    </div>
  `;
}

export function renderProductsGridSkeleton(count = 8) {
  return `<div class="products-grid">${Array.from({ length: count }, renderProductCardSkeleton).join('')}</div>`;
}

/** Katalog yuklanayotganda sahifa o'rniga ko'rsatiladi. */
export function renderPageSkeleton() {
  return `
    <div class="shell" style="padding-top: 24px; padding-bottom: 60px;" role="status" aria-live="polite">
      <span class="visually-hidden">Ma'lumotlar yuklanmoqda…</span>
      <div class="skeleton skeleton-line" style="width: 220px; height: 30px; margin-bottom: 12px;"></div>
      <div class="skeleton skeleton-line" style="width: min(420px, 90%); height: 16px; margin-bottom: 24px;"></div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px;">
        ${Array.from({ length: 5 }, () => '<div class="skeleton" style="width: 130px; height: 36px; border-radius: 9999px;"></div>').join('')}
      </div>
      ${renderProductsGridSkeleton(8)}
    </div>
  `;
}

export function renderNavSkeleton() {
  return Array.from(
    { length: 5 },
    () => '<div class="skeleton" style="width: 120px; height: 16px; margin: 12px 0;" aria-hidden="true"></div>'
  ).join('');
}

/**
 * "Ma'lumot yuklanmadi" ekrani.
 * @param {{ network?: boolean }} error
 * @param {string} retryHandler global funksiya nomi, masalan "__retryCatalog"
 */
export function renderLoadError(error, retryHandler) {
  const detail = error?.network
    ? "Internet aloqangizni tekshiring."
    : "Server bilan bog'lanishda muammo yuz berdi.";
  return `
    <div class="shell" style="padding-top: 40px; padding-bottom: 60px;">
      <div class="status-card" role="alert">
        <div class="status-icon status-icon-error">${icon('zap', '', 26)}</div>
        <h2 class="status-title">Ma'lumot yuklanmadi, qayta urinib ko'ring</h2>
        <p class="status-text">${esc(detail)}</p>
        <button type="button" class="btn-primary" onclick="window.${retryHandler}()">
          <span>Qayta urinish</span>
        </button>
      </div>
    </div>
  `;
}

export function renderConfigError() {
  return `
    <div class="shell" style="padding-top: 40px; padding-bottom: 60px;">
      <div class="status-card" role="alert">
        <div class="status-icon status-icon-error">${icon('zap', '', 26)}</div>
        <h2 class="status-title">Sayt sozlanmagan</h2>
        <p class="status-text">
          Supabase ulanish ma'lumotlari topilmadi. <code>VITE_SUPABASE_URL</code> va
          <code>VITE_SUPABASE_ANON_KEY</code> muhit o'zgaruvchilarini kiriting (README'ga qarang).
        </p>
      </div>
    </div>
  `;
}

export function renderNotFound(title, text) {
  return `
    <div class="shell" style="padding-top: 40px; padding-bottom: 60px;">
      <div class="status-card">
        <div class="status-icon">${icon('boxes', '', 26)}</div>
        <h2 class="status-title">${esc(title)}</h2>
        <p class="status-text">${esc(text)}</p>
        <a href="#catalog" class="btn-primary">
          <span>Katalogga o'tish</span>
          ${icon('arrow-right', '', 18)}
        </a>
      </div>
    </div>
  `;
}
