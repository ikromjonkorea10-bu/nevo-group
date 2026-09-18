import { icon } from '../icons.js';
import { BENEFITS, MAIN_PHONE, TELEGRAM_URL, INSTAGRAM_DM_URL } from '../data/content.js';
import { getCatalog } from '../lib/catalog.js';
import { isSupabaseConfigured } from '../lib/supabase.js';
import { esc } from '../lib/format.js';
import { renderProductCard } from '../components/ProductCard.js';
import { renderProductsGridSkeleton } from '../components/StatusViews.js';
import { renderTestimonials } from '../components/Testimonials.js';

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

export function renderHomePage() {
  const catalog = getCatalog();
  const inStock = catalog.products.filter(p => p.inStock);
  const { hero: heroProducts, featured: featuredProducts } = pickHomeProducts(catalog.products);
  const budgetProducts = inStock.filter(p => p.budget || (p.price < 5000 && p.categorySlug === 'truba-va-fitinglar')).slice(0, 8);
  const brandCount = new Set(catalog.products.map(p => p.brand).filter(Boolean)).size;
  const subcategoryCount = catalog.categories.reduce((sum, c) => sum + c.subcategories.length, 0);

  return `
    <main class="home-page-content">
      <!-- Hero Section with Glowing Aurora -->
      <section class="hero-section">
        <div class="hero-aurora-glow"></div>
        <div class="shell">
          <div class="hero-grid">
            <div class="hero-text-col">
              <div class="hero-tag">
                <span class="tag-pulse-dot"></span>
                <span>NEVO GROUP RASMIY PORTALI</span>
              </div>
              <h1 class="hero-title">
                Santexnika va qurilish mahsulotlari — barchasi bir joyda
              </h1>
              <p class="hero-desc">
                Keng assortiment, qulay muhandislik yechimlari va butun O'zbekiston bo'ylab to'g'ridan-to'g'ri yetkazib berish.
              </p>
              <div class="hero-buttons">
                <a href="#catalog" class="btn-primary hero-btn-glow">
                  <span>Mahsulotlarni ko'rish</span>
                  ${icon('arrow-right', '', 18)}
                </a>
                <a href="#tanlash" class="btn-secondary">
                  <span>Menga mahsulot topib bering</span>
                </a>
              </div>

              <!-- Real Team / Staff Trust Badge -->
              <div class="hero-team-strip">
                <div class="team-avatars-stack">
                  <img src="/workers/worker-consultant-thumb.webp" alt="Muhandis maslahatchi" class="avatar-circle" width="38" height="38">
                  <img src="/workers/worker-construction-thumb.webp" alt="Qurilish ustasi" class="avatar-circle" width="38" height="38">
                  <img src="/workers/worker-warehouse-thumb.webp" alt="Ombor logistikasi" class="avatar-circle" width="38" height="38">
                </div>
                <div class="team-trust-info">
                  <div class="team-trust-title">
                    <strong>Mutaxassislarimiz yordam beradi</strong>
                  </div>
                  <div class="team-trust-sub">Loyiha yoki ro'yxatingiz bo'yicha bepul maslahat</div>
                </div>
              </div>

              <!-- Trust Micro Badges -->
              <div class="hero-trust-badges">
                <div class="trust-item">
                  <span class="trust-check">✓</span>
                  <span>Narxlar so'mda, ochiq</span>
                </div>
                <div class="trust-item">
                  <span class="trust-check">✓</span>
                  <span>Kodi va o'lchami bilan</span>
                </div>
                <div class="trust-item">
                  <span class="trust-check">✓</span>
                  <span>O'zbekiston bo'ylab yetkazish</span>
                </div>
              </div>
            </div>

            <div class="hero-matrix-wrapper">
              <!-- Floating 3D Micro Badges -->
              <div class="floating-badge badge-float-top">
                <span class="live-dot-green"></span>
                <span>Narxlar praysdan</span>
              </div>

              <div class="hero-image-matrix">
                ${renderHeroCards(catalog, heroProducts)}
              </div>

              <div class="floating-badge badge-float-bottom">
                <span class="live-dot-blue"></span>
                <span>🔧 Mutaxassislar tanlovi</span>
              </div>
            </div>
          </div>

          <!-- Teaser Card -->
          <div class="teaser-banner">
            <div class="teaser-content">
              <h2>Qurilish uchun mahsulot qidiryapsizmi?</h2>
              <p>Tovar nomi, tavsif va sonini yozing — katalogdan mos tovarlarni ajratib, <strong>3 xil eng yaxshi taklif</strong> beramiz.</p>
            </div>
            <a href="#tanlash" class="btn-primary">
              <span>3 xil taklif olish</span>
              ${icon('arrow-right', '', 18)}
            </a>
          </div>

          <!-- Animated Stats Strip -->
          <div class="stats-section">
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon-wrap">${icon('boxes', '', 22)}</div>
                ${renderStatNumber(catalog, catalog.products.length)}
                <div class="stat-label">Katalogdagi tovarlar</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon-wrap">${icon('layout-grid', '', 22)}</div>
                ${renderStatNumber(catalog, catalog.categories.length)}
                <div class="stat-label">Asosiy bo'limlar</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon-wrap">${icon('tag', '', 22)}</div>
                ${renderStatNumber(catalog, subcategoryCount)}
                <div class="stat-label">Mahsulot guruhlari</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon-wrap">${icon('shield-check', '', 22)}</div>
                ${renderStatNumber(catalog, brandCount)}
                <div class="stat-label">Brendlar</div>
              </div>
            </div>
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
                  <img src="/workers/worker-pipefitting.webp" alt="Quvurlar montaji" loading="lazy" decoding="async">
                  <span class="worker-role-badge">🔧 Montaj va O'rnatish</span>
                </div>
                <div class="worker-card-body">
                  <h3>Obyektda quvurlar montaji</h3>
                  <p>Tajribali chilangar va montajchilarimiz yirik diametrli fitinglar, zapor armatura va quvurlarni germetik biriktiradi.</p>
                  <div class="worker-feature-check">
                    <span class="check-icon">✓</span>
                    <span>Yuqori bosimga chidamli fitinglar</span>
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

          <!-- 🎥 DUAL VIDEO SHOWCASE: MATERIAL USAGE & WAREHOUSE IN ACTION -->
          <section class="video-showcase-section">
            <div class="section-head" style="margin-bottom: 24px;">
              <div>
                <div class="section-pill-tag">VIDEO SHARHLAR</div>
                <h2 class="section-title">Mahsulotlarimiz Ish Jarayonida</h2>
                <div class="section-subtitle">Haqiqiy montaj, payvandlash va ombor operatsiyalari</div>
              </div>
            </div>

            <div class="dual-video-grid">
              <!-- Video Card 1: Pipeline welding and fitting -->
              <div class="video-showcase-card">
                <div class="video-media-wrap">
                  <video class="lazy-video" muted loop playsinline preload="none" poster="/mahsulot/pe-otvod.webp">
                    <source src="/videos/pipeline-showcase.webm" type="video/webm">
                  </video>
                  <div class="video-card-overlay"></div>
                  <button class="video-play-btn-circle" onclick="window.__openVideoModal('/videos/pipeline-showcase.webm', 'Magistral quvurlar va fitinglarni payvandlash jarayoni')" aria-label="Videoni tomosha qilish">
                    ${icon('play', '', 24)}
                  </button>
                  <span class="video-tag-top">⚡ Obyektda montaj</span>
                </div>
                <div class="video-card-info">
                  <h3>Magistral quvur va fitinglar montaji</h3>
                  <p>Yuqori bosimli suv ta'minoti quvurlarining professional payvandlash va montaj jarayoni.</p>
                  <div class="video-meta-row">
                    <span>⏱ 1080p HD Video</span>
                    <span>·</span>
                    <button class="video-text-link" onclick="window.__openVideoModal('/videos/pipeline-showcase.webm', 'Magistral quvurlar va fitinglarni payvandlash jarayoni')">
                      To'liq tomosha qilish →
                    </button>
                  </div>
                </div>
              </div>

              <!-- Video Card 2: Central warehouse and logistics -->
              <div class="video-showcase-card">
                <div class="video-media-wrap">
                  <video class="lazy-video" muted loop playsinline preload="none" poster="/workers/worker-warehouse.webp">
                    <source src="/videos/warehouse-showcase.webm" type="video/webm">
                  </video>
                  <div class="video-card-overlay"></div>
                  <button class="video-play-btn-circle" onclick="window.__openVideoModal('/videos/warehouse-showcase.webm', 'NEVO GROUP markaziy ombori va logistika operatsiyalari')" aria-label="Videoni tomosha qilish">
                    ${icon('play', '', 24)}
                  </button>
                  <span class="video-tag-top">📦 Ombor logistikasi</span>
                </div>
                <div class="video-card-info">
                  <h3>Markaziy ombor va yuklarni saralash</h3>
                  <p>Mijozlar buyurtmalarini tezkor saralash, qadoqlash va obyektlarga jo'natish tizimi.</p>
                  <div class="video-meta-row">
                    <span>⏱ 1080p HD Video</span>
                    <span>·</span>
                    <button class="video-text-link" onclick="window.__openVideoModal('/videos/warehouse-showcase.webm', 'NEVO GROUP markaziy ombori va logistika operatsiyalari')">
                      To'liq tomosha qilish →
                    </button>
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
      </section>

      <!-- Video Modal Popup -->
      <div id="video-modal-backdrop" class="video-modal-backdrop" onclick="if(event.target===this) window.__closeVideoModal()">
        <div class="video-modal-content">
          <button class="video-modal-close" onclick="window.__closeVideoModal()" aria-label="Yopish">
            ${icon('x', '', 24)}
          </button>
          <div class="video-player-wrap">
            <video id="modal-video-element" controls playsinline preload="none">
              <source id="modal-video-source" src="/videos/pipeline-showcase.webm" type="video/webm">
              Brauzeringiz video formatini qo'llab-quvvatlamaydi.
            </video>
          </div>
          <div class="video-modal-caption">
            <h4 id="modal-video-title">NEVO GROUP — Obyektlar uchun yuqori bosimli quvur va armatura ta'minoti</h4>
            <p id="modal-video-desc">Sifatli metall, sertifikatlangan ishlab chiqarish va ishonchli muhandislik yechimlari.</p>
          </div>
        </div>
      </div>
    </main>
  `;
}

