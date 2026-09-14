// Brauzer tabidagi sarlavha va meta description — har bir sahifa uchun.
// Eslatma: Telegram/Facebook kabi ulashish botlari JavaScript'ni bajarmaydi va
// #hash qismini ko'rmaydi. Mahsulot havolasining ulashish kartasi (og:title,
// og:image) server tomonda /p/<slug> manzilida yasaladi — api/share.js.

import { getCatalog, getProductBySlug, getCategoryBySlug } from './catalog.js';

const SITE = 'NEVO GROUP';
const DEFAULT_TITLE = 'NEVO GROUP — Santexnika va qurilish mahsulotlari';
const DEFAULT_DESCRIPTION =
  "Santexnika va qurilish mahsulotlari: truba va fitinglar, zapor armatura, yong'in va elektr jihozlari. Narxlar so'mda, O'zbekiston bo'ylab yetkazib berish.";

const STATIC_TITLES = {
  catalog: 'Katalog',
  tanlash: 'Mahsulot tanlash',
  'katta-buyurtma': 'Katta buyurtma',
  savat: 'Savat',
  aloqa: 'Aloqa',
};

function setDescription(text) {
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', text);
}

/** @param {string} route @param {string} [param] */
export function updatePageMeta(route, param = '') {
  let title = DEFAULT_TITLE;
  let description = DEFAULT_DESCRIPTION;
  const ready = getCatalog().status === 'ready';

  if (route === 'product' && ready) {
    const product = getProductBySlug(param);
    if (product) {
      title = `${product.name} — ${SITE}`;
      description = `${product.name}: ${product.priceFormatted} / ${product.unit}. ${product.category}. Buyurtma bering — operator narx va mavjudligini tasdiqlaydi.`;
    } else {
      title = `Mahsulot topilmadi — ${SITE}`;
    }
  } else if (route === 'bolim' && ready) {
    const category = getCategoryBySlug(param);
    if (category) {
      title = `${category.name} — ${SITE}`;
      description = `${category.name}: ${category.count} ta mahsulot narxi bilan. ${category.shortDesc}`.trim();
    }
  } else if (STATIC_TITLES[route]) {
    title = `${STATIC_TITLES[route]} — ${SITE}`;
  }

  if (document.title !== title) document.title = title;
  setDescription(description);
}
