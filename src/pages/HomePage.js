import { icon } from '../icons.js';
import { getCatalog } from '../lib/catalog.js';
import { esc } from '../lib/format.js';
import { renderTestimonials } from '../components/Testimonials.js';
import { renderProductCard } from '../components/ProductCard.js';
import { t } from '../lib/i18n.js';

// Hero kartalari bazadagi mahsulotlardan qoida bo'yicha tanlanadi — ID yozilmaydi.
const HERO_PICKS = [
  (p) => /труба|quvur/i.test(p.groupName || p.name),
  (p) => /фитинг|fiting/i.test(p.subcategory),
  (p) => /задвижк|zadvijka/i.test(p.groupName || p.name),
  (p) => p.categorySlug === 'elektr-jihozlari' || /подстанц|podstansiya/i.test(p.subcategory),
];
const HERO_COUNT = HERO_PICKS.length;
const FEATURED_COUNT = 8;

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

function renderBlueprintDivider(id = 'bp-1') {
  return `
    <div class="blueprint-divider" id="${id}" aria-hidden="true">
      <svg class="blueprint-svg" viewBox="0 0 1000 48" preserveAspectRatio="none">
        <defs>
          <linearGradient id="bp-grad-${id}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#1D4ED8" stop-opacity="0.15" />
            <stop offset="50%" stop-color="#38BDF8" stop-opacity="0.85" />
            <stop offset="100%" stop-color="#1D4ED8" stop-opacity="0.15" />
          </linearGradient>
        </defs>
        <line x1="0" y1="24" x2="1000" y2="24" stroke="url(#bp-grad-${id})" class="blueprint-pipe" />
        <circle cx="200" cy="24" r="5" class="blueprint-node" />
        <circle cx="500" cy="24" r="7" class="blueprint-node" />
        <circle cx="800" cy="24" r="5" class="blueprint-node" />
      </svg>
    </div>
  `;
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
          <button type="button" class="carousel-arrow-btn" id="proj-prev-btn" aria-label="Oldingi ta'minot yo'nalishi">
            ${icon('chevron-left', '', 20)}
          </button>
          <button type="button" class="carousel-arrow-btn" id="proj-next-btn" aria-label="Keyingi ta'minot yo'nalishi">
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
  
  const gauges = [
    {
      id: 'g1',
      target: 1,
      suffix: '',
      percent: 100,
      title: t('statYears'),
      sub: t('statYearsLabel'),
    },
    {
      id: 'g2',
      target: productCount,
      suffix: '+',
      percent: 85,
      title: t('statProducts'),
      sub: t('statProductsLabel'),
    },
    {
      id: 'g3',
      target: 100,
      suffix: '%',
      percent: 100,
      title: t('statPartners'),
      sub: t('statPartnersLabel'),
    },
    {
      id: 'g4',
      target: 12,
      suffix: '+',
      percent: 92,
      title: t('statDelivery'),
      sub: t('statDeliveryLabel'),
    },
  ];

  return `
    <!-- SCENE 2: NEVO CORPORATE ABOUT & 4 TECHNICAL PRESSURE GAUGES -->
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
            <p>${t('aboutCorpText')}</p>
          </div>
        </div>

        <!-- 4 Technical Pressure Gauge Indicators -->
        <div class="nevo-corp-metrics-grid">
          ${gauges.map((g, idx) => `
            <div class="nevo-gauge-item" data-gauge-id="${g.id}">
              <div class="nevo-gauge-dial" data-percent="${g.percent}">
                <svg class="nevo-gauge-svg" viewBox="0 0 120 120" width="116" height="116" aria-hidden="true">
                  <defs>
                    <linearGradient id="gauge-grad-${idx}" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stop-color="#1D4ED8" />
                      <stop offset="100%" stop-color="#38BDF8" />
                    </linearGradient>
                  </defs>
                  <!-- Background Track Arc (260 deg) -->
                  <path class="gauge-track" d="M 25 95 A 50 50 0 1 1 95 95" fill="none" />
                  <!-- Progress Arc (Animated via dashoffset) -->
                  <path class="gauge-progress" d="M 25 95 A 50 50 0 1 1 95 95" fill="none" stroke="url(#gauge-grad-${idx})" stroke-dasharray="245" stroke-dashoffset="245" />
                </svg>
                <div class="gauge-center-content">
                  <div class="nevo-metric-big-num" data-count="${g.target}" data-suffix="${g.suffix}">${g.target}${g.suffix}</div>
                </div>
              </div>
              <div class="nevo-gauge-title">${esc(g.title)}</div>
              <div class="nevo-gauge-sub">${esc(g.sub)}</div>
            </div>
          `).join('')}
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
      sub: "Suv ta'minoti va isitish tizimlari uchun polimer quvurlar",
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
      sub: "Ichimlik suvi va gaz tarmoqlari uchun yuqori bosimli polietilen quvurlar",
      img: '/images/categories/hdpe-pipes.webp',
      badge: 'PE 100 / SDR 11 / SDR 17',
      iconHtml: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
    },
  ];

  return `
    <!-- SCENE 3: NEVO GROUP LUXURY CATALOG SHOWCASE -->
    <section class="home-section nevo-catalog-showcase-section" id="catalog-anchor">
      <div class="section-head nevo-catalog-section-head">
        <div>
          <div class="section-pill-tag">${t('catalogBtn').toUpperCase()}</div>
          <h2 class="section-title">${t('catalogStackTitle')}</h2>
          <div class="section-subtitle">${t('catalogSub')}</div>
        </div>
        <a href="/katalog" class="section-link nevo-catalog-head-link">
          <span>${t('heroCtaCatalog')}</span>
          ${icon('arrow-right', '', 16)}
        </a>
      </div>

      <!-- Quick Search Bar with ⌘K -->
      <div class="nevo-catalog-search-strip">
        <span class="nevo-search-label">${t('searchInCatalog')}</span>
        <div class="nevo-search-box-wrap" onclick="window.__openQuickSearch ? window.__openQuickSearch() : (window.location.href='/katalog');">
          ${icon('search', '', 18)}
          <input type="text" placeholder="${esc(t('searchPlaceholderExtended'))}" readonly class="nevo-search-input-fake" />
          <span class="search-kbd-badge">⌘K</span>
        </div>
      </div>

      <!-- Category Cover Cards Grid -->
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
                  <span>${t('viewAction')}</span>
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

function renderBestsellersSlider(products) {
  if (!products || !products.length) return '';
  return `
    <!-- SCENE 4: BESTSELLERS / "OMBORDAN HOZIROQ" SLIDER -->
    <section class="home-section bestsellers-section">
      <div class="section-head bestsellers-head">
        <div>
          <div class="section-pill-tag">OMBORDAN HOZIROQ</div>
          <h2 class="section-title">Ommabop Mahsulotlar</h2>
          <div class="section-subtitle">Toshkent markaziy omborimizda doimiy tayyor zaxiradagi xaridorgir pozitsiyalar</div>
        </div>
        <div class="bestsellers-nav-arrows">
          <button type="button" class="carousel-arrow-btn" id="bestseller-prev-btn" aria-label="Oldingi mahsulotlar">
            ${icon('chevron-left', '', 20)}
          </button>
          <button type="button" class="carousel-arrow-btn" id="bestseller-next-btn" aria-label="Keyingi mahsulotlar">
            ${icon('chevron-right', '', 20)}
          </button>
        </div>
      </div>
      <div class="bestsellers-slider-track" id="bestsellers-slider-track">
        ${products.map(p => `
          <div class="bestseller-card-slot">
            ${renderProductCard(p)}
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function renderWhyNevo() {
  const benefits = [
    {
      icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
      title: "Doimiy Ombor Zaxirasi",
      desc: "Katalogdagi barcha asosiy mahsulotlar Toshkent markaziy omborimizda tayyor holda saqlanadi."
    },
    {
      icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>`,
      title: "Zavod Texnik Pasporti",
      desc: "Har bir partiya mahsulot uchun rasmiy ishlab chiqaruvchi sertifikati va texnik pasporti beriladi."
    },
    {
      icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
      title: "Shaffof Ulgurji Narxlar",
      desc: "To'g'ridan-to'g'ri birinchi qo'l narxlar, qulay to'lov shakllari va rasmiy shartnoma kafolati."
    },
    {
      icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
      title: "Muhandislik Maslahati",
      desc: "Smeta, loyiha va chizmalaringiz bo'yicha to'g'ri quvur va zapor armaturalarni tanlashda muhandis ko'magi."
    }
  ];

  return `
    <!-- SCENE 5: WHY NEVO (4 HONEST BENEFITS) -->
    <section class="home-section why-nevo-section">
      <div class="section-head text-center">
        <div class="section-pill-tag">NEGA AYNAN NEVO?</div>
        <h2 class="section-title">Ishonchli va Professional Ta'minot</h2>
        <div class="section-subtitle">Sanoat va fuqarolik qurilishi uchun sertifikatlangan santexnika mahsulotlari</div>
      </div>
      <div class="why-nevo-grid">
        ${benefits.map(b => `
          <div class="why-nevo-card">
            <div class="why-nevo-icon">${b.icon}</div>
            <h3 class="why-nevo-card-title">${esc(b.title)}</h3>
            <p class="why-nevo-card-desc">${esc(b.desc)}</p>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function renderHowToOrder() {
  const steps = [
    { num: '01', title: "Mahsulotni tanlang", desc: "Katalog bo'limlaridan yoki ⌘K tezkor qidiruv orqali kerakli tovarlarni toping." },
    { num: '02', title: "Savatga qo'shing", desc: "Miqdorni belgilab savatga kiriting yoki to'g'ridan-to'g'ri narx so'rovini yuboring." },
    { num: '03', title: "Smetani tasdiqlang", desc: "Operatorimiz qisqa vaqtda bog'lanib, zaxirani va aniq narxni tasdiqlaydi." },
    { num: '04', title: "Tezkor qabul qiling", desc: "Ombordan o'zingiz olib keting yoki O'zbekistonning istalgan hududiga yetkazib beramiz." }
  ];

  return `
    <!-- SCENE 6: HOW TO ORDER (4 ANIMATED STEPS) -->
    <section class="home-section how-to-order-section">
      <div class="section-head text-center">
        <div class="section-pill-tag">4 ODDIY QADAM</div>
        <h2 class="section-title">${t('howToOrder')}</h2>
        <div class="section-subtitle">Ombordan tovarlarni tez va oson xarid qilish jarayoni</div>
      </div>
      <div class="how-to-order-steps-grid">
        ${steps.map(s => `
          <div class="order-step-card">
            <div class="step-num-badge">${s.num}</div>
            <h3 class="step-title">${esc(s.title)}</h3>
            <p class="step-desc">${esc(s.desc)}</p>
          </div>
        `).join('')}
      </div>
      <div class="text-center" style="margin-top: 32px;">
        <a href="/tanlash" class="btn-royal-gold">
          <span>${t('findForMe')}</span>
          ${icon('arrow-right', '', 16)}
        </a>
      </div>
    </section>
  `;
}

function renderBrandsMarquee() {
  const brands = [
    'ALL AYZEN', 'Absan Sanat', 'NEVO', 'FIRAT', 'VALFEX',
    'Kalde', 'Dizayn', 'Pilsa', 'Ostendorf', 'Poelsan'
  ];

  return `
    <!-- SCENE 7: BRANDS & PARTNERS MARQUEE -->
    <section class="brands-marquee-section" aria-label="Hamkor brendlar">
      <div class="shell">
        <div class="brands-marquee-label">ISHLAB CHIQARUVCHILAR VA ISHONCHLI HAMKORLAR</div>
      </div>
      <div class="brands-marquee-strip">
        <div class="brands-marquee-track">
          ${[...brands, ...brands].map(b => `
            <div class="brand-chip-item">
              <span class="brand-chip-dot"></span>
              <span class="brand-chip-text">${esc(b)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderFaqSection() {
  const faqs = [
    {
      q: "Mahsulotlar sifat sertifikatiga egami?",
      a: "Ha, barcha quvurlar, zapor armaturalar va elektrotexnika mahsulotlari zavod texnik pasporti hamda tegishli GOST va ISO sertifikatlariga ega."
    },
    {
      q: "Viloyatlarga yetkazib berish qanday amalga oshiriladi?",
      a: "Toshkent shahri va O'zbekistonning barcha 12 viloyatiga ishonchli yuk tashish xizmatlari orqali buyurtma qilingan kunning o'zida yuklab jo'natiladi."
    },
    {
      q: "To'lov qanday usullarda qabul qilinadi?",
      a: "To'lovlar korxonalar uchun hisob-raqam orqali (pul o'tkazish, QQS bilan rasmiy shartnoma) hamda jismoniy shaxslar uchun naqd yoki bank kartasi orqali amalga oshiriladi."
    },
    {
      q: "Katta qurilish obyektlari uchun maxsus optom chegirmalar bormi?",
      a: "Ha, yirik pudratchilar va qurilish kompaniyalari uchun smeta bo'yicha maxsus ulgurji narxlar va bosqichma-bosqich ta'minot shartnomalari taqdim etiladi."
    }
  ];

  return `
    <!-- SCENE 9: ACCESSIBLE FAQ ACCORDION -->
    <section class="home-section faq-section">
      <div class="section-head text-center">
        <div class="section-pill-tag">SAVOL-JAVOBLAR</div>
        <h2 class="section-title">Ko'p Beriladigan Savollar</h2>
        <div class="section-subtitle">Xarid, yetkazib berish va to'lov shartlari haqida muhim ma'lumotlar</div>
      </div>
      <div class="faq-accordion-wrap">
        ${faqs.map((f, i) => `
          <details class="faq-accordion-item" ${i === 0 ? 'open' : ''}>
            <summary class="faq-summary">
              <span class="faq-question">${esc(f.q)}</span>
              <span class="faq-chevron">${icon('chevron-down', '', 18)}</span>
            </summary>
            <div class="faq-content">
              <p>${esc(f.a)}</p>
            </div>
          </details>
        `).join('')}
      </div>
    </section>
  `;
}

export function renderHomePage() {
  const catalog = getCatalog();
  const products = catalog.status === 'ready' ? catalog.products : [];
  const { featured } = pickHomeProducts(products);

  return `
    <main class="home-page-content">
      <!-- SCENE 1: NEVO CINEMATIC HERO SLIDESHOW -->
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
        <a href="#stats-anchor" class="hero-scroll-indicator" aria-label="${t('scrollDownAria')}">
          <div class="scroll-mouse-icon">
            <span class="scroll-mouse-dot"></span>
          </div>
        </a>
      </section>

      <!-- SCENE 2: NEVO CORPORATE ABOUT & 4 PRESSURE GAUGES -->
      ${renderNevoCorporateAbout(catalog)}

      <!-- BLUEPRINT DIVIDER 1 -->
      ${renderBlueprintDivider('bp-divider-1')}

      <div class="shell">
        <!-- SCENE 3: CATEGORY SHOWCASE -->
        ${renderNevoCatalogShowcase()}

        <!-- SCENE 4: BESTSELLERS / "OMBORDAN HOZIROQ" SLIDER -->
        ${renderBestsellersSlider(featured)}

        <!-- SCENE 5: WHY NEVO (4 HONEST BENEFITS) -->
        ${renderWhyNevo()}

        <!-- SCENE 6: HOW TO ORDER -->
        ${renderHowToOrder()}
      </div>

      <!-- SCENE 7: BRANDS & PARTNERS MARQUEE -->
      ${renderBrandsMarquee()}

      <!-- BLUEPRINT DIVIDER 2 -->
      ${renderBlueprintDivider('bp-divider-2')}

      <div class="shell">
        <!-- SCENE 8: SUPPLY LOGISTICS & INFRASTRUCTURE CAROUSEL -->
        ${renderProjectsCarousel()}

        <!-- SCENE 9: TESTIMONIALS / MIJOZLAR FIKRI -->
        ${renderTestimonials()}

        <!-- SCENE 10: ACCESSIBLE FAQ -->
        ${renderFaqSection()}

        <!-- SCENE 11: DARK FINAL CTA BANNER -->
        <div class="cta-banner-dark" style="margin-top: 54px; margin-bottom: 54px;">
          <h3>${t('bulkOrderMenu')}</h3>
          <p>${t('specNote')}</p>
          <div style="display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-top: 20px;">
            <a href="/katta-buyurtma" class="btn-royal-gold">
              ${icon('file-text', '', 18)}
              <span>${t('bulkOrderMenu')}</span>
            </a>
            <a href="/aloqa" class="btn-royal-glass">
              ${icon('phone', '', 18)}
              <span>${t('contactUs')}</span>
            </a>
          </div>
        </div>
      </div>
    </main>
  `;
}

export function initHomeAnimations() {
  // 1. Bespoke NEVO Hero 8K Industrial Slideshow Controller
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

  // 2. Hide Floating Expert Button when Hero CTAs are in viewport
  const floatingBtn = document.getElementById('floating-expert-btn');
  const heroCta = document.querySelector('.hero-buttons');
  if (floatingBtn && heroCta && 'IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        floatingBtn.classList.toggle('hero-cta-visible', entry.isIntersecting);
      });
    }, { threshold: 0.1 });
    heroObserver.observe(heroCta);
  }

  // 3. Blueprint Dividers Animation on Scroll
  const blueprintDividers = document.querySelectorAll('.blueprint-divider');
  if (blueprintDividers.length > 0 && 'IntersectionObserver' in window) {
    const bpObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-drawn');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    blueprintDividers.forEach(el => bpObserver.observe(el));
  }

  // 4. Pressure Gauge Dials Animation & Counters
  const gaugeItems = document.querySelectorAll('.nevo-gauge-item');
  if (gaugeItems.length > 0 && 'IntersectionObserver' in window) {
    const gaugeObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const item = entry.target;
          const dial = item.querySelector('.nevo-gauge-dial');
          const progressPath = item.querySelector('.gauge-progress');
          const numEl = item.querySelector('.nevo-metric-big-num[data-count]');

          if (dial && progressPath) {
            const pct = parseInt(dial.getAttribute('data-percent'), 10) || 100;
            const fullCircumference = 245;
            const targetOffset = fullCircumference * (1 - (pct / 100) * 0.72);
            progressPath.style.strokeDashoffset = String(targetOffset);
          }

          if (numEl) {
            const target = parseInt(numEl.getAttribute('data-count'), 10) || 0;
            const suffix = numEl.getAttribute('data-suffix') || '';
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
              numEl.textContent = Math.floor(count).toLocaleString('ru-RU').replace(/,/g, ' ') + suffix;
            }, stepTime);
          }

          obs.unobserve(item);
        }
      });
    }, { threshold: 0.15 });
    gaugeItems.forEach(el => gaugeObserver.observe(el));
  }

  // 5. Bestsellers Slider Navigation
  const bsPrev = document.getElementById('bestseller-prev-btn');
  const bsNext = document.getElementById('bestseller-next-btn');
  const bsTrack = document.getElementById('bestsellers-slider-track');
  if (bsTrack) {
    const scrollAmount = 300;
    if (bsPrev) {
      bsPrev.addEventListener('click', () => {
        bsTrack.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      });
    }
    if (bsNext) {
      bsNext.addEventListener('click', () => {
        bsTrack.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      });
    }
  }

  // 6. Projects Carousel Navigation
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

  // 7. 3D Card Hover Perspective Tilt
  const tiltCards = document.querySelectorAll(
    '.hero-img-card, .product-card, .why-nevo-card, .order-step-card, .worker-card, .project-card, .nevo-cat-card'
  );
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
