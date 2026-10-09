import { icon } from '../icons.js';
import { BENEFITS, MAIN_PHONE, TELEGRAM_URL, INSTAGRAM_DM_URL } from '../data/content.js';
import { getCatalog } from '../lib/catalog.js';
import { isSupabaseConfigured } from '../lib/supabase.js';
import { esc } from '../lib/format.js';
import { renderProductCard } from '../components/ProductCard.js';
import { renderProductsGridSkeleton } from '../components/StatusViews.js';
import { renderTestimonials } from '../components/Testimonials.js';
import { t } from '../lib/i18n.js';

function renderInlineLoadError() {
  return `
    <div class="status-card" role="alert" style="padding: 32px 20px;">
      <h3 class="status-title" style="font-size: 18px;">Ma'lumot yuklanmadi, qayta urinib ko'ring</h3>
      <p class="status-text" style="margin-bottom: 16px;">
        ${isSupabaseConfigured ? "Internet aloqangizni tekshiring." : "Sayt sozlanmagan: Supabase ulanish ma'lumotlari topilmadi."}
      </p>
      ${isSupabaseConfigured ? `<button type="button" class="btn-primary" onclick="window.__retryCatalog()">Qayta urinish</button>` : ''}
    </div>
  `;
}

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

function renderHeroCards(catalog, heroProducts) {
  if (catalog.status === 'loading' || (catalog.status === 'idle' && isSupabaseConfigured)) {
    return Array.from({ length: HERO_COUNT }, () => '<div class="hero-img-card skeleton" aria-hidden="true"></div>').join('');
  }
  return heroProducts.map((p) => `
    <a href="#product/${esc(p.slug)}" class="hero-img-card" title="${esc(p.name)}">
      <img
        src="${esc(p.image)}"
        alt="${esc(p.name)}"
        width="600"
        height="600"
        decoding="async"
        onerror="this.onerror=null;this.src='/brand/nevo-logo-sm.png';"
      >
      <span class="card-glass-sheen"></span>
    </a>
  `).join('');
}

// Statistika faqat bazadagi haqiqiy katalogdan hisoblanadi
function renderStatNumber(catalog, value) {
  return catalog.status === 'ready' && value
    ? `<div class="stat-number" data-count="${value}" data-suffix="">${value}</div>`
    : '<div class="stat-number">…</div>';
}

function renderProductsBlock(products, catalog) {
  if (!isSupabaseConfigured || catalog.status === 'error') return renderInlineLoadError();
  if (catalog.status !== 'ready') return renderProductsGridSkeleton(4);
  if (products.length === 0) {
    return `<p style="color: var(--muted); font-size: 15px;">Hozircha mahsulotlar yo'q.</p>`;
  }
  return `<div class="products-grid">${products.map(renderProductCard).join('')}</div>`;
}

function renderCategoriesBlock(catalog) {
  if (!isSupabaseConfigured || catalog.status === 'error') return renderInlineLoadError();
  if (catalog.status !== 'ready') {
    return `
      <div class="popular-categories-grid" aria-hidden="true">
        ${Array.from({ length: 5 }, () => '<div class="skeleton" style="height: 150px; border-radius: var(--radius-xl);"></div>').join('')}
      </div>
    `;
  }
  return `
    <div class="popular-categories-grid">
      ${catalog.categories.map(cat => `
        <a href="#bolim/${esc(cat.slug)}" class="category-card" data-cat="${esc(cat.slug)}">
          <div>
            <h3 class="category-card-name">${esc(cat.name)}</h3>
            <div class="category-card-desc">${esc(cat.shortDesc)}</div>
            <div class="category-card-count">${cat.count} ta mahsulot</div>
          </div>
          <img src="${esc(cat.image)}" alt="${esc(cat.name)}" class="category-card-img" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='/brand/nevo-logo-sm.png';">
          <div class="category-card-arrow">${icon('arrow-right', '', 14)}</div>
        </a>
      `).join('')}
    </div>
  `;
}

