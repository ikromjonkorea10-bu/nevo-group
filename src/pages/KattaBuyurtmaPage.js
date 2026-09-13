import { icon } from '../icons.js';
import { store } from '../store.js';

let selectedProjectType = 'Yakka tartibdagi uy';
let isSubmitted = false;

export function renderKattaBuyurtmaPage() {
  const projectTypes = [
    'Yakka tartibdagi uy',
    'Ko\'p qavatli bino',
    'Ta\'mirlash',
    'Savdo/ofis obyekti',
    'Issiqxona / ferma',
    'Boshqa'
  ];

  if (isSubmitted) {
    return `
      <div class="shell bulk-page-wrap">
        <nav class="breadcrumbs">
          <a href="#home">Bosh sahifa</a>
          <span>›</span>
          <span style="color: var(--ink); font-weight: 600;">Katta buyurtma</span>
        </nav>

        <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-2xl); padding: 60px 20px; text-align: center; margin-top: 24px;">
          <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            ${icon('check', '', 32)}
          </div>
          <h2 style="font-size: 26px; font-weight: 800; color: var(--ink); margin-bottom: 8px;">
            So'rovingiz muvaffaqiyatli qabul qilindi!
          </h2>
          <p style="font-size: 15px; color: var(--muted); max-width: 500px; margin: 0 auto 24px; line-height: 1.5;">
            Mutaxassisimiz ro'yxatni prays bo'yicha hisoblab chiqadi va qisqa vaqt ichida ko'rsatilgan telefon raqamiga narxlar smetasini yuboradi.
          </p>

          <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
            <button type="button" class="btn-secondary" onclick="window.__resetBulkOrder()">
              Yangi ro'yxat yuborish
            </button>
            <a href="#catalog" class="btn-primary">
              Katalogga qaytish
            </a>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="shell bulk-page-wrap">
      <nav class="breadcrumbs">
        <a href="#home">Bosh sahifa</a>
        <span>›</span>
        <span style="color: var(--ink); font-weight: 600;">Katta buyurtma</span>
      </nav>

      <div style="margin-top: 16px;">
        <h1 style="font-size: 32px; font-weight: 800; color: var(--ink);">Katta qurilish buyurtmasi</h1>
        <p style="font-size: 15.5px; color: var(--muted); margin-top: 8px; line-height: 1.5;">
          Obyekt uchun bir nechta pozitsiya kerakmi? Bittalab qidirib o'tirmang — ro'yxatni yozib yuboring, narxini va qancha muddatda yig'ilishini operatorimiz aytadi.
        </p>
      </div>

      <form class="bulk-form-card" id="bulk-order-form" onsubmit="window.__submitBulkOrder(event)">
        <!-- Project Type -->
        <div class="form-group">
          <label class="form-label">Loyiha turi</label>
          <div class="project-type-chips">
            ${projectTypes.map(pt => `
              <button 
                type="button" 
                class="project-chip ${selectedProjectType === pt ? 'active' : ''}" 
                onclick="window.__selectProjectType('${pt}')"
              >
                ${pt}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Products List Textarea -->
        <div class="form-group">
          <label class="form-label">Kerakli mahsulotlar ro'yxati *</label>
          <p style="font-size: 13px; color: var(--muted); margin-bottom: 8px;">
            Har qatorga bitta mahsulot yozing. Kod bilan yozsangiz aniqroq bo'ladi, lekin shart emas — nomi va soni ham yetadi.
          </p>
          <textarea 
            class="form-textarea" 
            id="bulk-items-text" 
            rows="6" 
            placeholder="Masalan:&#10;1. PP-R truba d25 PN20 — 120 metr&#10;2. AQUA LINE mufta d25 — 40 dona&#10;3. Zadvijka DN50 cho'yan — 2 dona" 
            required
          ></textarea>
        </div>

        <!-- Customer Contacts -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">Tashkilot / brigada nomi</label>
            <input type="text" class="form-input" id="bulk-org" placeholder="Masalan: 'Obod Qurilish' MCHJ" />
          </div>
          <div class="form-group">
            <label class="form-label">Mas'ul shaxs (Ism) *</label>
            <input type="text" class="form-input" id="bulk-name" placeholder="Ism-familiyangiz" required />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">Telefon raqamingiz *</label>
            <input type="tel" class="form-input" id="bulk-phone" placeholder="+998 90 123 45 67" required />
          </div>
          <div class="form-group">
            <label class="form-label">Obyekt qayerda (viloyat, tuman)</label>
            <input type="text" class="form-input" id="bulk-location" placeholder="Joylashuvi" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Qo'shimcha izoh — muddat, yetkazish shartlari, to'lov shakli...</label>
          <textarea class="form-textarea" id="bulk-notes" rows="3" placeholder="Ixtiyoriy izoh qoldiring..."></textarea>
        </div>

        <button type="submit" class="btn-primary" style="width: 100%; justify-content: center; padding: 15px;">
          <span>Ro'yxatni yuborish</span>
          ${icon('arrow-right', '', 18)}
        </button>
      </form>
    </div>
  `;
}

export function initKattaBuyurtmaEvents(rerenderCallback) {
  window.__selectProjectType = (pt) => {
    selectedProjectType = pt;
    rerenderCallback();
  };

  window.__submitBulkOrder = (e) => {
    e.preventDefault();
    const itemsText = document.getElementById('bulk-items-text')?.value?.trim();
    const name = document.getElementById('bulk-name')?.value?.trim();
    const phone = document.getElementById('bulk-phone')?.value?.trim();

    if (!itemsText || !name || !phone) {
      alert("Iltimos, mahsulotlar ro'yxatini va telefon raqamingizni to'ldiring.");
      return;
    }

    isSubmitted = true;
    store.showToast("Buyurtma so'rovi yuborildi");
    rerenderCallback();
  };

  window.__resetBulkOrder = () => {
    isSubmitted = false;
    rerenderCallback();
  };
}