// Fon videolari sahifa ochilganda yuklanmaydi (preload="none", autoplay yo'q):
// ekranga 200px qolganda yuklanib ijro etiladi, ekrandan chiqqanda pauza qilinadi.
let lazyVideoObserver = null;

function initLazyVideos() {
  lazyVideoObserver?.disconnect();
  const videos = document.querySelectorAll('video.lazy-video');
  if (!videos.length) return;

  if (!('IntersectionObserver' in window)) {
    videos.forEach(v => v.play().catch(() => {}));
    return;
  }

  lazyVideoObserver = new IntersectionObserver((entries) => {
    entries.forEach(({ target: video, isIntersecting }) => {
      if (isIntersecting) {
        if (!video.dataset.loaded) {
          video.dataset.loaded = '1';
          video.load();
        }
        video.play().catch(() => {});
      } else if (video.dataset.loaded) {
        video.pause();
      }
    });
  }, { rootMargin: '200px 0px' });

  videos.forEach(v => lazyVideoObserver.observe(v));
}

export function initHomeAnimations() {
  initLazyVideos();

  // Animated Stat Counters
  const counters = document.querySelectorAll('.stat-number[data-count]');
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

  // Video Modal Handlers
  window.__openVideoModal = (src, title) => {
    const modal = document.getElementById('video-modal-backdrop');
    const vid = document.getElementById('modal-video-element');
    const source = document.getElementById('modal-video-source');
    const titleEl = document.getElementById('modal-video-title');
    if (modal) {
      modal.classList.add('open');
      if (src && source && vid) {
        source.src = src;
        vid.load();
      }
      if (title && titleEl) {
        titleEl.textContent = title;
      }
      if (vid) {
        vid.currentTime = 0;
        vid.play().catch(() => {});
      }
    }
  };

  window.__closeVideoModal = () => {
    const modal = document.getElementById('video-modal-backdrop');
    const vid = document.getElementById('modal-video-element');
    if (modal) {
      modal.classList.remove('open');
      if (vid) vid.pause();
    }
  };

  // 3D Card Hover Perspective Tilt
  const tiltCards = document.querySelectorAll('.hero-img-card, .product-card, .benefit-card, .worker-card, .video-showcase-card');
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
