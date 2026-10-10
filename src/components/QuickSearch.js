// NEVO GROUP — QuickSearch ⌘K / Ctrl+K Command Palette Modal
import { icon } from '../icons.js';
import { esc } from '../lib/format.js';
import { getCatalog, matchesSearch } from '../lib/catalog.js';
import { t } from '../lib/i18n.js';
import { openProductModal } from './ProductModal.js';

const RECENT_KEY = 'nevo_recent_searches';
let isSearchOpen = false;
let currentQuery = '';
let activeIndex = -1;
let currentResults = [];

export function openQuickSearch(query = '') {
  isSearchOpen = true;
  currentQuery = query;
  activeIndex = -1;
  renderQuickSearchDOM();
  document.body.classList.add('search-modal-open');

  setTimeout(() => {
    const input = document.getElementById('quicksearch-input');
    if (input) {
      input.focus();
      if (query) input.value = query;
    }
  }, 50);
}

export function closeQuickSearch() {
  isSearchOpen = false;
  document.body.classList.remove('search-modal-open');
  const root = document.getElementById('quicksearch-modal-root');
  if (root) {
    root.innerHTML = '';
    root.classList.remove('active');
  }
}

function getRecentSearches() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : ['PN20', 'Zadvijka', 'Kanalizatsiya', 'Fiting'];
  } catch (e) {
    return ['PN20', 'Zadvijka', 'Kanalizatsiya'];
  }
}

function saveRecentSearch(term) {
  if (!term || term.trim().length < 2) return;
  try {
    const recents = getRecentSearches().filter((s) => s.toLowerCase() !== term.toLowerCase());
    recents.unshift(term.trim());
    localStorage.setItem(RECENT_KEY, JSON.stringify(recents.slice(0, 6)));
  } catch (e) {
    void e;
  }
}

function performSearch(q) {
  const catalog = getCatalog();
  if (catalog.status !== 'ready') return { categories: [], products: [] };

  const query = q.trim().toLowerCase();
  if (!query) return { categories: [], products: [] };

  // Match categories
  const categories = catalog.categories.filter(
    (c) =>
      c.name.toLowerCase().includes(query) ||
      c.slug.toLowerCase().includes(query) ||
      c.shortDesc.toLowerCase().includes(query)
  );

  // Match products
  const products = catalog.products.filter((p) => matchesSearch(p, query)).slice(0, 12);

  return { categories, products };
}

