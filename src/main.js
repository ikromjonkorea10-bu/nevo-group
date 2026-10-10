// /admin (oxirida "/" siz) SPA fallback orqali shu sahifaga tushsa — admin panelga yo'naltirish
if (window.location.pathname.replace(/\/+$/, '') === '/admin') {
  window.location.replace(`/admin/${window.location.hash}`);
}

import './style.css';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/free-mode';

import { icon } from './icons.js';
import { store } from './store.js';
import { isSupabaseConfigured } from './lib/supabase.js';
import { getCatalog, loadCatalog, onCatalogChange } from './lib/catalog.js';
import { renderPageSkeleton, renderLoadError, renderConfigError } from './components/StatusViews.js';
import { renderHeader, initHeaderEvents, updateCartBadges } from './components/Header.js';
import { renderFooter } from './components/Footer.js';
import { renderMobileBottomNav } from './components/MobileBottomNav.js';
import { renderHomePage, initHomeAnimations } from './pages/HomePage.js';
import { renderCatalogPage, initCatalogEvents } from './pages/CatalogPage.js';
import { renderProductDetailPage, initProductDetailEvents } from './pages/ProductDetailPage.js';
import { renderTanlashPage, initTanlashEvents } from './pages/TanlashPage.js';
import { renderKattaBuyurtmaPage, initKattaBuyurtmaEvents } from './pages/KattaBuyurtmaPage.js';
import { renderCartPage, initCartEvents } from './pages/CartPage.js';
import { renderContactPage, initContactEvents } from './pages/ContactPage.js';
import { initAnalytics, trackPageview } from './lib/analytics.js';
import { updatePageMeta } from './lib/pageMeta.js';
import { initIntroSplash } from './components/IntroSplash.js';
import { renderMaintenanceScreen, initMaintenanceUnlock } from './components/MaintenanceScreen.js';
import { initProductModalGlobal } from './components/ProductModal.js';
import { initQuickSearchGlobal } from './components/QuickSearch.js';

window.__getCatalog = getCatalog;

// Maintenance & Stealth Preview Gate
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('preview') === '1' || urlParams.get('preview') === 'true' || urlParams.get('admin') === '1' || window.location.hash.includes('preview=1')) {
  localStorage.setItem('nevo_admin_preview', '1');
}
if (urlParams.get('exit_preview') === '1') {
  localStorage.removeItem('nevo_admin_preview');
}
const isPreviewAuthorized = localStorage.getItem('nevo_admin_preview') === '1';

initAnalytics();
if (isPreviewAuthorized) {
  initIntroSplash();
}

