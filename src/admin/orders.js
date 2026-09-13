import { icon } from '../icons.js';
import { esc, formatPrice, formatPhone, formatOrderNumber, formatDateTime } from '../lib/format.js';
import {
  ORDER_STATUSES, statusBadge, typeBadge, describeError, toast, renderSkeletonRows, renderErrorBox,
} from './ui.js';

const PAGE_SIZE = 50;
const LIST_COLUMNS = 'id, customer_name, phone, total_amount, status, order_type, company_name, created_at';

const listState = { status: 'all', rows: [], total: 0 };

function listHeader() {
  return `
    <div class="admin-order-row admin-order-head" aria-hidden="true">
      <div>Raqam</div><div>Mijoz</div><div>Telefon</div><div>Summa</div><div>Status</div><div>Sana</div>
    </div>
  `;
}

function renderRow(o) {
  return `
    <a class="admin-order-row" href="#orders/${o.id}">
      <div>
        <div class="admin-order-num">${esc(formatOrderNumber(o.id))}</div>
        <div>${typeBadge(o.order_type)}</div>
      </div>
      <div style="min-width: 0;">
        <div class="admin-cell-main">${esc(o.customer_name)}</div>
        ${o.company_name ? `<div class="admin-cell-sub">${esc(o.company_name)}</div>` : ''}
      </div>
      <div class="admin-cell-sub" style="color: var(--ink);">${esc(formatPhone(o.phone))}</div>
      <div class="admin-amount">${esc(formatPrice(o.total_amount))}</div>
      <div>${statusBadge(o.status)}</div>
      <div class="admin-cell-sub">${esc(formatDateTime(o.created_at))}</div>
    </a>
  `;
}

