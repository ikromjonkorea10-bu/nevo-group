import { icon } from '../icons.js';
import { CATEGORIES } from '../data/categories.js';
import { PRODUCTS } from '../data/products.js';
import { renderProductCard } from '../components/ProductCard.js';

let state = {
  selectedCategory: 'all',
  selectedSubcategory: 'all',
  searchQuery: '',
  sortBy: 'default',
  viewMode: 'grid',
  isFilterOpen: false
};

export function renderCatalogPage(params = {}) {
  // Update state from params if passed
  if (params.category) state.selectedCategory = params.category;
  if (params.sub) state.selectedSubcategory = params.sub;
  if (params.search) state.searchQuery = params.search;
  if (params.sort) state.sortBy = params.sort;

  // Filter products
  let filtered = [...PRODUCTS];

  if (state.selectedCategory && state.selectedCategory !== 'all') {
    filtered = filtered.filter(p => p.categorySlug === state.selectedCategory);
  }

  if (state.selectedSubcategory && state.selectedSubcategory !== 'all') {
    filtered = filtered.filter(p => p.subcategory.toLowerCase() === state.selectedSubcategory.toLowerCase());
  }

  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.subcategory.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }

  // Sort
  if (state.sortBy === 'arzon') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (state.sortBy === 'qimmat') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (state.sortBy === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Get active category object
  const activeCatObj = CATEGORIES.find(c => c.slug === state.selectedCategory);
  const title = activeCatObj ? activeCatObj.name : 'Katalog';
  const subtext = activeCatObj ? `${activeCatObj.count} ta mahsulot narxi bilan` : 'Mahsulotni qidiring, bo\'lim va narx bo\'yicha saralang';

  // Available subcategories based on category
  const allSubcategories = [
    { name: 'Polietilen fitinglar', count: 241 },
    { name: 'Zadvijkalar', count: 47 },
    { name: 'Trubalar', count: 41 },
    { name: 'Kompression fitinglar', count: 37 },
    { name: 'Xomut va mahkamlagichlar', count: 33 },
    { name: 'Flanets va kompensator', count: 31 },
    { name: 'PPR fitinglar', count: 24 },
    { name: 'Zatvor va klapanlar', count: 22 },
    { name: 'Suv isitgichlar', count: 16 },
    { name: 'Filtr va vantuz', count: 13 },
    { name: 'Transformator podstansiyalari', count: 11 },
    { name: "Yong'in shlangi va fitingi", count: 11 },
    { name: 'Gidrant va kran', count: 6 },
    { name: 'Kran va ventillar', count: 6 }
  ];

  return `
    <div class="shell" style="padding-top: 24px; padding-bottom: 60px;">
      <!-- Catalog Page Header -->
      <div class="catalog-page-head">
        <h1 class="catalog-page-title">${title}</h1>
        <p class="catalog-page-sub">${subtext}</p>
        
        <div class="catalog-search-bar">
          ${icon('search', '', 20)}
          <input 
            type="text" 
            id="catalog-inner-search" 
            placeholder="Katalogdan qidirish..." 
            value="${state.searchQuery || ''}"
          />
          ${state.searchQuery ? `
            <button onclick="window.__clearCatalogSearch()" style="color: var(--muted); padding: 4px;">
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
          Barchasi (539)
        </button>
        ${CATEGORIES.map(c => `
          <button 
            class="cat-pill ${state.selectedCategory === c.slug ? 'active' : ''}" 
            onclick="window.__setCatalogCat('${c.slug}')"
          >
            ${c.name} (${c.count})
          </button>
        `).join('')}
      </div>

      <!-- Toolbar -->
      <div class="catalog-toolbar">
        <div class="catalog-toolbar-left">
          <button class="btn-filter-trigger" onclick="window.__toggleFilterModal(true)">
            ${icon('filter', '', 16)}
            <span>Filtr</span>
            ${state.selectedSubcategory !== 'all' ? '<span style="width: 8px; height: 8px; background: var(--nevo-blue); border-radius: 50%;"></span>' : ''}
          </button>

          <select class="sort-select" id="catalog-sort-select" onchange="window.__setCatalogSort(this.value)">
            <option value="default" ${state.sortBy === 'default' ? 'selected' : ''}>Mosligi bo'yicha</option>
            <option value="arzon" ${state.sortBy === 'arzon' ? 'selected' : ''}>Arzonroq oldin</option>
            <option value="qimmat" ${state.sortBy === 'qimmat' ? 'selected' : ''}>Qimmatroq oldin</option>
            <option value="name" ${state.sortBy === 'name' ? 'selected' : ''}>Nomi bo'yicha (A-Z)</option>
          </select>
        </div>

        <div style="font-size: 14px; color: var(--muted); font-weight: 500;">
          ${filtered.length} ta mahsulot ko'rsatilmoqda
        </div>
      </div>

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
            ${filtered.map(renderProductCard).join('')}
          </div>
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
              ${CATEGORIES.map(c => `
                <button 
                  class="filter-choice-pill ${state.selectedCategory === c.slug ? 'active' : ''}"
                  onclick="window.__setFilterCategory('${c.slug}')"
                >
                  ${c.name}
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
                  onclick="window.__setFilterSubcategory('${s.name}')"
                >
                  <span>${s.name}</span>
                  <span class="count">${s.count}</span>
                </button>
              `).join('')}
            </div>
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
  window.__setCatalogCat = (catSlug) => {
    state.selectedCategory = catSlug;
    state.selectedSubcategory = 'all';
    rerenderCallback();
  };

  window.__setCatalogSort = (sort) => {
    state.sortBy = sort;
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
    rerenderCallback();
  };

  window.__setFilterSubcategory = (sub) => {
    state.selectedSubcategory = sub;
    rerenderCallback();
  };

  window.__resetAllFilters = () => {
    state.selectedCategory = 'all';
    state.selectedSubcategory = 'all';
    state.searchQuery = '';
    state.sortBy = 'default';
    window.__toggleFilterModal(false);
    rerenderCallback();
  };

  window.__clearCatalogSearch = () => {
    state.searchQuery = '';
    rerenderCallback();
  };

  const innerSearch = document.getElementById('catalog-inner-search');
  if (innerSearch) {
    let timer;
    innerSearch.addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        state.searchQuery = e.target.value.trim();
        rerenderCallback();
      }, 300);
    });
  }
}
