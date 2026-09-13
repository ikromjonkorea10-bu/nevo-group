import { icon } from '../icons.js';
import { store } from '../store.js';
import { esc, formatOrderNumber } from '../lib/format.js';
import { validateOrder, submitOrder } from '../lib/orders.js';
import {
  fieldError, errorAttrs, errorClass, renderFormAlert, renderSubmitButton, bindFormState, focusFirstError,
} from '../lib/formHelpers.js';

const PROJECT_TYPES = [
  'Yakka tartibdagi uy',
  'Ko\'p qavatli bino',
  'Ta\'mirlash',
  'Savdo/ofis obyekti',
  'Issiqxona / ferma',
  'Boshqa'
];

let selectedProjectType = PROJECT_TYPES[0];
let includeCart = true;
let isSubmitting = false;
let form = { items_text: '', company_name: '', customer_name: '', phone: '', address: '', notes: '' };
let errors = {};
let formAlert = '';
let placedOrder = null; // { id }

const FIELD_ELEMENTS = {
  items: 'bulk-items-text',
  company_name: 'bulk-org',
  customer_name: 'bulk-name',
  phone: 'bulk-phone',
  address: 'bulk-location',
  comment: 'bulk-notes',
};

// element id -> [form kaliti, xato kaliti]
const ELEMENT_FIELDS = {
  'bulk-items-text': ['items_text', 'items'],
  'bulk-org': 'company_name',
  'bulk-name': 'customer_name',
  'bulk-phone': 'phone',
  'bulk-location': 'address',
  'bulk-notes': ['notes', 'comment'],
};

function breadcrumbs() {
  return `
    <nav class="breadcrumbs">
      <a href="#home">Bosh sahifa</a>
      <span>›</span>
      <span style="color: var(--ink); font-weight: 600;">Katta buyurtma</span>
    </nav>
  `;
}

function buildComment() {
  const parts = [`Loyiha turi: ${selectedProjectType}`];
  if (form.items_text.trim()) parts.push(`Mahsulotlar ro'yxati:\n${form.items_text.trim()}`);
  if (form.notes.trim()) parts.push(`Izoh: ${form.notes.trim()}`);
  return parts.join('\n\n');
}

