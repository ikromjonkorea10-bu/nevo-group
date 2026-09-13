import { getCatalog, getProductById, getProductBySlug } from './lib/catalog.js';
import { esc, formatPrice } from './lib/format.js';

class Store {
  constructor() {
    this.cart = this.loadCart();
    this.listeners = [];
  }

  loadCart() {
    try {
      const saved = JSON.parse(localStorage.getItem('nevo_cart') || '[]');
      if (!Array.isArray(saved)) return [];
      return saved.filter(
        (item) => item && (typeof item.productId === 'number' || typeof item.productId === 'string')
          && Number.isInteger(item.quantity) && item.quantity > 0
      );
    } catch (e) {
      console.warn('Savatni localStorage\'dan o\'qib bo\'lmadi', e);
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem('nevo_cart', JSON.stringify(this.cart));
    } catch (e) {
      console.warn('Savatni localStorage\'ga yozib bo\'lmadi', e);
    }
    this.notify();
  }

  /**
   * Katalog yuklangach chaqiriladi: eski savatdagi "ng-1000" ko'rinishidagi
   * id'larni bazadagi raqamli id'ga almashtiradi va katalogda yo'q
   * mahsulotlarni olib tashlaydi.
   */
  syncWithCatalog() {
    if (getCatalog().status !== 'ready') return;
    let removed = 0;
    const merged = new Map();
    for (const item of this.cart) {
      const product = typeof item.productId === 'string' && !/^\d+$/.test(item.productId)
        ? getProductBySlug(item.productId)
        : getProductById(item.productId);
      if (!product) {
        removed += 1;
        continue;
      }
      merged.set(product.id, (merged.get(product.id) || 0) + item.quantity);
    }
    const next = [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity }));
    const changed = JSON.stringify(next) !== JSON.stringify(this.cart);
    this.cart = next;
    if (changed) this.saveCart();
    if (removed > 0) {
      this.showToast('Savatdagi ba\'zi mahsulotlar katalogdan olib tashlangan', 'error');
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notify() {
    this.listeners.forEach(cb => cb(this.getCartDetails()));
  }

  addToCart(productId, quantity = 1) {
    const id = Number(productId);
    const product = getProductById(id);
    if (product && !product.inStock) {
      this.showToast('Bu mahsulot hozir mavjud emas', 'error');
      return;
    }
    const existing = this.cart.find(item => item.productId === id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.cart.push({ productId: id, quantity });
    }
    this.saveCart();
    this.showToast('Savatga qo\'shildi');
  }

  removeFromCart(productId) {
    const id = Number(productId);
    this.cart = this.cart.filter(item => item.productId !== id);
    this.saveCart();
    this.showToast('Savatdan o\'chirildi');
  }

  updateQuantity(productId, quantity) {
    const id = Number(productId);
    if (quantity <= 0) {
      this.removeFromCart(id);
      return;
    }
    const item = this.cart.find(item => item.productId === id);
    if (item) {
      item.quantity = Math.min(quantity, 100000);
      this.saveCart();
    }
  }

  clearCart() {
    this.cart = [];
    this.saveCart();
  }

  getCartCount() {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  /** Savatdagi mahsulotlar katalog ma'lumotlari bilan. Narx faqat ko'rsatish uchun — yakuniy narx serverda hisoblanadi. */
  getCartDetails() {
    const items = this.cart
      .map(item => {
        const product = getProductById(item.productId);
        return product ? { ...item, product, lineTotal: product.price * item.quantity } : null;
      })
      .filter(Boolean);

    const total = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const count = this.getCartCount();

    return {
      items,
      count,
      total,
      totalFormatted: formatPrice(total),
      hasUnavailable: items.some(i => !i.product.inStock),
    };
  }

  showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      container.setAttribute('role', 'status');
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const path = type === 'error'
      ? '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>'
      : '<path d="M20 6 9 17l-5-5"/>';
    toast.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${path}
      </svg>
      <span>${esc(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }
}

export const store = new Store();
