import { icon } from '../icons.js';
import { store } from '../store.js';
import { esc, formatPrice, formatOrderNumber } from '../lib/format.js';
import { validateOrder, submitOrder } from '../lib/orders.js';
import { invalidateCatalog, loadCatalog } from '../lib/catalog.js';
import {
  fieldError, errorAttrs, errorClass, renderFormAlert, renderSubmitButton, bindFormState, focusFirstError,
} from '../lib/formHelpers.js';

const PICKUP_ADDRESS = 'Filialdan olib ketadi (Toshkent sh., Santexnika va qurilish bozori, NEVO GROUP pavilyoni)';

let isCheckoutOpen = false;
let deliveryMethod = 'delivery'; // 'delivery' | 'pickup'
let isSubmitting = false;
let form = { customer_name: '', phone: '', address: '', comment: '' };
let errors = {};
let formAlert = '';
let placedOrder = null; // { id, total_amount }

const FIELD_ELEMENTS = {
  customer_name: 'order-name',
  phone: 'order-phone',
  address: 'order-address',
  comment: 'order-comment',
};
const ELEMENT_FIELDS = Object.fromEntries(Object.entries(FIELD_ELEMENTS).map(([field, id]) => [id, field]));

function breadcrumbs() {
  return `
    <nav class="breadcrumbs">
      <a href="#home">Bosh sahifa</a>
      <span>›</span>
      <span style="color: var(--ink); font-weight: 600;">Savat</span>
    </nav>
  `;
}

function renderSuccess() {
  return `
    <div class="shell cart-page-wrap">
      ${breadcrumbs()}
      <div class="status-card" style="margin-top: 24px;" role="status">
        <div class="status-icon status-icon-success">${icon('check', '', 30)}</div>
        <h1 class="status-title">Buyurtmangiz qabul qilindi!</h1>
        <p style="font-size: 14px; color: var(--muted); margin-bottom: 8px;">Buyurtma raqami</p>
        <div class="order-number-box" id="order-number">${esc(formatOrderNumber(placedOrder.id))}</div>
        <p style="font-size: 15px; color: var(--ink); font-weight: 700; margin-bottom: 12px;">
          Summa: ${esc(formatPrice(placedOrder.total_amount))}
        </p>
        <p class="status-text">
          Tez orada operatorimiz siz bilan bog'lanib, tovarlar mavjudligi va yetkazib berish vaqtini tasdiqlaydi.
          Murojaat qilganda buyurtma raqamini ayting.
        </p>
        <a href="#catalog" class="btn-primary" onclick="window.__closeOrderSuccess()">
          <span>Katalogga qaytish</span>
          ${icon('arrow-right', '', 18)}
        </a>
      </div>
    </div>
  `;
}

function renderEmpty() {
  return `
    <div class="shell cart-page-wrap">
      ${breadcrumbs()}

      <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 24px;">Savat</h1>

      <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-2xl); padding: 60px 20px; text-align: center;">
        <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: var(--tint); color: var(--nevo-blue); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          ${icon('shopping-cart', '', 28)}
        </div>
        <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">Savatingiz bo'sh</h3>
        <p style="color: var(--muted); font-size: 15px; max-width: 360px; margin: 0 auto 24px;">
          Katalogdan kerakli santexnika va qurilish mahsulotlarini tanlab qo'shing.
        </p>
        <a href="#catalog" class="btn-primary">
          <span>Katalogga o'tish</span>
          ${icon('arrow-right', '', 18)}
        </a>
      </div>
    </div>
  `;
}

