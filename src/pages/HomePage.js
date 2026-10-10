import { icon } from '../icons.js';
import { getCatalog } from '../lib/catalog.js';
import { esc } from '../lib/format.js';
import { renderTestimonials } from '../components/Testimonials.js';
import { t } from '../lib/i18n.js';

// Hero kartalari bazadagi mahsulotlardan qoida bo'yicha tanlanadi — ID yozilmaydi.
// Mahsulot o'chsa, tugasa yoki rasmi bo'lmasa, qoidaga mos keyingisi olinadi.
const HERO_PICKS = [
  (p) => /труба|quvur/i.test(p.groupName || p.name),
  (p) => /фитинг|fiting/i.test(p.subcategory),
  (p) => /задвижк|zadvijka/i.test(p.groupName || p.name),
  (p) => p.categorySlug === 'elektr-jihozlari' || /подстанц|podstansiya/i.test(p.subcategory),
];
const HERO_COUNT = HERO_PICKS.length;

const FEATURED_COUNT = 8;

/**
 * @param {Array} products
 * @param {Array} [avoid] bosh sahifada boshqa joyda chiqadigan mahsulotlar — ular va suratlari takrorlanmaydi
 */
export function pickHeroProducts(products, avoid = []) {
  const candidates = products.filter(
    (p) => p.inStock && p.hasImage && !avoid.some((x) => x.id === p.id || x.image === p.image)
  );
  const picked = [];
  const isFree = (p) => !picked.some((x) => x.id === p.id || x.image === p.image);

  for (const rule of HERO_PICKS) {
    const product = candidates.find((p) => rule(p) && isFree(p));
    if (product) picked.push(product);
  }
  // Qoidaga mos topilmaganlar o'rniga: avval hali ishlatilmagan kategoriyadan, keyin istalgani
  for (const preferNewCategory of [true, false]) {
    for (const p of candidates) {
      if (picked.length >= HERO_COUNT) break;
      if (!isFree(p)) continue;
      if (preferNewCategory && picked.some((x) => x.categoryId === p.categoryId)) continue;
      picked.push(p);
    }
  }
  return picked;
}

/**
 * "Tanlangan mahsulotlar" avtomatik tanlovi: sotuvda, surati bor.
 * Har qadamda: avval hali chiqmagan kategoriya, keyin hali chiqmagan brend, keyin
 * kam ishlatilgan kategoriya. `avoid` (hero) va o'zaro — bir xil mahsulot, surat yoki
 * mahsulot guruhi (faqat o'lchami farq qiladigan) takrorlanmaydi.
 * @param {Array} products
 * @param {Array} [avoid] ko'rinishi takrorlanmasligi kerak bo'lgan mahsulotlar (hero)
 */
export function pickFeaturedProducts(products, avoid = [], count = FEATURED_COUNT) {
  const candidates = products.filter((p) => p.inStock && p.hasImage);
  const picked = [];
  const catUsed = new Map();
  const brandUsed = new Map();
  const groupKey = (p) => `${p.brand}|${p.groupName || p.name}`;
  const looksRepeated = (p) =>
    [...avoid, ...picked].some((x) => x.id === p.id || x.image === p.image || groupKey(x) === groupKey(p));

  while (picked.length < count) {
    let best = null;
    let bestScore = Infinity;
    for (const p of candidates) {
      if (looksRepeated(p)) continue;
      const catCount = catUsed.get(p.categoryId) || 0;
      const score = (catCount ? 100 : 0) + (brandUsed.get(p.brand) || 0) * 10 + catCount;
      if (score < bestScore) {
        best = p;
        bestScore = score;
        if (score === 0) break;
      }
    }
    if (!best) break;
    picked.push(best);
    catUsed.set(best.categoryId, (catUsed.get(best.categoryId) || 0) + 1);
    brandUsed.set(best.brand, (brandUsed.get(best.brand) || 0) + 1);
  }
  return picked;
}

/**
 * Bosh sahifadagi hero va "Tanlangan mahsulotlar" — bir-birini takrorlamaydi.
 * Bazada featured=true (sotuvda) mahsulot bo'lsa, avtomatik tanlov o'rniga o'shalar chiqadi
 * va hero ulardan boshqa mahsulotlarni oladi.
 */
