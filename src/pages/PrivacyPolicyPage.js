import { icon } from '../icons.js';
import { t } from '../lib/i18n.js';

export function renderPrivacyPolicyPage() {
  return `
    <div class="shell" style="padding: 40px 16px 80px; max-width: 860px; margin: 0 auto;">
      <!-- Breadcrumbs -->
      <nav class="breadcrumbs" aria-label="Breadcrumb" style="margin-bottom: 24px;">
        <a href="/">${t('breadHome')}</a>
        <span>›</span>
        <span style="color: var(--ink); font-weight: 600;">${t('privacyPolicy')}</span>
      </nav>

      <div class="status-card" style="text-align: left; padding: 36px 32px; background: rgba(255, 255, 255, 0.035); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
          <div class="status-icon" style="margin: 0;">${icon('shield-check', '', 26)}</div>
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: var(--ink);">${t('privacyPolicy')}</h1>
        </div>

        <p style="color: var(--muted); font-size: 15px; line-height: 1.7; margin-bottom: 20px;">
          NEVO GROUP mijozlarining shaxsiy ma'lumotlari maxfiyligini hurmat qiladi va ularni himoya qilish majburiyatini oladi.
        </p>

        <h3 style="color: var(--ink); font-size: 18px; margin: 24px 0 10px;">1. Ma'lumotlarni yig'ish</h3>
        <p style="color: var(--muted); font-size: 14.5px; line-height: 1.7; margin-bottom: 16px;">
          Saytda buyurtma berish yoki murojaat yuborishda faqat buyurtmani qayta ishlash va yetkazib berish uchun zarur bo'lgan ma'lumotlar (ism, telefon raqami, manzil) so'raladi.
        </p>

        <h3 style="color: var(--ink); font-size: 18px; margin: 24px 0 10px;">2. Ma'lumotlardan foydalanish</h3>
        <p style="color: var(--muted); font-size: 14.5px; line-height: 1.7; margin-bottom: 16px;">
          Taqdim etilgan ma'lumotlar faqat mijoz bilan bog'lanish, buyurtma holatini tasdiqlash va xizmat sifatini oshirish maqsadida qo'llaniladi. Uchinchi shaxslarga tijoriy maqsadlarda berilmaydi.
        </p>

        <h3 style="color: var(--ink); font-size: 18px; margin: 24px 0 10px;">3. Xavfsizlik</h3>
        <p style="color: var(--muted); font-size: 14.5px; line-height: 1.7; margin-bottom: 24px;">
          Saytda zamonaviy xavfsizlik protokollari (HTTPS, shifrlash va xavfsiz ulanishlar) joriy qilingan bo'lib, foydalanuvchilar ma'lumotlari ruxsatsiz kirishdan himoyalangan.
        </p>

        <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <a href="/katalog" class="btn-primary">
            ${icon('chevron-left', '', 18)}
            <span>${t('backToCatalog')}</span>
          </a>
          <a href="/aloqa" class="btn-secondary">${t('contactUs')}</a>
        </div>
      </div>
    </div>
  `;
}
