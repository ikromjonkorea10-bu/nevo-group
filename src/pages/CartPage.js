import { icon } from '../icons.js';
import { store } from '../store.js';

let isCheckoutOpen = false;
let deliveryMethod = 'delivery'; // 'delivery' | 'pickup'

export function renderCartPage() {
  const { items, count, totalFormatted } = store.getCartDetails();

  if (items.length === 0 && !isCheckoutOpen) {
    return `
      <div class="shell cart-page-wrap">
        <nav class="breadcrumbs">
          <a href="#home">Bosh sahifa</a>
          <span>›</span>
          <span style="color: var(--ink); font-weight: 600;">Savat</span>
        </nav>

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

  if (isCheckoutOpen) {
    const reqNum = 'NG-' + Math.floor(100000 + Math.random() * 900000);

    return `
      <div class="shell cart-page-wrap">
        <button type="button" class="back-link" onclick="window.__toggleCheckout(false)">
          ${icon('chevron-left', '', 18)}
          <span>Savatga qaytish</span>
        </button>

        <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 24px;">Savat</h1>

        <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-2xl); padding: 32px; box-shadow: var(--shadow-card);">
          <h2 style="font-size: 22px; font-weight: 800; color: var(--ink);">Buyurtma ma'lumotlari</h2>
          <p style="font-size: 13.5px; color: var(--muted); margin: 4px 0 24px;">So'rov raqami: <strong>${reqNum}</strong></p>

          <div style="margin-bottom: 20px;">
            <div class="filter-group-label" style="margin-bottom: 8px;">OLISH USULI</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <button 
                type="button" 
                class="quiz-option-btn ${deliveryMethod === 'delivery' ? 'selected' : ''}" 
                style="justify-content: center; gap: 8px;"
                onclick="window.__setDeliveryMethod('delivery')"
              >
                ${icon('truck', '', 18)}
                <span>Yetkazib berish</span>
              </button>

              <button 
                type="button" 
                class="quiz-option-btn ${deliveryMethod === 'pickup' ? 'selected' : ''}" 
                style="justify-content: center; gap: 8px;"
                onclick="window.__setDeliveryMethod('pickup')"
              >
                ${icon('home', '', 18)}
                <span>Filialdan olaman</span>
              </button>
            </div>
          </div>

          ${deliveryMethod === 'delivery' ? `
            <div style="background: #eff6ff; border: 1px solid var(--tint-border); border-radius: var(--radius-md); padding: 12px 16px; font-size: 13.5px; color: #1e3a8a; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
              ${icon('zap', '', 18)}
              <span>Lokatsiya <strong>shart emas</strong>. Qishloq manzilini yozsangiz ham yetib boramiz — mo'ljalni aniqroq yozing.</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label class="form-label">Viloyat</label>
                <input type="text" class="form-input" id="order-region" placeholder="Masalan: Toshkent viloyati" />
              </div>
              <div>
                <label class="form-label">Tuman *</label>
                <input type="text" class="form-input" id="order-district" placeholder="Masalan: Zangiota tumani" required />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label class="form-label">Qishloq / shahar</label>
                <input type="text" class="form-input" id="order-city" placeholder="Aholi punkti" />
              </div>
              <div>
                <label class="form-label">Mahalla</label>
                <input type="text" class="form-input" id="order-subdistrict" placeholder="Mahalla nomi" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 3fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label class="form-label">Ko'cha</label>
                <input type="text" class="form-input" id="order-street" placeholder="Ko'cha nomi" />
              </div>
              <div>
                <label class="form-label">Uy №</label>
                <input type="text" class="form-input" id="order-house" placeholder="12" />
              </div>
            </div>

            <div style="margin-bottom: 20px;">
              <label class="form-label">Mo'ljal — masalan: maktab yonidagi oq darvoza</label>
              <input type="text" class="form-input" id="order-landmark" placeholder="Aniq mo'ljalni kiriting" />
            </div>
          ` : `
            <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px;">
              <h4 style="font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 4px;">Asosiy omborxona:</h4>
              <p style="font-size: 14px; color: var(--muted); line-height: 1.5;">Toshkent sh., Santexnika va qurilish bozori, NEVO GROUP pavilyoni.<br>Ish vaqti: 08:30 - 18:00 (Har kuni)</p>
            </div>
          `}

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 24px;">
            <div>
              <label class="form-label">Ismingiz *</label>
              <input type="text" class="form-input" id="order-name" placeholder="Ismingizni kiriting" required />
            </div>
            <div>
              <label class="form-label">Telefon raqamingiz *</label>
              <input type="tel" class="form-input" id="order-phone" placeholder="+998 90 123 45 67" required />
            </div>
          </div>

          <div style="background: #f8fafc; border-radius: var(--radius-md); padding: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600; color: var(--muted);">Umumiy summa (${count} ta tovar):</span>
            <span style="font-size: 20px; font-weight: 800; color: var(--ink);">${totalFormatted}</span>
          </div>

          <button 
            type="button" 
            class="btn-primary" 
            style="width: 100%; justify-content: center; padding: 15px;"
            onclick="window.__submitOrder('${reqNum}')"
          >
            <span>Buyurtmani tasdiqlash</span>
            ${icon('arrow-right', '', 18)}
          </button>
        </div>
      </div>
    `;
  }

  return `
    <div class="shell cart-page-wrap">
      <!-- Breadcrumbs -->
      <nav class="breadcrumbs">
        <a href="#home">Bosh sahifa</a>
        <span>›</span>
        <span style="color: var(--ink); font-weight: 600;">Savat</span>
      </nav>

      <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 24px;">Savat</h1>

      <!-- Cart Item Cards -->
      <div class="cart-items-container">
        ${items.map(item => `
          <div class="cart-item-card" id="cart-item-${item.product.id}">
            <div class="cart-item-left">
              <img 
                src="${item.product.image}" 
                alt="${item.product.name}" 
                onerror="this.src='/brand/nevo-logo-sm.png';"
              />
              <div>
                <a href="#product/${item.product.id}" class="cart-item-name">${item.product.name}</a>
                <div class="cart-item-meta">
                  Kod: ${item.product.sku} · ${item.product.priceFormatted} / ${item.product.unit}
                </div>
              </div>
            </div>

            <div class="cart-item-controls">
              <button 
                type="button" 
                class="cart-qty-btn" 
                onclick="window.__updateCartQty('${item.product.id}', ${item.quantity - 1})"
                aria-label="Kamaytirish"
              >
                ${icon('minus', '', 14)}
              </button>
              <span class="cart-qty-val">${item.quantity}</span>
              <button 
                type="button" 
                class="cart-qty-btn" 
                onclick="window.__updateCartQty('${item.product.id}', ${item.quantity + 1})"
                aria-label="Ko'paytirish"
              >
                ${icon('plus', '', 14)}
              </button>
            </div>

            <div class="cart-item-price-col">
              <div class="cart-item-total">
                ${(item.product.price * item.quantity).toLocaleString('uz-UZ').replace(/,/g, ' ')} so'm
              </div>
              <button 
                type="button" 
                class="cart-item-delete-btn" 
                onclick="window.__removeCartItem('${item.product.id}')"
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
          <span class="cart-summary-label">${count} ta pozitsiya</span>
          <span class="cart-summary-val">${totalFormatted}</span>
        </div>
        <p style="font-size: 13.5px; color: var(--muted); line-height: 1.45; margin-bottom: 20px;">
          Bu — saytdagi narxlar bo'yicha hisob. Yakuniy summani va yetkazib berish narxini operatorimiz tasdiqlaydi.
        </p>

        <button 
          type="button" 
          class="cart-checkout-btn" 
          onclick="window.__toggleCheckout(true)"
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
    isCheckoutOpen = isOpen;
    rerenderCallback();
  };

  window.__setDeliveryMethod = (method) => {
    deliveryMethod = method;
    rerenderCallback();
  };

  window.__submitOrder = (reqNum) => {
    const name = document.getElementById('order-name')?.value?.trim();
    const phone = document.getElementById('order-phone')?.value?.trim();

    if (!name || !phone) {
      alert("Iltimos, ismingiz va telefon raqamingizni kiriting.");
      return;
    }

    const { items, totalFormatted } = store.getCartDetails();
    const itemsList = items.map(i => `• ${i.product.name} (${i.quantity} ${i.product.unit}) - ${i.product.priceFormatted}`).join('\n');
    
    // Clear cart & reset checkout
    store.clearCart();
    isCheckoutOpen = false;

    // Show success dialog
    const container = document.createElement('div');
    container.className = 'filter-modal-backdrop open';
    container.innerHTML = `
      <div class="filter-modal-card" style="text-align: center; max-width: 480px;">
        <div style="width: 60px; height: 60px; margin: 0 auto 16px; background: #dcfce7; color: #15803d; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          ${icon('check', '', 32)}
        </div>
        <h3 style="font-size: 22px; font-weight: 800; color: var(--ink); margin-bottom: 8px;">Buyurtmangiz qabul qilindi!</h3>
        <p style="font-size: 14.5px; color: var(--muted); margin-bottom: 12px;">So'rov raqami: <strong>${reqNum}</strong></p>
        <p style="font-size: 14.5px; color: var(--muted); margin-bottom: 24px; line-height: 1.5;">
          Tez orada operatorimiz siz bilan bog'lanib, tovarlar mavjudligi va yetkazib berish vaqtini tasdiqlaydi.
        </p>
        <button class="btn-primary" style="width: 100%; justify-content: center;" onclick="this.closest('.filter-modal-backdrop').remove(); window.location.hash='#catalog';">
          Katalogga qaytish
        </button>
      </div>
    `;
    document.body.appendChild(container);
    rerenderCallback();
  };
}