// Global add to cart helper with tactile micro-animation
window.__addToCart = (productId, event) => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
    const btn = event.currentTarget || event.target.closest('.product-add-btn');
    if (btn && !btn.classList.contains('btn-added-animation')) {
      btn.classList.add('btn-added-animation');
      const origHtml = btn.innerHTML;
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>Qo'shildi!</span>
      `;
      setTimeout(() => {
        btn.classList.remove('btn-added-animation');
        btn.innerHTML = origHtml;
      }, 1400);
    }
  }

  // Bounce header cart badge
  const badge = document.getElementById('header-cart-badge');
  if (badge) {
    badge.classList.remove('badge-bounce-anim');
    void badge.offsetWidth; // trigger reflow
    badge.classList.add('badge-bounce-anim');
  }

  store.addToCart(productId, 1);
};

export function normalizeHashToPath(hash) {
  const clean = hash.replace(/^#\/?/, '');
  const [routePart, queryString] = clean.split('?');
  const parts = routePart.split('/').filter(Boolean);
  let pathname = '/';

  if (!parts.length || parts[0] === 'home') {
    pathname = '/';
  } else if (parts[0] === 'catalog' || parts[0] === 'katalog') {
    if (parts[1]) {
      pathname = `/katalog/${parts[1]}`;
    } else {
      pathname = '/katalog';
    }
  } else if (parts[0] === 'bolim' && parts[1]) {
    pathname = `/katalog/${parts[1]}`;
  } else if ((parts[0] === 'product' || parts[0] === 'p') && parts[1]) {
    pathname = `/katalog/mahsulot/${parts[1]}`;
  } else if (['savat', 'aloqa', 'tanlash', 'katta-buyurtma', 'biz-haqimizda', 'yangiliklar', 'hamkorlar'].includes(parts[0])) {
    pathname = `/${parts[0]}`;
  } else {
    pathname = parts[0] ? `/${parts[0]}` : '/';
  }

  const searchParams = new URLSearchParams(window.location.search);
  if (queryString) {
    const pairs = queryString.split('&');
    for (const pair of pairs) {
      const [k, v] = pair.split('=');
      if (k) searchParams.set(decodeURIComponent(k), decodeURIComponent(v || ''));
    }
  }

  const searchStr = searchParams.toString();
  return `${pathname}${searchStr ? '?' + searchStr : ''}`;
}

export function navigateTo(target, replace = false) {
  let path = target;
  if (path.startsWith(window.location.origin)) {
    path = path.slice(window.location.origin.length);
  }

  if (path.startsWith('#')) {
    path = normalizeHashToPath(path);
  }

  // Preserve ?preview=1 if currently active in URL
  const currentParams = new URLSearchParams(window.location.search);
  const targetUrl = new URL(path, window.location.origin);
  if (currentParams.get('preview') === '1' && !targetUrl.searchParams.has('preview')) {
    targetUrl.searchParams.set('preview', '1');
  }

  const finalUrl = targetUrl.pathname + (targetUrl.search ? targetUrl.search : '') + targetUrl.hash;

  if (replace) {
    window.history.replaceState(null, '', finalUrl);
  } else {
    window.history.pushState(null, '', finalUrl);
  }

  router();
}
window.__navigateTo = navigateTo;

function parseRoute() {
  // If old hash exists and is not an in-page scroll anchor
  if (
    window.location.hash &&
    !window.location.hash.startsWith('#category-') &&
    !window.location.hash.startsWith('#stats-') &&
    window.location.hash !== '#'
  ) {
    const newPath = normalizeHashToPath(window.location.hash);
    window.history.replaceState(null, '', newPath);
  }

  const searchParams = new URLSearchParams(window.location.search);
  const queryParams = {};
  for (const [k, v] of searchParams.entries()) {
    queryParams[k] = v;
  }

  const cleanPath = window.location.pathname.replace(/^\/+|\/+$/g, '');
  const parts = cleanPath.split('/').filter(Boolean);

  let route = 'home';
  let param = '';

  if (!parts.length) {
    route = 'home';
  } else if (parts[0] === 'katalog' || parts[0] === 'catalog') {
    if (parts[1] === 'mahsulot' && parts[2]) {
      route = 'product';
      param = parts[2];
    } else if (parts[1]) {
      route = 'catalog';
      param = parts[1];
      if (parts[2]) queryParams.sub = parts[2];
    } else {
      route = 'catalog';
    }
  } else if (parts[0] === 'bolim' && parts[1]) {
    route = 'catalog';
    param = parts[1];
  } else if ((parts[0] === 'product' || parts[0] === 'p') && parts[1]) {
    route = 'product';
    param = parts[1];
  } else if (parts[0] === 'k' && parts[1]) {
    route = 'catalog';
    param = parts[1];
  } else {
    route = parts[0] || 'home';
    param = parts[1] || '';
  }

  return { route, param, queryParams, raw: cleanPath || 'home' };
}

function sameAttributes(a, b) {
  if (a.attributes.length !== b.attributes.length) return false;
  for (const { name, value } of a.attributes) {
    if (b.getAttribute(name) !== value) return false;
  }
  return true;
}

// Eski DOM'ni yangisiga moslaydi: o'zgarmagan elementlar joyida qoladi, farq qilganlari almashtiriladi.
function morphChildren(oldParent, newParent) {
  const oldKids = [...oldParent.childNodes];
  const newKids = [...newParent.childNodes];
  if (oldKids.length !== newKids.length) {
    oldParent.replaceChildren(...newKids);
    return;
  }
  oldKids.forEach((oldNode, i) => {
    const newNode = newKids[i];
    if (oldNode.nodeName !== newNode.nodeName) {
      oldNode.replaceWith(newNode);
    } else if (oldNode.nodeType === Node.TEXT_NODE) {
      if (oldNode.data !== newNode.data) oldNode.data = newNode.data;
    } else if (oldNode.nodeType === Node.ELEMENT_NODE && !oldNode.isEqualNode(newNode)) {
      if (sameAttributes(oldNode, newNode)) morphChildren(oldNode, newNode);
      else oldNode.replaceWith(newNode);
    }
  });
}

// Bosh sahifa katalog kelganda qayta chizilganda o'zgarmagan qismlar (hero sarlavhasi —
// LCP elementi) qayta yaratilmaydi, aks holda LCP katalog javobigacha surilib ketadi.
function renderApp(app, html, morphPage) {
  const oldPage = morphPage && document.getElementById('page-container');
  if (!oldPage) {
    app.innerHTML = html;
    return;
  }
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const oldKids = [...app.children];
  const newKids = [...tpl.content.children];
  if (oldKids.length !== newKids.length || oldKids.some((el, i) => el.id !== newKids[i].id)) {
    app.innerHTML = html;
    return;
  }
  oldKids.forEach((el, i) => {
    if (el === oldPage) morphChildren(el, newKids[i]);
    else el.replaceWith(newKids[i]);
  });
}

const KNOWN_ROUTES = new Set([
  'home',
  'catalog',
  'katalog',
  'bolim',
  'product',
  'tanlash',
  'katta-buyurtma',
  'savat',
  'aloqa',
  'biz-haqimizda',
  'yangiliklar',
  'hamkorlar',
]);
// Katalog tayyor bo'lishini kutmaydigan sahifalar (yuklanish holatini o'zi ko'rsatadi)
const STATIC_ROUTES = new Set(['home', 'aloqa']);

let lastRouteKey = null;

function router() {
  const app = document.getElementById('app');
  if (!app) return;

  const isPreview = localStorage.getItem('nevo_admin_preview') === '1';
  if (!isPreview) {
    app.innerHTML = renderMaintenanceScreen();
    initMaintenanceUnlock();
    return;
  }

  const parsed = parseRoute();
  const route = KNOWN_ROUTES.has(parsed.route) ? parsed.route : 'home';
  const { param, queryParams, raw } = parsed;
  const routeKey = raw;
  const isNewRoute = routeKey !== lastRouteKey;
  lastRouteKey = routeKey;
  let pageHtml = '';
  let pageReady = true;

  const needsCatalog = !STATIC_ROUTES.has(route);

  if (needsCatalog && !isSupabaseConfigured) {
    pageHtml = renderConfigError();
    pageReady = false;
  } else if (needsCatalog && getCatalog().status === 'error') {
    pageHtml = renderLoadError(getCatalog().error, '__retryCatalog');
    pageReady = false;
  } else if (needsCatalog && getCatalog().status !== 'ready') {
    pageHtml = renderPageSkeleton();
    pageReady = false;
  } else if (route === 'home' || route === '') {
    pageHtml = renderHomePage();
  } else if (route === 'catalog' || route === 'katalog') {
    pageHtml = renderCatalogPage(param ? { category: param, ...queryParams } : queryParams, window.location.hash);
  } else if (route === 'bolim') {
    pageHtml = renderCatalogPage({ category: param, ...queryParams }, window.location.hash);
  } else if (route === 'product') {
    pageHtml = renderProductDetailPage(param);
  } else if (route === 'tanlash') {
    pageHtml = renderTanlashPage();
  } else if (route === 'katta-buyurtma') {
    pageHtml = renderKattaBuyurtmaPage();
  } else if (route === 'savat') {
    pageHtml = renderCartPage();
  } else if (route === 'aloqa') {
    pageHtml = renderContactPage();
  } else {
    pageHtml = renderHomePage();
  }

  const showFloatingBtn = route !== 'aloqa' && route !== 'savat';

  renderApp(app, `
    ${renderHeader()}
    <div id="page-container">${pageHtml}</div>
    ${renderFooter()}
    ${renderMobileBottomNav(route)}
    ${showFloatingBtn ? `
      <a href="/aloqa" class="floating-expert-btn" aria-label="Mutaxassisdan so'rash">
        ${icon('message-circle', '', 18)}
        <span>Mutaxassisdan so'rash</span>
      </a>
    ` : ''}
    <div class="nevo-preview-floating-badge" id="preview-badge" title="Faqat siz ko'ra olasiz. Oddiy foydalanuvchilarga sayt texnik rejimda ko'rinadi.">
      <span class="preview-dot"></span>
      <span>🛡️ Maxfiy Preview</span>
      <button type="button" class="preview-exit-btn" onclick="localStorage.removeItem('nevo_admin_preview'); window.location.href='/';">Yopish</button>
    </div>
  `, !isNewRoute && route === 'home');

  // Initialize Page-Specific Events
  initHeaderEvents();

  if (!pageReady) {
    // Skeleton yoki xatolik ekrani — sahifa hodisalari keyinroq ulanadi
  } else if (route === 'home' || route === '') {
    initHomeAnimations();
  } else if (route === 'catalog' || route === 'katalog' || route === 'bolim') {
    initCatalogEvents(router);
  } else if (route === 'product') {
    initProductDetailEvents();
  } else if (route === 'tanlash') {
    initTanlashEvents(router);
  } else if (route === 'katta-buyurtma') {
    initKattaBuyurtmaEvents(router);
  } else if (route === 'savat') {
    initCartEvents(router);
  } else if (route === 'aloqa') {
    initContactEvents();
  }

  // Update active states on category links
  document.querySelectorAll('.nav-category-link').forEach(link => {
    const cat = link.getAttribute('data-cat');
    if ((route === 'catalog' || route === 'katalog' || route === 'bolim') && param === cat) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  updatePageMeta(route === 'katalog' ? 'catalog' : route, param);

  if (isNewRoute) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    trackPageview(route, param);
  }
}

window.__retryCatalog = () => {
  loadCatalog();
};

// Katalog holati o'zgarganda (yuklandi / xatolik) sahifani qayta chizish
onCatalogChange((state) => {
  if (state.status === 'ready') store.syncWithCatalog();
  router();
});

// Savat o'zgarganda nishonlarni yangilash (bir marta ulanadi)
store.subscribe(({ count }) => updateCartBadges(count));

// Intercept local anchor clicks for smooth History API navigation
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (!link) return;
  const href = link.getAttribute('href');
  if (!href) return;

  // Allow browser standard behavior for new windows, downloads and modifiers
  if (link.target === '_blank' || link.hasAttribute('download') || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('javascript:')) return;
  if (href.startsWith('http://') || href.startsWith('https://')) {
    if (!href.startsWith(window.location.origin)) return;
  }
  if (href.startsWith('/admin') || href.startsWith('/api') || href.startsWith('/catalogs/')) return;
  if (href.startsWith('#') && (href === '#' || href.startsWith('#category-') || href.startsWith('#stats-') || document.querySelector(href))) {
    return;
  }

  e.preventDefault();
  navigateTo(href);
});

// Router Event Listeners
window.addEventListener('popstate', router);
window.addEventListener('hashchange', router);
window.addEventListener('nevolangchanged', router);
initProductModalGlobal();
initQuickSearchGlobal();

// Katalog so'rovi birinchi bo'lib jo'natiladi; sahifa keyingi vazifada bir marta chiziladi,
// shunda og'ir birinchi render so'rovning tarmoqqa chiqishini kechiktirmaydi.
if (isSupabaseConfigured) loadCatalog({ silent: true });
setTimeout(router, 0);
