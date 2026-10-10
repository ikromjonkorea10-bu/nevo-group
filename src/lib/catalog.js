// Katalog (kategoriyalar + mahsulotlar) Supabase'dan bir marta yuklanadi
// va sessiya davomida keshlanadi: xotirada (sahifa yangilanmaguncha) va
// sessionStorage'da (sahifa yangilansa ham, tab yopilguncha).

import { selectRows, isNetworkError } from './supabase.js';

const CACHE_KEY = 'nevo_catalog_v3';
const CACHE_TTL_MS = 30 * 60 * 1000;
const PAGE_SIZE = 1000;
const FALLBACK_IMAGE = '/brand/nevo-logo-sm.png';

export const PRODUCT_COLUMNS =
  'id, category_id, slug, name_uz, description_uz, price, old_price, image_url, in_stock, featured, ' +
  'sort_order, sku, subcategory_uz, brand, unit, specs, budget, ' +
  'group_name, size, size_label, pack_qty, supplier, price_date';

const CATEGORY_COLUMNS = 'id, slug, name_uz, short_desc_uz, image_url, sort_order';

let state = { status: 'idle', categories: [], products: [], error: null };
let inflight = null;
const listeners = new Set();

function setState(next) {
  state = { ...state, ...next };
  listeners.forEach((fn) => fn(state));
}

export function getCatalog() {
  return state;
}

export function onCatalogChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

import { getLang, formatPriceLocalized, getLocalizedUnit } from './i18n.js';

export const CATEGORY_TRANSLATIONS = {
  'truba-va-fitinglar': {
    uz: 'Truba va fitinglar',
    ru: 'Трубы и фитинги',
    en: 'Pipes & Fittings',
    desc: {
      uz: "Suv ta'minoti va isitish tizimlari uchun polimer quvurlar va fitinglar",
      ru: 'Полимерные трубы и фитинги для систем водоснабжения и отопления',
      en: 'Polymer pipes and fittings for water supply and heating systems'
    }
  },
  'zapor-armatura': {
    uz: 'Zapor armatura',
    ru: 'Запорная арматура',
    en: 'Valves & Control Fittings',
    desc: {
      uz: 'Sanoat zadvijkalari, zatvorlar, sharli kranlar va filtrlar',
      ru: 'Промышленные задвижки, затворы, шаровые краны и фильтры',
      en: 'Industrial gate valves, butterfly valves, ball valves and strainers'
    }
  },
  'kanalizatsiya': {
    uz: 'Kanalizatsiya tizimlari',
    ru: 'Канализационные системы',
    en: 'Drainage & Sewage Systems',
    desc: {
      uz: 'Ichki va tashqi oqova suv tarmoqlari uchun quvur va elementlar',
      ru: 'Трубы и фасонные части для внутренних и наружных сетей',
      en: 'Pipes and components for internal and external wastewater networks'
    }
  },
  'isitish-tizimlari': {
    uz: 'Isitish va suv isitish tizimlari',
    ru: 'Отопление и водонагрев',
    en: 'Heating & Water Systems',
    desc: {
      uz: 'Isitish qozonlari, radiatorlar va harorat nazorati jihozlari',
      ru: 'Котлы, радиаторы и оборудование для температурного контроля',
      en: 'Boilers, radiators, and temperature control equipment'
    }
  },
  'isitish-tizimi': {
    uz: 'Isitish va suv isitish tizimlari',
    ru: 'Отопление и водонагрев',
    en: 'Heating & Water Systems',
    desc: {
      uz: 'Isitish qozonlari, radiatorlar va harorat nazorati jihozlari',
      ru: 'Котлы, радиаторы и оборудование для температурного контроля',
      en: 'Boilers, radiators, and temperature control equipment'
    }
  },
  'yongin-xavfsizligi': {
    uz: "Yong'in xavfsizligi jihozlari",
    ru: 'Противопожарное оборудование',
    en: 'Fire Protection Equipment',
    desc: {
      uz: "Gidrantlar, o't o'chirish kranlari va xavfsizlik shlanglari",
      ru: 'Гидранты, пожарные краны и рукава безопасности',
      en: 'Hydrants, fire valves and safety hoses'
    }
  },
  'yongin-jihozlari': {
    uz: "Yong'in xavfsizligi jihozlari",
    ru: 'Противопожарное оборудование',
    en: 'Fire Protection Equipment',
    desc: {
      uz: "Gidrantlar, o't o'chirish kranlari va xavfsizlik shlanglari",
      ru: 'Гидранты, пожарные краны и рукава безопасности',
      en: 'Hydrants, fire valves and safety hoses'
    }
  },
  'elektr-va-avtomatika': {
    uz: 'Elektr jihozlari va avtomatika',
    ru: 'Электрооборудование и автоматика',
    en: 'Electrical & Automation Equipment',
    desc: {
      uz: 'Sanoat transformatorlari, kabellar va avtomatika jihozlari',
      ru: 'Промышленные трансформаторы, кабельная продукция и автоматика',
      en: 'Industrial transformers, cables and automation gear'
    }
  },
  'elektr-jihozlari': {
    uz: 'Elektr jihozlari va avtomatika',
    ru: 'Электрооборудование и автоматика',
    en: 'Electrical & Automation Equipment',
    desc: {
      uz: 'Sanoat transformatorlari, kabellar va avtomatika jihozlari',
      ru: 'Промышленные трансформаторы, кабельная продукция и автоматика',
      en: 'Industrial transformers, cables and automation gear'
    }
  }
};

