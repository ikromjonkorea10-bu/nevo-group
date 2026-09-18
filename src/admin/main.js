import '../style.css';
import './admin.css';
import { isSupabaseConfigured, getAdminSupabase, isNetworkError } from '../lib/supabase.js';
import { esc } from '../lib/format.js';
import { toast } from './ui.js';
import { renderOrdersPage, renderOrderDetailPage } from './orders.js';
import { renderProductsPage, renderProductFormPage } from './products.js';

const app = document.getElementById('admin-app');
document.body.classList.add('admin-body');

let session = null;
// Supabase client — kutubxona init()'da import() orqali yuklangach o'rnatiladi
let supabase = null;
let adminVerified = false;
let loginState = { email: '', error: '', submitting: false };
let renderToken = 0;

function parseRoute() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const [path] = hash.split('?');
  const [section = 'orders', param = ''] = path.split('/').filter(Boolean);
  return { section, param };
}

function renderConfigMissing() {
  app.innerHTML = `
    <div class="admin-login-wrap">
      <div class="admin-login-card">
        <h1 class="status-title">Admin panel sozlanmagan</h1>
        <p class="status-text" style="margin: 0;">
          <code>VITE_SUPABASE_URL</code> va <code>VITE_SUPABASE_ANON_KEY</code> muhit o'zgaruvchilari topilmadi.
          README'dagi ko'rsatmaga qarang.
        </p>
      </div>
    </div>
  `;
}

function renderCentered(title, text, actionsHtml = '') {
  app.innerHTML = `
    <div class="admin-login-wrap">
      <div class="admin-login-card" style="text-align: center;">
        <h1 class="status-title">${esc(title)}</h1>
        <p class="status-text">${esc(text)}</p>
        ${actionsHtml}
      </div>
    </div>
  `;
}

function renderLogin() {
  app.innerHTML = `
    <div class="admin-login-wrap">
      <form class="admin-login-card" id="admin-login-form" novalidate>
        <div class="admin-login-logo">
          <img src="/brand/nevo-logo.png" alt="" onerror="this.onerror=null;this.src='/brand/nevo-logo-sm.png';" />
          <div>
            <div style="font-weight: 800; font-size: 18px;">NEVO GROUP</div>
            <div style="font-size: 13px; color: var(--muted);">Admin panelga kirish</div>
          </div>
        </div>

        ${loginState.error ? `<div class="form-alert" role="alert"><span>${esc(loginState.error)}</span></div>` : ''}

        <div class="form-group" style="margin-bottom: 14px;">
          <label class="form-label" for="admin-email">Email</label>
          <input class="form-input" type="email" id="admin-email" name="email" autocomplete="username" required value="${esc(loginState.email)}" />
          <div class="field-error" id="err-admin-email" hidden></div>
        </div>
        <div class="form-group" style="margin-bottom: 20px;">
          <label class="form-label" for="admin-password">Parol</label>
          <input class="form-input" type="password" id="admin-password" name="password" autocomplete="current-password" required />
          <div class="field-error" id="err-admin-password" hidden></div>
        </div>

        <button type="submit" class="btn-primary" style="width: 100%; justify-content: center; padding: 14px;" ${loginState.submitting ? 'disabled aria-busy="true"' : ''}>
          ${loginState.submitting ? '<span class="btn-spinner" aria-hidden="true"></span><span>Kirilmoqda…</span>' : '<span>Kirish</span>'}
        </button>
        <p style="font-size: 12.5px; color: var(--muted); margin-top: 14px; text-align: center;">
          Hisoblarni faqat tizim administratori yaratadi.
        </p>
      </form>
    </div>
  `;

  const formEl = document.getElementById('admin-login-form');
  const emailEl = document.getElementById('admin-email');
  const passwordEl = document.getElementById('admin-password');
  (loginState.email ? passwordEl : emailEl).focus();

  const showFieldError = (el, id, message) => {
    const box = document.getElementById(id);
    box.textContent = message;
    box.hidden = !message;
    el.classList.toggle('has-error', Boolean(message));
    if (message) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
  };

  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (loginState.submitting) return;
    const email = emailEl.value.trim();
    const password = passwordEl.value;
    loginState.email = email;

    const emailError = !email ? 'Emailni kiriting' : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : "Email noto'g'ri";
    const passwordError = password ? '' : 'Parolni kiriting';
    showFieldError(emailEl, 'err-admin-email', emailError);
    showFieldError(passwordEl, 'err-admin-password', passwordError);
    if (emailError || passwordError) {
      (emailError ? emailEl : passwordEl).focus();
      return;
    }

    loginState = { email, error: '', submitting: true };
    renderLogin();

    let result;
    try {
      result = await supabase.auth.signInWithPassword({ email, password });
    } catch (err) {
      result = { error: err };
    }

    if (result.error) {
      const err = result.error;
      const message = isNetworkError(err)
        ? "Internet aloqasi yo'q yoki server javob bermadi. Qayta urinib ko'ring."
        : /invalid.*credentials|invalid login/i.test(err.message || '') || err.code === 'invalid_credentials'
          ? "Email yoki parol noto'g'ri"
          : err.message || 'Kirishda xatolik';
      loginState = { email, error: message, submitting: false };
      renderLogin();
      return;
    }

    loginState = { email: '', error: '', submitting: false };
    session = result.data.session;
    adminVerified = false;
    await render();
  });
}

