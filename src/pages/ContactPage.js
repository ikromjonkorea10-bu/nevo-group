import { icon } from '../icons.js';
import { store } from '../store.js';
import { getCatalog } from '../lib/catalog.js';
import { CONTACTS, INSTAGRAM_DM_URL } from '../data/content.js';

// Kafolat va qaytarish bo'limi.
// [MIJOZ: bu yerga haqiqiy siyosatni yozing] — hozirgi matnlar hech narsa va'da qilmaydi,
// faqat operatordan so'rashga yo'naltiradi. Aniq muddat va shartlar tasdiqlangach almashtiring.
const WARRANTY_ITEMS = [
  {
    icon: 'shield-check',
    title: 'Kafolat',
    text: "Mahsulot kafolati shartlarini buyurtma berishda operatorimizdan aniqlang.",
  },
  {
    icon: 'cube',
    title: 'Qaytarish va almashtirish',
    text: "Qaytarish yoki almashtirish shartlarini buyurtmadan oldin operator bilan kelishib oling.",
  },
  {
    icon: 'message-circle',
    title: "Muammo bo'lsa",
    text: "Mahsulotda nuqson topilsa, yuqoridagi telefon yoki Instagram orqali murojaat qiling.",
  },
];

export function renderContactPage() {
  const catalog = getCatalog();
  const assortment = catalog.status === 'ready' && catalog.products.length
    ? `${catalog.products.length} ta mahsulot`
    : 'Santexnika va qurilish mahsulotlari';

  return `
    <div class="shell contact-page-wrap">
      <h1 class="contact-title">Aloqa</h1>
      <p class="contact-subtitle">
        Narx, o'lcham yoki mavjudlik bo'yicha savolingiz bo'lsa — yozing. Kerakli mahsulotni topishda yordam beramiz.
      </p>

      <!-- Ready Message Box -->
      <div class="ready-message-box">
        <div class="ready-msg-label">Tayyor xabar</div>
        <div class="ready-msg-text" id="ready-msg-text">
          Assalomu alaykum! Mahsulot bo'yicha savolim bor edi.
        </div>
        <button type="button" class="btn-copy-msg" id="btn-copy-message" onclick="window.__copyReadyMessage()">
          ${icon('copy', '', 15)}
          <span id="copy-btn-label">Nusxa olish</span>
        </button>
      </div>

      <!-- Instagram Direct CTA -->
      <a 
        href="${INSTAGRAM_DM_URL}"
        target="_blank" 
        rel="noopener" 
        class="btn-instagram-direct"
      >
        ${icon('instagram', '', 20)}
        <span>Instagramda yozish</span>
      </a>

      <!-- Direct Phone Numbers -->
      <div class="contact-phones-row">
        ${CONTACTS.phones.map((p) => `
          <a href="tel:${p.tel}" class="phone-action-card">
            ${icon('phone', '', 18)}
            <span>${p.label}</span>
          </a>
        `).join('')}
      </div>

      <!-- Qisqacha ma'lumot -->
      <section style="margin-top: 40px;">
        <h3 style="font-size: 20px; font-weight: 800; color: var(--ink); margin-bottom: 6px;">
          Qisqacha ma'lumot
        </h3>

        <div class="info-cards-grid">
          <div class="info-box-card">
            <div class="info-box-icon">
              ${icon('map-pin', '', 20)}
            </div>
            <div>
              <div class="info-box-title">Joylashuv</div>
              <div class="info-box-value">O'zbekiston</div>
            </div>
          </div>

          <div class="info-box-card">
            <div class="info-box-icon">
              ${icon('boxes', '', 20)}
            </div>
            <div>
              <div class="info-box-title">Assortiment</div>
              <div class="info-box-value">${assortment}</div>
            </div>
          </div>

          <div class="info-box-card">
            <div class="info-box-icon">
              ${icon('instagram', '', 20)}
            </div>
            <div>
              <div class="info-box-title">Instagram</div>
              <div class="info-box-value">@${CONTACTS.instagram}</div>
            </div>
          </div>

          <div class="info-box-card">
            <div class="info-box-icon">
              ${icon('clock', '', 20)}
            </div>
            <div>
              <div class="info-box-title">Javob vaqti</div>
              <div class="info-box-value">Ish vaqtida javob beramiz</div>
            </div>
          </div>
        </div>

        <p style="font-size: 13.5px; color: var(--muted); margin-top: 14px; line-height: 1.5;">
          Aniq do'kon manzili va ish vaqti kompaniya tomonidan tasdiqlangach shu yerga qo'shiladi.
        </p>
      </section>

      <!-- Kafolat va qaytarish -->
      <section id="kafolat" style="margin-top: 40px;">
        <h3 style="font-size: 20px; font-weight: 800; color: var(--ink); margin-bottom: 6px;">
          Kafolat va qaytarish
        </h3>

        <div class="info-cards-grid">
          ${WARRANTY_ITEMS.map((w) => `
            <div class="info-box-card">
              <div class="info-box-icon">
                ${icon(w.icon, '', 20)}
              </div>
              <div>
                <div class="info-box-title">${w.title}</div>
                <div class="info-box-value" style="font-weight: 500; font-size: 14px; line-height: 1.5;">${w.text}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Qanday ishlaydi -->
      <section style="margin-top: 40px;">
        <h3 style="font-size: 20px; font-weight: 800; color: var(--ink); margin-bottom: 6px;">
          Qanday ishlaydi
        </h3>

        <div class="workflow-steps-list">
          <div class="workflow-step-card">
            <div class="step-circle-num">1</div>
            <div class="step-card-text">Mahsulot nomini yoki kodini yozing</div>
          </div>
          <div class="workflow-step-card">
            <div class="step-circle-num">2</div>
            <div class="step-card-text">Mutaxassisimiz narx va mavjudlikni tekshiradi</div>
          </div>
          <div class="workflow-step-card">
            <div class="step-circle-num">3</div>
            <div class="step-card-text">Kelishilgan holda buyurtmani rasmiylashtiramiz</div>
          </div>
        </div>
      </section>

      <!-- Avval katalogni ko'ring -->
      <section class="cta-banner-light" style="margin-top: 40px;">
        <div>
          <h3 style="font-size: 20px; font-weight: 800; margin-bottom: 6px;">Avval katalogni ko'ring</h3>
          <p style="font-size: 14.5px; color: var(--muted);">
            Kerakli mahsulotni topsangiz, so'rov matni avtomatik tayyorlanadi.
          </p>
        </div>
        <a href="#catalog" class="btn-primary">
          <span>Katalogga o'tish</span>
          ${icon('arrow-right', '', 18)}
        </a>
      </section>
    </div>
  `;
}

export function initContactEvents() {
  window.__copyReadyMessage = () => {
    const text = document.getElementById('ready-msg-text')?.innerText?.trim() || "Assalomu alaykum! Mahsulot bo'yicha savolim bor edi.";
    navigator.clipboard.writeText(text).then(() => {
      const label = document.getElementById('copy-btn-label');
      if (label) {
        label.textContent = "Nusxalandi! ✓";
        setTimeout(() => {
          label.textContent = "Nusxa olish";
        }, 2000);
      }
      store.showToast("Xabar nusxalandi");
    }).catch(() => {
      store.showToast("Nusxalashda xatolik yuz berdi", "error");
    });
  };
}
