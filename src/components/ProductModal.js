// NEVO GROUP — Luxury ProductModal & 3D Interactive Lightbox
// Replicates the interaction patterns of vero.uz with custom NEVO engineering styling

import { icon } from '../icons.js';
import { esc } from '../lib/format.js';
import { getCatalog, getProductBySlug } from '../lib/catalog.js';
import { t } from '../lib/i18n.js';
import { CONTACTS } from '../data/content.js';

let activeProduct = null;
let currentModalQty = 1;
let currentModalTab = 'photo'; // 'photo' | '3d'
let canvasAnimId = null;
let rotationAngle = 0;
let rotationPitch = 15;
let zoomScale = 1.0;
let isDragging = false;
let startX = 0;
let startY = 0;

export function getActiveModalProduct() {
  return activeProduct;
}

export function openProductModal(product) {
  if (!product) return;
  activeProduct = product;
  currentModalQty = 1;
  currentModalTab = product.badge === '3D' || product.has3d ? '3d' : 'photo';
  rotationAngle = 0;
  rotationPitch = 15;
  zoomScale = 1.0;

  // Sync URL query without page reload
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('open', product.slug);
    window.history.replaceState({ modalProduct: product.slug }, '', url.toString());
  } catch (e) {
    void e;
  }

  renderModalDOM();
  document.body.classList.add('modal-backdrop-open');
}

export function closeProductModal() {
  if (canvasAnimId) {
    cancelAnimationFrame(canvasAnimId);
    canvasAnimId = null;
  }
  activeProduct = null;
  document.body.classList.remove('modal-backdrop-open');

  const root = document.getElementById('product-modal-root');
  if (root) {
    root.innerHTML = '';
    root.classList.remove('active');
  }

  // Clear query param
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has('open')) {
      url.searchParams.delete('open');
      window.history.replaceState({}, '', url.toString());
    }
  } catch (e) {
    void e;
  }
}

