// Vercel Web Analytics — cookie ishlatmaydi, shaxsiy ma'lumot yig'maydi.
// Sayt hash-routing (#catalog, #product/slug) ishlatadi, skriptning avtomatik
// kuzatuvi esa faqat pushState o'tishlarini ko'radi. Shuning uchun avtomatik
// kuzatuv o'chiriladi va har bir sahifa o'tishi routerdan qo'lda yuboriladi.
// Qidiruv so'zlari va boshqa query parametrlar yuborilmaydi.

import { inject, pageview } from '@vercel/analytics';

const PARAM_ROUTES = new Set(['bolim', 'product']);

export function initAnalytics() {
  inject({ disableAutoTrack: true });
}

/**
 * @param {string} route masalan "product"
 * @param {string} [param] masalan mahsulot slug'i
 */
export function trackPageview(route, param = '') {
  if (!route || route === 'home') {
    pageview({ route: '/', path: '/' });
  } else if (PARAM_ROUTES.has(route) && param) {
    pageview({ route: `/${route}/[slug]`, path: `/${route}/${param}` });
  } else {
    pageview({ route: `/${route}`, path: `/${route}` });
  }
}