function renderCheckout({ items, count, totalFormatted, hasUnavailable }) {
  return `
    <div class="shell cart-page-wrap">
      <button type="button" class="back-link" onclick="window.__toggleCheckout(false)" ${isSubmitting ? 'disabled' : ''}>
        ${icon('chevron-left', '', 18)}
        <span>Savatga qaytish</span>
      </button>

      <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 24px;">Buyurtmani rasmiylashtirish</h1>

      <form id="checkout-form" novalidate onsubmit="event.preventDefault(); window.__submitOrder();" style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-2xl); padding: clamp(18px, 4vw, 32px); box-shadow: var(--shadow-card);">
        <h2 style="font-size: 22px; font-weight: 800; color: var(--ink); margin-bottom: 20px;">Buyurtma ma'lumotlari</h2>

        <div style="margin-bottom: 20px;">
          <div class="filter-group-label" style="margin-bottom: 8px;">OLISH USULI</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <button
              type="button"
              class="quiz-option-btn ${deliveryMethod === 'delivery' ? 'selected' : ''}"
              style="justify-content: center; gap: 8px;"
              onclick="window.__setDeliveryMethod('delivery')"
              aria-pressed="${deliveryMethod === 'delivery'}"
            >
              ${icon('truck', '', 18)}
              <span>Yetkazib berish</span>
            </button>

            <button
              type="button"
              class="quiz-option-btn ${deliveryMethod === 'pickup' ? 'selected' : ''}"
              style="justify-content: center; gap: 8px;"
              onclick="window.__setDeliveryMethod('pickup')"
              aria-pressed="${deliveryMethod === 'pickup'}"
            >
              ${icon('home', '', 18)}
              <span>Filialdan olaman</span>
            </button>
          </div>
        </div>

        <div class="form-grid-2" style="margin-bottom: 14px;">
          <div>
            <label class="form-label" for="order-name">Ismingiz *</label>
            <input type="text" class="form-input ${errorClass(errors, 'customer_name')}" id="order-name" name="name" autocomplete="name" maxlength="120" placeholder="Ismingizni kiriting" value="${esc(form.customer_name)}" ${errorAttrs(errors, 'customer_name')} />
            ${fieldError(errors, 'customer_name')}
          </div>
          <div>
            <label class="form-label" for="order-phone">Telefon raqamingiz *</label>
            <input type="tel" class="form-input ${errorClass(errors, 'phone')}" id="order-phone" name="phone" autocomplete="tel" inputmode="tel" maxlength="20" placeholder="+998 90 123 45 67" value="${esc(form.phone)}" ${errorAttrs(errors, 'phone')} />
            ${fieldError(errors, 'phone')}
          </div>
        </div>

        ${deliveryMethod === 'delivery' ? `
          <div style="background: #eff6ff; border: 1px solid var(--tint-border); border-radius: var(--radius-md); padding: 12px 16px; font-size: 13.5px; color: #1e3a8a; margin-bottom: 14px; display: flex; align-items: center; gap: 10px;">
            ${icon('zap', '', 18)}
            <span>Lokatsiya <strong>shart emas</strong>. Qishloq manzilini yozsangiz ham yetib boramiz — mo'ljalni aniqroq yozing.</span>
          </div>

          <div style="margin-bottom: 14px;">
            <label class="form-label" for="order-address">Manzil</label>
            <textarea class="form-textarea ${errorClass(errors, 'address')}" id="order-address" name="address" autocomplete="street-address" rows="2" maxlength="500" placeholder="Viloyat, tuman, mahalla, ko'cha, uy. Mo'ljal: maktab yonidagi oq darvoza" ${errorAttrs(errors, 'address')}>${esc(form.address)}</textarea>
            ${fieldError(errors, 'address')}
          </div>
        ` : `
          <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; margin-bottom: 14px;">
            <h4 style="font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 4px;">Asosiy omborxona:</h4>
            <p style="font-size: 14px; color: var(--muted); line-height: 1.5;">Toshkent sh., Santexnika va qurilish bozori, NEVO GROUP pavilyoni.<br>Ish vaqti: 08:30 - 18:00 (Har kuni)</p>
          </div>
        `}

        <div style="margin-bottom: 20px;">
          <label class="form-label" for="order-comment">Izoh</label>
          <textarea class="form-textarea ${errorClass(errors, 'comment')}" id="order-comment" name="comment" rows="3" maxlength="2000" placeholder="Qo'ng'iroq qilish uchun qulay vaqt, qo'shimcha istaklar..." ${errorAttrs(errors, 'comment')}>${esc(form.comment)}</textarea>
          ${fieldError(errors, 'comment')}
        </div>

        <div style="background: #f8fafc; border-radius: var(--radius-md); padding: 16px; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
            <span style="font-weight: 600; color: var(--muted);">Umumiy summa (${count} ta tovar, ${items.length} pozitsiya):</span>
            <span style="font-size: 20px; font-weight: 800; color: var(--ink);">${esc(totalFormatted)}</span>
          </div>
          <p style="font-size: 12.5px; color: var(--muted); margin-top: 6px;">Yakuniy summa bazadagi joriy narxlar bo'yicha hisoblanadi.</p>
        </div>

        ${fieldError(errors, 'items')}
        ${hasUnavailable ? renderFormAlert("Savatda hozir mavjud bo'lmagan mahsulot bor. Uni savatdan olib tashlang.") : ''}
        ${renderFormAlert(formAlert)}

        ${renderSubmitButton({ submitting: isSubmitting, label: 'Buyurtmani tasdiqlash', busyLabel: 'Yuborilmoqda…', type: 'submit' })}
      </form>
    </div>
  `;
}

