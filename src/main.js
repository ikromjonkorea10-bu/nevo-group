import './style.css';
import { icon } from './icons.js';
import { store } from './store.js';
import { renderHeader, initHeaderEvents } from './components/Header.js';
import { renderFooter } from './components/Footer.js';
import { renderMobileBottomNav } from './components/MobileBottomNav.js';
import { renderHomePage, initHomeAnimations } from './pages/HomePage.js';
import { renderCatalogPage, initCatalogEvents } from './pages/CatalogPage.js';
import { renderProductDetailPage, initProductDetailEvents } from './pages/ProductDetailPage.js';
import { renderTanlashPage, initTanlashEvents } from './pages/TanlashPage.js';
import { renderKattaBuyurtmaPage, initKattaBuyurtmaEvents } from './pages/KattaBuyurtmaPage.js';
import { renderCartPage, initCartEvents } from './pages/CartPage.js';
import { renderContactPage, initContactEvents } from './pages/ContactPage.js';

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

function router() {
  const app = document.getElementById('app');
  if (!app) return;

  const { route, param, queryParams } = parseRoute();
  let pageHtml = '';

  // Render Page based on Route
  if (route === 'home' || route === '') {
    pageHtml = renderHomePage();
  } else if (route === 'catalog') {
    pageHtml = renderCatalogPage(queryParams);
  } else if (route === 'bolim') {
    pageHtml = renderCatalogPage({ category: param, ...queryParams });
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

  app.innerHTML = `
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
  `;

  // Initialize Page-Specific Events
  initHeaderEvents();

  if (route === 'home' || route === '') {
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

  window.scrollTo({ top: 0, behavior: 'instant' });
}

// Router Event Listeners
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
router();