function renderModalDOM() {
  let root = document.getElementById('product-modal-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'product-modal-root';
    document.body.appendChild(root);
  }

  if (!activeProduct) {
    root.innerHTML = '';
    root.classList.remove('active');
    return;
  }

  const p = activeProduct;
  const name = esc(p.name);
  const catalog = getCatalog();
  const relatedProducts = (catalog.products || [])
    .filter((item) => item.categoryId === p.categoryId && item.id !== p.id)
    .slice(0, 8);

  const size = p.size || (p.specs && p.specs["O'lchami"]) || '';
  const material = (p.specs && p.specs['Materiali']) || '';
  const manufacturer = (p.specs && p.specs['Ishlab chiqaruvchi']) || p.brand || 'NEVO';
  const sku = p.sku || `NV-${String(p.id).padStart(4, '0')}`;

  root.className = 'product-modal-root active';
  root.innerHTML = `
    <div class="product-modal-backdrop" id="product-modal-backdrop" aria-hidden="true"></div>
    <div class="product-modal-container" role="dialog" aria-modal="true" aria-label="${name}">
      
      <!-- Top Bar: Category breadcrumb & Close button -->
      <div class="product-modal-topbar">
        <div class="modal-breadcrumb-tags">
          <span class="modal-cat-tag">${esc(p.category || 'Katalog')}</span>
          ${p.subcategory ? `<span class="modal-subcat-tag">/ ${esc(p.subcategory)}</span>` : ''}
          ${sku ? `<span class="modal-sku-tag">ART: ${esc(sku)}</span>` : ''}
        </div>
        <button type="button" class="modal-close-btn" id="modal-close-trigger" aria-label="${t('escToClose')}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Main Modal Body Grid -->
      <div class="product-modal-body-grid">
        
        <!-- Left: Image Viewer & Interactive 3D Turntable -->
        <div class="modal-visual-column">
          <!-- View Switcher Tabs -->
          <div class="modal-view-tabs" role="tablist">
            <button type="button" class="modal-tab-btn ${currentModalTab === 'photo' ? 'active' : ''}" id="tab-btn-photo">
              ${icon('maximize', '', 14)}
              <span>${t('viewPhoto')}</span>
            </button>
            <button type="button" class="modal-tab-btn ${currentModalTab === '3d' ? 'active' : ''}" id="tab-btn-3d">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              <span>${t('view3D')}</span>
            </button>
          </div>

          <!-- Photo View Area -->
          <div class="modal-photo-area ${currentModalTab === 'photo' ? 'active' : ''}" id="modal-photo-wrapper">
            <div class="modal-img-container">
              <img
                src="${esc(p.image)}"
                alt="${name}"
                class="modal-main-img"
                id="modal-main-image"
                loading="eager"
                onerror="this.onerror=null;this.src='/brand/nevo-logo-sm.png';"
              />
              <div class="modal-img-zoom-lens" id="modal-zoom-lens" aria-hidden="true"></div>
            </div>
          </div>

          <!-- 3D Turntable Area -->
          <div class="modal-3d-area ${currentModalTab === '3d' ? 'active' : ''}" id="modal-3d-wrapper">
            <div class="turntable-canvas-wrap">
              <canvas id="product-3d-canvas" width="600" height="600"></canvas>
              <div class="turntable-hint-overlay">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                  <path d="M21 3v5h-5"></path>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                  <path d="M3 21v-5h5"></path>
                </svg>
                <span>${t('rotate3DHint')}</span>
              </div>
            </div>

            <!-- 3D Controls Bar -->
            <div class="turntable-controls-bar">
              <button type="button" class="turntable-ctrl-btn" id="ctrl-zoom-out" title="${t('zoomOut')}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
              <button type="button" class="turntable-ctrl-btn" id="ctrl-reset" title="${t('resetView')}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                <span>${t('resetView')}</span>
              </button>
              <button type="button" class="turntable-ctrl-btn" id="ctrl-zoom-in" title="${t('zoomIn')}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Right: Specs Table & Purchase Actions -->
        <div class="modal-info-column">
          <div class="modal-info-header">
            <h2 class="modal-product-title">${name}</h2>
            <div class="modal-badges-strip">
              ${
                p.inStock
                  ? `
                <span class="badge-stock-pulse">
                  <span class="stock-pulse-dot"></span>
                  <span>${t('inStock')}</span>
                </span>
              `
                  : `
                <span class="badge-out-of-stock">${t('outOfStock')}</span>
              `
              }
              ${p.badge ? `<span class="badge-accent-chip">${esc(p.badge)}</span>` : ''}
              <span class="badge-first-hand">Birinchi qo'l kafolati</span>
            </div>
          </div>

          <!-- Specifications Table (Exact Vero Table Layout) -->
          <div class="modal-specs-section">
            <div class="modal-specs-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="text-sky">
                <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z"></path>
                <path d="m14.5 12.5 2-2"></path>
                <path d="m11.5 9.5 2-2"></path>
                <path d="m8.5 6.5 2-2"></path>
                <path d="m17.5 15.5 2-2"></path>
              </svg>
              <span>${t('productDimensions')}</span>
            </div>

            <div class="modal-specs-table-wrap">
              <table class="modal-specs-table">
                <tbody>
                  ${
                    size
                      ? `
                    <tr>
                      <td class="spec-prop-name">${t('diameterCol')}</td>
                      <td class="spec-prop-val"><strong>${esc(size)}</strong></td>
                    </tr>
                  `
                      : ''
                  }
                  ${
                    p.unit
                      ? `
                    <tr>
                      <td class="spec-prop-name">${t('unitCol')}</td>
                      <td class="spec-prop-val">${esc(p.unit)}</td>
                    </tr>
                  `
                      : ''
                  }
                  ${
                    p.packQty
                      ? `
                    <tr>
                      <td class="spec-prop-name">${t('packQtyCol')}</td>
                      <td class="spec-prop-val">${esc(p.packQty)} ${esc(p.unit)}</td>
                    </tr>
                  `
                      : ''
                  }
                  ${
                    manufacturer
                      ? `
                    <tr>
                      <td class="spec-prop-name">${t('brandCol')}</td>
                      <td class="spec-prop-val">${esc(manufacturer)}</td>
                    </tr>
                  `
                      : ''
                  }
                  ${
                    material
                      ? `
                    <tr>
                      <td class="spec-prop-name">Materiali</td>
                      <td class="spec-prop-val">${esc(material)}</td>
                    </tr>
                  `
                      : ''
                  }
                  <tr>
                    <td class="spec-prop-name">${t('skuCol')}</td>
                    <td class="spec-prop-val"><code>${esc(sku)}</code></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p class="modal-specs-footnote">
              ${icon('info', '', 14)}
              <span>${t('specNote')}</span>
            </p>
          </div>

          <!-- Price & Actions Box -->
          <div class="modal-action-box">
            <div class="modal-price-strip">
              <div class="modal-price-wrap">
                <span class="modal-price-amount">${esc(p.priceFormatted)}</span>
                <span class="modal-price-unit">/ ${esc(p.unit)}</span>
                ${p.oldPrice && p.oldPrice > p.price ? `<span class="modal-price-old">${esc(p.oldPriceFormatted)}</span>` : ''}
              </div>
              <div class="modal-qty-control">
                <button type="button" class="qty-btn" id="modal-qty-minus" aria-label="Kamaytirish">
                  ${icon('minus', '', 14)}
                </button>
                <span class="qty-display" id="modal-qty-val">1</span>
                <button type="button" class="qty-btn" id="modal-qty-plus" aria-label="Ko'paytirish">
                  ${icon('plus', '', 14)}
                </button>
              </div>
            </div>

            <div class="modal-cta-buttons-row">
              <button
                type="button"
                class="btn-modal-cart"
                id="modal-add-cart-btn"
                onclick="window.__addToCart(${p.id}, event)"
                ${p.inStock ? '' : 'disabled'}
              >
                ${icon('shopping-cart', '', 18)}
                <span>${p.inStock ? t('addToCart') : t('outOfStock')}</span>
              </button>

              <a
                href="https://t.me/${CONTACTS.telegramBot.replace('@', '')}?start=order_${p.id}"
                target="_blank"
                rel="noopener"
                class="btn-modal-order"
                id="modal-order-btn"
              >
                ${icon('message-circle', '', 18)}
                <span>${t('orderNow')}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom: Related Assortment Slideshow -->
      ${
        relatedProducts.length > 0
          ? `
        <div class="modal-related-strip">
          <div class="modal-related-head">
            <span class="related-accent-line"></span>
            <h3 class="modal-related-title">${t('relatedProducts')}</h3>
          </div>
          <div class="modal-related-slider" id="modal-related-track">
            ${relatedProducts
              .map(
                (rel) => `
              <div class="modal-related-item" data-slug="${esc(rel.slug)}">
                <div class="rel-thumb-wrap">
                  <img src="${esc(rel.image)}" alt="${esc(rel.name)}" loading="lazy" onerror="this.src='/brand/nevo-logo-sm.png';">
                </div>
                <div class="rel-info">
                  <h4 class="rel-name" title="${esc(rel.name)}">${esc(rel.name)}</h4>
                  <div class="rel-price">${esc(rel.priceFormatted)}</div>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `
          : ''
      }

    </div>
  `;

  bindModalEvents();
  if (currentModalTab === '3d') {
    initTurntableCanvas();
  }
}

function bindModalEvents() {
  const root = document.getElementById('product-modal-root');
  if (!root) return;

  // Backdrop and Close
  const backdrop = document.getElementById('product-modal-backdrop');
  if (backdrop) backdrop.addEventListener('click', closeProductModal);

  const closeBtn = document.getElementById('modal-close-trigger');
  if (closeBtn) closeBtn.addEventListener('click', closeProductModal);

  // Tabs
  const tabPhoto = document.getElementById('tab-btn-photo');
  const tab3d = document.getElementById('tab-btn-3d');
  const photoWrapper = document.getElementById('modal-photo-wrapper');
  const d3Wrapper = document.getElementById('modal-3d-wrapper');

  if (tabPhoto && tab3d) {
    tabPhoto.addEventListener('click', () => {
      currentModalTab = 'photo';
      tabPhoto.classList.add('active');
      tab3d.classList.remove('active');
      if (photoWrapper) photoWrapper.classList.add('active');
      if (d3Wrapper) d3Wrapper.classList.remove('active');
      if (canvasAnimId) cancelAnimationFrame(canvasAnimId);
    });

    tab3d.addEventListener('click', () => {
      currentModalTab = '3d';
      tab3d.classList.add('active');
      tabPhoto.classList.remove('active');
      if (d3Wrapper) d3Wrapper.classList.add('active');
      if (photoWrapper) photoWrapper.classList.remove('active');
      initTurntableCanvas();
    });
  }

  // Quantity Counter
  const minus = document.getElementById('modal-qty-minus');
  const plus = document.getElementById('modal-qty-plus');
  const display = document.getElementById('modal-qty-val');

  if (minus && plus && display) {
    minus.addEventListener('click', () => {
      if (currentModalQty > 1) {
        currentModalQty -= 1;
        display.textContent = String(currentModalQty);
      }
    });
    plus.addEventListener('click', () => {
      currentModalQty += 1;
      display.textContent = String(currentModalQty);
    });
  }

  // 3D Controls
  const btnZoomIn = document.getElementById('ctrl-zoom-in');
  const btnZoomOut = document.getElementById('ctrl-zoom-out');
  const btnReset = document.getElementById('ctrl-reset');

  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', () => {
      zoomScale = Math.min(2.5, zoomScale + 0.25);
      drawTurntableFrame();
    });
  }
  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => {
      zoomScale = Math.max(0.6, zoomScale - 0.25);
      drawTurntableFrame();
    });
  }
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      rotationAngle = 0;
      rotationPitch = 15;
      zoomScale = 1.0;
      drawTurntableFrame();
    });
  }

  // Related product clicks
  document.querySelectorAll('.modal-related-item').forEach((item) => {
    item.addEventListener('click', () => {
      const slug = item.getAttribute('data-slug');
      const nextProduct = getProductBySlug(slug);
      if (nextProduct) openProductModal(nextProduct);
    });
  });

  // Desktop Hover Magnifying Zoom Lens on Photo
  const mainImg = document.getElementById('modal-main-image');
  const zoomLens = document.getElementById('modal-zoom-lens');
  const imgContainer = document.querySelector('.modal-img-container');

  if (mainImg && zoomLens && imgContainer) {
    imgContainer.addEventListener('mousemove', (e) => {
      if (window.innerWidth < 900) return;
      const rect = imgContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        zoomLens.classList.remove('active');
        return;
      }

      zoomLens.classList.add('active');
      const lensRadius = 70;
      zoomLens.style.left = `${x - lensRadius}px`;
      zoomLens.style.top = `${y - lensRadius}px`;
      zoomLens.style.backgroundImage = `url("${mainImg.src}")`;
      zoomLens.style.backgroundRepeat = 'no-repeat';

      const zoomFactor = 2.4;
      zoomLens.style.backgroundSize = `${rect.width * zoomFactor}px ${rect.height * zoomFactor}px`;
      zoomLens.style.backgroundPosition = `-${x * zoomFactor - lensRadius}px -${y * zoomFactor - lensRadius}px`;
    });

    imgContainer.addEventListener('mouseleave', () => {
      if (zoomLens) zoomLens.classList.remove('active');
    });
  }
}

// Interactive 3D Turntable Rendering Engine
function initTurntableCanvas() {
  const canvas = document.getElementById('product-3d-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Touch and mouse drag listeners
  const onPointerDown = (clientX, clientY) => {
    isDragging = true;
    startX = clientX;
    startY = clientY;
  };

  const onPointerMove = (clientX, clientY) => {
    if (!isDragging) return;
    const dx = clientX - startX;
    const dy = clientY - startY;
    startX = clientX;
    startY = clientY;

    rotationAngle += dx * 0.8;
    rotationPitch = Math.max(-45, Math.min(65, rotationPitch - dy * 0.5));
    drawTurntableFrame();
  };

  const onPointerUp = () => {
    isDragging = false;
  };

  canvas.addEventListener('mousedown', (e) => onPointerDown(e.clientX, e.clientY));
  window.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY));
  window.addEventListener('mouseup', onPointerUp);

  canvas.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length === 1) {
        onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    { passive: true }
  );

  canvas.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches.length === 1) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    { passive: true }
  );

  window.addEventListener('touchend', onPointerUp);

  drawTurntableFrame();
}

function drawTurntableFrame() {
  const canvas = document.getElementById('product-3d-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Background Studio Lighting Gradient
  const grad = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.45);
  grad.addColorStop(0, 'rgba(14, 165, 233, 0.12)');
  grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.4)');
  grad.addColorStop(1, 'rgba(7, 13, 27, 0.95)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Turntable circular grid floor
  const cy = h * 0.72;
  ctx.save();
  ctx.translate(w / 2, cy);
  ctx.scale(1, 0.32);

  ctx.beginPath();
  ctx.arc(0, 0, 210 * zoomScale, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, 140 * zoomScale, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Spokes
  for (let a = 0; a < 360; a += 45) {
    const rad = ((a + rotationAngle) * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(rad) * 210 * zoomScale, Math.sin(rad) * 210 * zoomScale);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.stroke();
  }
  ctx.restore();

  // Draw 3D Isometric Cylinder / Pipe Geometry Projection
  ctx.save();
  ctx.translate(w / 2, h * 0.44);
  ctx.scale(zoomScale, zoomScale);

  const rad = (rotationAngle * Math.PI) / 180;
  const pitchRad = (rotationPitch * Math.PI) / 180;

  // Dynamic 3D Pipe Model Projection
  const radius = 80;
  const pipeLen = 170;
  const numSegments = 32;

  // Top and bottom ellipses
  const yOffset = Math.sin(pitchRad) * 45;

  // Shading based on light source
  const lightAngle = Math.PI * 0.25;

  // Pipe Body Faces
  ctx.beginPath();
  for (let i = 0; i < numSegments; i++) {
    const a1 = (i / numSegments) * Math.PI * 2 + rad;
    const a2 = ((i + 1) / numSegments) * Math.PI * 2 + rad;

    const x1 = Math.cos(a1) * radius;
    const z1 = Math.sin(a1) * radius;
    const x2 = Math.cos(a2) * radius;
    const z2 = Math.sin(a2) * radius;

    // Only draw front faces
    if (z1 + z2 > -40) {
      const shade = Math.max(0.2, Math.min(1.0, (Math.cos(a1 - lightAngle) + 1.2) * 0.45));
      ctx.fillStyle = `rgb(${Math.floor(14 * shade + 18)}, ${Math.floor(165 * shade + 40)}, ${Math.floor(233 * shade + 15)})`;

      ctx.beginPath();
      ctx.moveTo(x1, -pipeLen / 2 + yOffset * 0.4);
      ctx.lineTo(x2, -pipeLen / 2 + yOffset * 0.4);
      ctx.lineTo(x2, pipeLen / 2 - yOffset * 0.4);
      ctx.lineTo(x1, pipeLen / 2 - yOffset * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

  // Flange rim rings
  [-pipeLen / 2 + yOffset * 0.4, pipeLen / 2 - yOffset * 0.4].forEach((posY, idx) => {
    ctx.save();
    ctx.translate(0, posY);
    ctx.scale(1, 0.35 + Math.sin(pitchRad) * 0.2);

    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.15, 0, Math.PI * 2);
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = idx === 0 ? 'rgba(56, 189, 248, 0.35)' : 'rgba(7, 13, 27, 0.8)';
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });

  // Central Branding Badge on Pipe
  ctx.save();
  const badgeX = Math.cos(rad) * (radius + 2);
  const badgeZ = Math.sin(rad) * (radius + 2);
  if (badgeZ > 0) {
    ctx.translate(badgeX, 0);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NEVO · PN25', 0, 5);
  }
  ctx.restore();

  ctx.restore();
}

// Global Keyboard Handler (Escape closes modal)
export function initProductModalGlobal() {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeProduct) {
      closeProductModal();
    }
  });

  // Check URL query param on page load
  try {
    const url = new URL(window.location.href);
    const openSlug = url.searchParams.get('open');
    if (openSlug) {
      const catalog = getCatalog();
      if (catalog.status === 'ready') {
        const prod = getProductBySlug(openSlug);
        if (prod) openProductModal(prod);
      }
    }
  } catch (e) {
    void e;
  }
}
