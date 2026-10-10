// NEVO GROUP — Luxury Minimalist Product Card
import { icon } from '../icons.js';
import { esc } from '../lib/format.js';
import { t } from '../lib/i18n.js';
import { openProductModal } from './ProductModal.js';

// Global window handler to open modal
window.__openProductModal = (id, event) => {
  if (event) {
    // If user clicked add-to-cart button or a button inside, don't open modal
    if (event.target.closest('.product-add-btn') || event.target.closest('.card-action-btn')) {
      return;
    }
    event.preventDefault();
  }
  const numericId = Number(id);
  const catalog = window.__getCatalog ? window.__getCatalog() : null;
  const prod = catalog && catalog.products ? catalog.products.find((p) => p.id === numericId) : null;
  if (prod) {
    openProductModal(prod);
  }
};

export function renderProductCard(product) {
  if (!product) return '';
  const name = esc(product.name);
  const sku = product.sku || (product.id ? `NV-${String(product.id).padStart(4, '0')}` : '');
  const sizeSpec = product.size || (product.specs && product.specs["O'lchami"]) || '';
  const materialSpec = (product.specs && product.specs['Materiali']) || '';
  const specLine = [sizeSpec, materialSpec].filter(Boolean).join(' · ');

  const has3D = Boolean(product.has3d || (Array.isArray(product.images) && product.images.length >= 8));

  return `
    <article
      class="product-card nevo-style-card"
      id="card-${product.id}"
      data-product-id="${product.id}"
      onclick="window.__openProductModal(${product.id}, event)"
    >
      <a
        href="#product/${esc(product.slug)}"
        class="product-card-link-overlay"
        aria-label="${name} — ${t('viewPhoto')}"
      ></a>

      <!-- Image Area with Neutral Background & Aspect Ratio -->
      <div class="product-img-wrap" style="aspect-ratio: 1 / 1;">
        <!-- Top Left: SKU / Article Code Badge -->
        ${
          sku
            ? `
          <span class="card-sku-chip" title="${esc(t('skuLabel'))}: ${esc(sku)}">
            ${esc(sku)}
          </span>
        `
            : ''
        }

        <!-- Top Right: Badges (3D, Stock) -->
        <div class="card-top-badges">
          ${
            has3D
              ? `
            <span class="badge-3d-model" title="${t('view3D')}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              <span>${t('badge3D')}</span>
            </span>
          `
              : ''
          }
          ${
            product.inStock
              ? `
            <span class="badge-stock-pulse" title="${t('inStock')}">
              <span class="stock-pulse-dot"></span>
              <span>${t('inStock')}</span>
            </span>
          `
              : `
            <span class="badge-out-of-stock">${t('outOfStock')}</span>
          `
          }
        </div>

        <!-- Product Image -->
        <img
          src="${esc(product.image)}"
          alt="${name}"
          width="400"
          height="400"
          loading="lazy"
          decoding="async"
          class="product-card-img"
          onerror="this.onerror=null;this.src='/brand/nevo-logo-sm.png';"
        />

        <!-- Hover View Prompt -->
        <div class="card-hover-prompt" aria-hidden="true">
          <span class="hover-prompt-pill">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 3h6v6"></path><path d="m21 3-7 7"></path><path d="m3 21 7-7"></path><path d="M9 21H3v-6"></path>
            </svg>
            <span>${t('viewPhoto')}</span>
          </span>
        </div>
      </div>

      <!-- Card Body -->
      <div class="product-card-body">
        <h3 class="product-title" title="${name}">
          ${name}
        </h3>

        <!-- Optional Technical Specification line -->
        ${
          specLine
            ? `
          <div class="product-spec-line" title="${esc(specLine)}">
            ${esc(specLine)}
          </div>
        `
            : product.subcategory
              ? `
          <div class="product-spec-line">
            ${esc(product.subcategory)}
          </div>
        `
              : ''
        }

        <!-- Price & Unit -->
        <div class="product-price-row">
          <div class="product-price">
            <span class="price-val">${esc(product.priceFormatted)}</span>
            <span class="price-unit">/ ${esc(product.unit)}</span>
            ${
              product.oldPrice && product.oldPrice > product.price
                ? `
              <span class="product-old-price">${esc(product.oldPriceFormatted)}</span>
            `
                : ''
            }
          </div>
        </div>

        <!-- Action Button -->
        <div class="product-card-actions">
          <button
            type="button"
            class="product-add-btn"
            onclick="window.__addToCart(${product.id}, event)"
            aria-label="${name} ${t('addToCart')}"
            ${product.inStock ? '' : 'disabled'}
          >
            ${icon('shopping-cart', '', 16)}
            <span>${product.inStock ? t('addToCart') : t('outOfStock')}</span>
          </button>
        </div>
      </div>
    </article>
  `;
}