export function renderKattaBuyurtmaPage() {
  if (placedOrder) {
    return `
      <div class="shell bulk-page-wrap">
        ${breadcrumbs()}

        <div class="status-card" style="margin-top: 24px;" role="status">
          <div class="status-icon status-icon-success">${icon('check', '', 30)}</div>
          <h2 class="status-title">So'rovingiz muvaffaqiyatli qabul qilindi!</h2>
          <p style="font-size: 14px; color: var(--muted); margin-bottom: 8px;">Buyurtma raqami</p>
          <div class="order-number-box" id="order-number">${esc(formatOrderNumber(placedOrder.id))}</div>
          <p class="status-text">
            Mutaxassisimiz ro'yxatni prays bo'yicha hisoblab chiqadi va qisqa vaqt ichida ko'rsatilgan telefon raqamiga narxlar smetasini yuboradi.
          </p>

          <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
            <button type="button" class="btn-secondary" onclick="window.__resetBulkOrder()">
              Yangi ro'yxat yuborish
            </button>
            <a href="#catalog" class="btn-primary" onclick="window.__resetBulkOrder(true)">
              Katalogga qaytish
            </a>
          </div>
        </div>
      </div>
    `;
  }

  const { items, count } = store.getCartDetails();
  const availableItems = items.filter((i) => i.product.inStock);

  return `
    <div class="shell bulk-page-wrap">
      ${breadcrumbs()}

      <div style="margin-top: 16px;">
        <h1 style="font-size: 32px; font-weight: 800; color: var(--ink);">Katta qurilish buyurtmasi</h1>
        <p style="font-size: 15.5px; color: var(--muted); margin-top: 8px; line-height: 1.5;">
          Obyekt uchun bir nechta pozitsiya kerakmi? Bittalab qidirib o'tirmang — ro'yxatni yozib yuboring, narxini va qancha muddatda yig'ilishini operatorimiz aytadi.
        </p>
      </div>

      <form class="bulk-form-card" id="bulk-order-form" novalidate onsubmit="window.__submitBulkOrder(event)">
        <!-- Project Type -->
        <div class="form-group">
          <label class="form-label">Loyiha turi</label>
          <div class="project-type-chips">
            ${PROJECT_TYPES.map(pt => `
              <button
                type="button"
                class="project-chip ${selectedProjectType === pt ? 'active' : ''}"
                data-value="${esc(pt)}"
                aria-pressed="${selectedProjectType === pt}"
                onclick="window.__selectProjectType(this.dataset.value)"
              >
                ${esc(pt)}
              </button>
            `).join('')}
          </div>
        </div>

        ${availableItems.length > 0 ? `
          <div class="form-group">
            <label style="display: flex; gap: 10px; align-items: flex-start; background: var(--tint); border: 1px solid var(--tint-border); border-radius: var(--radius-md); padding: 12px 14px; cursor: pointer;">
              <input type="checkbox" id="bulk-include-cart" ${includeCart ? 'checked' : ''} onchange="window.__toggleBulkIncludeCart(this.checked)" style="margin-top: 3px; width: 16px; height: 16px;" />
              <span style="font-size: 14px; line-height: 1.45; color: var(--ink);">
                Savatdagi <strong>${availableItems.length} ta pozitsiya</strong> (${count} ta tovar) ham buyurtmaga qo'shilsin
              </span>
            </label>
          </div>
        ` : ''}

        <!-- Products List Textarea -->
        <div class="form-group">
          <label class="form-label" for="bulk-items-text">Kerakli mahsulotlar ro'yxati${availableItems.length > 0 && includeCart ? '' : ' *'}</label>
          <p style="font-size: 13px; color: var(--muted); margin-bottom: 8px;">
            Har qatorga bitta mahsulot yozing. Kod bilan yozsangiz aniqroq bo'ladi, lekin shart emas — nomi va soni ham yetadi.
          </p>
          <textarea
            class="form-textarea ${errorClass(errors, 'items')}"
            id="bulk-items-text"
            rows="6"
            maxlength="6000"
            placeholder="Masalan:&#10;1. PP-R truba d25 PN20 — 120 metr&#10;2. AQUA LINE mufta d25 — 40 dona&#10;3. Zadvijka DN50 cho'yan — 2 dona"
            ${errorAttrs(errors, 'items')}
          >${esc(form.items_text)}</textarea>
          ${fieldError(errors, 'items')}
        </div>

        <!-- Customer Contacts -->
        <div class="form-grid-2" style="gap: 16px;">
          <div class="form-group">
            <label class="form-label" for="bulk-org">Kompaniya / tashkilot nomi</label>
            <input type="text" class="form-input ${errorClass(errors, 'company_name')}" id="bulk-org" autocomplete="organization" maxlength="200" placeholder="Masalan: 'Obod Qurilish' MCHJ" value="${esc(form.company_name)}" ${errorAttrs(errors, 'company_name')} />
            ${fieldError(errors, 'company_name')}
          </div>
          <div class="form-group">
            <label class="form-label" for="bulk-name">Mas'ul shaxs (Ism) *</label>
            <input type="text" class="form-input ${errorClass(errors, 'customer_name')}" id="bulk-name" autocomplete="name" maxlength="120" placeholder="Ism-familiyangiz" value="${esc(form.customer_name)}" ${errorAttrs(errors, 'customer_name')} />
            ${fieldError(errors, 'customer_name')}
          </div>
        </div>

        <div class="form-grid-2" style="gap: 16px;">
          <div class="form-group">
            <label class="form-label" for="bulk-phone">Telefon raqamingiz *</label>
            <input type="tel" class="form-input ${errorClass(errors, 'phone')}" id="bulk-phone" autocomplete="tel" inputmode="tel" maxlength="20" placeholder="+998 90 123 45 67" value="${esc(form.phone)}" ${errorAttrs(errors, 'phone')} />
            ${fieldError(errors, 'phone')}
          </div>
          <div class="form-group">
            <label class="form-label" for="bulk-location">Obyekt manzili (viloyat, tuman)</label>
            <input type="text" class="form-input ${errorClass(errors, 'address')}" id="bulk-location" maxlength="500" placeholder="Joylashuvi" value="${esc(form.address)}" ${errorAttrs(errors, 'address')} />
            ${fieldError(errors, 'address')}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="bulk-notes">Qo'shimcha izoh — muddat, yetkazish shartlari, to'lov shakli...</label>
          <textarea class="form-textarea ${errorClass(errors, 'comment')}" id="bulk-notes" rows="3" maxlength="2000" placeholder="Ixtiyoriy izoh qoldiring..." ${errorAttrs(errors, 'comment')}>${esc(form.notes)}</textarea>
          ${fieldError(errors, 'comment')}
        </div>

        ${renderFormAlert(formAlert)}

        ${renderSubmitButton({ submitting: isSubmitting, label: "Ro'yxatni yuborish", busyLabel: 'Yuborilmoqda…', type: 'submit' })}
      </form>
    </div>
  `;
}

export function initKattaBuyurtmaEvents(rerenderCallback) {
  window.__selectProjectType = (pt) => {
    selectedProjectType = pt;
    rerenderCallback();
  };

  window.__toggleBulkIncludeCart = (checked) => {
    includeCart = checked;
    delete errors.items;
    rerenderCallback();
  };

  window.__submitBulkOrder = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cartItems = includeCart
      ? store.getCartDetails().items.filter((i) => i.product.inStock)
      : [];

    errors = validateOrder({
      customerName: form.customer_name,
      phone: form.phone,
      hasItems: cartItems.length > 0 || form.items_text.trim().length > 0,
      itemsError: "Mahsulotlar ro'yxatini yozing yoki savatga mahsulot qo'shing",
    });
    formAlert = '';

    if (Object.keys(errors).length > 0) {
      rerenderCallback();
      focusFirstError(FIELD_ELEMENTS);
      return;
    }

    isSubmitting = true;
    rerenderCallback();

    const result = await submitOrder({
      customerName: form.customer_name,
      phone: form.phone,
      address: form.address,
      comment: buildComment(),
      orderType: 'bulk',
      companyName: form.company_name,
      items: cartItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    });

    isSubmitting = false;

    if (result.ok) {
      placedOrder = result.order;
      if (cartItems.length > 0) store.clearCart();
      form = { items_text: '', company_name: '', customer_name: '', phone: '', address: '', notes: '' };
      errors = {};
      store.showToast("Buyurtma so'rovi yuborildi");
    } else if (result.field && FIELD_ELEMENTS[result.field]) {
      errors = { [result.field]: result.message };
    } else {
      formAlert = result.message;
    }

    if (window.location.hash.replace(/^#\/?/, '').split('?')[0] === 'katta-buyurtma') {
      rerenderCallback();
      if (result.ok) window.scrollTo({ top: 0, behavior: 'instant' });
      else focusFirstError(FIELD_ELEMENTS);
    }
  };

  window.__resetBulkOrder = (silent = false) => {
    placedOrder = null;
    if (!silent) rerenderCallback();
  };

  bindFormState(form, ELEMENT_FIELDS, errors);
}
