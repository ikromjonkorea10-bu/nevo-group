import { icon } from '../icons.js';
import { store } from '../store.js';

export function renderMobileBottomNav(currentRoute = '') {
  const count = store.getCartCount();
  const isHome = currentRoute === '' || currentRoute === 'home';
  const isCatalog = currentRoute.startsWith('catalog') || currentRoute.startsWith('bolim');
  const isCart = currentRoute.startsWith('savat');
  const isContact = currentRoute.startsWith('aloqa');

  return `
    <nav class="bottom-nav-bar" id="mobile-bottom-nav">
      <div class="bottom-nav-grid">
        <a href="#home" class="bottom-nav-item ${isHome ? 'active' : ''}">
          ${icon('home', '', 20)}
          <span>Bosh sahifa</span>
        </a>

        <a href="#catalog" class="bottom-nav-item ${isCatalog ? 'active' : ''}">
          ${icon('layout-grid', '', 20)}
          <span>Katalog</span>
        </a>

        <a href="#savat" class="bottom-nav-item ${isCart ? 'active' : ''}">
          ${icon('shopping-cart', '', 20)}
          <span class="bottom-nav-badge" id="mobile-cart-badge" style="${count > 0 ? '' : 'display:none;'}">
            ${count}
          </span>
          <span>Savat</span>
        </a>

        <a href="#aloqa" class="bottom-nav-item ${isContact ? 'active' : ''}">
          ${icon('phone', '', 20)}
          <span>Aloqa</span>
        </a>
      </div>
    </nav>
  `;
}