function renderProjectsCarousel() {
  const projects = [
    {
      img: '/projects/nest-one.webp',
      title: t('project1Title'),
      type: t('project1Type'),
      desc: t('project1Desc'),
      tags: ['#Quvurlar', '#ZaporArmatura', '#NestOne'],
    },
    {
      img: '/projects/humo-arena.webp',
      title: t('project2Title'),
      type: t('project2Type'),
      desc: t('project2Desc'),
      tags: ['#HumoArena', '#Sovutish', '#Flaneslar'],
    },
    {
      img: '/projects/islamic-center.webp',
      title: t('project3Title'),
      type: t('project3Type'),
      desc: t('project3Desc'),
      tags: ['#IslomSivilizatsiyasi', '#Gidrantlar', '#Isitish'],
    },
    {
      img: '/projects/tashkent-city.webp',
      title: t('project4Title'),
      type: t('project4Type'),
      desc: t('project4Desc'),
      tags: ['#CongressHall', '#SanoatQuvurlari', '#TashkentCity'],
    },
    {
      img: '/workers/worker-construction.webp',
      title: t('project5Title'),
      type: t('project5Type'),
      desc: t('project5Desc'),
      tags: ['#YangiOzbekiston', '#Muhandislik', '#PEQuvurlar'],
    },
    {
      img: '/workers/worker-pipefitting.webp',
      title: t('project6Title'),
      type: t('project6Type'),
      desc: t('project6Desc'),
      tags: ['#Magistral', '#SanoatMontaj', '#Vstavkalar'],
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

function renderVeroCorporateAbout(catalog) {
  const productCount = catalog.status === 'ready' && catalog.products.length ? catalog.products.length : 1000;
  return `
    <!-- VERO STYLE CORPORATE ABOUT & METRICS (Screenshot 2) -->
    <section class="vero-about-section" id="stats-anchor">
      <div class="shell">
        <div class="vero-about-header">
          <div class="vero-about-brand">
            <span class="brand-triangle-icon">▲</span>
            <div class="vero-about-brand-text">
              <span class="brand-big">nevo</span>
              <span class="brand-sub">GROUP</span>
            </div>
          </div>
          <div class="vero-about-text">
            <p>
              O'zbekiston va Markaziy Osiyo bozorida suv ta'minoti, isitish va kanalizatsiya tizimlari uchun polimer quvurlar hamda fitinglar yetkazib beruvchi eng yirik korxonalardan biri. Assortimentimiz 1 000 dan ortiq sertifikatlangan qurilish materiallari va muhandislik mahsulotlarini birlashtiradi hamda to'g'ridan-to'g'ri birinchi qo'l kafolati bilan xizmat ko'rsatadi.
            </p>
          </div>
        </div>

        <div class="vero-metrics-grid">
          <div class="vero-metric-card">
            <div class="vero-metric-icon-wrap">🏭</div>
            <div class="vero-metric-val" data-count="10" data-suffix="+">10+</div>
            <div class="vero-metric-lbl">YIL TAJRIBA</div>
          </div>

          <div class="vero-metric-card">
            <div class="vero-metric-icon-wrap">📦</div>
            <div class="vero-metric-val" data-count="${productCount}" data-suffix="+">${productCount}+</div>
            <div class="vero-metric-lbl">MAHSULOT TURI</div>
          </div>

          <div class="vero-metric-card">
            <div class="vero-metric-icon-wrap">🚚</div>
            <div class="vero-metric-val" data-count="100" data-suffix="%">100%</div>
            <div class="vero-metric-lbl">RESPUBLIKA BO'YLAB YETKAZISH</div>
          </div>

          <div class="vero-metric-card">
            <div class="vero-metric-icon-wrap">👥</div>
            <div class="vero-metric-val" data-count="5000" data-suffix="+">5 000+</div>
            <div class="vero-metric-lbl">HAMKORLAR VA USTA-MUTAXASSISLAR</div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderVeroCatalogShowcase() {
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
    <!-- VERO STYLE LUXURY CATALOG SHOWCASE (Screenshot 5) -->
    <section class="home-section vero-catalog-showcase-section">
      <div class="section-head">
        <div>
          <div class="section-pill-tag">ASOSIY YO'NALISHLAR</div>
          <h2 class="section-title">Mahsulotlar Katalogi</h2>
          <div class="section-subtitle">Yuqori sifatli polimer quvurlar, fitinglar va sanoat armaturasi</div>
        </div>
        <a href="#catalog" class="section-link">
          <span>To'liq katalog</span>
          ${icon('arrow-right', '', 16)}
        </a>
      </div>

      <div class="vero-catalog-grid">
        ${categories.map(c => `
          <a href="#bolim/${esc(c.slug)}" class="vero-cat-card">
            <div class="vero-cat-card-bg" style="background-image: url('${c.img}');"></div>
            <div class="vero-cat-card-overlay"></div>
            <div class="vero-cat-card-inner">
              <div class="vero-cat-icon-pill">
                ${c.iconHtml}
                <span>${esc(c.badge)}</span>
              </div>
              <div class="vero-cat-footer">
                <div>
                  <h3 class="vero-cat-heading">${esc(c.title)}</h3>
                  <p class="vero-cat-subtext">${esc(c.sub)}</p>
                </div>
                <span class="vero-cat-btn">
                  <span>Ko'rish</span>
                  ${icon('arrow-right', '', 16)}
                </span>
              </div>
            </div>
          </a>
        `).join('')}
      </div>
    </section>
  `;
}

export function renderHomePage() {
  const catalog = getCatalog();
  const inStock = catalog.products.filter(p => p.inStock);
  const { hero: heroProducts, featured: featuredProducts } = pickHomeProducts(catalog.products);
  const budgetProducts = inStock.filter(p => p.budget || (p.price < 5000 && p.categorySlug === 'truba-va-fitinglar')).slice(0, 8);
  const brandCount = new Set(catalog.products.map(p => p.brand).filter(Boolean)).size;
  const subcategoryCount = catalog.categories.reduce((sum, c) => sum + c.subcategories.length, 0);

  return `
    <main class="home-page-content">
      <!-- VERO STYLE FULLSCREEN INDUSTRIAL HERO -->
      <section class="hero-section hero-section-vero">
        <div class="hero-creative-backdrop">
          <img src="/brand/hero-industrial-bg.webp" alt="NEVO GROUP" class="hero-backdrop-img" decoding="async">
          <div class="hero-video-overlay-gradient"></div>
          <div class="hero-video-grid-pattern"></div>
        </div>

        <div class="shell hero-vero-shell">
          <div class="hero-grid hero-vero-grid">
            <div class="hero-text-col">
              <div class="hero-tag hero-vero-tag">
                <span class="tag-pulse-dot"></span>
                <span>${t('heroBadge')}</span>
              </div>
              <h1 class="hero-title hero-title-vero">
                Suv ta'minoti va isitish tizimlari uchun <span class="text-gradient-orange">kompleks muhandislik yechimlari</span>
              </h1>
              <p class="hero-desc hero-desc-vero">
                Ishonchli muhandislik tarmoqlari uchun yuqori sifatli polimer quvurlar, fitinglar va sanoat zapor armaturasining keng assortimenti
              </p>
              <div class="hero-buttons hero-buttons-vero">
                <a href="#catalog" class="btn-primary hero-btn-glow btn-primary-vero">
                  <span>${t('heroCtaCatalog')}</span>
                  ${icon('arrow-right', '', 18)}
                </a>
                <a href="#aloqa" class="btn-secondary btn-secondary-vero">
                  ${icon('phone', '', 18)}
                  <span>${t('heroCtaFind')}</span>
                </a>
              </div>

              <!-- Real Team / Staff Trust Badge -->
              <div class="hero-team-strip hero-team-strip-vero">
                <div class="team-avatars-stack">
                  <img src="/workers/worker-consultant-thumb.webp" alt="Muhandis maslahatchi" class="avatar-circle" width="38" height="38">
                  <img src="/workers/worker-construction-thumb.webp" alt="Qurilish ustasi" class="avatar-circle" width="38" height="38">
                  <img src="/workers/worker-warehouse-thumb.webp" alt="Ombor logistikasi" class="avatar-circle" width="38" height="38">
                </div>
                <div class="team-trust-info">
                  <div class="team-trust-title">
                    <strong>${t('heroConsultBadge')}</strong>
                  </div>
                  <div class="team-trust-sub">${t('heroConsultSub')}</div>
                </div>
              </div>

              <!-- Trust Micro Badges -->
              <div class="hero-trust-badges hero-trust-badges-vero">
                <div class="trust-item">
                  <span class="trust-check">✓</span>
                  <span>${t('heroTrust1')}</span>
                </div>
                <div class="trust-item">
                  <span class="trust-check">✓</span>
                  <span>${t('heroTrust2')}</span>
                </div>
                <div class="trust-item">
                  <span class="trust-check">✓</span>
                  <span>${t('heroTrust3')}</span>
                </div>
              </div>
            </div>

            <div class="hero-matrix-wrapper">
              <!-- Floating 3D Micro Badges -->
              <div class="floating-badge badge-float-top">
                <span class="live-dot-green"></span>
                <span>${t('heroFloat1')}</span>
              </div>

              <div class="hero-image-matrix">
                ${renderHeroCards(catalog, heroProducts)}
              </div>

              <div class="floating-badge badge-float-bottom">
                <span class="live-dot-blue"></span>
                <span>${t('heroFloat2')}</span>
              </div>
            </div>
          </div>
        </div>

        <a href="#stats-anchor" class="hero-scroll-indicator" aria-label="${t('heroScrollDown')}">
          <div class="scroll-mouse-icon">
            <span class="scroll-mouse-dot"></span>
          </div>
          <span class="scroll-label-text">${t('heroScrollDown')}</span>
        </a>
      </section>

      <!-- VERO STYLE CORPORATE ABOUT & METRICS (Screenshot 2) -->
      ${renderVeroCorporateAbout(catalog)}

      <div class="shell">
        <!-- VERO STYLE LUXURY CATALOG SHOWCASE (Screenshot 5) -->
        ${renderVeroCatalogShowcase()}

        <!-- YIRIK LOYIHALARDA (MAJOR PROJECTS IN UZBEKISTAN) CAROUSEL -->
        ${renderProjectsCarousel()}

        <!-- Teaser Card -->
        <div class="teaser-banner">
          <div class="teaser-content">
            <h2>${t('teaserTitle')}</h2>
            <p>${t('teaserDesc')}</p>
          </div>
          <a href="#tanlash" class="btn-primary">
            <span>${t('teaserBtn')}</span>
            ${icon('arrow-right', '', 18)}
          </a>
        </div>
          <!-- 👷‍♂️ WORKERS & ON-SITE STAFF STORYTELLING SECTION -->
          <section class="home-section workers-story-section">
            <div class="section-head">
              <div>
                <div class="section-pill-tag">MUTAXASSISLAR VA ISH JARAYONI</div>
                <h2 class="section-title">Bizning Jamoa va Amaliyotdagi Sifat</h2>
                <div class="section-subtitle">Obyektlarda o'rnatish, ombor nazorati va muhandislik xizmatlari</div>
              </div>
              <a href="#aloqa" class="section-link">
                <span>Mutaxassislar bilan bog'lanish</span>
                ${icon('arrow-right', '', 16)}
              </a>
            </div>

            <div class="workers-grid">
              <div class="worker-card">
                <div class="worker-img-wrap">
                  <img src="/workers/worker-pipefitting.webp" alt="Quvurlar montaji va muhandislik nazorati" loading="lazy" decoding="async">
                  <span class="worker-role-badge">📐 Muhandislik Nazorati</span>
                </div>
                <div class="worker-card-body">
                  <h3>Zamonaviy muhandislik nazorati va montaj</h3>
                  <p>Loyiha chizmalari, bosim hisob-kitoblari va quvur tarmoqlarining standartlarga to'liq mosligini professional muhandislarimiz nazorat qiladi.</p>
                  <div class="worker-feature-check">
                    <span class="check-icon">✓</span>
                    <span>Standartlarga muvofiqlik nazorati</span>
                  </div>
                </div>
              </div>

              <div class="worker-card">
                <div class="worker-img-wrap">
                  <img src="/workers/worker-warehouse.webp" alt="Ombor logistikasi" loading="lazy" decoding="async">
                  <span class="worker-role-badge">📦 Markaziy Ombor</span>
                </div>
                <div class="worker-card-body">
                  <h3>Katta zaxiradagi ombor tizimi</h3>
                  <p>Mahsulotlar omborda saralanadi, buyurtma bo'yicha qadoqlanadi va jo'natiladi.</p>
                  <div class="worker-feature-check">
                    <span class="check-icon">✓</span>
                    <span>Buyurtma bo'yicha qadoqlash</span>
                  </div>
                </div>
              </div>

              <div class="worker-card">
                <div class="worker-img-wrap">
                  <img src="/workers/worker-construction.webp" alt="Qurilish muhandisi" loading="lazy" decoding="async">
                  <span class="worker-role-badge">🏗️ Muhandislik Nazorati</span>
                </div>
                <div class="worker-card-body">
                  <h3>Qurilish obyektlari ta'minoti</h3>
                  <p>Ko'p qavatli binolar, sanoat inshootlari va turar-joylar uchun loyiha smetasiga mos tovarlarni aniq hisoblab beramiz.</p>
                  <div class="worker-feature-check">
                    <span class="check-icon">✓</span>
                    <span>Smeta bo'yicha bepul maslahat</span>
                  </div>
                </div>
              </div>

              <div class="worker-card">
                <div class="worker-img-wrap">
                  <img src="/workers/worker-delivery.webp" alt="Nevo brendli yetkazib berish mashinasi" loading="lazy" decoding="async">
                  <span class="worker-role-badge">🚚 Respublika Bo'ylab</span>
                </div>
                <div class="worker-card-body">
                  <h3>Xavfsiz va tezkor yetkazish</h3>
                  <p>Toshkent shahri va O'zbekiston viloyatlariga tovarlarni ehtiyotkorlik bilan yetkazib beramiz.</p>
                  <div class="worker-feature-check">
                    <span class="check-icon">✓</span>
                    <span>Yuk ortish va tushirish xizmati</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Mashhur bo'limlar -->
          <section class="home-section">
            <div class="section-head">
              <div>
                <h2 class="section-title">Mashhur bo'limlar</h2>
                <div class="section-subtitle">Asosiy yo'nalishlar bo'yicha mahsulotlar</div>
              </div>
            </div>

            ${renderCategoriesBlock(catalog)}

            <!-- Two Big Promo Cards Side by Side -->
            <div class="side-promos-grid">
              <div class="promo-card light">
                <div>
                  <div class="promo-icon-wrap">
                    ${icon('compass', '', 22)}
                  </div>
                  <h3>Nima kerakligini bilmayapsizmi?</h3>
                  <p>Bir nechta savolga javob bering — katalogdan uchta mos variantni ko'rsatamiz.</p>
                </div>
                <a href="#tanlash" class="promo-action">
                  <span>Mahsulot tanlash</span>
                  ${icon('arrow-right', '', 16)}
                </a>
              </div>

              <div class="promo-card dark">
                <div>
                  <div class="promo-icon-wrap">
                    ${icon('hard-hat', '', 22)}
                  </div>
                  <h3>Obyekt uchun ko'p miqdorda kerakmi?</h3>
                  <p>Ro'yxatni bitta joyga yozing — narx va muddatni operatorimiz aytadi.</p>
                </div>
                <a href="#katta-buyurtma" class="promo-action">
                  <span>Katta buyurtma</span>
                  ${icon('arrow-right', '', 16)}
                </a>
              </div>
            </div>
          </section>

          <!-- Tanlangan mahsulotlar -->
          <section class="home-section">
            <div class="section-head">
              <div>
                <h2 class="section-title">Tanlangan mahsulotlar</h2>
                <div class="section-subtitle">Ko'p so'raladigan va eng sifatli pozitsiyalar</div>
              </div>
              <a href="#catalog" class="section-link">
                <span>Hammasi</span>
                ${icon('arrow-right', '', 16)}
              </a>
            </div>

            ${renderProductsBlock(featuredProducts, catalog)}
          </section>

          <!-- 👨‍💼 Real Consultant Specialist Interactive Card -->
          <section class="consultant-spotlight-section">
            <div class="consultant-card">
              <div class="consultant-photo-wrap">
                <img src="/workers/worker-consultant.webp" alt="Mutaxassis maslahati" loading="lazy" decoding="async">
              </div>
              <div class="consultant-content">
                <div class="consultant-badge">MUTAXASSIS MASLAHATI</div>
                <h3 class="consultant-name">Loyiha va Smetangizni Bizga Yuboring</h3>
                <p class="consultant-quote">
                  "Qurilish loyihangiz uchun qaysi diametr, devor qalinligi va bosim darajasi mos kelishiga ikkilanyapsizmi? Kerakli mahsulotlarni prays bo'yicha jamlab beramiz."
                </p>
                <div class="consultant-actions">
                  <a href="tel:${MAIN_PHONE.tel}" class="btn-primary">
                    ${icon('phone', '', 18)}
                    <span>${MAIN_PHONE.label}</span>
                  </a>
                  ${TELEGRAM_URL ? `
                    <a href="${TELEGRAM_URL}" target="_blank" rel="noopener" class="btn-secondary consultant-tg-btn">
                      ${icon('message-circle', '', 18)}
                      <span>Telegram orqali yozish</span>
                    </a>
                  ` : `
                    <a href="${INSTAGRAM_DM_URL}" target="_blank" rel="noopener" class="btn-secondary consultant-tg-btn">
                      ${icon('instagram', '', 18)}
                      <span>Instagramda yozish</span>
                    </a>
                  `}
                </div>
              </div>
            </div>
          </section>

          <!-- Arzon narxlar -->
          <section class="home-section">
            <div class="section-head">
              <div>
                <h2 class="section-title">Arzon narxlar</h2>
                <div class="section-subtitle">Kichik diametrdagi ommabop fitinglar</div>
              </div>
              <a href="#catalog?sort=arzon" class="section-link">
                <span>Hammasi</span>
                ${icon('arrow-right', '', 16)}
              </a>
            </div>

            ${renderProductsBlock(budgetProducts, catalog)}
          </section>

          <!-- Nega NEVO GROUP? -->
          <section class="home-section">
            <div class="section-head">
              <div>
                <h2 class="section-title">Nega NEVO GROUP?</h2>
                <div class="section-subtitle">Biz bilan ishlashning asosiy afzalliklari</div>
              </div>
            </div>

            <div class="benefits-grid">
              ${BENEFITS.map(b => `
                <div class="benefit-card">
                  <div class="benefit-icon-wrap">
                    ${icon(b.icon, '', 20)}
                  </div>
                  <div class="benefit-title">${b.title}</div>
                  <div class="benefit-desc">${b.desc}</div>
                </div>
              `).join('')}
            </div>
          </section>

          <!-- Mijozlar fikri: TESTIMONIALS bo'sh bo'lsa chiqmaydi -->
          ${renderTestimonials()}

          <!-- Light CTA Banner -->
          <div class="cta-banner-light">
            <div>
              <h3>Uy uchunmi yoki qurilish uchunmi?</h3>
              <p>Kerakli mahsulotni topishda professional mutaxassislarimiz yordam beradi.</p>
            </div>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <a href="#catalog" class="btn-secondary" style="background: #ffffff;">
                Mahsulotlarni ko'rish
              </a>
              <a href="#aloqa" class="btn-primary">
                ${icon('message-circle', '', 18)}
                <span>Mutaxassis bilan bog'lanish</span>
              </a>
            </div>
          </div>

          <!-- Dark Final CTA Banner -->
          <div class="cta-banner-dark">
            <h3>Kerakli mahsulotni topdingizmi?</h3>
            <p>Narx va mavjudligini bilish uchun biz bilan hoziroq bog'laning.</p>
            <a href="#aloqa" class="btn-white">
              ${icon('message-circle', '', 18)}
              <span>Bog'lanish</span>
            </a>
          </div>
      </div>
    </main>
  `;
}

export function initHomeAnimations() {
  // Animated Stat Counters
  const counters = document.querySelectorAll('.stat-number[data-count], .vero-stat-value[data-count], .vero-metric-val[data-count]');
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
  const tiltCards = document.querySelectorAll('.hero-img-card, .product-card, .benefit-card, .worker-card, .project-card, .vero-cat-card');
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