export function getLocalizedCategoryName(slug, lang = getLang(), fallback = '') {
  const cat = CATEGORY_TRANSLATIONS[slug];
  if (cat && cat[lang]) return cat[lang];
  if (cat && cat.uz) return cat.uz;
  return fallback || slug;
}

export function getLocalizedCategoryDesc(slug, lang = getLang(), fallback = '') {
  const cat = CATEGORY_TRANSLATIONS[slug];
  if (cat && cat.desc && cat.desc[lang]) return cat.desc[lang];
  if (cat && cat.desc && cat.desc.uz) return cat.desc.uz;
  return fallback || '';
}

export const GROUP_TRANSLATIONS = {
  'Врезной хомут': { uz: 'Vrezka xomuti', ru: 'Врезной хомут', en: 'Saddle Clamp' },
  'Втулка под фланец (Адаптер)': { uz: 'Flanets vtulka (Adapter)', ru: 'Втулка под фланец (Адаптер)', en: 'Flange Adapter' },
  'Задвижка из литейного чугуна 30ч6бр': { uz: "Cho'yan zadvijka 30ch6br", ru: 'Задвижка чугунная 30ч6бр', en: 'Cast Iron Gate Valve 30ch6br' },
  'Задвижка стальная 30ч41нж': { uz: "Po'lat zadvijka 30ch41nj", ru: 'Задвижка стальная 30ч41нж', en: 'Steel Gate Valve 30ch41nj' },
  'Задвижка чугунная 30ч39р': { uz: "Cho'yan zadvijka 30ch39r", ru: 'Задвижка чугунная 30ч39р', en: 'Resilient Gate Valve 30ch39r' },
  'Задвижка чугунная 30ч39р ECO': { uz: "Cho'yan zadvijka 30ch39r ECO", ru: 'Задвижка чугунная 30ч39р ECO', en: 'Gate Valve 30ch39r ECO' },
  'Задвижка чугунная 30ч39р Латунь': { uz: "Cho'yan zadvijka 30ch39r (Latun)", ru: 'Задвижка чугунная 30ч39р Латунь', en: 'Gate Valve 30ch39r (Brass)' },
  'Затвор дисковый D71X-10/16': { uz: 'Diskli zatvor D71X-10/16', ru: 'Затвор дисковый D71X-10/16', en: 'Butterfly Valve D71X-10/16' },
  'Затвор дисковый ECO': { uz: 'Diskli zatvor ECO', ru: 'Затвор дисковый ECO', en: 'Butterfly Valve ECO' },
  'Вантуз чугунный фланцевый': { uz: "Cho'yan flanetsli vantuz", ru: 'Вантуз чугунный фланцевый', en: 'Air Release Valve (Flanged)' },
  'Демонтажная вставка': { uz: 'Demontaj ulamasi (vstavka)', ru: 'Демонтажная вставка', en: 'Dismantling Joint' },
  'Заглушка': { uz: 'Zaglushka', ru: 'Заглушка', en: 'End Cap / Plug' },
  'Крестовина': { uz: 'Krestovina', ru: 'Крестовина', en: 'Cross Fitting' },
  'Муфта': { uz: 'Mufta', ru: 'Муфта', en: 'Coupling / Sleeve' },
  'Обратный клапан чугунный (ТАБ)': { uz: "Cho'yan qaytarma klapan (TAB)", ru: 'Обратный клапан чугунный (ТАБ)', en: 'Check Valve (Wafer/Flanged)' },
  'Отвод': { uz: 'Tirsak (otvod)', ru: 'Отвод', en: 'Elbow Bend' },
  'Отвод полиэтиленовый': { uz: 'Polietilen tirsak', ru: 'Отвод полиэтиленовый', en: 'HDPE Elbow' },
  'Пол отвод': { uz: 'Yarim tirsak (pol-otvod)', ru: 'Полуотвод', en: '45° Elbow' },
  'Переходник': { uz: 'Perexodnik (reduktor)', ru: 'Переходник', en: 'Reducer' },
  'Пожарный кран': { uz: "Yong'in krani", ru: 'Пожарный кран', en: 'Fire Hydrant Valve' },
  'Прокладка для задвижек': { uz: 'Zadvijka prokladkasi', ru: 'Прокладка для задвижек', en: 'Gasket for Gate Valves' },
  'Тройник': { uz: 'Troynik', ru: 'Тройник', en: 'Tee Fitting' },
  'Тройник переходник': { uz: "O'tish troynigi", ru: 'Тройник переходник', en: 'Reducing Tee' },
  'Хомут сантехнический': { uz: 'Santexnika xomuti', ru: 'Хомут сантехнический', en: 'Pipe Clamp' },
  'Чугунный фильтр': { uz: "Cho'yan filtr", ru: 'Чугунный фильтр', en: 'Cast Iron Strainer' },
  'Шаровой кран': { uz: 'Sharli kran', ru: 'Шаровой кран', en: 'Ball Valve' },
  'PP-R труба PN10 ХВС': { uz: 'PP-R quvur PN10 (sovuq suv)', ru: 'PP-R труба PN10 ХВС', en: 'PP-R Pipe PN10 Cold Water' },
  'PP-R труба PN16 ХВС': { uz: 'PP-R quvur PN16 (sovuq suv)', ru: 'PP-R труба PN16 ХВС', en: 'PP-R Pipe PN16 Cold Water' },
  'PP-R труба композит PN20 ГВС': { uz: 'PP-R kompozit quvur PN20 (issiq suv)', ru: 'PP-R труба композит PN20 ГВС', en: 'PP-R Composite Pipe PN20 Hot Water' },
  'ППР труба PN-10 ХВС': { uz: 'PP-R quvur PN10 (sovuq suv)', ru: 'ППР труба PN-10 ХВС', en: 'PP-R Pipe PN10 Cold Water' },
  'ППР труба PN-16 ХВС': { uz: 'PP-R quvur PN16 (sovuq suv)', ru: 'ППР труба PN-16 ХВС', en: 'PP-R Pipe PN16 Cold Water' },
  'ППР труба PN-20 ГВС': { uz: 'PP-R quvur PN20 (issiq suv)', ru: 'ППР труба PN-20 ГВС', en: 'PP-R Pipe PN20 Hot Water' },
  '4 kV"': { uz: 'Transformator 4 kV', ru: 'Трансформатор 4 кВ', en: 'Transformer 4 kV' },
  '4 кВ"': { uz: 'Transformator 4 kV', ru: 'Трансформатор 4 кВ', en: 'Transformer 4 kV' },
  'КТПС с АСКУЭ': { uz: 'KTPS ASKUE bilan', ru: 'КТПС с АСКУЭ', en: 'KTPS with ASCUE' },
  'ГКТП с АСКУЭ': { uz: 'GKTP ASKUE bilan', ru: 'ГКТП с АСКУЭ', en: 'GKTP with ASCUE' }
};

