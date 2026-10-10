// NEVO GROUP — Luxury Catalog Architecture (Index & Category Pages)
// Bespoke high-performance industrial engineering catalog with custom NEVO design

import { icon } from '../icons.js';
import { getCatalog, getCategoryBySlug, getProductBySlug } from '../lib/catalog.js';
import { esc, slugify } from '../lib/format.js';
import { t, getLang } from '../lib/i18n.js';
import { renderProductCard } from '../components/ProductCard.js';
import { openProductModal } from '../components/ProductModal.js';
import { renderQuickSearchTrigger } from '../components/QuickSearch.js';
import { PDF_CATALOGS } from '../data/catalogs.js';
import Swiper from 'swiper';
import { Navigation, Pagination, Keyboard, FreeMode } from 'swiper/modules';

// Category High-Res Industrial Cover Mappings
const CATEGORY_COVERS = {
  'truba-va-fitinglar': '/images/catalog-slides/slide-pipes.jpg',
  'zapor-armatura': '/images/catalog-slides/slide-valves.jpg',
  'yongin-jihozlari': '/images/categories/hdpe-pipes.webp',
  'isitish-tizimi': '/images/categories/valves-fittings.webp',
  'elektr-jihozlari': '/mahsulot/ktp-ktps.webp',
};

// Line-art Icon SVGs per category
function getCategoryIconSvg(slug) {
  switch (slug) {
    case 'truba-va-fitinglar':
      return `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"></path>
          <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"></path>
        </svg>
      `;
    case 'zapor-armatura':
      return `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 5H3"></path><path d="M12 19H3"></path>
          <path d="M14 3v4"></path><path d="M16 17v4"></path>
          <path d="M21 12h-9"></path><path d="M21 19h-5"></path>
          <path d="M21 5h-7"></path><path d="M8 10v4"></path><path d="M8 12H3"></path>
        </svg>
      `;
    case 'yongin-jihozlari':
      return `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          <path d="M12 8v4"></path><path d="M12 16h.01"></path>
        </svg>
      `;
    case 'isitish-tizimi':
      return `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"></path>
        </svg>
      `;
    case 'elektr-jihozlari':
      return `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
      `;
    default:
      return `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.12 6.4-6-3.87a3 3 0 0 0-3.24 0l-6 3.87a3 3 0 0 0-1.88 2.6v7.74a3 3 0 0 0 1.88 2.6l6 3.87a3 3 0 0 0 3.24 0l6-3.87a3 3 0 0 0 1.88-2.6V9a3 3 0 0 0-1.88-2.6z"></path>
        </svg>
      `;
  }
}

/**
 * Main Catalog Renderer
 * Supports:
 * - /catalog (Index page with Hero Video, Main Slideshow, Stacking Cards, PDF Catalogs)
 * - /catalog/<slug> (Category detail page with Hero, Sticky Chip Nav, Groups H2, Subgroups H3, Product Grid)
 */
export function renderCatalogPage(params = {}, _routeKey = '') {
  const { categories, products } = getCatalog();
  const categorySlug = params.category || params.slug;

  if (categorySlug && categorySlug !== 'all') {
    const category = categories.find((c) => c.slug === categorySlug) || getCategoryBySlug(categorySlug);
    if (!category) {
      return renderCategoryNotFound();
    }
    const catProducts = products.filter((p) => p.categoryId === category.id || p.categorySlug === categorySlug);
    return renderCategoryDetailPage(category, catProducts, params);
  }

  return renderCatalogIndexPage(categories, products);
}

/**
 * INDEX PAGE: /catalog
 */
