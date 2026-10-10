// NEVO GROUP — Ko'p tillilik tizimi (UZ / RU / EN)
import uz from '../locales/uz.json' with { type: 'json' };
import ru from '../locales/ru.json' with { type: 'json' };
import en from '../locales/en.json' with { type: 'json' };

const STORAGE_KEY = 'nevo_lang';

let currentLang = (() => {
  try {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const queryLang = urlParams.get('lang');
      if (queryLang === 'ru' || queryLang === 'uz' || queryLang === 'en') {
        try {
          localStorage.setItem(STORAGE_KEY, queryLang);
        } catch {
          // ignore
        }
        return queryLang;
      }
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ru' || saved === 'uz' || saved === 'en') return saved;
    }
  } catch (e) {
    void e;
  }
  return 'uz';
})();

if (typeof document !== 'undefined') {
  document.documentElement.lang = currentLang;
}

const listeners = new Set();

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (lang !== 'uz' && lang !== 'ru' && lang !== 'en') return;
  currentLang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (e) {
    void e;
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nevolangchanged', { detail: { lang } }));
  }
  listeners.forEach((fn) => fn(currentLang));
}

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const DICT = {
  uz,
  ru,
  en,
};

export function t(key) {
  const lang = getLang();
  return (DICT[lang] && DICT[lang][key]) || (DICT.uz && DICT.uz[key]) || key;
}

export function formatProductCount(count, lang = getLang()) {
  const n = Math.max(0, Math.round(Number(count) || 0));
  if (lang === 'ru') {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 19) return `${n} товаров`;
    if (mod10 === 1) return `${n} товар`;
    if (mod10 >= 2 && mod10 <= 4) return `${n} товара`;
    return `${n} товаров`;
  }
  if (lang === 'en') {
    return n === 1 ? '1 product' : `${n} products`;
  }
  return `${n} ta mahsulot`;
}

export function formatPriceLocalized(amount, lang = getLang()) {
  const n = Math.round(Number(amount) || 0);
  const grouped = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const sign = n < 0 ? '-' : '';
  if (lang === 'ru') return `${sign}${grouped} сум`;
  if (lang === 'en') return `${sign}${grouped} UZS`;
  return `${sign}${grouped} so'm`;
}

export function getLocalizedUnit(unit, lang = getLang()) {
  const u = String(unit || '').toLowerCase().trim();
  if (u.includes('dona') || u.includes('шт') || u.includes('pcs') || u === '1') {
    if (lang === 'ru') return 'шт.';
    if (lang === 'en') return 'pcs';
    return 'dona';
  }
  if (u.includes('metr') || u.includes('метр') || u === 'm') {
    if (lang === 'ru') return 'м';
    if (lang === 'en') return 'm';
    return 'metr';
  }
  if (u.includes('komplekt') || u.includes('компл') || u.includes('set')) {
    if (lang === 'ru') return 'компл.';
    if (lang === 'en') return 'set';
    return 'komplekt';
  }
  if (u.includes('kg') || u.includes('кг')) {
    if (lang === 'ru') return 'кг';
    if (lang === 'en') return 'kg';
    return 'kg';
  }
  return unit || (lang === 'ru' ? 'шт.' : lang === 'en' ? 'pcs' : 'dona');
}

export function getLocalizedStock(inStock, lang = getLang()) {
  if (inStock) {
    if (lang === 'ru') return 'В наличии';
    if (lang === 'en') return 'In Stock';
    return 'Omborda bor';
  }
  if (lang === 'ru') return 'Под заказ';
  if (lang === 'en') return 'On request';
  return 'Buyurtma asosida';
}