async function fetchOrders(supabase, from) {
  let query = supabase
    .from('orders')
    .select(LIST_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (listState.status !== 'all') query = query.eq('status', listState.status);
  return query;
}

export async function renderOrdersPage(container, ctx) {
  const pills = [{ value: 'all', label: 'Hammasi' }, ...ORDER_STATUSES];

  container.innerHTML = `
    <div class="admin-page-head">
      <div>
        <h1 class="admin-page-title">Buyurtmalar</h1>
        <p class="admin-page-sub" id="orders-count">Yuklanmoqda…</p>
      </div>
      <button type="button" class="btn-secondary" id="orders-refresh">Yangilash</button>
    </div>
    <div class="admin-pills" role="group" aria-label="Status bo'yicha filtr">
      ${pills.map((p) => `
        <button type="button" class="admin-pill ${listState.status === p.value ? 'active' : ''}" data-status="${p.value}" aria-pressed="${listState.status === p.value}">
          ${esc(p.label)}
        </button>
      `).join('')}
    </div>
    <div id="orders-body">
      <div class="admin-card admin-list" role="status" aria-label="Yuklanmoqda">${listHeader()}${renderSkeletonRows()}</div>
    </div>
  `;

  container.querySelectorAll('[data-status]').forEach((btn) => {
    btn.addEventListener('click', () => {
      listState.status = btn.dataset.status;
      renderOrdersPage(container, ctx);
    });
  });
  container.querySelector('#orders-refresh').addEventListener('click', () => renderOrdersPage(container, ctx));

  const body = container.querySelector('#orders-body');
  const countEl = container.querySelector('#orders-count');
  const requestedStatus = listState.status;

  const { data, error, count } = await fetchOrders(ctx.supabase, 0);
  if (!ctx.isCurrent() || requestedStatus !== listState.status || !body.isConnected) return;

  if (error) {
    countEl.textContent = '';
    window.__adminRetryOrders = () => renderOrdersPage(container, ctx);
    body.innerHTML = renderErrorBox(describeError(error), 'window.__adminRetryOrders()');
    return;
  }

  listState.rows = data;
  listState.total = count ?? data.length;
  countEl.textContent = `${listState.total} ta buyurtma · yangilari birinchi`;

  const draw = () => {
    if (listState.rows.length === 0) {
      body.innerHTML = `<div class="admin-card admin-muted-center">Bu status bo'yicha buyurtma yo'q.</div>`;
      return;
    }
    const remaining = listState.total - listState.rows.length;
    body.innerHTML = `
      <div class="admin-card admin-list">${listHeader()}${listState.rows.map(renderRow).join('')}</div>
      ${remaining > 0 ? `
        <div style="text-align: center; margin-top: 16px;">
          <button type="button" class="btn-secondary" id="orders-more">Yana yuklash (${remaining} ta qoldi)</button>
        </div>
      ` : ''}
    `;
    const more = body.querySelector('#orders-more');
    if (more) {
      more.addEventListener('click', async () => {
        more.disabled = true;
        more.textContent = 'Yuklanmoqda…';
        const res = await fetchOrders(ctx.supabase, listState.rows.length);
        if (!ctx.isCurrent() || !body.isConnected) return;
        if (res.error) {
          toast(describeError(res.error), 'error');
          more.disabled = false;
          more.textContent = 'Yana yuklash';
          return;
        }
        listState.rows = [...listState.rows, ...res.data];
        listState.total = res.count ?? listState.total;
        draw();
      });
    }
  };
  draw();
}

export async function renderOrderDetailPage(container, ctx, idParam) {
  const id = Number.parseInt(idParam, 10);
  if (!Number.isInteger(id) || id <= 0) {
    container.innerHTML = `<div class="admin-card admin-muted-center">Buyurtma raqami noto'g'ri. <a href="#orders" style="color: var(--nevo-blue); font-weight: 600;">Ro'yxatga qaytish</a></div>`;
    return;
  }

  container.innerHTML = `
    <a href="#orders" class="back-link">${icon('chevron-left', '', 18)}<span>Buyurtmalar ro'yxati</span></a>
    <div class="admin-page-head">
      <div>
        <h1 class="admin-page-title">${esc(formatOrderNumber(id))}</h1>
        <p class="admin-page-sub">Buyurtma tafsilotlari</p>
      </div>
    </div>
    <div id="order-detail-body" role="status" aria-label="Yuklanmoqda">
      <div class="admin-detail-grid">
        <div class="admin-card admin-card-pad">
          ${Array.from({ length: 6 }, () => '<div class="skeleton skeleton-line" style="width: 80%; height: 14px; margin-bottom: 16px;"></div>').join('')}
        </div>
        <div class="admin-card admin-card-pad">
          ${Array.from({ length: 5 }, () => '<div class="skeleton skeleton-line" style="height: 18px; margin-bottom: 16px;"></div>').join('')}
        </div>
      </div>
    </div>
  `;

  const body = container.querySelector('#order-detail-body');
  const [orderRes, itemsRes] = await Promise.all([
    ctx.supabase
      .from('orders')
      .select('id, customer_name, phone, address, comment, total_amount, status, order_type, company_name, created_at, updated_at')
      .eq('id', id)
      .limit(1),
    ctx.supabase
      .from('order_items')
      .select('id, product_id, product_name, price, quantity')
      .eq('order_id', id)
      .order('id', { ascending: true }),
  ]);
  if (!ctx.isCurrent() || !body.isConnected) return;

  const error = orderRes.error || itemsRes.error;
  if (error) {
    window.__adminRetryOrder = () => renderOrderDetailPage(container, ctx, idParam);
    body.removeAttribute('role');
    body.innerHTML = renderErrorBox(describeError(error), 'window.__adminRetryOrder()');
    return;
  }

  const order = orderRes.data[0];
  if (!order) {
    body.removeAttribute('role');
    body.innerHTML = `<div class="admin-card admin-muted-center">Buyurtma topilmadi.</div>`;
    return;
  }

  const items = itemsRes.data;
  const itemsTotal = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);

  body.removeAttribute('role');
  body.removeAttribute('aria-label');
  body.innerHTML = `
    <div class="admin-detail-grid">
      <div style="display: flex; flex-direction: column; gap: 18px;">
        <section class="admin-card admin-card-pad">
          <h2 class="admin-section-title">Status</h2>
          <div style="margin-bottom: 12px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <span id="order-status-badge">${statusBadge(order.status)}</span>
            ${typeBadge(order.order_type)}
          </div>
          <form class="admin-status-form" id="order-status-form">
            <label for="order-status-select" class="visually-hidden">Yangi status</label>
            <select class="admin-select" id="order-status-select">
              ${ORDER_STATUSES.map((s) => `<option value="${s.value}" ${s.value === order.status ? 'selected' : ''}>${esc(s.label)}</option>`).join('')}
            </select>
            <button type="submit" class="btn-primary" id="order-status-save" disabled>Saqlash</button>
          </form>
          <div class="field-error" id="order-status-error" hidden></div>
        </section>

        <section class="admin-card admin-card-pad">
          <h2 class="admin-section-title">Mijoz</h2>
          <dl class="admin-dl">
            <div><dt>Ism</dt><dd>${esc(order.customer_name)}</dd></div>
            <div><dt>Telefon</dt><dd><a href="tel:${esc(order.phone)}">${esc(formatPhone(order.phone))}</a></dd></div>
            ${order.company_name ? `<div><dt>Kompaniya</dt><dd>${esc(order.company_name)}</dd></div>` : ''}
            <div><dt>Manzil</dt><dd class="admin-pre">${order.address ? esc(order.address) : '<span style="color: var(--muted);">Ko\'rsatilmagan</span>'}</dd></div>
            <div><dt>Izoh</dt><dd class="admin-pre">${order.comment ? esc(order.comment) : '<span style="color: var(--muted);">Yo\'q</span>'}</dd></div>
            <div><dt>Yaratilgan</dt><dd>${esc(formatDateTime(order.created_at))}</dd></div>
          </dl>
        </section>
      </div>

      <section class="admin-card">
        <div class="admin-card-pad" style="padding-bottom: 0;">
          <h2 class="admin-section-title">Mahsulotlar (${items.length})</h2>
        </div>
        ${items.length === 0 ? `
          <div class="admin-muted-center" style="padding-top: 16px;">
            Savatdan mahsulot tanlanmagan — ro'yxat izohda yozilgan.
          </div>
        ` : `
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr><th>Mahsulot</th><th class="num">Narx</th><th class="num">Soni</th><th class="num">Jami</th></tr>
              </thead>
              <tbody>
                ${items.map((i) => `
                  <tr>
                    <td>
                      <div style="font-weight: 600;">${esc(i.product_name)}</div>
                      ${i.product_id ? '' : '<div class="admin-cell-sub">Mahsulot katalogdan o\'chirilgan</div>'}
                    </td>
                    <td class="num">${esc(formatPrice(i.price))}</td>
                    <td class="num">${i.quantity}</td>
                    <td class="num">${esc(formatPrice(Number(i.price) * i.quantity))}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr><td colspan="3">Umumiy summa</td><td class="num">${esc(formatPrice(order.total_amount ?? itemsTotal))}</td></tr>
              </tfoot>
            </table>
          </div>
        `}
      </section>
    </div>
  `;

  const form = body.querySelector('#order-status-form');
  const select = body.querySelector('#order-status-select');
  const saveBtn = body.querySelector('#order-status-save');
  const errorBox = body.querySelector('#order-status-error');
  let currentStatus = order.status;

  select.addEventListener('change', () => {
    saveBtn.disabled = select.value === currentStatus;
    errorBox.hidden = true;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nextStatus = select.value;
    if (nextStatus === currentStatus) return;
    saveBtn.disabled = true;
    select.disabled = true;
    saveBtn.innerHTML = '<span class="btn-spinner" aria-hidden="true"></span><span>Saqlanmoqda…</span>';

    const { data, error: updateError } = await ctx.supabase
      .from('orders')
      .update({ status: nextStatus })
      .eq('id', id)
      .select('id, status');

    if (!body.isConnected) return;
    select.disabled = false;
    saveBtn.textContent = 'Saqlash';

    if (updateError || !data || data.length !== 1) {
      errorBox.textContent = updateError ? describeError(updateError) : "Statusni o'zgartirishga ruxsat yo'q.";
      errorBox.hidden = false;
      select.value = currentStatus;
      saveBtn.disabled = true;
      return;
    }

    currentStatus = data[0].status;
    body.querySelector('#order-status-badge').innerHTML = statusBadge(currentStatus);
    saveBtn.disabled = true;
    toast('Status saqlandi');
  });
}
