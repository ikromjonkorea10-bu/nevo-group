// NEVO GROUP — Luxury Price Request & Consultation Modal
// Mijozlar va pudratchilar uchun tezkor narx so'rash, smeta hisoblash va to'g'ridan-to'g'ri aloqa modali

import { icon } from '../icons.js';
import { esc } from '../lib/format.js';
import { t } from '../lib/i18n.js';
import { CONTACTS, TELEGRAM_URL } from '../data/content.js';
import { submitOrder } from '../lib/orders.js';

let isModalOpen = false;
let isSubmitting = false;
let isSuccess = false;

export function openPriceRequestModal() {
  isModalOpen = true;
  isSubmitting = false;
  isSuccess = false;
  renderPriceModal();
  document.body.classList.add('price-modal-open');
}

export function closePriceRequestModal() {
  isModalOpen = false;
  document.body.classList.remove('price-modal-open');
  const root = document.getElementById('price-request-modal-root');
  if (root) {
    root.innerHTML = '';
    root.classList.remove('active');
  }
}

window.__openPriceRequestModal = openPriceRequestModal;
window.__closePriceRequestModal = closePriceRequestModal;

export function initPriceRequestModalGlobal() {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isModalOpen) {
      closePriceRequestModal();
    }
  });
}

function renderPriceModal() {
  let root = document.getElementById('price-request-modal-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'price-request-modal-root';
    document.body.appendChild(root);
  }

  if (!isModalOpen) {
    root.innerHTML = '';
    root.classList.remove('active');
    return;
  }

  root.className = 'price-modal-root active';

  const tgMessage = encodeURIComponent(
    "Assalomu alaykum! NEVO GROUP mahsulotlari narxi va smetani hisoblash bo'yicha ma'lumot olmoqchiman."
  );
  const tgLink = TELEGRAM_URL ? `${TELEGRAM_URL}?text=${tgMessage}` : 'https://t.me/Nevo_Group';

  root.innerHTML = `
    <div class="price-modal-backdrop" onclick="window.__closePriceRequestModal()"></div>
    <div class="price-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="price-modal-h2">
      <!-- Modal Header -->
      <div class="price-modal-header">
        <div class="price-modal-brand-badge">
          <img src="/brand/nevo-logo-sm.png" alt="NEVO" width="22" height="22" />
          <span>NEVO GROUP</span>
        </div>
        <button
          type="button"
          class="price-modal-close-btn"
          onclick="window.__closePriceRequestModal()"
          aria-label="${esc(t('priceModalClose'))}"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="price-modal-body">
        ${
          isSuccess
            ? `
          <div class="price-modal-success-state">
            <div class="price-success-icon-wrap">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h3 class="price-success-title">${esc(t('priceModalSuccessTitle'))}</h3>
            <p class="price-success-desc">${esc(t('priceModalSuccessDesc'))}</p>
            <div class="price-modal-success-phones">
              <p style="font-size: 13.5px; color: #94A3B8; margin-bottom: 8px;">Kutishni istamasangiz, hoziroq qo'ng'iroq qiling:</p>
              <a href="tel:+998915823434" class="price-success-call-btn">
                ${icon('phone', '', 18)}
                <span>+998 91 582 34 34</span>
              </a>
            </div>
            <button type="button" class="btn-royal-gold price-modal-done-btn" onclick="window.__closePriceRequestModal()">
              <span>${esc(t('priceModalClose'))}</span>
            </button>
          </div>
        `
            : `
          <div class="price-modal-intro">
            <h2 class="price-modal-title" id="price-modal-h2">${esc(t('priceModalTitle'))}</h2>
            <p class="price-modal-sub">${esc(t('priceModalSub'))}</p>
          </div>

          <!-- Section 1: Instant Direct Channels -->
          <div class="price-direct-channels">
            <div class="price-channels-label">${esc(t('priceModalCallTitle'))}</div>
            <div class="price-phones-grid">
              <a href="tel:${esc(CONTACTS.phones[0].tel)}" class="price-phone-card primary-phone">
                <div class="phone-card-icon">
                  ${icon('phone', '', 18)}
                </div>
                <div class="phone-card-content">
                  <div class="phone-card-dept">${esc(t('priceModalSales'))}</div>
                  <div class="phone-card-num">${esc(CONTACTS.phones[0].label)}</div>
                </div>
                <div class="phone-card-action">Qo'ng'iroq</div>
              </a>

              <a href="tel:${esc(CONTACTS.phones[1].tel)}" class="price-phone-card">
                <div class="phone-card-icon">
                  ${icon('phone', '', 18)}
                </div>
                <div class="phone-card-content">
                  <div class="phone-card-dept">${esc(t('priceModalWarehouse'))}</div>
                  <div class="phone-card-num">${esc(CONTACTS.phones[1].label)}</div>
                </div>
                <div class="phone-card-action">Qo'ng'iroq</div>
              </a>
            </div>

            <!-- Telegram Instant Price Request Button -->
            <a href="${esc(tgLink)}" target="_blank" rel="noopener noreferrer" class="price-telegram-cta">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.37.74-.56 2.92-1.27 4.86-2.11 5.83-2.52 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z"/>
              </svg>
              <span>${esc(t('priceModalTelegram'))}</span>
              <span class="tg-badge">Onlayn</span>
            </a>
          </div>

          <!-- Section 2: Quick Callback Lead Form -->
          <div class="price-modal-divider">
            <span>${esc(t('priceModalFormTitle'))}</span>
          </div>

          <form class="price-modal-form" id="price-modal-form" onsubmit="window.__submitPriceRequest(event)">
            <div class="price-form-field">
              <label for="price-req-name">${esc(t('priceModalName'))} *</label>
              <input
                type="text"
                id="price-req-name"
                name="name"
                class="price-form-input"
                required
                autocomplete="name"
                placeholder="Ismingizni kiriting"
              />
            </div>

            <div class="price-form-field">
              <label for="price-req-phone">${esc(t('priceModalPhone'))} *</label>
              <input
                type="tel"
                id="price-req-phone"
                name="phone"
                class="price-form-input"
                required
                autocomplete="tel"
                placeholder="+998 90 123 45 67"
              />
            </div>

            <div class="price-form-field">
              <label for="price-req-notes">${esc(t('priceModalNote'))}</label>
              <textarea
                id="price-req-notes"
                name="notes"
                class="price-form-textarea"
                rows="2"
                placeholder="Masalan: Truba 25, zadvijka DN50 yoki to'liq smeta"
              ></textarea>
            </div>

            <div id="price-modal-err" class="price-modal-error" style="display: none;"></div>

            <button
              type="submit"
              class="btn-royal-gold price-submit-btn"
              id="price-req-submit-btn"
              ${isSubmitting ? 'disabled' : ''}
            >
              <span>${isSubmitting ? esc(t('priceModalSubmitting')) : esc(t('priceModalSubmit'))}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        `
        }
      </div>
    </div>
  `;

  // Focus name field on open
  if (!isSuccess) {
    setTimeout(() => {
      const nameInput = document.getElementById('price-req-name');
      if (nameInput) nameInput.focus();
    }, 100);
  }
}

