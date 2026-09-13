import { icon } from '../icons.js';
import { esc, formatPrice, slugify } from '../lib/format.js';
import { PRODUCT_COLUMNS, invalidateCatalog } from '../lib/catalog.js';
import { describeError, toast, renderErrorBox, confirmDialog } from './ui.js';

const PAGE_SIZE = 50;
const FETCH_PAGE = 1000;
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const IMAGE_RE = /^(https?:\/\/|\/[^/])/;
const SPEC_KEYS = [
  { key: "O'lchami", id: 'spec-size', label: "O'lchami" },
  { key: 'Materiali', id: 'spec-material', label: 'Materiali' },
  { key: 'Ishlab chiqaruvchi', id: 'spec-maker', label: 'Ishlab chiqaruvchi' },
];

const listState = { search: '', category: 'all', stock: 'all', visible: PAGE_SIZE };

async function fetchCategories(supabase) {
  return supabase.from('categories').select('id, slug, name_uz').order('sort_order').order('id');
}

async function fetchAllProducts(supabase) {
  const rows = [];
  for (let from = 0; ; from += FETCH_PAGE) {
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_COLUMNS)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + FETCH_PAGE - 1);
    if (error) return { data: null, error };
    rows.push(...data);
    if (data.length < FETCH_PAGE) return { data: rows, error: null };
  }
}

function renderTableSkeleton() {
  return `
    <div class="admin-card" role="status" aria-label="Yuklanmoqda">
      ${Array.from({ length: 8 }, () => `
        <div style="display: flex; gap: 12px; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border);">
          <div class="skeleton" style="width: 44px; height: 44px; border-radius: 8px;"></div>
          <div style="flex: 1;">
            <div class="skeleton skeleton-line" style="width: 60%;"></div>
            <div class="skeleton skeleton-line" style="width: 30%; margin: 0;"></div>
          </div>
          <div class="skeleton skeleton-line" style="width: 90px; margin: 0;"></div>
        </div>
      `).join('')}
    </div>
  `;
}

