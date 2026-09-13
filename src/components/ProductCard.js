import { icon } from '../icons.js';

export function renderProductCard(product) {
  return `
    <article class="product-card" id="card-${product.id}">
      <a href="#product/${product.id}" class="product-card-link-overlay" aria-label="${product.name} batafsil"></a>
      
      <div class="product-img-wrap">
        <img 
          src="${product.image}" 
          alt="${product.name}" 
          loading="lazy"
          onerror="this.src='/brand/nevo-logo-sm.png';"
        />
      </div>

      <div class="product-card-body">
        <div class="product-badges-row">
          <span class="badge-stock-pulse">
            <span class="stock-pulse-dot"></span>
            <span>Omborda</span>
          </span>
          <span class="badge-subcat">${product.subcategory}</span>
        </div>

        <h3 class="product-title" title="${product.name}">
          ${product.name}
        </h3>

        <div class="product-price">
          ${product.priceFormatted}
        </div>

        <div class="product-meta">
          ${product.unit} · ${product.sku}
        </div>

        <button 
          type="button" 
          class="product-add-btn" 
          onclick="window.__addToCart('${product.id}', event)"
          aria-label="${product.name} savatga qo'shish"
        >
          ${icon('shopping-cart', '', 16)}
          <span>Savatga</span>
        </button>
      </div>
    </article>
  `;
}