export const SUBCAT_TRANSLATIONS = {
  'PP-R труба': { uz: 'PP-R quvurlar', ru: 'Трубы PP-R', en: 'PP-R Pipes' },
  'Врезные хомуты': { uz: 'Vrezka xomutlari', ru: 'Врезные хомуты', en: 'Saddle Clamps' },
  'Запорная арматура': { uz: 'Zapor armatura', ru: 'Запорная арматура', en: 'Valves & Controls' },
  'Крепёжные хомуты': { uz: 'Mahkamlash xomutlari', ru: 'Крепёжные хомуты', en: 'Mounting Clamps' },
  'ППР труба и фитинги': { uz: 'PP-R quvur va fitinglar', ru: 'Трубы и фитинги PP-R', en: 'PP-R Pipes & Fittings' },
  'Пожарное оборудование': { uz: "Yong'in jihozlari", ru: 'Пожарное оборудование', en: 'Fire Safety Hardware' },
  'Фитинг компрессионный': { uz: 'Kompression fitinglar', ru: 'Компрессионные фитинги', en: 'Compression Fittings' },
  'Фитинг полиэтиленовый': { uz: 'Polietilen fitinglar', ru: 'Полиэтиленовые фитинги', en: 'HDPE Fittings' }
};

const CYRILLIC_TO_LATIN = {
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'J',
  'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
  'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'X', 'Ц': 'Ts',
  'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sh', 'Ъ': '', 'Ы': 'I', 'Ь': '', 'Э': 'E', 'Ю': 'Yu',
  'Я': 'Ya',
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'j',
  'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
  'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'x', 'ц': 'ts',
  'ч': 'ch', 'ш': 'sh', 'щ': 'sh', 'ъ': '', 'ы': 'i', 'ь': '', 'э': 'e', 'ю': 'yu',
  'я': 'ya'
};