export async function renderProductsPage(container, ctx) {
  container.innerHTML = `
    <div class="admin-page-head">
      <div>
        <h1 class="admin-page-title">Mahsulotlar</h1>
        <p class="admin-page-sub" id="products-count">Yuklanmoqda…</p>
      </div>
      <a href="#products/new" class="btn-primary">${icon('plus', '', 16)}<span>Yangi mahsulot</span></a>
    </div>
    <div id="products-body">${renderTableSkeleton()}</div>
  `;

  const body = container.querySelector('#products-body');
  const countEl = container.querySelector('#products-count');

  const [catRes, prodRes] = await Promise.all([fetchCategories(ctx.supabase), fetchAllProducts(ctx.supabase)]);
  if (!ctx.isCurrent() || !body.isConnected) return;

  const error = catRes.error || prodRes.error;
  if (error) {
    countEl.textContent = '';
    window.__adminRetryProducts = () => renderProductsPage(container, ctx);
    body.innerHTML = renderErrorBox(describeError(error), 'window.__adminRetryProducts()');
    return;
  }

  const categories = catRes.data;
  const categoryName = new Map(categories.map((c) => [Number(c.id), c.name_uz]));
  let products = prodRes.data;

  const drawTable = () => {
    const q = listState.search.trim().toLowerCase();
    const filtered = products.filter((p) => {
      if (listState.category !== 'all' && String(p.category_id) !== listState.category) return false;
      if (listState.stock === 'in' && !p.in_stock) return false;
      if (listState.stock === 'out' && p.in_stock) return false;
      if (!q) return true;
      return [p.name_uz, p.size, p.sku, p.slug, p.brand, p.subcategory_uz].some((v) => (v || '').toLowerCase().includes(q));
    });
    countEl.textContent = `${products.length} ta mahsulot${filtered.length !== products.length ? ` · ${filtered.length} ta filtrlangan` : ''}`;
    const visible = filtered.slice(0, listState.visible);
    const tableHost = body.querySelector('#products-table');

    if (filtered.length === 0) {
      tableHost.innerHTML = `<div class="admin-card admin-muted-center">Mahsulot topilmadi.</div>`;
      return;
    }

    tableHost.innerHTML = `
      <div class="admin-card admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Mahsulot</th>
              <th class="admin-hide-sm">Kategoriya</th>
              <th class="num">Narx</th>
              <th class="admin-hide-sm">Holat</th>
              <th class="num"><span class="visually-hidden">Amallar</span></th>
            </tr>
          </thead>
          <tbody>
            ${visible.map((p) => `
              <tr>
                <td>
                  <div class="admin-product-cell">
                    <img class="admin-thumb" src="${esc(p.image_url || '/brand/nevo-logo-sm.png')}" alt="" loading="lazy" onerror="this.onerror=null;this.src='/brand/nevo-logo-sm.png';" />
                    <div>
                      <div style="font-weight: 600;">${esc(p.name_uz)}</div>
                      <div class="admin-cell-sub">${esc([p.sku, p.brand].filter(Boolean).join(' · ') || p.slug)}</div>
                    </div>
                  </div>
                </td>
                <td class="admin-hide-sm">${esc(categoryName.get(Number(p.category_id)) || '—')}</td>
                <td class="num" style="font-weight: 700;">
                  ${esc(formatPrice(p.price))}
                  ${p.in_stock ? '' : '<div class="admin-show-sm"><span class="flag flag-no">Mavjud emas</span></div>'}
                </td>
                <td class="admin-hide-sm">
                  <span class="flag ${p.in_stock ? 'flag-yes' : 'flag-no'}">${p.in_stock ? 'Mavjud' : 'Mavjud emas'}</span>
                  ${p.featured ? '<span class="flag flag-star">Tanlangan</span>' : ''}
                </td>
                <td>
                  <div class="admin-actions">
                    <a class="admin-icon-btn" href="#products/${p.id}" aria-label="${esc(p.name_uz)} — tahrirlash">Tahrirlash</a>
                    <button type="button" class="admin-icon-btn danger" data-delete="${p.id}" aria-label="${esc(p.name_uz)} — o'chirish">${icon('trash-2', '', 14)}</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ${filtered.length > visible.length ? `
        <div style="text-align: center; margin-top: 16px;">
          <button type="button" class="btn-secondary" id="products-more">Yana ko'rsatish (${filtered.length - visible.length} ta qoldi)</button>
        </div>
      ` : ''}
    `;

    tableHost.querySelector('#products-more')?.addEventListener('click', () => {
      listState.visible += PAGE_SIZE;
      drawTable();
    });

    tableHost.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.dataset.delete);
        const product = products.find((p) => Number(p.id) === id);
        const ok = await confirmDialog({
          title: "Mahsulotni o'chirish",
          message: `"${product?.name_uz}" butunlay o'chiriladi. Oldingi buyurtmalardagi nomi va narxi saqlanib qoladi.`,
          confirmLabel: "O'chirish",
          danger: true,
        });
        if (!ok) return;
        btn.disabled = true;
        const { data, error: delError } = await ctx.supabase.from('products').delete().eq('id', id).select('id');
        if (!body.isConnected) return;
        if (delError || !data || data.length !== 1) {
          btn.disabled = false;
          toast(delError ? describeError(delError) : "O'chirishga ruxsat yo'q", 'error');
          return;
        }
        products = products.filter((p) => Number(p.id) !== id);
        invalidateCatalog();
        toast("Mahsulot o'chirildi");
        drawTable();
      });
    });
  };

  body.innerHTML = `
    <div class="admin-toolbar">
      <label for="products-search" class="visually-hidden">Qidirish</label>
      <input type="search" class="form-input" id="products-search" placeholder="Nomi, kodi, brendi bo'yicha qidirish…" value="${esc(listState.search)}" />
      <label for="products-category" class="visually-hidden">Kategoriya</label>
      <select class="admin-select" id="products-category">
        <option value="all">Barcha kategoriyalar</option>
        ${categories.map((c) => `<option value="${c.id}" ${String(c.id) === listState.category ? 'selected' : ''}>${esc(c.name_uz)}</option>`).join('')}
      </select>
      <label for="products-stock" class="visually-hidden">Mavjudlik</label>
      <select class="admin-select" id="products-stock">
        <option value="all" ${listState.stock === 'all' ? 'selected' : ''}>Barcha holatlar</option>
        <option value="in" ${listState.stock === 'in' ? 'selected' : ''}>Mavjud</option>
        <option value="out" ${listState.stock === 'out' ? 'selected' : ''}>Mavjud emas</option>
      </select>
    </div>
    <div id="products-table"></div>
  `;

  let searchTimer;
  body.querySelector('#products-search').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      listState.search = e.target.value;
      listState.visible = PAGE_SIZE;
      drawTable();
    }, 200);
  });
  body.querySelector('#products-category').addEventListener('change', (e) => {
    listState.category = e.target.value;
    listState.visible = PAGE_SIZE;
    drawTable();
  });
  body.querySelector('#products-stock').addEventListener('change', (e) => {
    listState.stock = e.target.value;
    listState.visible = PAGE_SIZE;
    drawTable();
  });

  drawTable();
}