function renderShell(section) {
  app.innerHTML = `
    <header class="admin-topbar">
      <div class="shell admin-topbar-inner">
        <a href="#orders" class="admin-brand">
          <img src="/brand/nevo-logo-sm.png" alt="" />
          <span>NEVO GROUP <small>Admin</small></span>
        </a>
        <nav class="admin-nav" aria-label="Admin bo'limlari">
          <a href="#orders" class="${section === 'orders' ? 'active' : ''}">Buyurtmalar</a>
          <a href="#products" class="${section === 'products' ? 'active' : ''}">Mahsulotlar</a>
        </nav>
        <div class="admin-user">
          <span class="admin-user-email" title="${esc(session?.user?.email)}">${esc(session?.user?.email)}</span>
          <button type="button" class="admin-logout-btn" id="admin-logout">Chiqish</button>
        </div>
      </div>
    </header>
    <main class="shell admin-main" id="admin-content"></main>
  `;
  document.getElementById('admin-logout').addEventListener('click', logout);
  return document.getElementById('admin-content');
}

async function logout() {
  // session avval tozalanadi — SIGNED_OUT hodisasi "sessiya tugadi" deb ko'rsatmasin
  session = null;
  adminVerified = false;
  try {
    await supabase.auth.signOut();
  } catch {
    // tarmoq bo'lmasa ham lokal sessiya tozalanadi
  }
  window.location.hash = '';
  renderLogin();
}

async function verifyAdmin() {
  renderCentered('Tekshirilmoqda…', "Kirish huquqi tekshirilmoqda, bir oz kuting.");
  const { data, error } = await supabase.rpc('is_admin');
  if (error) {
    const network = isNetworkError(error);
    renderCentered(
      "Ma'lumot yuklanmadi, qayta urinib ko'ring",
      network ? "Internet aloqasi yo'q yoki server javob bermadi." : error.message || "Noma'lum xatolik",
      `<div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
         <button type="button" class="btn-primary" id="admin-retry">Qayta urinish</button>
         <button type="button" class="btn-secondary" id="admin-logout-2">Chiqish</button>
       </div>`
    );
    document.getElementById('admin-retry').addEventListener('click', render);
    document.getElementById('admin-logout-2').addEventListener('click', logout);
    return false;
  }
  if (data !== true) {
    renderCentered(
      "Ruxsat yo'q",
      "Bu hisob admin panelga kirish huquqiga ega emas. Administrator bilan bog'laning.",
      '<button type="button" class="btn-primary" id="admin-logout-2">Boshqa hisob bilan kirish</button>'
    );
    document.getElementById('admin-logout-2').addEventListener('click', logout);
    return false;
  }
  adminVerified = true;
  return true;
}

async function render() {
  const token = ++renderToken;
  if (!session) {
    renderLogin();
    return;
  }
  if (!adminVerified && !(await verifyAdmin())) return;
  if (token !== renderToken) return;

  const { section, param } = parseRoute();
  const ctx = {
    supabase,
    navigate: (hash) => {
      if (window.location.hash === hash) render();
      else window.location.hash = hash;
    },
    isCurrent: () => token === renderToken,
    rerender: render,
  };

  if (section === 'products') {
    const container = renderShell('products');
    if (param) await renderProductFormPage(container, ctx, param);
    else await renderProductsPage(container, ctx);
  } else {
    const container = renderShell('orders');
    if (param) await renderOrderDetailPage(container, ctx, param);
    else await renderOrdersPage(container, ctx);
  }
}

async function init() {
  if (!isSupabaseConfigured) {
    renderConfigMissing();
    return;
  }

  try {
    supabase = await getAdminSupabase();
  } catch (error) {
    console.warn('Supabase kutubxonasi yuklanmadi:', error);
    renderCentered(
      'Admin panel yuklanmadi',
      isNetworkError(error) ? "Internet aloqasi yo'q yoki server javob bermadi." : error.message || "Noma'lum xatolik",
      '<button type="button" class="btn-primary" onclick="location.reload()">Qayta urinish</button>'
    );
    return;
  }
  const { data } = await supabase.auth.getSession();
  session = data.session;

  supabase.auth.onAuthStateChange((event, nextSession) => {
    if (event === 'SIGNED_OUT' && session) {
      session = null;
      adminVerified = false;
      toast('Sessiya tugadi. Qayta kiring.', 'error');
      renderLogin();
    } else if (event === 'TOKEN_REFRESHED' && nextSession) {
      session = nextSession;
    }
  });

  window.addEventListener('hashchange', render);
  await render();
}

init();