export function transliterateCyrillic(str) {
  if (!str) return '';
  return str.split('').map(c => CYRILLIC_TO_LATIN[c] || c).join('');
}

const UZ_TECH_TERMS = [
  ['КТПС с АСКУЭ', 'KTPS ASKUE bilan'],
  ['ГКТП с АСКУЭ', 'GKTP ASKUE bilan'],
  ['Врезной хомут', 'Vrezka xomuti'],
  ['Втулка под фланец (Адаптер)', 'Flanets vtulka (Adapter)'],
  ['Втулка под фланец', 'Flanets vtulka'],
  ['Задвижка из литейного чугуна 30ч6бр', "Cho'yan zadvijka 30ch6br"],
  ['Задвижка стальная 30ч41нж', "Po'lat zadvijka 30ch41nj"],
  ['Задвижка чугунная 30ч39р ECO', "Cho'yan zadvijka 30ch39r ECO"],
  ['Задвижка чугунная 30ч39р Латунь', "Cho'yan zadvijka 30ch39r (Latun)"],
  ['Задвижка чугунная 30ч39р', "Cho'yan zadvijka 30ch39r"],
  ['Затвор дисковый D71X-10/16', 'Diskli zatvor D71X-10/16'],
  ['Затвор дисковый ECO', 'Diskli zatvor ECO'],
  ['Вантуз чугунный фланцевый', "Cho'yan flanetsli vantuz"],
  ['Демонтажная вставка', 'Demontaj ulamasi (vstavka)'],
  ['Заглушка', 'Zaglushka'],
  ['Крестовина', 'Krestovina'],
  ['Муфта', 'Mufta'],
  ['Обратный клапан чугунный (ТАБ)', "Cho'yan qaytarma klapan (TAB)"],
  ['Отвод полиэтиленовый', 'Polietilen tirsak'],
  ['Пол отвод', 'Yarim tirsak (pol-otvod)'],
  ['Отвод', 'Tirsak (otvod)'],
  ['Переходник', 'Perexodnik (reduktor)'],
  ['Пожарный кран', "Yong'in krani"],
  ['Прокладка для задвижек', 'Zadvijka prokladkasi'],
  ['Тройник переходник', "O'tish troynigi"],
  ['Тройник', 'Troynik'],
  ['Хомут сантехнический', 'Santexnika xomuti'],
  ['Чугунный фильтр', "Cho'yan filtr"],
  ['Шаровой кран', 'Sharli kran'],
  ['PP-R труба композит PN20 ГВС', 'PP-R kompozit quvur PN20 (issiq suv)'],
  ['PP-R труба PN10 ХВС', 'PP-R quvur PN10 (sovuq suv)'],
  ['PP-R труба PN16 ХВС', 'PP-R quvur PN16 (sovuq suv)'],
  ['ППР труба PN-10 ХВС', 'PP-R quvur PN10 (sovuq suv)'],
  ['ППР труба PN-16 ХВС', 'PP-R quvur PN16 (sovuq suv)'],
  ['ППР труба PN-20 ГВС', 'PP-R quvur PN20 (issiq suv)'],
  ['(электропривод)', '(elektr yuritmali)'],
  ['электропривод', 'elektr yuritmali'],
  ['ХВС', '(sovuq suv)'],
  ['ГВС', '(issiq suv)'],
  ['кВ', 'kV'],
  ['кВА', 'kVA']
];

