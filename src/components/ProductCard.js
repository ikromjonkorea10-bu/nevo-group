import { icon } from '../icons.js';
import { esc } from '../lib/format.js';

export function renderProductCard(product) {
  if (!product) return '';
  const name = esc(product.name);

  return `
    <article class="product-card" id="card-${product.id}">
      <a href="#product/${esc(product.slug)}" class="product-card-link-overlay" aria-label="${name} batafsil"></a>

      <div class="product-img-wrap">
        <img
          src="${esc(product.image)}"
          alt="${name}"
          loading="lazy"
          onerror="this.onerror=null;this.src='/brand/nevo-logo-sm.png';"
        />
      </div>

      <div class="product-card-body">
        <div class="product-badges-row">
          ${product.inStock ? `
            <span class="badge-stock-pulse">
              <span class="stock-pulse-dot"></span>
              <span>Omborda</span>
            </span>
          ` : `
            <span class="badge-out-of-stock">Mavjud emas</span>
          `}
          ${product.subcategory ? `<span class="badge-subcat">${esc(product.subcategory)}</span>` : ''}
        </div>

        <h3 class="product-title" title="${name}">
          ${name}
        </h3>

        <div class="product-price">
          ${esc(product.priceFormatted)}${product.oldPrice && product.oldPrice > product.price ? `<span class="product-old-price">${esc(product.oldPriceFormatted)}</span>` : ''}
        </div>

        <div class="product-meta">
          ${esc(product.unit)}${product.sku ? ` · ${esc(product.sku)}` : ''}
        </div>

        <button
          type="button"
          class="product-add-btn"
          onclick="window.__addToCart(${product.id}, event)"
          aria-label="${name} savatga qo'shish"
          ${product.inStock ? '' : 'disabled'}
        >
          ${icon('shopping-cart', '', 16)}
          <span>${product.inStock ? 'Savatga' : 'Mavjud emas'}</span>
        </button>
      </div>
    </article>
  `;
}
