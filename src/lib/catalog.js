// Katalog (kategoriyalar + mahsulotlar) Supabase'dan bir marta yuklanadi
// va sessiya davomida keshlanadi: xotirada (sahifa yangilanmaguncha) va
// sessionStorage'da (sahifa yangilansa ham, tab yopilguncha).

import { selectRows, isNetworkError } from './supabase.js';
import { formatPrice } from './format.js';

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

import { getLang } from './i18n.js';

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
  '4 кВ"': { uz: 'Transformator 4 kV', ru: 'Трансформатор 4 кВ', en: 'Transformer 4 kV' }
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

export function getLocalizedGroup(rawGroup, lang = getLang()) {
  if (!rawGroup) return '';
  const match = GROUP_TRANSLATIONS[rawGroup];
  return match ? (match[lang] || match.uz) : rawGroup;
}

export function getLocalizedSubcategory(rawSub, lang = getLang()) {
  if (!rawSub) return '';
  const match = SUBCAT_TRANSLATIONS[rawSub];
  return match ? (match[lang] || match.uz) : rawSub;
}

export function mapProduct(row, categoriesById) {
  const category = categoriesById.get(row.category_id);
  const price = Number(row.price) || 0;
  const oldPrice = row.old_price === null || row.old_price === undefined ? null : Number(row.old_price);
  const lang = getLang();
  const rawGroup = row.group_name || '';
  const rawSubcat = row.subcategory_uz || '';
  const groupName = getLocalizedGroup(rawGroup, lang);
  const subcategory = getLocalizedSubcategory(rawSubcat, lang);

  return {
    id: Number(row.id),
    slug: row.slug,
    categoryId: Number(row.category_id),
    name: row.name_uz,
    sku: row.sku || '',
    description: row.description_uz || '',
    category: category ? category.name : '',
    categorySlug: category ? category.slug : '',
    subcategory,
    subcategoryRaw: rawSubcat,
    brand: row.brand || '',
    price,
    priceFormatted: formatPrice(price),
    oldPrice,
    oldPriceFormatted: oldPrice ? formatPrice(oldPrice) : '',
    unit: row.unit || '1 dona',
    groupName,
    groupNameRaw: rawGroup,
    size: row.size || '',
    sizeLabel: row.size_label || '',
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
  };
}

function buildCatalog(categoryRows, productRows) {
  const categories = categoryRows.map((c) => ({
    id: Number(c.id),
    slug: c.slug,
    name: c.name_uz,
    shortDesc: c.short_desc_uz || '',
    image: c.image_url || FALLBACK_IMAGE,
    sortOrder: c.sort_order ?? 0,
    count: 0,
    subcategories: [],
  }));
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
  return [product.name, product.size, product.sku, product.subcategory, product.brand, product.category]
    .some((v) => v && v.toLowerCase().includes(q));
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
