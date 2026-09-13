import { icon } from '../icons.js';
import { store } from '../store.js';
import { PRODUCTS } from '../data/products.js';
import { CATEGORIES } from '../data/categories.js';

export function renderHeader() {
  const cartCount = store.getCartCount();

  return `
    <aside class="top-bar">
      <div class="shell">
        <span class="top-badge">
          <span>🇺🇿</span>
          <span>O'zbekiston bo'ylab yetkazib berish</span>
        </span>
        <div class="top-links">
          <a href="#aloqa" class="top-link">Biz bilan bog'lanish</a>
          <a href="https://instagram.com/nevo_group_uzbekistan" target="_blank" rel="noopener" class="top-link">
            ${icon('instagram', '', 14)}
            <span>@nevo_group_uzbekistan</span>
          </a>
          <a href="tel:+998952601100" class="top-link">
            ${icon('phone', '', 14)}
            <span>+998 95 260 11 00</span>
          </a>
        </div>
      </div>
    </aside>

    <header class="main-header">
      <div class="shell">
        <div class="header-main-row">
          <a href="#home" class="brand-logo" id="logo-link">
            <img src="/brand/nevo-logo.png" alt="NEVO GROUP" onerror="this.src='/brand/nevo-logo-sm.png';">
            <div class="brand-title">
              <span class="brand-name">NEVO GROUP</span>
            </div>
          </a>

          <a href="#catalog" class="catalog-trigger-btn">
            ${icon('menu', '', 18)}
            <span>Katalog</span>
          </a>

          <div class="header-search-wrap">
            <form class="header-search-form" id="header-search-form" onsubmit="event.preventDefault();">
              <input 
                type="text" 
                class="header-search-input" 
                id="header-search-input" 
                placeholder="Mahsulot qidirish..." 
                autocomplete="off"
              />
              <button type="submit" class="header-search-btn" aria-label="Qidirish">
                ${icon('search', '', 18)}
              </button>
            </form>
            <div class="search-results-dropdown" id="search-dropdown"></div>
          </div>

          <div class="header-actions">
            <a href="#savat" class="header-icon-btn" aria-label="Savat">
              ${icon('shopping-cart', '', 20)}
              <span class="cart-count-badge" id="header-cart-badge" style="${cartCount > 0 ? '' : 'display:none;'}">
                ${cartCount}
              </span>
            </a>
            <a href="tel:+998952601100" class="header-icon-btn" aria-label="Qo'ng'iroq qilish">
              ${icon('phone', '', 20)}
            </a>
          </div>
        </div>

        <nav class="header-nav-subrow">
          ${CATEGORIES.map(cat => `
            <div class="nav-category-item" data-cat="${cat.slug}">
              <a href="#bolim/${cat.slug}" class="nav-category-link">
                <span>${cat.name}</span>
                ${icon('chevron-down', '', 13)}
              </a>
              <div class="nav-mega-dropdown">
                <div class="mega-dropdown-inner">
                  <div class="mega-subcategories">
                    <div class="mega-subcat-title">${cat.name} bo'limlari</div>
                    <div class="mega-subcat-grid">
                      ${cat.subcategories.map(sub => `
                        <a href="#catalog?category=${cat.slug}&sub=${encodeURIComponent(sub.name)}" class="mega-subcat-link">
                          <span class="subcat-dot"></span>
                          <span class="subcat-name">${sub.name}</span>
                          <span class="subcat-count">${sub.count}</span>
                        </a>
                      `).join('')}
                    </div>
                  </div>
                  <div class="mega-featured-side">
                    <div class="mega-thumb-wrap">
                      <img src="${cat.image}" alt="${cat.name}" onerror="this.src='/brand/nevo-logo-sm.png';">
                    </div>
                    <div class="mega-thumb-info">
                      <div class="mega-cat-badge">${cat.count} ta mahsulot</div>
                      <a href="#bolim/${cat.slug}" class="mega-view-all">
                        <span>Bo'limga o'tish</span>
                        ${icon('arrow-right', '', 14)}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </nav>
      </div>
    </header>
  `;
}

export function initHeaderEvents() {
  const searchInput = document.getElementById('header-search-input');
  const dropdown = document.getElementById('search-dropdown');
  const form = document.getElementById('header-search-form');

  if (searchInput && dropdown) {
    let timeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      const query = e.target.value.trim().toLowerCase();

      if (query.length < 2) {
        dropdown.classList.remove('active');
        dropdown.innerHTML = '';
        return;
      }

      timeout = setTimeout(() => {
        const matches = PRODUCTS.filter(p => 
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.subcategory.toLowerCase().includes(query)
        ).slice(0, 6);

        if (matches.length === 0) {
          dropdown.innerHTML = `
            <div style="padding: 16px; text-align: center; color: var(--muted); font-size: 14px;">
              "${query}" bo'yicha mahsulot topilmadi.
            </div>
          `;
        } else {
          dropdown.innerHTML = matches.map(p => `
            <a href="#product/${p.id}" class="search-result-item" onclick="document.getElementById('search-dropdown').classList.remove('active')">
              <img src="${p.image}" alt="${p.name}" onerror="this.src='/brand/nevo-logo-sm.png';">
              <div class="search-result-info">
                <div class="search-result-title">${p.name}</div>
                <div class="search-result-sub">
                  <span>${p.subcategory}</span>
                  <span>·</span>
                  <span>${p.sku}</span>
                </div>
              </div>
              <div class="search-result-price">${p.priceFormatted}</div>
            </a>
          `).join('') + `
            <a href="#catalog?search=${encodeURIComponent(query)}" style="display: block; padding: 10px; text-align: center; background: #f8fafc; font-size: 13.5px; font-weight: 600; color: var(--nevo-blue); border-top: 1px solid var(--border);">
              Barcha natijalarni ko'rish (${matches.length}+) →
            </a>
          `;
        }
        dropdown.classList.add('active');
      }, 200);
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = searchInput.value.trim();
        if (val) {
          dropdown.classList.remove('active');
          window.location.hash = `#catalog?search=${encodeURIComponent(val)}`;
        }
      });
    }
  }

  // Subscribe cart changes to update header cart badge
  store.subscribe(({ count }) => {
    const badge = document.getElementById('header-cart-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
    const mobileBadge = document.getElementById('mobile-cart-badge');
    if (mobileBadge) {
      mobileBadge.textContent = count;
      mobileBadge.style.display = count > 0 ? 'flex' : 'none';
    }
  });
}
