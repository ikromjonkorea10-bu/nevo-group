import { PRODUCTS } from './data/products.js';

class Store {
  constructor() {
    this.cart = this.loadCart();
    this.listeners = [];
  }

  loadCart() {
    try {
      const saved = localStorage.getItem('nevo_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load cart from localStorage', e);
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem('nevo_cart', JSON.stringify(this.cart));
      this.notify();
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
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
    const existing = this.cart.find(item => item.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.cart.push({ productId, quantity });
    }
    this.saveCart();
    this.showToast('Savatga qo\'shildi');
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(item => item.productId !== productId);
    this.saveCart();
    this.showToast('Savatdan o\'chirildi');
  }

  updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    const item = this.cart.find(item => item.productId === productId);
    if (item) {
      item.quantity = quantity;
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

  getCartDetails() {
    const items = this.cart.map(item => {
      const product = PRODUCTS.find(p => p.id === item.productId);
      return {
        ...item,
        product: product || {
          id: item.productId,
          name: 'Noma\'lum mahsulot',
          price: 0,
          priceFormatted: '0 so\'m',
          unit: 'dona',
          sku: 'NG-UNKNOWN',
          image: '/brand/nevo-logo-sm.png'
        },
        lineTotal: (product ? product.price : 0) * item.quantity
      };
    });

    const total = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const count = items.reduce((sum, i) => sum + i.quantity, 0);

    return {
      items,
      count,
      total,
      totalFormatted: `${total.toLocaleString('uz-UZ').replace(/,/g, ' ')} so'm`
    };
  }

  showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6 9 17l-5-5"/>
      </svg>
      <span>${message}</span>
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