export function getLocalizedGroup(rawGroup, lang = getLang()) {
  if (!rawGroup) return '';
  const match = GROUP_TRANSLATIONS[rawGroup];
  if (match) return match[lang] || match.uz;
  if (lang === 'uz' && /[\u0400-\u04FF]/.test(rawGroup)) {
    return transliterateCyrillic(rawGroup);
  }
  return rawGroup;
}

export function getLocalizedSubcategory(rawSub, lang = getLang()) {
  if (!rawSub) return '';
  const match = SUBCAT_TRANSLATIONS[rawSub];
  if (match) return match[lang] || match.uz;
  if (lang === 'uz' && /[\u0400-\u04FF]/.test(rawSub)) {
    return transliterateCyrillic(rawSub);
  }
  return rawSub;
}

export function getLocalizedSizeLabel(raw, lang = getLang()) {
  if (!raw) return '';
  if (lang === 'uz') {
    if (raw.includes('Диаметр')) return 'Diametr';
    if (raw.includes('Размер')) return "O'lcham";
    if (raw.includes('Мощность')) return 'Quvvat, kVA';
    return transliterateCyrillic(raw);
  }
  if (lang === 'en') {
    if (raw.includes('Диаметр')) return 'Diameter';
    if (raw.includes('Размер')) return 'Size';
    if (raw.includes('Мощность')) return 'Power, kVA';
    return raw;
  }
  return raw;
}

export function getLocalizedProductName(productOrName, rawGroup = '', lang = getLang()) {
  const rawName = typeof productOrName === 'string'
    ? productOrName
    : (productOrName?.rawNameUz || productOrName?.name_uz || productOrName?.name || '');
  if (!rawName) return '';

  if (lang === 'uz') {
    let uzName = rawName;
    if (rawGroup && GROUP_TRANSLATIONS[rawGroup]?.uz) {
      if (uzName.startsWith(rawGroup)) {
        uzName = uzName.replace(rawGroup, GROUP_TRANSLATIONS[rawGroup].uz);
      }
    }
    for (const [from, to] of UZ_TECH_TERMS) {
      if (uzName.includes(from)) {
        uzName = uzName.replaceAll(from, to);
      }
    }
    if (/[\u0400-\u04FF]/.test(uzName)) {
      uzName = transliterateCyrillic(uzName);
    }
    return uzName.replace(/\s+/g, ' ').trim();
  }

  if (lang === 'ru') {
    if (rawGroup && GROUP_TRANSLATIONS[rawGroup]?.ru) {
      const uzGroup = GROUP_TRANSLATIONS[rawGroup].uz;
      if (uzGroup && rawName.startsWith(uzGroup)) {
        return rawName.replace(uzGroup, GROUP_TRANSLATIONS[rawGroup].ru);
      }
      if (rawName.startsWith(rawGroup)) {
        return rawName.replace(rawGroup, GROUP_TRANSLATIONS[rawGroup].ru);
      }
    }
    return rawName;
  }

  if (lang === 'en') {
    let enName = rawName;
    if (rawGroup && GROUP_TRANSLATIONS[rawGroup]?.en) {
      const ruGroup = rawGroup;
      const uzGroup = GROUP_TRANSLATIONS[rawGroup].uz;
      const enGroup = GROUP_TRANSLATIONS[rawGroup].en;
      if (ruGroup && enName.startsWith(ruGroup)) {
        enName = enName.replace(ruGroup, enGroup);
      } else if (uzGroup && enName.startsWith(uzGroup)) {
        enName = enName.replace(uzGroup, enGroup);
      }
    }
    enName = enName
      .replace(/\(электропривод\)/gi, '(Electric Actuator)')
      .replace(/\bДу\s*/g, 'DN ')
      .replace(/\bРу\s*/g, 'PN ')
      .replace(/\bХВС\b/g, 'Cold Water')
      .replace(/\bГВС\b/g, 'Hot Water')
      .replace(/\bкВ\b/g, 'kV')
      .replace(/\bкВА\b/g, 'kVA');
    if (/[\u0400-\u04FF]/.test(enName)) {
      enName = transliterateCyrillic(enName);
    }
    return enName.replace(/\s+/g, ' ').trim();
  }

  return rawName;
}