// ---------------------------------------------------------------------
// Qo'shish / tahrirlash formasi
// ---------------------------------------------------------------------

function emptyProduct() {
  return {
    name_uz: '', slug: '', category_id: '', subcategory_uz: '', sku: '', brand: '', unit: '1 dona',
    price: '', old_price: '', image_url: '', description_uz: '', in_stock: true, featured: false,
    budget: false, sort_order: '0', specs: {},
  };
}

function toFormValues(row) {
  return {
    name_uz: row.name_uz || '',
    slug: row.slug || '',
    category_id: String(row.category_id ?? ''),
    subcategory_uz: row.subcategory_uz || '',
    sku: row.sku || '',
    brand: row.brand || '',
    unit: row.unit || '1 dona',
    price: row.price === null || row.price === undefined ? '' : String(row.price),
    old_price: row.old_price === null || row.old_price === undefined ? '' : String(row.old_price),
    image_url: row.image_url || '',
    description_uz: row.description_uz || '',
    in_stock: row.in_stock !== false,
    featured: Boolean(row.featured),
    budget: Boolean(row.budget),
    sort_order: String(row.sort_order ?? 0),
    specs: row.specs && typeof row.specs === 'object' ? row.specs : {},
  };
}

function validateProduct(v) {
  const errors = {};
  if (!v.name_uz.trim()) errors.name_uz = 'Nomini kiriting';
  else if (v.name_uz.trim().length > 300) errors.name_uz = '300 belgidan oshmasin';

  if (!v.slug) errors.slug = 'Slug kiriting';
  else if (!SLUG_RE.test(v.slug)) errors.slug = "Faqat kichik lotin harflari, raqamlar va chiziqcha (masalan: ppr-truba-d20)";

  if (!v.category_id) errors.category_id = 'Kategoriyani tanlang';

  if (v.price.trim() === '') errors.price = 'Narxni kiriting';
  else if (!/^\d{1,15}$/.test(v.price.trim())) errors.price = "Narx butun musbat son bo'lishi kerak (so'mda)";

  if (v.old_price.trim() !== '' && !/^\d{1,15}$/.test(v.old_price.trim())) {
    errors.old_price = "Eski narx butun musbat son bo'lishi kerak";
  }

  if (!v.unit.trim()) errors.unit = "O'lchov birligini kiriting";
  else if (v.unit.trim().length > 40) errors.unit = '40 belgidan oshmasin';

  if (v.image_url.trim() && !IMAGE_RE.test(v.image_url.trim())) {
    errors.image_url = "Rasm havolasi https:// yoki / bilan boshlanishi kerak";
  }

  if (v.sku.trim().length > 60) errors.sku = '60 belgidan oshmasin';
  if (!/^-?\d{1,9}$/.test(v.sort_order.trim() || '0')) errors.sort_order = "Tartib raqami butun son bo'lishi kerak";
  return errors;
}