export function pickHomeProducts(products) {
  const manual = products.filter((p) => p.featured && p.inStock).slice(0, FEATURED_COUNT);
  if (manual.length) {
    const hero = pickHeroProducts(products, manual);
    return { hero, featured: manual, featuredSource: 'manual' };
  }
  const hero = pickHeroProducts(products);
  const featured = pickFeaturedProducts(products, hero);
  return { hero, featured, featuredSource: 'auto' };
}

function renderProjectsCarousel() {
  const projects = [
    {
      img: '/workers/worker-warehouse.webp',
      title: t('project1Title'),
      type: t('project1Type'),
      desc: t('project1Desc'),
      tags: ['#Ombor', '#Logistika', '#TezkorYuklash'],
    },
    {
      img: '/images/catalog-slides/slide-valves.jpg',
      title: t('project2Title'),
      type: t('project2Type'),
      desc: t('project2Desc'),
      tags: ['#ZaporArmatura', '#Zadvijkalar', '#Flaneslar'],
    },
    {
      img: '/images/catalog-slides/slide-pipes.jpg',
      title: t('project3Title'),
      type: t('project3Type'),
      desc: t('project3Desc'),
      tags: ['#PolimerQuvurlar', '#PPR', '#Fitinglar'],
    },
    {
      img: '/images/catalog-slides/slide-sewer.jpg',
      title: t('project4Title'),
      type: t('project4Type'),
      desc: t('project4Desc'),
      tags: ['#YonginXavfsizligi', '#Gidrantlar', '#Shlanglar'],
    },
    {
      img: '/workers/worker-delivery.webp',
      title: t('project5Title'),
      type: t('project5Type'),
      desc: t('project5Desc'),
      tags: ['#OptomYetkazish', '#Smeta', '#BarchaViloyatlar'],
    },
    {
      img: '/workers/worker-consultant.webp',
      title: t('project6Title'),
      type: t('project6Type'),
      desc: t('project6Desc'),
      tags: ['#TexnikMaslahat', '#Muhandislik', '#Tanlash'],
    },
  ];

  return `
    <section class="home-section projects-carousel-section">
      <div class="section-head projects-section-head">
        <div>
          <div class="section-pill-tag">${t('projectsTag')}</div>
          <h2 class="section-title">${t('projectsTitle')}</h2>
          <div class="section-subtitle">${t('projectsSub')}</div>
        </div>
        <div class="projects-carousel-nav-arrows">
          <button type="button" class="carousel-arrow-btn" id="proj-prev-btn" aria-label="Oldingi loyiha">
            ${icon('chevron-left', '', 20)}
          </button>
          <button type="button" class="carousel-arrow-btn" id="proj-next-btn" aria-label="Keyingi loyiha">
            ${icon('chevron-right', '', 20)}
          </button>
        </div>
      </div>

      <div class="projects-carousel-wrapper">
        <div class="projects-carousel-track" id="projects-carousel-track">
          ${projects.map((proj, idx) => `
            <article class="project-card" data-index="${idx}">
              <div class="project-img-wrap">
                <img src="${proj.img}" alt="${esc(proj.title)}" loading="lazy" decoding="async">
                <span class="project-type-badge">${esc(proj.type)}</span>
              </div>
              <div class="project-card-body">
                <h3 class="project-title">${esc(proj.title)}</h3>
                <p class="project-desc">${esc(proj.desc)}</p>
                <div class="project-tags">
                  ${proj.tags.map(tag => `<span class="project-tag">${tag}</span>`).join('')}
                </div>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderNevoCorporateAbout(catalog) {
  const productCount = catalog.status === 'ready' && catalog.products.length ? catalog.products.length : 100;
  return `
    <!-- NEVO CORPORATE ABOUT & METRICS (REALISTIC & AUTHENTIC) -->
    <section class="nevo-corp-about-section" id="stats-anchor">
      <div class="shell">
        <div class="nevo-corp-about-header">
          <div class="nevo-corp-brand-box">
            <img src="/brand/nevo-logo.png" alt="NEVO GROUP" class="nevo-corp-emblem-img" width="68" height="68" />
            <div class="nevo-corp-brand-text">
              <span class="corp-brand-nevo text-gradient-sky">nevo<sup class="corp-brand-r">®</sup></span>
              <span class="corp-brand-group">GROUP</span>
            </div>
          </div>
          <div class="nevo-corp-intro-text">
            <p>
              ${t('heroDesc')}
            </p>
          </div>
        </div>

        <!-- 4 Minimalist Line-Art Metrics (Authentic & Realistic for Nevo Group) -->
        <div class="nevo-corp-metrics-grid">
          <div class="nevo-metric-stat-item">
            <div class="nevo-metric-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <div class="nevo-metric-big-num" data-count="1" data-suffix="">1</div>
            <div class="nevo-metric-tag-label">${t('statYears')}</div>
          </div>

          <div class="nevo-metric-stat-item">
            <div class="nevo-metric-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div class="nevo-metric-big-num" data-count="${productCount}" data-suffix="+">${productCount}+</div>
            <div class="nevo-metric-tag-label">${t('statProducts')}</div>
          </div>

          <div class="nevo-metric-stat-item">
            <div class="nevo-metric-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
            </div>
            <div class="nevo-metric-big-num" data-count="100" data-suffix="%">100%</div>
            <div class="nevo-metric-tag-label">${t('statPartners')}</div>
          </div>

          <div class="nevo-metric-stat-item">
            <div class="nevo-metric-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </div>
            <div class="nevo-metric-big-num" data-count="12" data-suffix="+">12+</div>
            <div class="nevo-metric-tag-label">${t('statDelivery')}</div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderNevoCatalogShowcase() {
  const categories = [
    {
      slug: 'truba-va-fitinglar',
      title: 'Polipropilen (PP-R) va Kompozit Quvurlar',
      sub: "Suv ta'minoti va isitish tizimlari uchun sertifikatlangan polimer quvurlar",
      img: '/images/categories/ppr-pipes.webp',
      badge: 'PP-R / PN20 / PN25',
      iconHtml: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>',
    },
    {
      slug: 'truba-va-fitinglar',
      title: 'Kanalizatsiya tizimlari',
      sub: "Ichki va tashqi oqova tarmoqlari uchun PVX va polipropilen quvurlar",
      img: '/images/categories/sewer-pipes.webp',
      badge: 'PVX / SN4 / SN8',
      iconHtml: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h20M2 6h20M2 18h20"></path></svg>',
    },
    {
      slug: 'zapor-armatura',
      title: 'Zapor armatura va metall fitinglar',
      sub: "Zadvijkalar, sharli kranlar, teskari klapanlar va demontaj vstavkalari",
      img: '/images/categories/valves-fittings.webp',
      badge: "Latun / Cho'yan / Po'lat",
      iconHtml: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
    },
    {
      slug: 'truba-va-fitinglar',
      title: 'Polietilen (HDPE PE-100) bosimli quvurlar',
      sub: "Ichimlik suvi va gaz magistrallari uchun yuqori bosimli polietilen quvurlar",
      img: '/images/categories/hdpe-pipes.webp',
      badge: 'PE 100 / SDR 11 / SDR 17',
      iconHtml: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
    },
  ];

  return `
    <!-- NEVO GROUP LUXURY CATALOG SHOWCASE -->
    <section class="home-section nevo-catalog-showcase-section" id="catalog-anchor">
      <div class="section-head nevo-catalog-section-head">
        <div>
          <div class="section-pill-tag">ASOSIY YO'NALISHLAR</div>
          <h2 class="section-title">Mahsulotlar va Katalog</h2>
          <div class="section-subtitle">Isitish, suv ta'minoti va muhandislik tizimlari uchun sanoat jihozlari, komplektovchi qismlar va materiallarning keng assortimenti.</div>
        </div>
        <a href="/katalog" class="section-link nevo-catalog-head-link">
          <span>Katalogni ko'rish</span>
          ${icon('arrow-right', '', 16)}
        </a>
      </div>

      <!-- Quick Search Bar -->
      <div class="nevo-catalog-search-strip">
        <span class="nevo-search-label">KATALOGDAN QIDIRISH</span>
        <div class="nevo-search-box-wrap" onclick="window.__openQuickSearch ? window.__openQuickSearch() : (window.location.href='/katalog');">
          ${icon('search', '', 18)}
          <input type="text" placeholder="Mahsulot qidirish — masalan: PN20, fiting, kran..." readonly class="nevo-search-input-fake" />
          <span class="search-kbd-badge">⌘K</span>
        </div>
      </div>

      <!-- Cards Grid -->
      <div class="nevo-catalog-grid">
        ${categories.map(c => `
          <a href="/katalog/${esc(c.slug)}" class="nevo-cat-card">
            <div class="nevo-cat-card-bg" style="background-image: url('${c.img}');"></div>
            <div class="nevo-cat-card-overlay"></div>
            <div class="nevo-cat-card-inner">
              <div class="nevo-cat-icon-pill">
                ${c.iconHtml}
                <span>${esc(c.badge)}</span>
              </div>
              <div class="nevo-cat-footer">
                <div>
                  <h3 class="nevo-cat-heading">${esc(c.title)}</h3>
                  <p class="nevo-cat-subtext">${esc(c.sub)}</p>
                </div>
                <span class="nevo-cat-btn">
                  <span>Ko'rish</span>
                  ${icon('arrow-right', '', 16)}
                </span>
              </div>
            </div>
          </a>
        `).join('')}
      </div>

      <!-- Slider Dots Pagination -->
      <div class="nevo-catalog-dots">
        <span class="nevo-dot active"></span>
        <span class="nevo-dot"></span>
        <span class="nevo-dot"></span>
        <span class="nevo-dot"></span>
      </div>
    </section>
  `;
}

export function renderHomePage() {
  const catalog = getCatalog();

  return `
    <main class="home-page-content">
      <!-- NEVO LUXURY 8K INDUSTRIAL ENGINEERING HERO SLIDESHOW (100% Bespoke, No Watermarks) -->
      <section class="hero-section hero-section-nevo">
        <div class="hero-slideshow-backdrop" id="nevo-hero-slideshow">
          <div class="hero-slide-item active" data-slide="0">
            <img src="/images/hero/hero-plant-1.jpg" alt="NEVO Zamonaviy Muhandislik Korxonasi" class="hero-slide-img" fetchpriority="high" />
          </div>
          <div class="hero-slide-item" data-slide="1">
            <img src="/images/hero/hero-valves-2.jpg" alt="NEVO Sanoat Zapor Armaturalari va Zadvijkalar" class="hero-slide-img" loading="lazy" />
          </div>
          <div class="hero-slide-item" data-slide="2">
            <img src="/images/hero/hero-factory-3.jpg" alt="NEVO Polimer Quvur Ishlab Chiqarish Liniyasi" class="hero-slide-img" loading="lazy" />
          </div>
          <div class="hero-slide-gradient-overlay"></div>
          <div class="hero-slide-ambient-glow"></div>
          <div class="hero-slide-blueprint-grid"></div>
        </div>

        <div class="shell hero-nevo-shell">
          <div class="hero-nevo-center-wrap">
            <div class="hero-royal-badge">
              <span class="royal-badge-emblem">
                <img src="/brand/nevo-logo-sm.png" alt="NEVO" width="18" height="18" />
              </span>
              <span>${t('heroBadge')}</span>
            </div>

            <h1 class="hero-title hero-title-nevo">
              <span class="brand-gold-word">NEVO GROUP</span> — ${t('heroTitleAccent')}
            </h1>
            <p class="hero-desc hero-desc-nevo">
              ${t('heroDesc')}
            </p>
            <div class="hero-buttons hero-buttons-nevo">
              <a href="/katalog" class="btn-royal-gold hero-btn-glow">
                <span>${t('heroCtaCatalog')}</span>
                ${icon('arrow-right', '', 18)}
              </a>
              <a href="/aloqa" class="btn-royal-glass">
                ${icon('phone', '', 18)}
                <span>${t('heroCtaFind')}</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Slide Switcher Dots on Hero Bottom Center/Right -->
        <div class="hero-slides-nav" id="hero-slides-dots">
          <button type="button" class="hero-slide-dot active" data-slide="0" onclick="window.__switchHeroSlide(0)" aria-label="1-slayd: Sanoat Muhandisligi">
            <span class="hero-dot-fill"></span>
            <span class="hero-dot-tooltip">Sanoat Korxonasi</span>
          </button>
          <button type="button" class="hero-slide-dot" data-slide="1" onclick="window.__switchHeroSlide(1)" aria-label="2-slayd: Zapor Armatura">
            <span class="hero-dot-fill"></span>
            <span class="hero-dot-tooltip">Zapor Armatura</span>
          </button>
          <button type="button" class="hero-slide-dot" data-slide="2" onclick="window.__switchHeroSlide(2)" aria-label="3-slayd: Ishlab Chiqarish">
            <span class="hero-dot-fill"></span>
            <span class="hero-dot-tooltip">Ishlab Chiqarish</span>
          </button>
        </div>

        <!-- Scroll Mouse Indicator -->
        <a href="#stats-anchor" class="hero-scroll-indicator" aria-label="Pastga tushish">
          <div class="scroll-mouse-icon">
            <span class="scroll-mouse-dot"></span>
          </div>
        </a>
      </section>

      <!-- NEVO CORPORATE ABOUT & 4 METRICS -->
      ${renderNevoCorporateAbout(catalog)}

      <div class="shell">
        <!-- NEVO GROUP LUXURY CATALOG SHOWCASE -->
        ${renderNevoCatalogShowcase()}

        <!-- YIRIK LOYIHALARDA (MAJOR PROJECTS IN UZBEKISTAN) CAROUSEL -->
        ${renderProjectsCarousel()}

        <!-- MIJOZLAR FIKRI (TESTIMONIALS) -->
        ${renderTestimonials()}

        <!-- Dark Final CTA Banner -->
        <div class="cta-banner-dark" style="margin-top: 54px; margin-bottom: 54px;">
          <h3>Kerakli mahsulotni topdingizmi?</h3>
          <p>Narx va mavjudligini bilish uchun biz bilan hoziroq bog'laning.</p>
          <a href="/aloqa" class="btn-white">
            ${icon('message-circle', '', 18)}
            <span>Bog'lanish</span>
          </a>
        </div>
      </div>
    </main>
  `;
}

export function initHomeAnimations() {
  // Bespoke NEVO Hero 8K Industrial Slideshow Controller
  let heroCurrent = 0;
  const heroSlides = document.querySelectorAll('#nevo-hero-slideshow .hero-slide-item');
  const heroDots = document.querySelectorAll('#hero-slides-dots .hero-slide-dot');
  const totalHeroSlides = heroSlides.length;

  window.__switchHeroSlide = (idx) => {
    if (totalHeroSlides === 0) return;
    heroCurrent = (idx + totalHeroSlides) % totalHeroSlides;
    heroSlides.forEach((el, i) => {
      el.classList.toggle('active', i === heroCurrent);
    });
    heroDots.forEach((btn, i) => {
      btn.classList.toggle('active', i === heroCurrent);
    });
  };

  if (totalHeroSlides > 1) {
    if (window.__heroSlideInterval) {
      clearInterval(window.__heroSlideInterval);
    }
    window.__heroSlideInterval = setInterval(() => {
      window.__switchHeroSlide(heroCurrent + 1);
    }, 5500);

    const heroWrap = document.getElementById('nevo-hero-slideshow');
    if (heroWrap) {
      heroWrap.addEventListener('mouseenter', () => clearInterval(window.__heroSlideInterval));
      heroWrap.addEventListener('mouseleave', () => {
        clearInterval(window.__heroSlideInterval);
        window.__heroSlideInterval = setInterval(() => {
          window.__switchHeroSlide(heroCurrent + 1);
        }, 5500);
      });
    }
  }
  // Animated Stat Counters
  const counters = document.querySelectorAll('.stat-number[data-count], .nevo-metric-big-num[data-count]');
  if (counters.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-count'), 10);
          const suffix = el.getAttribute('data-suffix') || '';
          let count = 0;
          const duration = 1600;
          const stepTime = 25;
          const steps = duration / stepTime;
          const increment = target / steps;
          const timer = setInterval(() => {
            count += increment;
            if (count >= target) {
              count = target;
              clearInterval(timer);
            }
            el.textContent = Math.floor(count).toLocaleString('ru-RU').replace(/,/g, ' ') + suffix;
          }, stepTime);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.15 });
    counters.forEach(c => observer.observe(c));
  }

  // Projects Carousel Navigation
  const prevBtn = document.getElementById('proj-prev-btn');
  const nextBtn = document.getElementById('proj-next-btn');
  const track = document.getElementById('projects-carousel-track');
  if (track) {
    const scrollAmount = 380;
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      });
    }
  }

  // 3D Card Hover Perspective Tilt
  const tiltCards = document.querySelectorAll('.hero-img-card, .product-card, .benefit-card, .worker-card, .project-card, .nevo-cat-card');
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dx = (x - cx) / cx;
      const dy = (y - cy) / cy;
      card.style.transform = `perspective(700px) rotateX(${-dy * 4}deg) rotateY(${dx * 4}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}
