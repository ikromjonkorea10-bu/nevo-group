// Katalog CSV'ini (scripts/seed-data/nevo-katalog.csv) o'qish va tekshirish.
// import-catalog.js va lokal emulyator (local-supabase.mjs --seed) ishlatadi.

import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DEFAULT_CSV = path.join(ROOT, 'scripts', 'seed-data', 'nevo-katalog.csv');
export const DEFAULT_IMAGES_CSV = path.join(ROOT, 'scripts', 'seed-data', 'rasm-biriktirish.csv');

const REQUIRED_COLUMNS = [
  'sku', 'slug', 'name', 'group_name', 'size', 'size_label', 'pack_qty', 'unit', 'price',
  'manba_narx', 'manba_valyuta', 'brand', 'category_uz', 'subcategory_ru', 'supplier',
  'price_date', 'in_stock', 'featured',
];

/** RFC 4180 CSV: qo'shtirnoqli maydonlar, ichidagi "" va qator ko'chishlari. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v.trim() !== ''));
}

const toBool = (v) => {
  const s = v.trim().toLowerCase();
  if (['true', '1', 'ha', 'yes'].includes(s)) return true;
  if (['false', '0', 'yo\'q', 'no', ''].includes(s)) return false;
  return null;
};
const nullable = (v) => (v.trim() === '' ? null : v.trim());

function toProductRow(rec, line, errors) {
  const err = (msg) => errors.push(`${line}-qator (${rec.sku || rec.slug || '?'}): ${msg}`);

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(rec.slug)) err(`slug noto'g'ri: "${rec.slug}"`);
  if (!rec.name.trim()) err('name bo\'sh');
  if (!/^\d+$/.test(rec.price.trim())) err(`price butun son (so'm) bo'lishi kerak: "${rec.price}"`);
  if (rec.currency && rec.currency.trim() && rec.currency.trim() !== 'UZS') {
    err(`narx so'mda bo'lishi kerak, currency="${rec.currency}"`);
  }
  const manbaNarx = rec.manba_narx.trim() === '' ? null : Number(rec.manba_narx);
  if (manbaNarx !== null && !(manbaNarx >= 0)) err(`manba_narx noto'g'ri: "${rec.manba_narx}"`);
  if (rec.price_date.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(rec.price_date.trim())) {
    err(`price_date YYYY-MM-DD bo'lishi kerak: "${rec.price_date}"`);
  }
  const inStock = toBool(rec.in_stock);
  const featured = toBool(rec.featured);
  if (inStock === null) err(`in_stock noto'g'ri: "${rec.in_stock}"`);
  if (featured === null) err(`featured noto'g'ri: "${rec.featured}"`);

  return {
    slug: rec.slug,
    sku: nullable(rec.sku),
    name_uz: rec.name.trim(),
    group_name: nullable(rec.group_name),
    size: nullable(rec.size),
    size_label: nullable(rec.size_label),
    pack_qty: nullable(rec.pack_qty),
    unit: nullable(rec.unit) || 'dona',
    price: Number(rec.price),
    manba_narx: manbaNarx,
    manba_valyuta: nullable(rec.manba_valyuta),
    brand: nullable(rec.brand),
    subcategory_uz: nullable(rec.subcategory_ru),
    supplier: nullable(rec.supplier),
    price_date: nullable(rec.price_date),
    in_stock: inStock ?? true,
    featured: featured ?? false,
    sort_order: line,
  };
}

/**
 * CSV'ni o'qiydi va tekshiradi. Xato bo'lsa, barcha xatolar ro'yxati bilan Error tashlaydi.
 * @returns {Promise<Array<{ categoryName: string, row: object }>>}
 */
export async function readCatalog(csvPath = DEFAULT_CSV) {
  const text = (await readFile(csvPath, 'utf8')).replace(/^\uFEFF/, '');
  const [header, ...lines] = parseCsv(text);
  const columns = header.map((h) => h.trim());
  const missing = REQUIRED_COLUMNS.filter((c) => !columns.includes(c));
  if (missing.length) {
    throw new Error(`CSV'da ustunlar yo'q: ${missing.join(', ')}`);
  }

  const errors = [];
  const items = lines.map((cells, i) => {
    const line = i + 2;
    if (cells.length !== columns.length) {
      errors.push(`${line}-qator: ${cells.length} ta maydon, ${columns.length} ta kutilgan`);
    }
    const rec = Object.fromEntries(columns.map((c, j) => [c, cells[j] ?? '']));
    return { categoryName: rec.category_uz.trim(), row: toProductRow(rec, line, errors) };
  });

  for (const key of ['slug', 'sku']) {
    const seen = new Map();
    for (const { row } of items) {
      if (!row[key]) continue;
      if (seen.has(row[key])) errors.push(`${key} takrorlangan: "${row[key]}"`);
      seen.set(row[key], true);
    }
  }

  if (errors.length) {
    const list = errors.slice(0, 30).map((e) => `  • ${e}`).join('\n');
    throw new Error(`CSV'da ${errors.length} ta xato:\n${list}`);
  }
  return items;
}

/**
 * Rasm biriktirish jadvalini (slug,image_url,...) o'qiydi va tekshiradi.
 * Mahalliy yo'llar (/images/...) public/ ichida mavjud bo'lishi shart.
 * @returns {Promise<Map<string, string>>} slug → image_url
 */
export async function readImageMap(csvPath = DEFAULT_IMAGES_CSV) {
  const text = (await readFile(csvPath, 'utf8')).replace(/^\uFEFF/, '');
  const [header, ...lines] = parseCsv(text);
  const columns = header.map((h) => h.trim());
  const slugCol = columns.indexOf('slug');
  const urlCol = columns.indexOf('image_url');
  if (slugCol < 0 || urlCol < 0) throw new Error('Rasm CSV\'ida slug va image_url ustunlari bo\'lishi kerak');

  const errors = [];
  const map = new Map();
  const checkedFiles = new Map();
  for (const [i, cells] of lines.entries()) {
    const line = i + 2;
    const slug = (cells[slugCol] || '').trim();
    const url = (cells[urlCol] || '').trim();
    if (!slug || !url) {
      errors.push(`${line}-qator: slug yoki image_url bo'sh`);
      continue;
    }
    if (map.has(slug)) errors.push(`${line}-qator: slug takrorlangan: "${slug}"`);
    if (!/^(https?:\/\/|\/[^/])/.test(url)) {
      errors.push(`${line}-qator (${slug}): image_url "/..." yoki "https://..." bo'lishi kerak: "${url}"`);
    } else if (url.startsWith('/')) {
      if (!checkedFiles.has(url)) {
        const file = path.join(ROOT, 'public', ...url.slice(1).split('/'));
        checkedFiles.set(url, await stat(file).then((s) => s.isFile(), () => false));
      }
      if (!checkedFiles.get(url)) errors.push(`${line}-qator (${slug}): fayl topilmadi: public${url}`);
    }
    map.set(slug, url);
  }

  if (errors.length) {
    const list = errors.slice(0, 30).map((e) => `  • ${e}`).join('\n');
    throw new Error(`Rasm CSV'ida ${errors.length} ta xato:\n${list}`);
  }
  return map;
}