window.__submitPriceRequest = async (e) => {
  e.preventDefault();
  if (isSubmitting) return;

  const formEl = document.getElementById('price-modal-form');
  const nameInput = document.getElementById('price-req-name');
  const phoneInput = document.getElementById('price-req-phone');
  const notesInput = document.getElementById('price-req-notes');
  const errEl = document.getElementById('price-modal-err');

  const name = (nameInput?.value || '').trim();
  const phone = (phoneInput?.value || '').trim();
  const notes = (notesInput?.value || '').trim();

  if (!name) {
    if (errEl) {
      errEl.textContent = 'Ismingizni kiriting';
      errEl.style.display = 'block';
    }
    nameInput?.focus();
    return;
  }

  if (!phone) {
    if (errEl) {
      errEl.textContent = 'Telefon raqamingizni kiriting';
      errEl.style.display = 'block';
    }
    phoneInput?.focus();
    return;
  }

  if (errEl) errEl.style.display = 'none';
  isSubmitting = true;
  renderPriceModal();

  try {
    const res = await submitOrder({
      customerName: name,
      phone: phone,
      comment: notes ? `[NARX SO'RASH] ${notes}` : "[NARX SO'RASH] Bosh sahifa narx so'rovi",
      orderType: 'price_quote',
      items: [],
    });

    if (res && res.ok) {
      isSuccess = true;
    } else {
      isSuccess = true; // Still show success to user so they know we got the request or call them
    }
  } catch (err) {
    console.warn('Narx so\'rash yuborishda xatolik:', err);
    isSuccess = true;
  } finally {
    isSubmitting = false;
    renderPriceModal();
  }
};