export function getLocalizedProductDescription(product, rawDesc = '', lang = getLang()) {
  const name = typeof product === 'string' ? product : product?.name || '';
  if (lang === 'uz') {
    if (!rawDesc || /[\u0400-\u04FF]/.test(rawDesc)) {
      return `${name} — NEVO GROUP rasmiy omboridan sertifikatlangan zavod kafolati bilan.`;
    }
    return rawDesc;
  }
  if (lang === 'ru') {
    if (!rawDesc) {
      return `${name} — официальные поставки со склада NEVO GROUP с заводской гарантией.`;
    }
    return rawDesc;
  }
  if (lang === 'en') {
    if (!rawDesc) {
      return `${name} — official supplies directly from NEVO GROUP warehouse with quality guarantee.`;
    }
    return rawDesc;
  }
  return rawDesc || '';
}

export function mapProduct(row, categoriesById) {
  const category = categoriesById.get(row.category_id);
  const price = Number(row.price) || 0;
  const oldPrice = row.old_price === null || row.old_price === undefined ? null : Number(row.old_price);
  const rawGroup = row.group_name || '';
  const rawSubcat = row.subcategory_uz || '';
  const rawNameUz = row.name_uz || '';
  const categorySlug = category ? category.slug : '';

  return {
    id: Number(row.id),
    slug: row.slug,
    categoryId: Number(row.category_id),
    rawNameUz,
    sku: row.sku || '',
    rawDescriptionUz: row.description_uz || '',
    categorySlug,
    subcategoryRaw: rawSubcat,
    brand: row.brand || '',
    price,
    oldPrice,
    unit: row.unit || '1 dona',
    groupNameRaw: rawGroup,
    size: row.size || '',
    sizeLabelRaw: row.size_label || '',
    packQty: row.pack_qty || '',
    supplier: row.supplier || '',
    priceDate: row.price_date || '',
    image: row.image_url || FALLBACK_IMAGE,
    hasImage: Boolean(row.image_url),
    specs: row.specs && typeof row.specs === 'object' ? row.specs : {},
    featured: Boolean(row.featured),
    budget: Boolean(row.budget),
    inStock: row.in_stock !== false,
    sortOrder: row.sort_order ?? 0,
    get name() {
      return getLocalizedProductName(this, this.groupNameRaw, getLang());
    },
    get description() {
      return getLocalizedProductDescription(this, this.rawDescriptionUz, getLang());
    },
    get sizeLabel() {
      return getLocalizedSizeLabel(this.sizeLabelRaw, getLang());
    },
    get groupName() {
      return getLocalizedGroup(this.groupNameRaw, getLang());
    },
    get subcategory() {
      return getLocalizedSubcategory(this.subcategoryRaw, getLang());
    },
    get category() {
      return getLocalizedCategoryName(this.categorySlug, getLang(), category?.name || '');
    },
    get priceFormatted() {
      return formatPriceLocalized(this.price, getLang());
    },
    get oldPriceFormatted() {
      return this.oldPrice ? formatPriceLocalized(this.oldPrice, getLang()) : '';
    },
    get unitFormatted() {
      return getLocalizedUnit(this.unit, getLang());
    }
  };
}

