import { esc } from '../lib/format.js';
import { isNetworkError } from '../lib/supabase.js';

export const ORDER_STATUSES = [
  { value: 'new', label: 'Yangi' },
  { value: 'confirmed', label: 'Tasdiqlangan' },
  { value: 'delivered', label: 'Yetkazilgan' },
  { value: 'cancelled', label: 'Bekor qilingan' },
];

export function statusLabel(value) {
  return ORDER_STATUSES.find((s) => s.value === value)?.label || value;
}

export function statusBadge(value) {
  const known = ORDER_STATUSES.some((s) => s.value === value);
  return `<span class="status-badge ${known ? `status-${value}` : ''}">${esc(statusLabel(value))}</span>`;
}

export function typeBadge(orderType) {
  return orderType === 'bulk'
    ? '<span class="type-badge bulk">Katta buyurtma</span>'
    : '<span class="type-badge">Chakana</span>';
}

/** Supabase xatosini admin uchun tushunarli matnga aylantiradi. */
export function describeError(error) {
  if (!error) return "Noma'lum xatolik";
  if (isNetworkError(error)) return "Internet aloqasi yo'q yoki server javob bermadi.";
  if (error.code === '42501' || error.status === 401 || error.status === 403) {
    return "Bu amal uchun ruxsat yo'q. Qayta kirib ko'ring.";
  }
  if (error.code === 'PGRST116') return "Yozuv topilmadi yoki unga ruxsat yo'q.";
  if (error.code === 'PGRST303' || /JWT expired/i.test(error.message || '')) {
    return 'Sessiya muddati tugagan. Qayta kiring.';
  }
  return error.message || "Noma'lum xatolik";
}

export function toast(message, type = 'success') {
  let container = document.getElementById('admin-toasts');
  if (!container) {
    container = document.createElement('div');
    container.id = 'admin-toasts';
    container.className = 'admin-toast-container';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = `admin-toast ${type === 'error' ? 'error' : ''}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), type === 'error' ? 5000 : 2800);
}

export function renderSkeletonRows(count = 6) {
  return Array.from(
    { length: count },
    () => `
      <div class="admin-order-row" aria-hidden="true">
        <div class="skeleton skeleton-line" style="width: 70%; margin: 0;"></div>
        <div class="skeleton skeleton-line" style="width: 85%; margin: 0;"></div>
        <div class="skeleton skeleton-line admin-hide-sm" style="width: 70%; margin: 0;"></div>
        <div class="skeleton skeleton-line" style="width: 60%; margin: 0;"></div>
        <div class="skeleton skeleton-line" style="width: 80%; margin: 0;"></div>
        <div class="skeleton skeleton-line" style="width: 75%; margin: 0;"></div>
      </div>
    `
  ).join('');
}

export function renderErrorBox(message, retryHandler) {
  return `
    <div class="status-card" role="alert" style="max-width: none;">
      <div class="status-icon status-icon-error">!</div>
      <h2 class="status-title" style="font-size: 18px;">Ma'lumot yuklanmadi, qayta urinib ko'ring</h2>
      <p class="status-text">${esc(message)}</p>
      <button type="button" class="btn-primary" onclick="${retryHandler}">Qayta urinish</button>
    </div>
  `;
}

/**
 * Tasdiqlash oynasi (window.confirm o'rniga).
 * @returns {Promise<boolean>}
 */
export function confirmDialog({ title, message, confirmLabel = 'Tasdiqlash', danger = false }) {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'admin-modal-backdrop';
    backdrop.innerHTML = `
      <div class="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title">
        <h3 id="admin-modal-title">${esc(title)}</h3>
        <p>${esc(message)}</p>
        <div class="admin-modal-actions">
          <button type="button" class="btn-secondary" data-action="cancel">Bekor qilish</button>
          <button type="button" class="${danger ? 'btn-danger' : 'btn-primary'}" data-action="ok">${esc(confirmLabel)}</button>
        </div>
      </div>
    `;
    const close = (result) => {
      document.removeEventListener('keydown', onKey);
      backdrop.remove();
      resolve(result);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') close(false);
    };
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close(false);
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action) close(action === 'ok');
    });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(backdrop);
    backdrop.querySelector('[data-action="cancel"]').focus();
  });
}
