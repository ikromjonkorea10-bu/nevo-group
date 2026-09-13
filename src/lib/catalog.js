// Katalog (kategoriyalar + mahsulotlar) Supabase'dan bir marta yuklanadi
// va sessiya davomida keshlanadi: xotirada (sahifa yangilanmaguncha) va
// sessionStorage'da (sahifa yangilansa ham, tab yopilguncha).

import { getSupabase, isNetworkError } from './supabase.js';
import { formatPrice } from './format.js';

const CACHE_KEY = 'nevo_catalog_v2';
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

export function mapProduct(row, categoriesById) {
  const category = categoriesById.get(row.category_id);
  const price = Number(row.price) || 0;
  const oldPrice = row.old_price === null || row.old_price === undefined ? null : Number(row.old_price);
  return {
    id: Number(row.id),
    slug: row.slug,
    categoryId: Number(row.category_id),
    name: row.name_uz,
    sku: row.sku || '',
    description: row.description_uz || '',
    category: category ? category.name : '',
    categorySlug: category ? category.slug : '',
    subcategory: row.subcategory_uz || '',
    brand: row.brand || '',
    price,
    priceFormatted: formatPrice(price),
    oldPrice,
    oldPriceFormatted: oldPrice ? formatPrice(oldPrice) : '',
    unit: row.unit || '1 dona',
    groupName: row.group_name || '',
    size: row.size || '',
    sizeLabel: row.size_label || '',
    packQty: row.pack_qty || '',
    supplier: row.supplier || '',
    priceDate: row.price_date || '',
    image: row.image_url || FALLBACK_IMAGE,
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

  return { categories, products };
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

async function fetchAllProducts(supabase) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_COLUMNS)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
      .retry(false);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
}

async function fetchCatalogOnce() {
  const supabase = getSupabase();
  const [categoriesRes, productRows] = await Promise.all([
    supabase
      .from('categories')
      .select(CATEGORY_COLUMNS)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true })
      .retry(false),
    fetchAllProducts(supabase),
  ]);
  if (categoriesRes.error) throw categoriesRes.error;
  return { categoryRows: categoriesRes.data, productRows };
}

// Kutubxonaning uzoq (1+2+4 s) retry'i o'rniga: tarmoq xatosida 1 soniyadan
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

/** Katalogni yuklaydi (keshdan yoki Supabase'dan). Parallel chaqiruvlar bitta so'rovga birlashadi. */
export function loadCatalog() {
  if (state.status === 'ready') return Promise.resolve(state);
  if (inflight) return inflight;

  const cached = readCache();
  if (cached) {
    setState({ status: 'ready', error: null, ...buildCatalog(cached.categories, cached.products) });
    return Promise.resolve(state);
  }

  setState({ status: 'loading', error: null });
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
