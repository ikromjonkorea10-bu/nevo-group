import { icon } from '../icons.js';
import { getCatalog, matchesSearch } from '../lib/catalog.js';
import { esc } from '../lib/format.js';
import { renderProductCard } from '../components/ProductCard.js';

const PAGE_SIZE = 48;

let state = {
  selectedCategory: 'all',
  selectedSubcategory: 'all',
  selectedBrand: 'all',
  searchQuery: '',
  sortBy: 'default',
  viewMode: 'grid',
  isFilterOpen: false,
  visibleCount: PAGE_SIZE
};

export function renderCatalogPage(params = {}) {
  const { categories, products } = getCatalog();

  // Update state from params if passed
  if (params.category) state.selectedCategory = params.category;
  if (params.sub) state.selectedSubcategory = params.sub;
  if (params.brand) state.selectedBrand = params.brand;
  if (params.search) state.searchQuery = params.search;
  if (params.sort) state.sortBy = params.sort;

  // Filter products
  let filtered = [...products];

  if (state.selectedCategory && state.selectedCategory !== 'all') {
    filtered = filtered.filter(p => p.categorySlug === state.selectedCategory);
  }

  if (state.selectedSubcategory && state.selectedSubcategory !== 'all') {
    filtered = filtered.filter(p => p.subcategory.toLowerCase() === state.selectedSubcategory.toLowerCase());
  }

  // Brendlar — tanlangan bo'lim va ichki bo'lim doirasida (brend filtridan oldin) hisoblanadi
  const brandCounts = new Map();
  for (const p of filtered) {
    if (p.brand) brandCounts.set(p.brand, (brandCounts.get(p.brand) || 0) + 1);
  }
  const allBrands = [...brandCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  if (state.selectedBrand && state.selectedBrand !== 'all') {
    filtered = filtered.filter(p => p.brand.toLowerCase() === state.selectedBrand.toLowerCase());
  }

  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(p => matchesSearch(p, q));
  }

  const activeFilterCount = (state.selectedSubcategory !== 'all' ? 1 : 0) + (state.selectedBrand !== 'all' ? 1 : 0);

  // Sort
  if (state.sortBy === 'arzon') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (state.sortBy === 'qimmat') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (state.sortBy === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Get active category object
  const activeCatObj = categories.find(c => c.slug === state.selectedCategory);
  const title = activeCatObj ? activeCatObj.name : 'Katalog';
  const subtext = activeCatObj ? `${activeCatObj.count} ta mahsulot narxi bilan` : 'Mahsulotni qidiring, bo\'lim va narx bo\'yicha saralang';

  // Ichki bo'limlar — tanlangan bo'lim (yoki hammasi) bo'yicha bazadan hisoblanadi
  const subCounts = new Map();
  for (const p of products) {
    if (!p.subcategory) continue;
    if (activeCatObj && p.categoryId !== activeCatObj.id) continue;
    subCounts.set(p.subcategory, (subCounts.get(p.subcategory) || 0) + 1);
  }
  const allSubcategories = [...subCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const visible = filtered.slice(0, state.visibleCount);

  return `
    <div class="shell" style="padding-top: 24px; padding-bottom: 60px;">
      <!-- Catalog Page Header -->
      <div class="catalog-page-head">
        <h1 class="catalog-page-title">${esc(title)}</h1>
        <p class="catalog-page-sub">${esc(subtext)}</p>

        <div class="catalog-search-bar">
          ${icon('search', '', 20)}
          <input
            type="text"
            id="catalog-inner-search"
            placeholder="Nomi yoki o'lchami bo'yicha qidirish (masalan: 32/20)"
            value="${esc(state.searchQuery || '')}"
          />
          ${state.searchQuery ? `
            <button onclick="window.__clearCatalogSearch()" style="color: var(--muted); padding: 4px;" aria-label="Qidiruvni tozalash">
              ${icon('x', '', 16)}
            </button>
          ` : ''}
        </div>

        <div class="catalog-notice">
          ${icon('zap', '', 18)}
          <span>Narxlar NEVO GROUP praysidan olingan. Prays vaqti-vaqti bilan yangilanadi — buyurtma berishdan oldin operatorimiz aniq narxni tasdiqlaydi.</span>
        </div>
      </div>

      <!-- Quick Category Pills -->
      <div class="category-pills-row">
        <button
          class="cat-pill ${state.selectedCategory === 'all' ? 'active' : ''}"
          onclick="window.__setCatalogCat('all')"
        >
          Barchasi (${products.length})
        </button>
        ${categories.map(c => `
          <button
            class="cat-pill ${state.selectedCategory === c.slug ? 'active' : ''}"
            data-cat="${esc(c.slug)}"
            onclick="window.__setCatalogCat(this.dataset.cat)"
          >
            ${esc(c.name)} (${c.count})
          </button>
        `).join('')}
      </div>

      <!-- Toolbar -->
      <div class="catalog-toolbar">
        <div class="catalog-toolbar-left">
          <button class="btn-filter-trigger" onclick="window.__toggleFilterModal(true)">
            ${icon('filter', '', 16)}
            <span>Filtr</span>
            ${activeFilterCount ? `<span class="filter-count-badge">${activeFilterCount}</span>` : ''}
          </button>

          <select class="sort-select" id="catalog-sort-select" onchange="window.__setCatalogSort(this.value)" aria-label="Saralash">
            <option value="default" ${state.sortBy === 'default' ? 'selected' : ''}>Mosligi bo'yicha</option>
            <option value="arzon" ${state.sortBy === 'arzon' ? 'selected' : ''}>Arzonroq oldin</option>
            <option value="qimmat" ${state.sortBy === 'qimmat' ? 'selected' : ''}>Qimmatroq oldin</option>
            <option value="name" ${state.sortBy === 'name' ? 'selected' : ''}>Nomi bo'yicha (A-Z)</option>
          </select>
        </div>

        <div style="font-size: 14px; color: var(--muted); font-weight: 500;">
          ${filtered.length} ta mahsulot
        </div>
      </div>

      ${activeFilterCount ? `
        <div class="active-filters-row">
          ${state.selectedSubcategory !== 'all' ? `
            <button type="button" class="active-filter-chip" onclick="window.__setFilterSubcategory('all')" aria-label="Ichki bo'lim filtrini olib tashlash">
              <span>${esc(state.selectedSubcategory)}</span>${icon('x', '', 14)}
            </button>
          ` : ''}
          ${state.selectedBrand !== 'all' ? `
            <button type="button" class="active-filter-chip" onclick="window.__setFilterBrand('all')" aria-label="Brend filtrini olib tashlash">
              <span>Brend: ${esc(state.selectedBrand)}</span>${icon('x', '', 14)}
            </button>
          ` : ''}
        </div>
      ` : ''}

      <!-- Products Grid -->
      <div style="margin-top: 24px;">
        ${filtered.length === 0 ? `
          <div style="text-align: center; padding: 60px 20px; background: var(--surface); border-radius: var(--radius-xl); border: 1px solid var(--border);">
            <div style="width: 56px; height: 56px; margin: 0 auto 16px; background: var(--tint); color: var(--nevo-blue); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              ${icon('boxes', '', 26)}
            </div>
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Mahsulot topilmadi</h3>
            <p style="color: var(--muted); font-size: 14.5px; max-width: 400px; margin: 0 auto 20px;">
              Qidiruv so'rovingizga yoki tanlangan filtrlarga mos mahsulot mavjud emas.
            </p>
            <button class="btn-primary" onclick="window.__resetAllFilters()">
              Barcha filtrlarni tozalash
            </button>
          </div>
        ` : `
          <div class="products-grid">
            ${visible.map(renderProductCard).join('')}
          </div>
          ${filtered.length > visible.length ? `
            <div style="text-align: center; margin-top: 28px;">
              <button type="button" class="btn-secondary" onclick="window.__showMoreProducts()">
                Yana ko'rsatish (${filtered.length - visible.length} ta qoldi)
              </button>
            </div>
          ` : ''}
        `}
      </div>

      <!-- Filter Modal -->
      <div class="filter-modal-backdrop ${state.isFilterOpen ? 'open' : ''}" id="filter-modal-backdrop" onclick="if(event.target===this) window.__toggleFilterModal(false)">
        <div class="filter-modal-card">
          <div class="filter-modal-header">
            <h3 class="filter-modal-title">Filtr</h3>
            <button onclick="window.__toggleFilterModal(false)" style="padding: 6px; color: var(--muted);" aria-label="Yopish">
              ${icon('x', '', 20)}
            </button>
          </div>

          <div class="filter-modal-body">
            <div class="filter-group-label">BO'LIM</div>
            <div class="filter-pills-wrap">
              <button
                class="filter-choice-pill ${state.selectedCategory === 'all' ? 'active' : ''}"
                onclick="window.__setFilterCategory('all')"
              >
                Hammasi
              </button>
              ${categories.map(c => `
                <button
                  class="filter-choice-pill ${state.selectedCategory === c.slug ? 'active' : ''}"
                  data-cat="${esc(c.slug)}"
                  onclick="window.__setFilterCategory(this.dataset.cat)"
                >
                  ${esc(c.name)}
                </button>
              `).join('')}
            </div>

            <div class="filter-group-label">ICHKI BO'LIM</div>
            <div class="filter-pills-wrap">
              <button
                class="filter-choice-pill ${state.selectedSubcategory === 'all' ? 'active' : ''}"
                onclick="window.__setFilterSubcategory('all')"
              >
                Hammasi
              </button>
              ${allSubcategories.map(s => `
                <button
                  class="filter-choice-pill ${state.selectedSubcategory.toLowerCase() === s.name.toLowerCase() ? 'active' : ''}"
                  data-sub="${esc(s.name)}"
                  onclick="window.__setFilterSubcategory(this.dataset.sub)"
                >
                  <span>${esc(s.name)}</span>
                  <span class="count">${s.count}</span>
                </button>
              `).join('')}
            </div>

            ${allBrands.length ? `
              <div class="filter-group-label">BREND</div>
              <div class="filter-pills-wrap">
                <button
                  class="filter-choice-pill ${state.selectedBrand === 'all' ? 'active' : ''}"
                  onclick="window.__setFilterBrand('all')"
                >
                  Hammasi
                </button>
                ${allBrands.map(b => `
                  <button
                    class="filter-choice-pill ${state.selectedBrand.toLowerCase() === b.name.toLowerCase() ? 'active' : ''}"
                    data-brand="${esc(b.name)}"
                    onclick="window.__setFilterBrand(this.dataset.brand)"
                  >
                    <span>${esc(b.name)}</span>
                    <span class="count">${b.count}</span>
                  </button>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <div class="filter-modal-footer">
            <button class="btn-clear-filter" onclick="window.__resetAllFilters()">
              Tozalash
            </button>
            <button class="btn-apply-filter" onclick="window.__toggleFilterModal(false)">
              Ko'rsatish (${filtered.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initCatalogEvents(rerenderCallback) {
  const resetPaging = () => {
    state.visibleCount = PAGE_SIZE;
  };

  window.__setCatalogCat = (catSlug) => {
    state.selectedCategory = catSlug;
    state.selectedSubcategory = 'all';
    state.selectedBrand = 'all';
    resetPaging();
    rerenderCallback();
  };

  window.__setCatalogSort = (sort) => {
    state.sortBy = sort;
    resetPaging();
    rerenderCallback();
  };

  window.__toggleFilterModal = (isOpen) => {
    state.isFilterOpen = isOpen;
    const modal = document.getElementById('filter-modal-backdrop');
    if (modal) {
      if (isOpen) modal.classList.add('open');
      else modal.classList.remove('open');
    }
  };

  window.__setFilterCategory = (cat) => {
    state.selectedCategory = cat;
    state.selectedSubcategory = 'all';
    state.selectedBrand = 'all';
    resetPaging();
    rerenderCallback();
  };

  window.__setFilterSubcategory = (sub) => {
    state.selectedSubcategory = sub;
    resetPaging();
    rerenderCallback();
  };

  window.__setFilterBrand = (brand) => {
    state.selectedBrand = brand;
    resetPaging();
    rerenderCallback();
  };

  window.__resetAllFilters = () => {
    state.selectedCategory = 'all';
    state.selectedSubcategory = 'all';
    state.selectedBrand = 'all';
    state.searchQuery = '';
    state.sortBy = 'default';
    resetPaging();
    window.__toggleFilterModal(false);
    rerenderCallback();
  };

  window.__clearCatalogSearch = () => {
    state.searchQuery = '';
    resetPaging();
    rerenderCallback();
  };

  window.__showMoreProducts = () => {
    state.visibleCount += PAGE_SIZE;
    rerenderCallback();
  };

  const innerSearch = document.getElementById('catalog-inner-search');
  if (innerSearch) {
    let timer;
    innerSearch.addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        state.searchQuery = e.target.value.trim();
        resetPaging();
        rerenderCallback();
        const input = document.getElementById('catalog-inner-search');
        if (input) {
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }, 300);
    });
  }
}