function toRow(v) {
  const specs = { ...v.specs };
  for (const { key } of SPEC_KEYS) {
    const val = (v[`spec:${key}`] ?? specs[key] ?? '').trim();
    if (val) specs[key] = val;
    else delete specs[key];
  }
  const nullable = (s) => (s.trim() ? s.trim() : null);
  return {
    name_uz: v.name_uz.trim(),
    slug: v.slug,
    category_id: Number(v.category_id),
    subcategory_uz: nullable(v.subcategory_uz),
    sku: nullable(v.sku),
    brand: nullable(v.brand),
    unit: v.unit.trim(),
    price: Number(v.price.trim()),
    old_price: v.old_price.trim() ? Number(v.old_price.trim()) : null,
    image_url: nullable(v.image_url),
    description_uz: nullable(v.description_uz),
    in_stock: v.in_stock,
    featured: v.featured,
    budget: v.budget,
    sort_order: Number(v.sort_order.trim() || '0'),
    specs,
  };
}

function field({ id, name, label, errors, required = false, hint = '', type = 'text', value = '', attrs = '', span2 = false }) {
  const err = errors[name];
  return `
    <div class="form-group ${span2 ? 'span-2' : ''}">
      <label class="form-label" for="${id}">${esc(label)}${required ? ' *' : ''}</label>
      <input class="form-input ${err ? 'has-error' : ''}" type="${type}" id="${id}" name="${name}" value="${esc(value)}" ${attrs} ${err ? `aria-invalid="true" aria-describedby="err-${name}"` : ''} />
      ${err ? `<div class="field-error" id="err-${name}">${esc(err)}</div>` : hint ? `<div class="form-hint">${esc(hint)}</div>` : ''}
    </div>
  `;
}

