import { icon } from '../icons.js';
import { getCatalog, getProductBySlug } from '../lib/catalog.js';
import { esc } from '../lib/format.js';
import { store } from '../store.js';
import { renderProductCard } from '../components/ProductCard.js';
import { renderNotFound } from '../components/StatusViews.js';
import { CONTACTS } from '../data/content.js';
import { t } from '../lib/i18n.js';

let currentQty = 1;

export function renderProductDetailPage(slug) {
  const product = getProductBySlug(slug);
  currentQty = 1;

  if (!product) {
    return renderNotFound(
      t('categoryNotFound'),
      t('categoryNotFoundDesc'),
      { categories: getCatalog().categories }
    );
  }

  // Find related products in same category
  const related = getCatalog().products
    .filter(p => p.categoryId === product.categoryId && p.id !== product.id && p.inStock)
    .slice(0, 4);

  const size = product.size || (product.specs && product.specs["O'lchami"]) || '';
  const material = (product.specs && product.specs['Materiali']) || '';
  const manufacturer = (product.specs && product.specs['Ishlab chiqaruvchi']) || product.brand || 'NEVO';
  const sku = product.sku || `NV-${String(product.id).padStart(4, '0')}`;

  const characteristics = [
    [t('brandCol'), manufacturer],
    [t('diameterCol'), size],
    [t('unitCol'), product.unitFormatted || product.unit],
    [t('packQtyCol'), product.packQty ? `${product.packQty} ${product.unitFormatted || product.unit}`.trim() : ''],
    [t('materialCol'), material],
    [t('skuCol'), sku],
  ].filter(([, value]) => Boolean(value));

  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: product.image.startsWith('http') ? product.image : `https://nevogroup.uz${product.image}`,
    description: product.description || `${product.name} — NEVO GROUP rasmiy omboridan`,
    sku: sku,
    brand: {
      '@type': 'Brand',
      name: manufacturer,
    },
    offers: {
      '@type': 'Offer',
      url: `https://nevogroup.uz/katalog/mahsulot/${product.slug}`,
      priceCurrency: 'UZS',
      price: product.price,
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'NEVO GROUP',
      },
    },
  };

  const telegramLink = `https://t.me/${CONTACTS.telegramBot.replace('@', '')}?start=order_${product.id}`;

  return `
    <div class="shell product-detail-wrap">
      <!-- Breadcrumbs -->
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">${t('breadHome')}</a>
        <span>›</span>
        <a href="/katalog">${t('breadCatalog')}</a>
        <span>›</span>
        <a href="/katalog/${esc(product.categorySlug)}">${esc(product.category)}</a>
        ${product.subcategory ? `<span>›</span><span>${esc(product.subcategory)}</span>` : ''}
        <span>›</span>
        <span style="color: var(--ink); font-weight: 600;">${esc(product.name)}</span>
      </nav>

      <a href="/katalog/${esc(product.categorySlug)}" class="back-link">
        ${icon('chevron-left', '', 18)}
        <span>${t('backToCatalog')}</span>
      </a>

      <!-- Detail Grid -->
      <div class="product-detail-grid">
        <!-- Image Card -->
        <div class="product-detail-gallery">
          <div class="detail-gallery-main">
            <img
              src="${esc(product.image)}"
              alt="${esc(product.name)}"
              width="600"
              height="600"
              fetchpriority="high"
              decoding="async"
              class="detail-gallery-img"
              onerror="this.onerror=null;this.src='/brand/nevo-logo-sm.png';"
            />
          </div>
        </div>

        <!-- Info & Buy Box -->
        <div class="product-detail-info">
          <div class="product-badges-row">
            ${product.inStock ? `<span class="badge-stock-pulse"><span class="stock-pulse-dot"></span><span>${t('inStock')}</span></span>` : `<span class="badge-out-of-stock">${t('outOfStock')}</span>`}
            ${product.subcategory ? `<span class="badge-subcat">${esc(product.subcategory)}</span>` : ''}
            ${product.brand ? `<span class="badge-brand">${esc(product.brand)}</span>` : ''}
            <span class="badge-first-hand">${t('badgeFirstHand')}</span>
          </div>

          <h1 class="detail-title">${esc(product.name)}</h1>
          <p class="detail-subtitle">${esc(product.description || t('catalogSub'))}</p>

          <div class="detail-buy-box">
            <div class="detail-price-row">
              <span class="detail-price-val">${esc(product.priceFormatted)}</span>
              <span class="detail-price-unit">/ ${esc(product.unitFormatted || product.unit)}</span>
              ${product.oldPrice && product.oldPrice > product.price ? `<span class="product-old-price">${esc(product.oldPriceFormatted)}</span>` : ''}
            </div>

            <p class="price-note">
              ${icon('info', '', 14)}
              <span>${t('priceNote')}</span>
            </p>

            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
              <div style="display: inline-flex; align-items: center; background: #f1f5f9; border-radius: 8px; padding: 4px 8px;">
                <button 
                  type="button" 
                  class="cart-qty-btn" 
                  onclick="window.__changeDetailQty(-1)"
                  aria-label="${t('decreaseQty')}"
                >
                  ${icon('minus', '', 14)}
                </button>
                <span id="detail-qty-display" style="padding: 0 12px; font-weight: 700; font-size: 15px; color: #0F172A;">1</span>
                <button 
                  type="button" 
                  class="cart-qty-btn" 
                  onclick="window.__changeDetailQty(1)"
                  aria-label="${t('increaseQty')}"
                >
                  ${icon('plus', '', 14)}
                </button>
              </div>
              <span style="font-size: 14px; color: var(--muted); font-weight: 500;">
                ${esc(product.unitFormatted || product.unit)}${product.packQty ? ` · ${t('packQuantity')} ${esc(product.packQty)}` : ''}
              </span>
            </div>

            <div class="detail-actions-col">
              <button
                type="button"
                class="detail-add-btn"
                onclick="window.__addDetailProductToCart(${product.id})"
                ${product.inStock ? '' : 'disabled'}
              >
                ${icon('shopping-cart', '', 18)}
                <span>${product.inStock ? t('addToCart') : t('outOfStock')}</span>
              </button>

              <a 
                href="${telegramLink}"
                target="_blank" 
                rel="noopener"
                class="detail-inquire-btn"
              >
                ${icon('message-circle', '', 18)}
                <span>${t('inquireAboutProduct')}</span>
              </a>
            </div>

            <div class="detail-meta-row">
              ${sku ? `
                <div class="detail-sku-note">
                  ${t('skuCol')}: <strong>${esc(sku)}</strong>
                </div>
              ` : '<span></span>'}
              <button type="button" class="detail-share-btn" data-slug="${esc(product.slug)}" data-name="${esc(product.name)}" onclick="window.__shareProduct(this.dataset.slug, this.dataset.name)">
                ${icon('share', '', 15)}
                <span>${t('shareProduct')}</span>
              </button>
            </div>
          </div>

          ${characteristics.length ? `
            <div class="detail-specs-block">
              <h4>${t('specsTableHeading')}</h4>
              <dl class="detail-char-table">
                ${characteristics.map(([label, value]) => `
                  <div class="detail-char-row">
                    <dt>${esc(label)}</dt>
                    <dd>${esc(value)}</dd>
                  </div>
                `).join('')}
              </dl>
            </div>
          ` : ''}

          <!-- Highlights List -->
          <div class="detail-specs-block">
            <h4>${t('productBenefits')}</h4>
            <ul class="specs-check-list">
              <li>
                ${icon('check', '', 18)}
                <span>${t('benefitReliable')}</span>
              </li>
              ${material ? `
                <li>
                  ${icon('check', '', 18)}
                  <span>${t('materialCol')}: ${esc(material)}</span>
                </li>
              ` : ''}
              <li>
                ${icon('check', '', 18)}
                <span>${t('benefitPriceOrigin')}</span>
              </li>
              <li>
                ${icon('check', '', 18)}
                <span>${t('benefitStockConfirm')}</span>
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
              <h2 class="section-title">${t('relatedProducts')}</h2>
              <div class="section-subtitle">${t('relatedProductsSub')}</div>
            </div>
            <a href="/katalog/${esc(product.categorySlug)}" class="section-link">
              <span>${t('allCategoryProducts')}</span>
              ${icon('arrow-right', '', 16)}
            </a>
          </div>

          <div class="products-grid">
            ${related.map(renderProductCard).join('')}
          </div>
        </section>
      ` : ''}

      <!-- JSON-LD Product Structured Data -->
      <script type="application/ld+json">
        ${JSON.stringify(jsonLd)}
      </script>
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

  // /p/<slug> — Telegram va boshqa ilovalarda mahsulot nomi va surati bilan chiqadigan havola
  window.__shareProduct = async (slug, name) => {
    const url = `${window.location.origin}/p/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      store.showToast(t('copyLinkSuccess'));
    } catch {
      window.prompt(t('copyLinkSuccess'), url);
    }
  };
}