function renderQuickSearchDOM() {
  let root = document.getElementById('quicksearch-modal-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'quicksearch-modal-root';
    document.body.appendChild(root);
  }

  const recents = getRecentSearches();
  const { categories, products } = performSearch(currentQuery);
  currentResults = [
    ...categories.map((c) => ({ type: 'category', data: c })),
    ...products.map((p) => ({ type: 'product', data: p })),
  ];

  const hasQuery = currentQuery.trim().length > 0;
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.userAgent);
  const kbdSymbol = isMac ? '⌘K' : 'Ctrl+K';

  root.className = 'quicksearch-modal-root active';
  root.innerHTML = `
    <div class="quicksearch-backdrop" id="quicksearch-backdrop" aria-hidden="true"></div>
    <div class="quicksearch-dialog" role="dialog" aria-modal="true" aria-label="${t('catalogSearchLabel')}">
      
      <!-- Input bar with colorful beam edge animation -->
      <div class="quicksearch-input-wrap beam-search">
        <div class="quicksearch-input-inner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="search-input-icon">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="search"
            id="quicksearch-input"
            class="quicksearch-input"
            placeholder="${t('catalogSearchPlaceholder')}"
            value="${esc(currentQuery)}"
            autocomplete="off"
            spellcheck="false"
            aria-label="${t('catalogSearchLabel')}"
          />
          ${
            currentQuery
              ? `
            <button type="button" class="quicksearch-clear-btn" id="quicksearch-clear" aria-label="${t('escToClose')}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          `
              : `
            <kbd class="quicksearch-kbd-badge">${kbdSymbol}</kbd>
          `
          }
          <button type="button" class="quicksearch-close-x" id="quicksearch-close-btn" aria-label="${t('escToClose')}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="beam-edge-clip" aria-hidden="true">
          <div class="beam-edge">
            <div class="beam-run"></div>
          </div>
        </div>
      </div>

      <!-- Results or Recent Queries Box -->
      <div class="quicksearch-results-panel" id="quicksearch-results-panel">
        ${
          !hasQuery
            ? `
          <div class="quicksearch-recents-box">
            <div class="recents-header">
              <span class="recents-title">${t('recentSearches')}</span>
            </div>
            <div class="recents-chips-row">
              ${recents
                .map(
                  (r) => `
                <button type="button" class="recent-chip-btn" data-query="${esc(r)}">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
                  <span>${esc(r)}</span>
                </button>
              `
                )
                .join('')}
            </div>
          </div>
        `
            : currentResults.length === 0
              ? `
          <div class="quicksearch-empty-state">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="text-muted">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
            <p class="empty-title">"${esc(currentQuery)}" ${t('searchNoResultsQuery')}</p>
            <p class="empty-sub">${t('searchTryAnother')}</p>
          </div>
        `
              : `
          <!-- Categories Matches -->
          ${
            categories.length > 0
              ? `
            <div class="results-group-block">
              <div class="results-group-label">${t('searchCategoriesGroup')} (${categories.length})</div>
              <div class="results-cat-list">
                ${categories
                  .map(
                    (c, i) => `
                  <a
                    href="/katalog/${esc(c.slug)}"
                    class="search-cat-item ${i === activeIndex ? 'selected' : ''}"
                    data-index="${i}"
                    data-type="category"
                    data-slug="${esc(c.slug)}"
                  >
                    <div class="search-cat-thumb">
                      <img src="${esc(c.image)}" alt="${esc(c.name)}" onerror="this.src='/brand/nevo-logo-sm.png';">
                    </div>
                    <div class="search-cat-info">
                      <span class="search-cat-title">${esc(c.name)}</span>
                      <span class="search-cat-desc">${esc(c.shortDesc)}</span>
                    </div>
                    <span class="search-cat-count">${c.count} ${t('productsWord')}</span>
                    ${icon('chevron-right', '', 14)}
                  </a>
                `
                  )
                  .join('')}
              </div>
            </div>
          `
              : ''
          }

          <!-- Products Matches -->
          ${
            products.length > 0
              ? `
            <div class="results-group-block">
              <div class="results-group-label">${t('searchProductsGroup')} (${products.length})</div>
              <div class="results-prod-list">
                ${products
                  .map((p, idx) => {
                    const globalIdx = categories.length + idx;
                    const isSel = globalIdx === activeIndex;
                    return `
                    <div
                      class="search-prod-item ${isSel ? 'selected' : ''}"
                      data-index="${globalIdx}"
                      data-type="product"
                      data-id="${p.id}"
                    >
                      <div class="search-prod-thumb">
                        <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.src='/brand/nevo-logo-sm.png';">
                      </div>
                      <div class="search-prod-info">
                        <div class="search-prod-title" title="${esc(p.name)}">${esc(p.name)}</div>
                        <div class="search-prod-meta">
                          <span class="search-prod-cat">${esc(p.category)}</span>
                          ${p.sku ? `<span class="search-prod-sku">· ${esc(p.sku)}</span>` : ''}
                        </div>
                      </div>
                      <div class="search-prod-price">
                        <span class="val">${esc(p.priceFormatted)}</span>
                        <span class="unit">/${esc(p.unit)}</span>
                      </div>
                    </div>
                  `;
                  })
                  .join('')}
              </div>
            </div>
          `
              : ''
          }
        `
        }
      </div>

      <!-- Footer with navigation hints -->
      <div class="quicksearch-footer">
        <div class="nav-hints">
          <span class="hint-key">↑↓</span>
          <span class="hint-label">${t('quickSearchHintSelect')}</span>
          <span class="hint-key">↵</span>
          <span class="hint-label">${t('quickSearchHintOpen')}</span>
          <span class="hint-key">ESC</span>
          <span class="hint-label">${t('quickSearchHintClose')}</span>
        </div>
      </div>

    </div>
  `;

  bindQuickSearchEvents();
}

function bindQuickSearchEvents() {
  const root = document.getElementById('quicksearch-modal-root');
  if (!root) return;

  const backdrop = document.getElementById('quicksearch-backdrop');
  if (backdrop) backdrop.addEventListener('click', closeQuickSearch);

  const closeBtn = document.getElementById('quicksearch-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeQuickSearch);

  const input = document.getElementById('quicksearch-input');
  if (input) {
    input.addEventListener('input', (e) => {
      currentQuery = e.target.value;
      activeIndex = -1;
      renderQuickSearchDOM();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeQuickSearch();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentResults.length > 0) {
          activeIndex = (activeIndex + 1) % currentResults.length;
          updateActiveSelection();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentResults.length > 0) {
          activeIndex = (activeIndex - 1 + currentResults.length) % currentResults.length;
          updateActiveSelection();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < currentResults.length) {
          selectItem(currentResults[activeIndex]);
        } else if (currentResults.length > 0) {
          selectItem(currentResults[0]);
        }
      }
    });
  }

  const clearBtn = document.getElementById('quicksearch-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      currentQuery = '';
      activeIndex = -1;
      renderQuickSearchDOM();
    });
  }

  // Recent Chips
  document.querySelectorAll('.recent-chip-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const q = btn.getAttribute('data-query');
      currentQuery = q;
      activeIndex = -1;
      renderQuickSearchDOM();
    });
  });

  // Product row clicks
  document.querySelectorAll('.search-prod-item').forEach((item) => {
    item.addEventListener('click', () => {
      const id = Number(item.getAttribute('data-id'));
      const catalog = getCatalog();
      const product = catalog.products.find((p) => p.id === id);
      if (product) {
        saveRecentSearch(product.name);
        closeQuickSearch();
        openProductModal(product);
      }
    });
  });

  // Category row clicks
  document.querySelectorAll('.search-cat-item').forEach((item) => {
    item.addEventListener('click', () => {
      const slug = item.getAttribute('data-slug');
      saveRecentSearch(slug);
      closeQuickSearch();
      window.location.hash = `#catalog/${slug}`;
    });
  });
}

