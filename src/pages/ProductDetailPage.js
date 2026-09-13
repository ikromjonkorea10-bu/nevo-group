import { icon } from '../icons.js';
import { getCatalog, getProductBySlug } from '../lib/catalog.js';
import { esc } from '../lib/format.js';
import { store } from '../store.js';
import { renderProductCard } from '../components/ProductCard.js';
import { renderNotFound } from '../components/StatusViews.js';

let currentQty = 1;

export function renderProductDetailPage(slug) {
  const product = getProductBySlug(slug);
  currentQty = 1;

  if (!product) {
    return renderNotFound('Mahsulot topilmadi', "Bu mahsulot katalogdan olib tashlangan yoki havola noto'g'ri.");
  }

  // Find related products in same category
  const related = getCatalog().products
    .filter(p => p.categoryId === product.categoryId && p.id !== product.id && p.inStock)
    .slice(0, 4);
  const size = product.specs["O'lchami"];
  const material = product.specs['Materiali'];

  return `
    <div class="shell product-detail-wrap">
      <!-- Breadcrumbs -->
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="#home">Bosh sahifa</a>
        <span>›</span>
        <a href="#catalog">Katalog</a>
        <span>›</span>
        <a href="#bolim/${esc(product.categorySlug)}">${esc(product.category)}</a>
        ${product.subcategory ? `<span>›</span><span>${esc(product.subcategory)}</span>` : ''}
        <span>›</span>
        <span style="color: var(--ink); font-weight: 600;">${esc(product.name)}</span>
      </nav>

      <a href="#catalog" class="back-link">
        ${icon('chevron-left', '', 18)}
        <span>Katalogga qaytish</span>
      </a>

      <!-- Detail Grid -->
      <div class="product-detail-grid">
        <!-- Image Card -->
        <div class="product-detail-gallery">
          <img
            src="${esc(product.image)}"
            alt="${esc(product.name)}"
            onerror="this.onerror=null;this.src='/brand/nevo-logo-sm.png';"
          />
        </div>

        <!-- Info & Buy Box -->
        <div class="product-detail-info">
          <div class="product-badges-row">
            ${product.inStock ? '' : '<span class="badge-out-of-stock">Hozir mavjud emas</span>'}
            ${product.subcategory ? `<span class="badge-subcat">${esc(product.subcategory)}</span>` : ''}
            ${product.brand ? `<span class="badge-brand">${esc(product.brand)}</span>` : ''}
          </div>

          <h1 class="detail-title">${esc(product.name)}</h1>
          <p class="detail-subtitle">${esc(product.description || 'Suv liniyasi va qurilish uchun sifatli mahsulot')}</p>

          <div class="detail-buy-box">
            <div class="detail-price-row">
              <span class="detail-price-val">${esc(product.priceFormatted)}</span>
              <span class="detail-price-unit">/ ${esc(product.unit)}</span>
              ${product.oldPrice && product.oldPrice > product.price ? `<span class="product-old-price">${esc(product.oldPriceFormatted)}</span>` : ''}
            </div>

            <p class="detail-price-disclaimer">
              NEVO GROUP praysidagi narx. Miqdorga qarab chegirma bo'lishi mumkin — buyurtmadan oldin operator aniq narxni tasdiqlaydi.
            </p>

            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
              <div style="display: inline-flex; align-items: center; background: #f1f5f9; border-radius: 8px; padding: 4px 8px;">
                <button 
                  type="button" 
                  class="cart-qty-btn" 
                  onclick="window.__changeDetailQty(-1)"
                  aria-label="Kamaytirish"
                >
                  ${icon('minus', '', 14)}
                </button>
                <span id="detail-qty-display" style="padding: 0 12px; font-weight: 700; font-size: 15px;">1</span>
                <button 
                  type="button" 
                  class="cart-qty-btn" 
                  onclick="window.__changeDetailQty(1)"
                  aria-label="Ko'paytirish"
                >
                  ${icon('plus', '', 14)}
                </button>
              </div>
              <span style="font-size: 14px; color: var(--muted); font-weight: 500;">Dona / metr</span>
            </div>

            <div class="detail-actions-col">
              <button
                type="button"
                class="detail-add-btn"
                onclick="window.__addDetailProductToCart(${product.id})"
                ${product.inStock ? '' : 'disabled'}
              >
                ${icon('shopping-cart', '', 18)}
                <span>${product.inStock ? "Savatga qo'shish" : 'Hozir mavjud emas'}</span>
              </button>

              <a 
                href="https://ig.me/m/nevo_group_uzbekistan" 
                target="_blank" 
                rel="noopener"
                class="detail-inquire-btn"
              >
                ${icon('message-circle', '', 18)}
                <span>Shu mahsulot bo'yicha so'rash</span>
              </a>
            </div>

            ${product.sku ? `
              <div class="detail-sku-note">
                Mahsulot kodi: <strong>${esc(product.sku)}</strong>
              </div>
            ` : ''}
          </div>

          <!-- Specs List -->
          <div class="detail-specs-block">
            <h4>Nima bilan yaxshi</h4>
            <ul class="specs-check-list">
              <li>
                ${icon('check', '', 18)}
                <span>Suv liniyasi va qurilishda ishonchli xizmat</span>
              </li>
              <li>
                ${icon('check', '', 18)}
                <span>O'lchami: ${esc(size || 'Standart')}</span>
              </li>
              <li>
                ${icon('check', '', 18)}
                <span>Materiali: ${esc(material || 'Yuqori sifatli xomashyo')}</span>
              </li>
              <li>
                ${icon('check', '', 18)}
                <span>Narx NEVO GROUP praysidan olingan</span>
              </li>
              <li>
                ${icon('check', '', 18)}
                <span>Mavjudligini operatorimiz tasdiqlaydi</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Related Products -->
      ${related.length > 0 ? `
        <section class="home-section" style="margin-top: 60px;">
          <div class="section-head">
            <div>
              <h2 class="section-title">O'xshash mahsulotlar</h2>
              <div class="section-subtitle">Ushbu bo'limdagi boshqa tovarlar</div>
            </div>
            <a href="#bolim/${esc(product.categorySlug)}" class="section-link">
              <span>Bo'limdagi barcha tovarlar</span>
              ${icon('arrow-right', '', 16)}
            </a>
          </div>

          <div class="products-grid">
            ${related.map(renderProductCard).join('')}
          </div>
        </section>
      ` : ''}
    </div>
  `;
}

export function initProductDetailEvents() {
  window.__changeDetailQty = (delta) => {
    currentQty = Math.max(1, currentQty + delta);
    const el = document.getElementById('detail-qty-display');
    if (el) el.textContent = currentQty;
  };

  window.__addDetailProductToCart = (pid) => {
    store.addToCart(pid, currentQty);
  };
}