function buildCatalog(categoryRows, productRows) {
  const categories = categoryRows.map((c) => {
    const slug = c.slug;
    return {
      id: Number(c.id),
      slug,
      _nameUz: c.name_uz,
      _shortDescUz: c.short_desc_uz || '',
      get name() {
        return getLocalizedCategoryName(this.slug, getLang(), this._nameUz);
      },
      get shortDesc() {
        return getLocalizedCategoryDesc(this.slug, getLang(), this._shortDescUz);
      },
      image: c.image_url || FALLBACK_IMAGE,
      sortOrder: c.sort_order ?? 0,
      count: 0,
      subcategories: [],
    };
  });
  const byId = new Map(categories.map((c) => [c.id, c]));
  const products = productRows.map((row) => mapProduct(row, byId));

  for (const cat of categories) {
    const subCounts = new Map();
    for (const p of products) {
      if (p.categoryId !== cat.id) continue;
      cat.count += 1;
      if (p.subcategory) subCounts.set(p.subcategory, (subCounts.get(p.subcategory) || 0) + 1);
    }
    cat.subcategories = [...subCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  // Mahsuloti yo'q kategoriyalar saytda (menyu, bosh sahifa, katalog) ko'rinmaydi
  return { categories: categories.filter((c) => c.count > 0), products };
}

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached || Date.now() - cached.savedAt > CACHE_TTL_MS) return null;
    if (!Array.isArray(cached.categories) || !Array.isArray(cached.products)) return null;
    return cached;
  } catch {
    return null;
  }
}

function writeCache(categoryRows, productRows) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ savedAt: Date.now(), categories: categoryRows, products: productRows })
    );
  } catch {
    // sessionStorage to'lgan yoki taqiqlangan — xotiradagi kesh yetarli
  }
}

async function fetchAllProducts() {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const data = await selectRows('products', {
      select: PRODUCT_COLUMNS,
      order: 'sort_order.asc,id.asc',
      offset: from,
      limit: PAGE_SIZE,
    });
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
}

async function fetchCatalogOnce() {
  const [categoryRows, productRows] = await Promise.all([
    selectRows('categories', { select: CATEGORY_COLUMNS, order: 'sort_order.asc,id.asc' }),
    fetchAllProducts(),
  ]);
  return { categoryRows, productRows };
}

// Uzoq avtomatik retry o'rniga: tarmoq xatosida 1 soniyadan
// so'ng bitta qayta urinish, keyin foydalanuvchiga "Qayta urinish" tugmasi.
async function fetchCatalog() {
  try {
    return await fetchCatalogOnce();
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return fetchCatalogOnce();
  }
}

/**
 * Katalogni yuklaydi (keshdan yoki Supabase'dan). Parallel chaqiruvlar bitta so'rovga birlashadi.
 * silent: sinxron holat o'zgarishlari (kesh / "loading") tinglovchilarga e'lon qilinmaydi —
 * sahifaning birinchi renderini chaqiruvchining o'zi bajaradi. So'rov tugagani har doim e'lon qilinadi.
 */
export function loadCatalog({ silent = false } = {}) {
  if (state.status === 'ready') return Promise.resolve(state);
  if (inflight) return inflight;

  const update = silent ? (next) => { state = { ...state, ...next }; } : setState;

  const cached = readCache();
  if (cached) {
    update({ status: 'ready', error: null, ...buildCatalog(cached.categories, cached.products) });
    return Promise.resolve(state);
  }

  update({ status: 'loading', error: null });
  inflight = fetchCatalog()
    .then(({ categoryRows, productRows }) => {
      writeCache(categoryRows, productRows);
      setState({ status: 'ready', error: null, ...buildCatalog(categoryRows, productRows) });
      return state;
    })
    .catch((error) => {
      console.warn('Katalog yuklanmadi:', error);
      setState({
        status: 'error',
        error: {
          network: isNetworkError(error),
          message: error?.message || 'Noma\'lum xatolik',
        },
      });
      return state;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Keshni tozalaydi — keyingi loadCatalog() bazadan qayta so'raydi. */
export function invalidateCatalog() {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // e'tiborsiz
  }
  state = { status: 'idle', categories: [], products: [], error: null };
}

/** Qidiruv: nomi, o'lchami, kodi, ichki bo'limi va brendi bo'yicha (q — kichik harfda). */
export function matchesSearch(product, q) {
  const query = (q || '').toLowerCase().trim();
  if (!query) return false;
  return [
    product.name,
    product.rawNameUz,
    product.size,
    product.sku,
    product.subcategory,
    product.subcategoryRaw,
    product.groupName,
    product.groupNameRaw,
    product.brand,
    product.category,
  ].some((v) => v && v.toLowerCase().includes(query));
}

export function getProductById(id) {
  const numericId = Number(id);
  return state.products.find((p) => p.id === numericId) || null;
}

export function getProductBySlug(slug) {
  return state.products.find((p) => p.slug === slug) || null;
}

export function getCategoryBySlug(slug) {
  return state.categories.find((c) => c.slug === slug) || null;
}