export function renderCartPage() {
  if (placedOrder) return renderSuccess();

  const details = store.getCartDetails();
  const { items, count, totalFormatted, hasUnavailable } = details;

  if (items.length === 0) {
    isCheckoutOpen = false;
    return renderEmpty();
  }

  if (isCheckoutOpen) return renderCheckout(details);

  return `
    <div class="shell cart-page-wrap">
      ${breadcrumbs()}

      <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 24px;">Savat</h1>

      <!-- Cart Item Cards -->
      <div class="cart-items-container">
        ${items.map(item => `
          <div class="cart-item-card" id="cart-item-${item.product.id}">
            <div class="cart-item-left">
              <img
                src="${esc(item.product.image)}"
                alt="${esc(item.product.name)}"
                width="64"
                height="64"
                loading="lazy"
                decoding="async"
                onerror="this.onerror=null;this.src='/brand/nevo-logo-sm.png';"
              />
              <div>
                <a href="#product/${esc(item.product.slug)}" class="cart-item-name">${esc(item.product.name)}</a>
                <div class="cart-item-meta">
                  ${item.product.sku ? `Kod: ${esc(item.product.sku)} · ` : ''}${esc(item.product.priceFormatted)} / ${esc(item.product.unit)}
                </div>
                ${item.product.inStock ? '' : '<div class="cart-item-warning">Hozir mavjud emas — savatdan olib tashlang</div>'}
              </div>
            </div>

            <div class="cart-item-controls">
              <button
                type="button"
                class="cart-qty-btn"
                onclick="window.__updateCartQty(${item.product.id}, ${item.quantity - 1})"
                aria-label="Kamaytirish"
              >
                ${icon('minus', '', 14)}
              </button>
              <span class="cart-qty-val">${item.quantity}</span>
              <button
                type="button"
                class="cart-qty-btn"
                onclick="window.__updateCartQty(${item.product.id}, ${item.quantity + 1})"
                aria-label="Ko'paytirish"
              >
                ${icon('plus', '', 14)}
              </button>
            </div>

            <div class="cart-item-price-col">
              <div class="cart-item-total">
                ${esc(formatPrice(item.lineTotal))}
              </div>
              <button
                type="button"
                class="cart-item-delete-btn"
                onclick="window.__removeCartItem(${item.product.id})"
              >
                ${icon('trash-2', '', 14)}
                <span>O'chirish</span>
              </button>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Cart Summary Box -->
      <div class="cart-summary-box">
        <div class="cart-summary-row">
          <span class="cart-summary-label">${count} ta tovar</span>
          <span class="cart-summary-val">${esc(totalFormatted)}</span>
        </div>
        <p style="font-size: 13.5px; color: var(--muted); line-height: 1.45; margin-bottom: 20px;">
          Bu — saytdagi narxlar bo'yicha hisob. Yakuniy summani va yetkazib berish narxini operatorimiz tasdiqlaydi.
        </p>

        ${hasUnavailable ? renderFormAlert("Savatda hozir mavjud bo'lmagan mahsulot bor. Buyurtma berish uchun uni olib tashlang.") : ''}

        <button
          type="button"
          class="cart-checkout-btn"
          onclick="window.__toggleCheckout(true)"
          ${hasUnavailable ? 'disabled' : ''}
        >
          <span>Buyurtmani rasmiylashtirish</span>
          ${icon('arrow-right', '', 18)}
        </button>

        <div style="text-align: center; margin-top: 14px;">
          <a href="#catalog" style="font-size: 14.5px; font-weight: 600; color: var(--nevo-blue);">
            Yana mahsulot qo'shish
          </a>
        </div>
      </div>
    </div>
  `;
}

export function initCartEvents(rerenderCallback) {
  window.__updateCartQty = (pid, qty) => {
    store.updateQuantity(pid, qty);
    rerenderCallback();
  };

  window.__removeCartItem = (pid) => {
    store.removeFromCart(pid);
    rerenderCallback();
  };

  window.__toggleCheckout = (isOpen) => {
    if (isSubmitting) return;
    isCheckoutOpen = isOpen;
    formAlert = '';
    rerenderCallback();
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  window.__setDeliveryMethod = (method) => {
    deliveryMethod = method;
    delete errors.address;
    rerenderCallback();
  };

  window.__closeOrderSuccess = () => {
    placedOrder = null;
  };

  window.__submitOrder = async () => {
    if (isSubmitting) return;

    const { items, hasUnavailable } = store.getCartDetails();
    errors = validateOrder({
      customerName: form.customer_name,
      phone: form.phone,
      hasItems: items.length > 0,
      itemsError: "Savat bo'sh — avval mahsulot qo'shing",
    });
    formAlert = hasUnavailable ? "Savatda hozir mavjud bo'lmagan mahsulot bor. Uni savatdan olib tashlang." : '';

    if (Object.keys(errors).length > 0 || hasUnavailable) {
      rerenderCallback();
      focusFirstError(FIELD_ELEMENTS);
      return;
    }

    isSubmitting = true;
    formAlert = '';
    rerenderCallback();

    const result = await submitOrder({
      customerName: form.customer_name,
      phone: form.phone,
      address: deliveryMethod === 'pickup' ? PICKUP_ADDRESS : form.address,
      comment: form.comment,
      orderType: 'retail',
      companyName: null,
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    });

    isSubmitting = false;

    if (result.ok) {
      placedOrder = result.order;
      store.clearCart();
      isCheckoutOpen = false;
      form = { customer_name: '', phone: '', address: '', comment: '' };
      errors = {};
      formAlert = '';
      if (window.location.hash.replace(/^#\/?/, '').split('?')[0] === 'savat') {
        rerenderCallback();
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
      return;
    }

    if (result.field && FIELD_ELEMENTS[result.field]) {
      errors = { [result.field]: result.message };
    } else if (result.field === 'items') {
      errors = { items: result.message };
    } else {
      formAlert = result.message;
    }

    if (result.field === 'out_of_stock') {
      // Keshdagi mavjudlik eskirgan — katalogni bazadan qayta olamiz,
      // savatda qaysi mahsulot mavjud emasligi belgilanadi.
      invalidateCatalog();
      loadCatalog();
      return;
    }

    rerenderCallback();
    focusFirstError(FIELD_ELEMENTS);
  };

  if (isCheckoutOpen) {
    bindFormState(form, ELEMENT_FIELDS, errors);
  }
}