function renderCatalogIndexPage(categories, _products) {
  const lang = getLang();

  return `
    <div class="catalog-index-wrapper">
      
      <!-- 1. CatalogHero: Full-width background video with dark overlay -->
      <section class="catalog-hero-fullscreen" id="catalog-hero">
        <div class="catalog-hero-video-bg">
          <video
            src="/videos/pipeline-showcase.webm"
            poster="/images/catalog-slides/slide-pipes.jpg"
            autoplay
            muted
            loop
            playsinline
            preload="metadata"
            aria-hidden="true"
            class="catalog-hero-video"
          ></video>
          <div class="catalog-hero-dark-overlay"></div>
          <div class="catalog-hero-radial-glow"></div>
        </div>

        <div class="shell catalog-hero-inner">
          <div class="catalog-hero-content-box">
            <div class="catalog-hero-tag">
              <span class="hero-tag-pulse"></span>
              <span>NEVO GROUP · SANOAT ASSORTIMENTI</span>
            </div>

            <h1 class="catalog-hero-h1">
              ${t('catalogTitle')}<br>
              <span class="text-gradient-sky">NEVO GROUP</span>
            </h1>

            <p class="catalog-hero-desc">
              ${t('catalogSub')}
            </p>

            <div class="catalog-hero-actions">
              <a href="#category-slideshow-section" class="btn-catalog-explore" id="scroll-to-categories">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M15 3h6v6"></path><path d="m21 3-7 7"></path><path d="m3 21 7-7"></path><path d="M9 21H3v-6"></path>
                </svg>
                <span>${t('viewCatalogBtn')}</span>
              </a>

              <button type="button" class="btn-hero-quicksearch" onclick="window.__openQuickSearch()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <span>Qidirish</span>
                <kbd class="hero-kbd-badge">⌘K</kbd>
              </button>
            </div>
          </div>
        </div>

        <!-- Sticky Quick Search Bar beneath hero -->
        <div class="catalog-sticky-search-holder">
          <div class="shell">
            ${renderQuickSearchTrigger()}
          </div>
        </div>
      </section>

      <!-- 2. CategorySlideshow: Large Tall Cover Cards (Swiper Horizontal) -->
      <section class="catalog-slideshow-section" id="category-slideshow-section">
        <div class="shell">
          <div class="section-title-strip">
            <div class="title-left">
              <span class="section-indicator-pill"></span>
              <h2 class="section-title-h2">Asosiy Bo'limlar</h2>
            </div>
            <div class="slideshow-nav-arrows">
              <button type="button" class="swiper-btn-prev" id="cat-swiper-prev" aria-label="Oldingi bo'lim">
                ${icon('chevron-left', '', 20)}
              </button>
              <button type="button" class="swiper-btn-next" id="cat-swiper-next" aria-label="Keyingi bo'lim">
                ${icon('chevron-right', '', 20)}
              </button>
            </div>
          </div>

          <!-- Swiper Container for Categories -->
          <div class="swiper" id="category-swiper-slider">
            <div class="swiper-wrapper">
              ${categories
                .map((cat) => {
                  const cover = CATEGORY_COVERS[cat.slug] || cat.image || '/images/catalog-slides/slide-pipes.jpg';
                  const countText = `${cat.count} ${t('productsWord')}`;
                  return `
                  <div class="swiper-slide category-tall-slide">
                    <a href="#catalog/${esc(cat.slug)}" class="category-cover-card" data-slug="${esc(cat.slug)}">
                      <div class="cat-card-bg-wrap">
                        <img
                          src="${esc(cover)}"
                          alt="${esc(cat.name)}"
                          loading="lazy"
                          class="cat-card-bg-img"
                          onerror="this.src='/images/catalog-slides/slide-pipes.jpg';"
                        />
                        <div class="cat-card-dark-gradient"></div>
                      </div>

                      <div class="cat-card-top">
                        <div class="cat-card-icon-pill">
                          ${getCategoryIconSvg(cat.slug)}
                        </div>
                        <span class="cat-card-count-badge">${countText}</span>
                      </div>

                      <div class="cat-card-bottom">
                        <h3 class="cat-card-title">${esc(cat.name)}</h3>
                        <p class="cat-card-sub">${esc(cat.shortDesc)}</p>
                        
                        <div class="cat-card-cta-row">
                          <span class="cat-open-btn">
                            <span>${t('openCategory')}</span>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="arrow-icon">
                              <path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>
                            </svg>
                          </span>
                        </div>
                      </div>
                    </a>
                  </div>
                `;
                })
                .join('')}
            </div>
            <div class="swiper-pagination" id="cat-swiper-pagination"></div>
          </div>
        </div>
      </section>

      <!-- 3. Stacking Cards Scroll Experience (NEVO Signature Pattern) -->
      <section class="catalog-stacking-section" id="stacking-cards-section">
        <div class="shell">
          <div class="stacking-section-header">
            <h2 class="stacking-title">Muhandislik Tizimlari Katalogi</h2>
            <p class="stacking-sub">Har bir bo'lim bo'yicha to'liq tovar assortimenti va texnik xarakteristikalari</p>
          </div>

          <div class="stacking-cards-track" id="stacking-track">
            ${categories
              .map((cat, idx) => {
                const cover = CATEGORY_COVERS[cat.slug] || cat.image || '/images/catalog-slides/slide-pipes.jpg';
                return `
                <div
                  class="stacking-card-item"
                  data-card="true"
                  style="top: ${96 + 22 * idx}px;"
                >
                  <div class="stacking-card-bg">
                    <img src="${esc(cover)}" alt="${esc(cat.name)}" class="stacking-card-img" loading="lazy" />
                    <div class="stacking-card-overlay"></div>
                  </div>

                  <div class="stacking-card-header">
                    <div class="stacking-icon-box">
                      ${getCategoryIconSvg(cat.slug)}
                    </div>
                    <span class="stacking-count-pill">${cat.count} ${t('productsWord')}</span>
                  </div>

                  <div class="stacking-card-footer">
                    <div class="stacking-text-block">
                      <h3 class="stacking-cat-h3">${esc(cat.name)}</h3>
                      <p class="stacking-cat-desc">${esc(cat.shortDesc)}</p>
                    </div>

                    <a href="#catalog/${esc(cat.slug)}" class="stacking-open-btn">
                      <span>${t('openCategory')}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>
                      </svg>
                    </a>
                  </div>

                  <a href="#catalog/${esc(cat.slug)}" class="stacking-card-overlay-link" aria-label="${esc(cat.name)}"></a>
                </div>
              `;
              })
              .join('')}
          </div>
        </div>
      </section>

      <!-- 4. CatalogDownloads: Official PDF Catalogs Grid -->
      <section class="catalog-downloads-section" id="catalog-downloads">
        <div class="shell">
          <div class="downloads-head">
            <div class="head-icon-circle">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-sky">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </div>
            <h2 class="downloads-title">${t('downloadCatalogs')}</h2>
            <p class="downloads-sub">Texnik pasportlar, mahsulot parametrlari va to'liq montaj chizmalari jamlangan rasmiy PDF broshyuralar</p>
          </div>

          <div class="downloads-grid">
            ${PDF_CATALOGS.map((pdf) => {
              const title = pdf.title[lang] || pdf.title.uz;
              const desc = pdf.desc[lang] || pdf.desc.uz;
              return `
                <div class="download-pdf-card">
                  <div class="pdf-card-cover-wrap">
                    <img src="${esc(pdf.cover)}" alt="${esc(title)}" class="pdf-cover-img" loading="lazy" />
                    <span class="pdf-badge">${esc(pdf.badge || 'PDF')}</span>
                  </div>
                  
                  <div class="pdf-card-body">
                    <h3 class="pdf-card-title">${esc(title)}</h3>
                    <p class="pdf-card-desc">${esc(desc)}</p>
                    
                    <div class="pdf-card-footer">
                      <a href="${esc(pdf.file)}" target="_blank" rel="noopener" class="btn-pdf-view" title="${t('viewPdf')}">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        <span>${t('viewPdf')}</span>
                      </a>
                      <a href="${esc(pdf.file)}" download class="btn-pdf-download" title="${t('downloadPdf')}">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </section>

    </div>
  `;
}

/**
 * CATEGORY DETAIL PAGE: /catalog/<slug>
 */
function renderCategoryDetailPage(category, products, _params) {
  const cover = CATEGORY_COVERS[category.slug] || category.image || '/images/catalog-slides/slide-pipes.jpg';
  const productCountText = `${products.length} ${t('productsWord')}`;

  // Group products hierarchically:
  // Level 1: H2 Groups (by groupName or category)
  // Level 2: H3 Subgroups (by subcategory)
  const groupMap = new Map();

  for (const p of products) {
    const gName = p.groupName || p.subcategory || category.name;
    if (!groupMap.has(gName)) {
      groupMap.set(gName, {
        name: gName,
        anchorId: `grp-${slugify(gName)}`,
        items: [],
        subgroups: new Map(),
      });
    }
    const group = groupMap.get(gName);
    group.items.push(p);

    const subName = p.subcategory || '';
    if (subName && subName !== gName) {
      if (!group.subgroups.has(subName)) {
        group.subgroups.set(subName, []);
      }
      group.subgroups.get(subName).push(p);
    }
  }

  const groups = Array.from(groupMap.values());

  return `
    <div class="category-page-wrapper">
      
      <!-- 1. CategoryHero: High-res cover image with dark gradient & counts -->
      <section class="category-hero-section">
        <div class="category-hero-bg">
          <img
            src="${esc(cover)}"
            alt="${esc(category.name)}"
            class="cat-hero-bg-img"
            loading="eager"
            onerror="this.src='/images/catalog-slides/slide-pipes.jpg';"
          />
          <div class="cat-hero-gradient-overlay"></div>
        </div>

        <div class="shell category-hero-inner">
          <nav class="cat-breadcrumbs" aria-label="Breadcrumb">
            <a href="#home">${t('breadHome')}</a>
            <span class="crumb-separator">/</span>
            <a href="#catalog">${t('breadCatalog')}</a>
            <span class="crumb-separator">/</span>
            <span class="crumb-current">${esc(category.name)}</span>
          </nav>

          <div class="cat-hero-heading-block">
            <div class="cat-hero-icon-title">
              <div class="cat-hero-icon">
                ${getCategoryIconSvg(category.slug)}
              </div>
              <h1 class="category-hero-h1">${esc(category.name)}</h1>
            </div>
            
            <p class="category-hero-desc">${esc(category.shortDesc || 'Sanoat va fuqarolik qurilishi uchun sertifikatlangan tizimlar')}</p>

            <div class="cat-hero-meta-row">
              <span class="cat-count-pill">
                <span class="pulse-dot"></span>
                <strong>${productCountText}</strong>
              </span>

              <a href="#catalog" class="btn-return-catalog">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 12H5"></path><path d="m12 19-7-7 7-7"></path>
                </svg>
                <span>${t('backToCatalog')}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. Sticky Horizontal Chip Nav (Scroll-Spy) -->
      ${
        groups.length > 1
          ? `
        <nav class="category-sticky-chip-nav" id="cat-chip-nav" aria-label="Bo'limlar navigatsiyasi">
          <div class="shell">
            <div class="chip-nav-scroll-track" id="chip-scroll-track">
              ${groups
                .map(
                  (g, idx) => `
                <a
                  href="#${g.anchorId}"
                  class="group-chip-btn ${idx === 0 ? 'active' : ''}"
                  data-anchor="${g.anchorId}"
                >
                  <span class="chip-text">${esc(g.name)}</span>
                  <span class="chip-badge">${g.items.length}</span>
                </a>
              `
                )
                .join('')}
            </div>
          </div>
        </nav>
      `
          : ''
      }

      <!-- 3. Section Groups & Product Grids -->
      <section class="category-products-body">
        <div class="shell">
          ${
            products.length === 0
              ? `
            <div class="empty-category-box">
              <div class="empty-icon-wrap">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="text-sky">
                  <path d="m21.12 6.4-6-3.87a3 3 0 0 0-3.24 0l-6 3.87a3 3 0 0 0-1.88 2.6v7.74a3 3 0 0 0 1.88 2.6l6 3.87a3 3 0 0 0 3.24 0l6-3.87a3 3 0 0 0 1.88-2.6V9a3 3 0 0 0-1.88-2.6z"></path>
                </svg>
              </div>
              <h2 class="empty-title">Mahsulotlar tez orada qo'shiladi</h2>
              <p class="empty-desc">Ushbu bo'lim uchun yangi tovarlar omborga qabul qilinmoqda. Narx va buyurtma uchun biz bilan bog'laning.</p>
              <a href="#catalog" class="btn-primary-sky">Katalogga qaytish</a>
            </div>
          `
              : `
            <div class="category-groups-stack">
              ${groups
                .map((group) => {
                  const subEntries = Array.from(group.subgroups.entries());
                  return `
                  <div class="category-group-block" id="${group.anchorId}" data-spy-group="${group.anchorId}">
                    
                    <!-- H2 Group Title with Indicator and Count -->
                    <div class="group-header-row">
                      <div class="group-title-wrap">
                        <span class="group-indicator-bar"></span>
                        <h2 class="group-title-h2">${esc(group.name)}</h2>
                      </div>
                      <span class="group-items-count">${group.items.length} ${t('productsWord')}</span>
                    </div>

                    <!-- If group has distinct subcategories (H3) -->
                    ${
                      subEntries.length > 0
                        ? `
                      <div class="subgroups-wrapper">
                        ${subEntries
                          .map(
                            ([subName, subItems]) => `
                          <div class="subgroup-block">
                            <div class="subgroup-header">
                              <span class="subgroup-dot"></span>
                              <h3 class="subgroup-title-h3">${esc(subName)}</h3>
                              <span class="subgroup-count">(${subItems.length})</span>
                            </div>

                            <div class="product-grid-responsive">
                              ${subItems.map((p) => renderProductCard(p)).join('')}
                            </div>
                          </div>
                        `
                          )
                          .join('')}
                      </div>
                    `
                        : `
                      <!-- Standard Product Grid under H2 -->
                      <div class="product-grid-responsive">
                        ${group.items.map((p) => renderProductCard(p)).join('')}
                      </div>
                    `
                    }

                  </div>
                `;
                })
                .join('')}
            </div>
          `
          }
        </div>
      </section>

    </div>
  `;
}

function renderCategoryNotFound() {
  return `
    <div class="shell" style="padding: 120px 0; text-align: center;">
      <h1 style="font-size: 32px; font-weight: 800; color: #FFFFFF; margin-bottom: 12px;">Bo'lim topilmadi</h1>
      <p style="color: #94A3B8; font-size: 16px; margin-bottom: 24px;">Ushbu kategoriya mavjud emas yoki nomi o'zgartirilgan.</p>
      <a href="#catalog" class="btn-primary-sky">Katalogga qaytish</a>
    </div>
  `;
}

/**
 * Event Controller & Scroll-Spy Initializer
 */
export function initCatalogEvents(_router) {
  // 1. Initialize Swiper for Category Slideshow (Index mode)
  const swiperEl = document.getElementById('category-swiper-slider');
  if (swiperEl) {
    try {
      new Swiper('#category-swiper-slider', {
        modules: [Navigation, Pagination, Keyboard, FreeMode],
        slidesPerView: 1.15,
        spaceBetween: 16,
        grabCursor: true,
        keyboard: { enabled: true },
        navigation: {
          nextEl: '#cat-swiper-next',
          prevEl: '#cat-swiper-prev',
        },
        pagination: {
          el: '#cat-swiper-pagination',
          clickable: true,
        },
        breakpoints: {
          640: { slidesPerView: 2.1, spaceBetween: 20 },
          960: { slidesPerView: 3.1, spaceBetween: 24 },
          1280: { slidesPerView: 4.05, spaceBetween: 28 },
        },
      });
    } catch (e) {
      console.warn('Swiper init error:', e);
    }
  }

  // 2. Stacking Cards Scroll Physics Engine (rAF scroll listener)
  const stackingCards = Array.from(document.querySelectorAll('[data-card="true"]'));
  if (stackingCards.length > 0) {
    let animActive = true;
    let cardT = stackingCards.map(() => 0);
    let cardA = stackingCards.map(() => 0);

    const onScrollTick = () => {
      if (!animActive) return;
      const vh = window.innerHeight;

      stackingCards.forEach((card, idx) => {
        const nextCard = stackingCards[idx + 1];
        let factor = 0;
        if (nextCard) {
          const top = nextCard.getBoundingClientRect().top;
          const targetTop = 96 + 22 * idx;
          factor = Math.max(0, Math.min(1, (vh - top) / (vh - targetTop)));
        }
        cardA[idx] = factor;
        cardT[idx] += (cardA[idx] - cardT[idx]) * 0.14;
        const n = cardT[idx];

        card.style.transform = `translateY(${-8 * n}px) scale(${1 - 0.055 * n})`;
        card.style.filter = `brightness(${1 - 0.35 * n})`;
      });

      requestAnimationFrame(onScrollTick);
    };

    requestAnimationFrame(onScrollTick);
    window.__cleanupStacking = () => {
      animActive = false;
    };
  }

  // 3. Smooth scroll to categories button
  const scrollBtn = document.getElementById('scroll-to-categories');
  if (scrollBtn) {
    scrollBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById('category-slideshow-section');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // 4. Sticky Horizontal Chip Nav & Scroll-Spy (Category mode)
  const chipNav = document.getElementById('cat-chip-nav');
  const groupBlocks = Array.from(document.querySelectorAll('[data-spy-group]'));

  if (chipNav && groupBlocks.length > 0) {
    const chips = Array.from(chipNav.querySelectorAll('.group-chip-btn'));

    // Click handler with smooth scroll offset
    chips.forEach((chip) => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        const anchorId = chip.getAttribute('data-anchor');
        const targetBlock = document.getElementById(anchorId);
        if (targetBlock) {
          const navHeight = chipNav.offsetHeight || 60;
          const top = targetBlock.getBoundingClientRect().top + window.scrollY - navHeight - 80;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });

    // IntersectionObserver Scroll-Spy
    if ('IntersectionObserver' in window) {
      const spyObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const anchorId = entry.target.id;
              chips.forEach((c) => {
                const matches = c.getAttribute('data-anchor') === anchorId;
                c.classList.toggle('active', matches);
                if (matches) {
                  c.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
                }
              });
            }
          });
        },
        {
          rootMargin: '-20% 0px -60% 0px',
          threshold: 0,
        }
      );

      groupBlocks.forEach((b) => spyObserver.observe(b));
    }
  }

  // 5. Open ProductModal if ?open=<slug> query parameter exists
  try {
    const url = new URL(window.location.href);
    const openSlug = url.searchParams.get('open');
    if (openSlug) {
      const prod = getProductBySlug(openSlug);
      if (prod) {
        setTimeout(() => openProductModal(prod), 100);
      }
    }
  } catch (e) {
    void e;
  }
}