function updateActiveSelection() {
  document.querySelectorAll('.search-cat-item, .search-prod-item').forEach((el) => {
    const idx = Number(el.getAttribute('data-index'));
    if (idx === activeIndex) {
      el.classList.add('selected');
      el.scrollIntoView({ block: 'nearest' });
    } else {
      el.classList.remove('selected');
    }
  });
}

function selectItem(item) {
  if (!item) return;
  if (item.type === 'category') {
    saveRecentSearch(item.data.name);
    closeQuickSearch();
    if (window.__navigateTo) {
      window.__navigateTo(`/katalog/${item.data.slug}`);
    } else {
      window.location.href = `/katalog/${item.data.slug}`;
    }
  } else if (item.type === 'product') {
    saveRecentSearch(item.data.name);
    closeQuickSearch();
    openProductModal(item.data);
  }
}

// Global ⌘K / Ctrl+K keyboard listener
export function initQuickSearchGlobal() {
  window.addEventListener('keydown', (e) => {
    const isMac = /Mac|iPhone|iPad/i.test(navigator.userAgent);
    const trigger = isMac ? e.metaKey && e.key.toLowerCase() === 'k' : e.ctrlKey && e.key.toLowerCase() === 'k';
    if (trigger) {
      e.preventDefault();
      if (isSearchOpen) {
        closeQuickSearch();
      } else {
        openQuickSearch();
      }
    }
  });
}

// Renderable trigger bar for CatalogHero
export function renderQuickSearchTrigger() {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.userAgent);
  const kbdSymbol = isMac ? '⌘K' : 'Ctrl+K';

  return `
    <div class="beam-search sticky-catalog-search" onclick="window.__openQuickSearch()">
      <div class="search-trigger-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="text-sky">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span class="search-placeholder-text">${t('catalogSearchPlaceholder')}</span>
        <kbd class="kbd-chip">${kbdSymbol}</kbd>
      </div>
      <div class="beam-edge-clip" aria-hidden="true">
        <div class="beam-edge">
          <div class="beam-run"></div>
        </div>
      </div>
    </div>
  `;
}

window.__openQuickSearch = (q = '') => {
  openQuickSearch(q);
};
