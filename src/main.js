// /admin (oxirida "/" siz) SPA fallback orqali shu sahifaga tushsa — admin panelga yo'naltirish
if (window.location.pathname.replace(/\/+$/, '') === '/admin') {
  window.location.replace(`/admin/${window.location.hash}`);
}

import './style.css';
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

initAnalytics();

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

function parseRoute() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const [path, queryString] = hash.split('?');
  const queryParams = {};

  if (queryString) {
    const pairs = queryString.split('&');
    for (const pair of pairs) {
      const [k, v] = pair.split('=');
      if (k) queryParams[decodeURIComponent(k)] = decodeURIComponent(v || '');
    }
  }

  const parts = path.split('/').filter(Boolean);
  const route = parts[0] || 'home';
  const param = parts[1] || '';

  return { route, param, queryParams, raw: path };
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

const KNOWN_ROUTES =new Set(['home', 'catalog', 'bolim', 'product', 'tanlash', 'katta-buyurtma', 'savat', 'aloqa']);
// Katalog tayyor bo'lishini kutmaydigan sahifalar (yuklanish holatini o'zi ko'rsatadi)
const STATIC_ROUTES = new Set(['home', 'aloqa']);

let lastRouteKey = null;

function router() {
  const app = document.getElementById('app');
  if (!app) return;

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
  } else if (route === 'catalog') {
    pageHtml = renderCatalogPage(queryParams, window.location.hash);
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
      <a href="#aloqa" class="floating-expert-btn" aria-label="Mutaxassisdan so'rash">
        ${icon('message-circle', '', 18)}
        <span>Mutaxassisdan so'rash</span>
      </a>
    ` : ''}
  `, !isNewRoute && route === 'home');

  // Initialize Page-Specific Events
  initHeaderEvents();

  if (!pageReady) {
    // Skeleton yoki xatolik ekrani — sahifa hodisalari keyinroq ulanadi
  } else if (route === 'home' || route === '') {
    initHomeAnimations();
  } else if (route === 'catalog' || route === 'bolim') {
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
    if (route === 'bolim' && param === cat) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  updatePageMeta(route, param);

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

// Router Event Listeners
window.addEventListener('hashchange', router);
// Katalog so'rovi birinchi bo'lib jo'natiladi; sahifa keyingi vazifada bir marta chiziladi,
// shunda og'ir birinchi render so'rovning tarmoqqa chiqishini kechiktirmaydi.
if (isSupabaseConfigured) loadCatalog({ silent: true });
setTimeout(router, 0);
