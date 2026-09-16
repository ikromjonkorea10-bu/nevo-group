// "Mijozlar fikri" — bosh sahifa bo'limi. Faqat haqiqiy, egasi rozi bo'lgan sharhlar qo'shiladi.
// Ro'yxat bo'sh bo'lsa bo'lim umuman chiqmaydi.
//
// [MIJOZ: bu yerga haqiqiy sharhlarni qo'shing]. Namuna:
//   { text: 'Sharh matni', name: 'Ism F.', role: 'Qurilish kompaniyasi', source: 'Instagram' },
// role va source ixtiyoriy.

import { esc } from '../lib/format.js';

export const TESTIMONIALS = [];

export function renderTestimonials(items = TESTIMONIALS) {
  if (!items.length) return '';
  return `
    <section class="home-section" aria-labelledby="testimonials-title">
      <div class="section-head">
        <div>
          <h2 class="section-title" id="testimonials-title">Mijozlar fikri</h2>
          <div class="section-subtitle">NEVO GROUP bilan ishlagan mijozlarimiz</div>
        </div>
      </div>

      <div class="testimonials-grid">
        ${items.map((t) => `
          <figure class="testimonial-card">
            <blockquote class="testimonial-text">${esc(t.text)}</blockquote>
            <figcaption class="testimonial-author">
              <span class="testimonial-name">${esc(t.name)}</span>
              ${t.role ? `<span class="testimonial-meta">${esc(t.role)}</span>` : ''}
              ${t.source ? `<span class="testimonial-meta">${esc(t.source)}</span>` : ''}
            </figcaption>
          </figure>
        `).join('')}
      </div>
    </section>
  `;
}
