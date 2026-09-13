import { icon } from '../icons.js';
import { getCatalog } from '../lib/catalog.js';
import { esc } from '../lib/format.js';
import { renderProductCard } from '../components/ProductCard.js';

let step = 1;
let answers = {
  category: '',
  subcategory: '',
  size: '',
  quantity: '',
  pricePreference: 'O\'rtacha'
};
let isCompleted = false;

export function renderTanlashPage() {
  const { categories, products } = getCatalog();
  if (!answers.category && categories.length) answers.category = categories[0].slug;

  if (isCompleted) {
    // Generate 3 recommendations based on answers
    const available = products.filter(p => p.inStock);
    let pool = available.filter(p => p.categorySlug === answers.category);
    if (pool.length === 0) pool = available;

    pool = [...pool].sort((a, b) => a.price - b.price);

    const offer1 = pool[0]; // Budget/best match
    const offer2 = pool[Math.floor(pool.length / 2)]; // Balanced
    const offer3 = pool[pool.length - 1]; // Premium

    if (!offer1) {
      return `
        <div class="shell quiz-page-wrap">
          <div class="status-card" style="margin-top: 24px;">
            <h2 class="status-title">Hozircha mos mahsulot topilmadi</h2>
            <p class="status-text">Operatorimiz sizga mos variantni topib beradi.</p>
            <a href="#aloqa" class="btn-primary">Bog'lanish</a>
          </div>
        </div>
      `;
    }

    return `
      <div class="shell quiz-page-wrap">
        <nav class="breadcrumbs">
          <a href="#home">Bosh sahifa</a>
          <span>›</span>
          <span style="color: var(--ink); font-weight: 600;">Mahsulot tanlash</span>
        </nav>

        <div style="text-align: center; margin: 24px 0 36px;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: #eff6ff; color: var(--nevo-blue); border-radius: 50%; margin-bottom: 14px;">
            ${icon('check', '', 28)}
          </div>
          <h1 style="font-size: 30px; font-weight: 800; color: var(--ink);">Sizga mos 3 ta taklif</h1>
          <p style="font-size: 15px; color: var(--muted); max-width: 480px; margin: 8px auto 0;">
            Katalogdan siz kiritgan mezonlar bo'yicha eng ma'qul 3 xil variantni ajratdik.
          </p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px;">
          <!-- Offer 1 -->
          <div>
            <div style="background: #eff6ff; border: 1px solid var(--tint-border); border-radius: 12px 12px 0 0; padding: 10px 14px; text-align: center; font-size: 13px; font-weight: 700; color: var(--nevo-blue);">
              ⭐ Taklif 1: Hamyonbop variant
            </div>
            ${renderProductCard(offer1)}
          </div>

          <!-- Offer 2 -->
          <div>
            <div style="background: #f1f5f9; border: 1px solid var(--border); border-radius: 12px 12px 0 0; padding: 10px 14px; text-align: center; font-size: 13px; font-weight: 700; color: var(--ink);">
              ⚖️ Taklif 2: Muqobil / O'rtacha
            </div>
            ${renderProductCard(offer2)}
          </div>

          <!-- Offer 3 -->
          <div>
            <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 12px 12px 0 0; padding: 10px 14px; text-align: center; font-size: 13px; font-weight: 700; color: #b45309;">
              💎 Taklif 3: Sifatliroq / Katta o'lcham
            </div>
            ${renderProductCard(offer3)}
          </div>
        </div>

        <div style="text-align: center; margin-top: 40px; display: flex; justify-content: center; gap: 14px;">
          <button type="button" class="btn-secondary" onclick="window.__restartQuiz()">
            Qaytadan tanlash
          </button>
          <a href="#catalog" class="btn-primary">
            Katalogni ko'rish
          </a>
        </div>
      </div>
    `;
  }

  // Quiz Steps
  return `
    <div class="shell quiz-page-wrap">
      <nav class="breadcrumbs">
        <a href="#home">Bosh sahifa</a>
        <span>›</span>
        <span style="color: var(--ink); font-weight: 600;">Mahsulot tanlash</span>
      </nav>

      <div style="margin-top: 16px;">
        <h1 style="font-size: 32px; font-weight: 800; color: var(--ink);">Nima kerakligini bilmayapsizmi?</h1>
        <p style="font-size: 15.5px; color: var(--muted); margin-top: 8px; line-height: 1.5;">
          Bir nechta savol — va katalogdan uchta variant chiqaramiz. Bilmagan savolingizni o'tkazib yuborsangiz ham bo'ladi.
        </p>
      </div>

      <div class="quiz-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <span style="font-size: 13px; font-weight: 700; color: var(--nevo-blue); text-transform: uppercase;">
            Savol ${step} / 4
          </span>
          <div style="display: flex; gap: 4px;">
            ${[1, 2, 3, 4].map(s => `
              <div style="width: 24px; height: 4px; border-radius: 2px; background: ${s <= step ? 'var(--nevo-blue)' : '#e2e8f0'};"></div>
            `).join('')}
          </div>
        </div>

        ${step === 1 ? `
          <h2 class="quiz-question-title">Nima ustida ishlayapsiz?</h2>
          <p class="quiz-question-sub">Bo'limni tanlang</p>

          <div class="quiz-options-list">
            ${categories.map(c => `
              <button
                type="button"
                class="quiz-option-btn ${answers.category === c.slug ? 'selected' : ''}"
                data-value="${esc(c.slug)}"
                onclick="window.__selectQuizCat(this.dataset.value)"
              >
                <span>${esc(c.name)}</span>
                <span style="font-size: 13px; font-weight: 500; opacity: 0.8;">${c.count} mahsulot</span>
              </button>
            `).join('')}
          </div>
        ` : ''}

        ${step === 2 ? `
          <h2 class="quiz-question-title">O'lchami ma'lummi?</h2>
          <p class="quiz-question-sub">Bilmasangiz — o'tkazib yuboring, operator aniqlaydi</p>

          <div class="quiz-options-list">
            ${['d20 (1/2 dyuym)', 'd25 (3/4 dyuym)', 'd32 (1 dyuym)', 'd50 / d63 (Magistral)', 'd110 (Kanalizatsiya / Suv)', 'Bilmayman / Standart'].map(sz => `
              <button 
                type="button" 
                class="quiz-option-btn ${answers.size === sz ? 'selected' : ''}" 
                data-value="${esc(sz)}"
                onclick="window.__selectQuizSize(this.dataset.value)"
              >
                <span>${sz}</span>
                ${answers.size === sz ? icon('check', '', 16) : ''}
              </button>
            `).join('')}
          </div>
        ` : ''}

        ${step === 3 ? `
          <h2 class="quiz-question-title">Qancha miqdorda kerak?</h2>
          <p class="quiz-question-sub">Taxminan — miqdorga qarab narx o'zgarishi mumkin</p>

          <div class="quiz-options-list">
            ${['1 - 10 dona / metr (Uy uchun)', '10 - 50 dona / metr (Ta\'mirlash)', '50 - 200 dona / metr (Katta xonadon)', '200+ dona / Ulgurji (Katta qurilish)'].map(qty => `
              <button 
                type="button" 
                class="quiz-option-btn ${answers.quantity === qty ? 'selected' : ''}" 
                data-value="${esc(qty)}"
                onclick="window.__selectQuizQty(this.dataset.value)"
              >
                <span>${qty}</span>
                ${answers.quantity === qty ? icon('check', '', 16) : ''}
              </button>
            `).join('')}
          </div>
        ` : ''}

        ${step === 4 ? `
          <h2 class="quiz-question-title">Narx bo'yicha nima muhim?</h2>
          <p class="quiz-question-sub">Ixtiyoriy tanlov</p>

          <div class="quiz-options-list">
            ${[
              { title: 'Eng arzoni bo\'lsin', desc: 'Minimal budjet bilan qulay yechim' },
              { title: 'O\'rtacha', desc: 'Narx va sifatning eng yaxshi mutanosibligi' },
              { title: 'Sifatliroq bo\'lsin', desc: 'Katta bosimga chidamli va uzoq muddatli' }
            ].map(opt => `
              <button 
                type="button" 
                class="quiz-option-btn ${answers.pricePreference === opt.title ? 'selected' : ''}" 
                data-value="${esc(opt.title)}"
                onclick="window.__selectQuizPrice(this.dataset.value)"
              >
                <div>
                  <div style="font-weight: 700;">${opt.title}</div>
                  <div style="font-size: 13px; font-weight: 400; opacity: 0.85;">${opt.desc}</div>
                </div>
                ${answers.pricePreference === opt.title ? icon('check', '', 16) : ''}
              </button>
            `).join('')}
          </div>
        ` : ''}

        <div class="quiz-nav-row">
          ${step > 1 ? `
            <button type="button" class="btn-secondary" onclick="window.__prevQuizStep()">
              Orqaga
            </button>
          ` : `<div></div>`}

          <div style="display: flex; gap: 10px;">
            <button type="button" class="btn-secondary" onclick="window.__skipQuizStep()">
              O'tkazib yuborish
            </button>
            <button type="button" class="btn-primary" onclick="window.__nextQuizStep()">
              ${step === 4 ? 'Takliflarni ko\'rish' : 'Keyingisi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initTanlashEvents(rerenderCallback) {
  window.__selectQuizCat = (cat) => {
    answers.category = cat;
    rerenderCallback();
  };

  window.__selectQuizSize = (sz) => {
    answers.size = sz;
    rerenderCallback();
  };

  window.__selectQuizQty = (qty) => {
    answers.quantity = qty;
    rerenderCallback();
  };

  window.__selectQuizPrice = (pr) => {
    answers.pricePreference = pr;
    rerenderCallback();
  };

  window.__nextQuizStep = () => {
    if (step < 4) {
      step++;
    } else {
      isCompleted = true;
    }
    rerenderCallback();
  };

  window.__prevQuizStep = () => {
    if (step > 1) {
      step--;
      rerenderCallback();
    }
  };

  window.__skipQuizStep = () => {
    window.__nextQuizStep();
  };

  window.__restartQuiz = () => {
    step = 1;
    isCompleted = false;
    rerenderCallback();
  };
}
