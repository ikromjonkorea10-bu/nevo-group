// "Mijozlar fikri" bo'limi. Sharhlar src/data/content.js dagi TESTIMONIALS dan olinadi.

import { esc } from '../lib/format.js';
import { TESTIMONIALS } from '../data/content.js';

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