export async function renderProductFormPage(container, ctx, param) {
  const isNew = param === 'new';
  const id = isNew ? null : Number.parseInt(param, 10);

  container.innerHTML = `
    <a href="#products" class="back-link">${icon('chevron-left', '', 18)}<span>Mahsulotlar ro'yxati</span></a>
    <div class="admin-page-head">
      <h1 class="admin-page-title">${isNew ? 'Yangi mahsulot' : 'Mahsulotni tahrirlash'}</h1>
    </div>
    <div id="product-form-body">
      <div class="admin-card admin-card-pad" role="status" aria-label="Yuklanmoqda">
        ${Array.from({ length: 6 }, () => '<div class="skeleton skeleton-line" style="height: 40px; margin-bottom: 18px;"></div>').join('')}
      </div>
    </div>
  `;
  const body = container.querySelector('#product-form-body');

  if (!isNew && (!Number.isInteger(id) || id <= 0)) {
    body.innerHTML = `<div class="admin-card admin-muted-center">Mahsulot raqami noto'g'ri.</div>`;
    return;
  }

  const [catRes, prodRes] = await Promise.all([
    fetchCategories(ctx.supabase),
    isNew ? Promise.resolve({ data: null, error: null }) : ctx.supabase.from('products').select(PRODUCT_COLUMNS).eq('id', id).limit(1),
  ]);
  if (!ctx.isCurrent() || !body.isConnected) return;

  const loadError = catRes.error || prodRes.error;
  if (loadError) {
    window.__adminRetryProductForm = () => renderProductFormPage(container, ctx, param);
    body.innerHTML = renderErrorBox(describeError(loadError), 'window.__adminRetryProductForm()');
    return;
  }
  if (!isNew && !prodRes.data[0]) {
    body.innerHTML = `<div class="admin-card admin-muted-center">Mahsulot topilmadi. <a href="#products" style="color: var(--nevo-blue); font-weight: 600;">Ro'yxatga qaytish</a></div>`;
    return;
  }

  const categories = catRes.data;
  const values = isNew ? emptyProduct() : toFormValues(prodRes.data[0]);
  for (const { key } of SPEC_KEYS) values[`spec:${key}`] = String(values.specs[key] ?? '');
  let slugTouched = !isNew;
  let errors = {};
  let formAlert = '';
  let saving = false;

  const draw = () => {
    body.innerHTML = `
      <form class="admin-card admin-card-pad" id="product-form" novalidate>
        ${formAlert ? `<div class="form-alert" role="alert"><span>${esc(formAlert)}</span></div>` : ''}
        <div class="admin-form-grid">
          ${field({ id: 'p-name', name: 'name_uz', label: 'Nomi', required: true, errors, value: values.name_uz, attrs: 'maxlength="300"', span2: true })}
          ${field({ id: 'p-slug', name: 'slug', label: 'Slug (URL)', required: true, errors, value: values.slug, attrs: 'maxlength="80" autocapitalize="off" spellcheck="false"', hint: "Saytdagi manzil: #product/slug. Nomdan avtomatik yasaladi." })}

          <div class="form-group">
            <label class="form-label" for="p-category">Kategoriya *</label>
            <select class="admin-select ${errors.category_id ? 'has-error' : ''}" id="p-category" name="category_id" style="width: 100%;" ${errors.category_id ? 'aria-invalid="true" aria-describedby="err-category_id"' : ''}>
              <option value="">Tanlang…</option>
              ${categories.map((c) => `<option value="${c.id}" ${String(c.id) === values.category_id ? 'selected' : ''}>${esc(c.name_uz)}</option>`).join('')}
            </select>
            ${errors.category_id ? `<div class="field-error" id="err-category_id">${esc(errors.category_id)}</div>` : ''}
          </div>

          ${field({ id: 'p-price', name: 'price', label: "Narx (so'm)", required: true, errors, value: values.price, attrs: 'inputmode="numeric" maxlength="15"' })}
          ${field({ id: 'p-old-price', name: 'old_price', label: "Eski narx (so'm)", errors, value: values.old_price, attrs: 'inputmode="numeric" maxlength="15"', hint: "Chegirma bo'lsa — ustidan chizilgan holda ko'rinadi" })}

          ${field({ id: 'p-subcategory', name: 'subcategory_uz', label: "Ichki bo'lim", errors, value: values.subcategory_uz, attrs: 'maxlength="200"' })}
          ${field({ id: 'p-unit', name: 'unit', label: "O'lchov birligi", required: true, errors, value: values.unit, attrs: 'maxlength="40"', hint: 'Masalan: 1 dona, 50 metr' })}
          ${field({ id: 'p-sku', name: 'sku', label: 'Mahsulot kodi (SKU)', errors, value: values.sku, attrs: 'maxlength="60"' })}
          ${field({ id: 'p-brand', name: 'brand', label: 'Brend', errors, value: values.brand, attrs: 'maxlength="100"' })}

          <div class="form-group span-2">
            <label class="form-label" for="p-image">Rasm havolasi (URL)</label>
            <div style="display: flex; gap: 14px; align-items: flex-start; flex-wrap: wrap;">
              <div style="flex: 1 1 260px;">
                <input class="form-input ${errors.image_url ? 'has-error' : ''}" type="url" id="p-image" name="image_url" value="${esc(values.image_url)}" placeholder="https://… yoki /mahsulot/rasm.webp" maxlength="1000" ${errors.image_url ? 'aria-invalid="true" aria-describedby="err-image_url"' : ''} />
                ${errors.image_url ? `<div class="field-error" id="err-image_url">${esc(errors.image_url)}</div>` : '<div class="form-hint">Rasm fayli boshqa joyda saqlangan bo\'lishi kerak.</div>'}
              </div>
              <div class="admin-image-preview" id="p-image-preview"></div>
            </div>
          </div>

          <div class="form-group span-2">
            <label class="form-label" for="p-description">Tavsif</label>
            <textarea class="form-textarea" id="p-description" name="description_uz" rows="3" maxlength="5000">${esc(values.description_uz)}</textarea>
          </div>

          ${SPEC_KEYS.map((s) => field({ id: s.id, name: `spec:${s.key}`, label: s.label, errors, value: values[`spec:${s.key}`], attrs: 'maxlength="200"' })).join('')}
          ${field({ id: 'p-sort', name: 'sort_order', label: 'Tartib raqami', errors, value: values.sort_order, attrs: 'inputmode="numeric" maxlength="10"', hint: 'Kichik raqam — ro\'yxatda yuqoriroq' })}

          <div class="form-group span-2">
            <div class="admin-checks">
              <label class="admin-check"><input type="checkbox" name="in_stock" ${values.in_stock ? 'checked' : ''} /> Omborda mavjud</label>
              <label class="admin-check"><input type="checkbox" name="featured" ${values.featured ? 'checked' : ''} /> Tanlangan (bosh sahifada)</label>
              <label class="admin-check"><input type="checkbox" name="budget" ${values.budget ? 'checked' : ''} /> Arzon narxlar blokida</label>
            </div>
          </div>
        </div>

        <div class="admin-form-actions">
          <a href="#products" class="btn-secondary">Bekor qilish</a>
          <button type="submit" class="btn-primary" ${saving ? 'disabled aria-busy="true"' : ''}>
            ${saving ? '<span class="btn-spinner" aria-hidden="true"></span><span>Saqlanmoqda…</span>' : `<span>${isNew ? "Qo'shish" : 'Saqlash'}</span>`}
          </button>
        </div>
      </form>
    `;

    const formEl = body.querySelector('#product-form');
    const updatePreview = () => {
      const preview = body.querySelector('#p-image-preview');
      const url = values.image_url.trim();
      if (url && IMAGE_RE.test(url)) {
        preview.innerHTML = '<img alt="Rasm ko\'rinishi" />';
        const img = preview.querySelector('img');
        img.onerror = () => {
          preview.textContent = 'Rasm yuklanmadi';
        };
        img.src = url;
      } else {
        preview.textContent = 'Rasm yo\'q';
      }
    };
    updatePreview();

    formEl.addEventListener('input', (e) => {
      const el = e.target;
      if (!el.name) return;
      if (el.type === 'checkbox') {
        values[el.name] = el.checked;
        return;
      }
      values[el.name] = el.value;
      if (el.name === 'name_uz' && !slugTouched) {
        values.slug = slugify(el.value);
        body.querySelector('#p-slug').value = values.slug;
      }
      if (el.name === 'slug') {
        slugTouched = true;
      }
      if (el.name === 'image_url') updatePreview();
      if (errors[el.name]) {
        delete errors[el.name];
        el.classList.remove('has-error');
        el.removeAttribute('aria-invalid');
        body.querySelector(`#err-${CSS.escape(el.name)}`)?.remove();
      }
    });
    formEl.addEventListener('change', (e) => {
      const el = e.target;
      if (el.type === 'checkbox') values[el.name] = el.checked;
      else if (el.tagName === 'SELECT') {
        values[el.name] = el.value;
        if (errors[el.name]) {
          delete errors[el.name];
          draw();
        }
      }
    });
    body.querySelector('#p-slug').addEventListener('blur', (e) => {
      const cleaned = slugify(e.target.value);
      if (cleaned !== e.target.value) {
        values.slug = cleaned;
        e.target.value = cleaned;
      }
    });

    formEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (saving) return;
      errors = validateProduct(values);
      formAlert = '';
      if (Object.keys(errors).length) {
        draw();
        body.querySelector('.has-error')?.focus();
        return;
      }

      saving = true;
      draw();
      const row = toRow(values);
      const query = isNew
        ? ctx.supabase.from('products').insert(row).select('id')
        : ctx.supabase.from('products').update(row).eq('id', id).select('id');
      const { data, error } = await query;
      saving = false;
      if (!body.isConnected) return;

      if (error || !data || data.length !== 1) {
        if (error?.code === '23505') {
          if (/sku/i.test(`${error.message} ${error.details}`)) errors.sku = 'Bu kod boshqa mahsulotda ishlatilgan';
          else errors.slug = 'Bu slug band — boshqasini kiriting';
        } else if (error?.code === '23514') {
          formAlert = "Ma'lumotlardan biri baza qoidalariga mos emas: " + (error.message || '');
        } else {
          formAlert = error ? describeError(error) : "Saqlashga ruxsat yo'q";
        }
        draw();
        body.querySelector('.has-error')?.focus();
        return;
      }

      invalidateCatalog();
      toast(isNew ? "Mahsulot qo'shildi" : 'Mahsulot saqlandi');
      ctx.navigate('#products');
    });
  };

  draw();
}
