// Baza sxemasi, RLS va place_order RPC testlari.
// Ishga tushirish: npm run test:db
//
// Migratsiyalar PGlite'dagi Supabase nusxasiga qo'llanadi va har bir
// qoida anon / authenticated (admin emas) / admin rollari bilan sinaladi.

import assert from 'node:assert/strict';
import { createSupabaseDb, asRole, createAuthUser } from './lib/pglite-supabase.mjs';

const results = [];
async function test(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ✓ ${name}`);
  } catch (err) {
    results.push({ name, ok: false, err });
    console.log(`  ✗ ${name}\n    ${err.message}`);
  }
}

async function expectError(promise, { code, hint, match } = {}) {
  try {
    await promise;
  } catch (err) {
    if (code) assert.equal(err.code, code, `kutilgan kod ${code}, kelgan ${err.code}: ${err.message}`);
    if (hint) assert.equal(err.hint, hint, `kutilgan hint ${hint}, kelgan ${err.hint}: ${err.message}`);
    if (match) assert.match(err.message, match);
    return err;
  }
  assert.fail('Xatolik kutilgan edi, lekin so\'rov muvaffaqiyatli bajarildi');
}

const db = await createSupabaseDb();

// ---- Tayyorgarlik (superuser sifatida) --------------------------------
const adminId = await createAuthUser(db, 'admin@nevo.test');
const userId = await createAuthUser(db, 'oddiy@nevo.test');
await db.query('insert into public.admin_users (user_id) values ($1)', [adminId]);

const { rows: [cat] } = await db.query(
  `insert into public.categories (slug, name_uz, sort_order) values ('truba', 'Truba', 1) returning id`
);
const { rows: prods } = await db.query(
  `insert into public.products (category_id, slug, name_uz, price, in_stock)
   values ($1, 'ng-1', 'Truba d20', 6000, true),
          ($1, 'ng-2', 'Mufta d25', 2500, true),
          ($1, 'ng-3', 'Tugagan mahsulot', 1000, false)
   returning id, slug`,
  [cat.id]
);
const P = Object.fromEntries(prods.map((p) => [p.slug, Number(p.id)]));

const ANON = { role: 'anon' };
const USER = { role: 'authenticated', sub: userId, email: 'oddiy@nevo.test' };
const ADMIN = { role: 'authenticated', sub: adminId, email: 'admin@nevo.test' };

const placeOrder = (auth, args) =>
  asRole(db, auth, (tx) =>
    tx.query(
      `select public.place_order(
         p_customer_name => $1, p_phone => $2, p_address => $3, p_comment => $4,
         p_order_type => $5, p_company_name => $6, p_items => $7::jsonb) as r`,
      [
        args.name ?? 'Ali', args.phone ?? '+998901234567', args.address ?? null, args.comment ?? null,
        args.type ?? 'retail', args.company ?? null, JSON.stringify(args.items ?? []),
      ]
    ).then((res) => res.rows[0].r)
  );

const countOrders = async () => Number((await db.query('select count(*) as c from public.orders')).rows[0].c);

console.log('\nKatalog (categories, products)');

await test('anon kategoriya va mahsulotlarni o\'qiy oladi', async () => {
  const c = await asRole(db, ANON, (tx) => tx.query('select * from public.categories'));
  const p = await asRole(db, ANON, (tx) => tx.query('select * from public.products'));
  assert.equal(c.rows.length, 1);
  assert.equal(p.rows.length, 3);
});

await test('anon mahsulot qo\'sha olmaydi', async () => {
  await expectError(
    asRole(db, ANON, (tx) =>
      tx.query(`insert into public.products (category_id, slug, name_uz, price) values ($1, 'x', 'X', 1)`, [cat.id])
    ),
    { code: '42501' }
  );
});

await test('anon mahsulotni o\'zgartira va o\'chira olmaydi', async () => {
  await expectError(asRole(db, ANON, (tx) => tx.query('update public.products set price = 1')), { code: '42501' });
  await expectError(asRole(db, ANON, (tx) => tx.query('delete from public.products')), { code: '42501' });
  await expectError(asRole(db, ANON, (tx) => tx.query('update public.categories set name_uz = \'x\'')), { code: '42501' });
});

await test('admin bo\'lmagan authenticated foydalanuvchi mahsulot yoza olmaydi', async () => {
  await expectError(
    asRole(db, USER, (tx) =>
      tx.query(`insert into public.products (category_id, slug, name_uz, price) values ($1, 'x', 'X', 1)`, [cat.id])
    ),
    { code: '42501' }
  );
  const upd = await asRole(db, USER, (tx) => tx.query('update public.products set price = 1 returning id'));
  assert.equal(upd.rows.length, 0, 'RLS update\'ni bloklashi kerak');
  const del = await asRole(db, USER, (tx) => tx.query('delete from public.products returning id'));
  assert.equal(del.rows.length, 0, 'RLS delete\'ni bloklashi kerak');
});

await test('admin mahsulot qo\'shadi, tahrirlaydi va o\'chiradi', async () => {
  const ins = await asRole(db, ADMIN, (tx) =>
    tx.query(
      `insert into public.products (category_id, slug, name_uz, price) values ($1, 'yangi-mahsulot', 'Yangi', 100) returning id`,
      [cat.id]
    )
  );
  const id = ins.rows[0].id;
  const upd = await asRole(db, ADMIN, (tx) =>
    tx.query('update public.products set price = 200 where id = $1 returning price', [id])
  );
  assert.equal(Number(upd.rows[0].price), 200);
  const del = await asRole(db, ADMIN, (tx) => tx.query('delete from public.products where id = $1 returning id', [id]));
  assert.equal(del.rows.length, 1);
});

await test('noto\'g\'ri image_url (javascript:) rad etiladi', async () => {
  await expectError(
    asRole(db, ADMIN, (tx) =>
      tx.query(
        `insert into public.products (category_id, slug, name_uz, price, image_url) values ($1, 'xss', 'X', 1, 'javascript:alert(1)')`,
        [cat.id]
      )
    ),
    { code: '23514' }
  );
});

console.log('\nBuyurtmalar RLS');

await test('anon to\'g\'ridan-to\'g\'ri orders\'ga INSERT qila olmaydi (faqat RPC)', async () => {
  await expectError(
    asRole(db, ANON, (tx) =>
      tx.query(`insert into public.orders (customer_name, phone, total_amount) values ('X', '+998901234567', 1)`)
    ),
    { code: '42501' }
  );
  await expectError(
    asRole(db, ANON, (tx) =>
      tx.query(`insert into public.order_items (order_id, product_name, price, quantity) values (1, 'X', 0, 1)`)
    ),
    { code: '42501' }
  );
});

await test('place_order: muvaffaqiyatli buyurtma, narx serverdan olinadi', async () => {
  const r = await placeOrder(ANON, {
    name: '  Vali  ',
    phone: '+998 (90) 123-45-67',
    address: 'Toshkent',
    items: [
      { product_id: P['ng-1'], quantity: 2, price: 1 },
      { product_id: P['ng-2'], quantity: 3 },
      { product_id: P['ng-1'], quantity: 1 },
    ],
  });
  assert.ok(r.id > 0);
  assert.equal(Number(r.total_amount), 6000 * 3 + 2500 * 3);

  const { rows: [o] } = await db.query('select * from public.orders where id = $1', [r.id]);
  assert.equal(o.customer_name, 'Vali');
  assert.equal(o.phone, '+998901234567');
  assert.equal(o.status, 'new');
  assert.equal(o.order_type, 'retail');
  const { rows: items } = await db.query(
    'select product_id, product_name, price, quantity from public.order_items where order_id = $1 order by product_id',
    [r.id]
  );
  assert.equal(items.length, 2, 'takroriy mahsulot birlashtirilishi kerak');
  assert.equal(Number(items[0].price), 6000);
  assert.equal(items[0].quantity, 3);
  assert.equal(items[0].product_name, 'Truba d20');
});

await test('anon orders va order_items SELECT — bo\'sh natija', async () => {
  const total = await countOrders();
  assert.ok(total > 0, 'bazada buyurtma bo\'lishi kerak');
  const o = await asRole(db, ANON, (tx) => tx.query('select * from public.orders'));
  const i = await asRole(db, ANON, (tx) => tx.query('select * from public.order_items'));
  assert.equal(o.rows.length, 0);
  assert.equal(i.rows.length, 0);
  const upd = await asRole(db, ANON, (tx) => tx.query(`update public.orders set status = 'cancelled' returning id`).catch((e) => e));
  assert.equal(upd.code, '42501', 'anon UPDATE huquqiga ega bo\'lmasligi kerak');
  const del = await asRole(db, ANON, (tx) => tx.query('delete from public.orders returning id').catch((e) => e));
  assert.equal(del.code, '42501', 'anon DELETE huquqiga ega bo\'lmasligi kerak');
});

await test('admin bo\'lmagan authenticated buyurtmalarni ko\'rmaydi (bo\'sh natija)', async () => {
  const o = await asRole(db, USER, (tx) => tx.query('select * from public.orders'));
  const i = await asRole(db, USER, (tx) => tx.query('select * from public.order_items'));
  assert.equal(o.rows.length, 0);
  assert.equal(i.rows.length, 0);
  const upd = await asRole(db, USER, (tx) => tx.query(`update public.orders set status = 'cancelled' returning id`));
  assert.equal(upd.rows.length, 0);
});

await test('anon admin_users va is_admin()\'ga kira olmaydi', async () => {
  await expectError(asRole(db, ANON, (tx) => tx.query('select * from public.admin_users')), { code: '42501' });
  await expectError(asRole(db, ANON, (tx) => tx.query('select public.is_admin()')), { code: '42501' });
  const u = await asRole(db, USER, (tx) => tx.query('select public.is_admin() as a'));
  assert.equal(u.rows[0].a, false);
  const a = await asRole(db, ADMIN, (tx) => tx.query('select public.is_admin() as a'));
  assert.equal(a.rows[0].a, true);
});

await test('admin buyurtmalarni ko\'radi va statusni o\'zgartiradi', async () => {
  const o = await asRole(db, ADMIN, (tx) => tx.query('select id from public.orders'));
  assert.ok(o.rows.length >= 1);
  const upd = await asRole(db, ADMIN, (tx) =>
    tx.query(`update public.orders set status = 'confirmed' where id = $1 returning status`, [o.rows[0].id])
  );
  assert.equal(upd.rows[0].status, 'confirmed');
  await expectError(
    asRole(db, ADMIN, (tx) => tx.query(`update public.orders set status = 'noma''lum' where id = $1`, [o.rows[0].id])),
    { code: '23514' }
  );
});

console.log('\nplace_order validatsiyasi');

await test('bo\'sh savat rad etiladi', async () => {
  await expectError(placeOrder(ANON, { items: [] }), { hint: 'items' });
});

await test('ism bo\'sh bo\'lsa rad etiladi', async () => {
  await expectError(placeOrder(ANON, { name: '   ', items: [{ product_id: P['ng-1'], quantity: 1 }] }), {
    hint: 'customer_name',
  });
});

await test('noto\'g\'ri telefon rad etiladi', async () => {
  for (const phone of ['12345', '+99890123456', '+7 900 123 45 67', '+9989012345678', '']) {
    await expectError(placeOrder(ANON, { phone, items: [{ product_id: P['ng-1'], quantity: 1 }] }), { hint: 'phone' });
  }
});

await test('9 raqamli telefon +998 bilan to\'ldiriladi', async () => {
  const r = await placeOrder(ANON, { phone: '90 123 45 67', items: [{ product_id: P['ng-2'], quantity: 1 }] });
  const { rows: [o] } = await db.query('select phone from public.orders where id = $1', [r.id]);
  assert.equal(o.phone, '+998901234567');
});

await test('noto\'g\'ri miqdor rad etiladi', async () => {
  for (const quantity of [0, -1, 1.5, '1; drop table', 100001]) {
    await expectError(placeOrder(ANON, { items: [{ product_id: P['ng-1'], quantity }] }), { hint: 'items' });
  }
  await expectError(placeOrder(ANON, { items: [{ product_id: 'abc', quantity: 1 }] }), { hint: 'items' });
});

await test('mavjud bo\'lmagan / tugagan mahsulot — hech narsa yozilmaydi (tranzaksiya)', async () => {
  const before = await countOrders();
  const beforeItems = Number((await db.query('select count(*) as c from public.order_items')).rows[0].c);
  await expectError(
    placeOrder(ANON, { items: [{ product_id: P['ng-1'], quantity: 1 }, { product_id: P['ng-3'], quantity: 1 }] }),
    { hint: 'out_of_stock', match: /Tugagan mahsulot/ }
  );
  await expectError(placeOrder(ANON, { items: [{ product_id: 999999, quantity: 1 }] }), { hint: 'out_of_stock' });
  assert.equal(await countOrders(), before);
  assert.equal(Number((await db.query('select count(*) as c from public.order_items')).rows[0].c), beforeItems);
});

await test('katta buyurtma: kompaniya nomi saqlanadi, ro\'yxat izohda bo\'lsa savat shart emas', async () => {
  const r = await placeOrder(ANON, {
    type: 'bulk',
    company: 'Obod Qurilish MCHJ',
    comment: 'PP-R truba d25 — 120 metr',
    items: [],
  });
  const { rows: [o] } = await db.query('select * from public.orders where id = $1', [r.id]);
  assert.equal(o.order_type, 'bulk');
  assert.equal(o.company_name, 'Obod Qurilish MCHJ');
  assert.equal(Number(o.total_amount), 0);
  await expectError(placeOrder(ANON, { type: 'bulk', items: [] }), { hint: 'items' });
});

await test('retail buyurtmada company_name e\'tiborga olinmaydi', async () => {
  const r = await placeOrder(ANON, { company: 'X', items: [{ product_id: P['ng-1'], quantity: 1 }] });
  const { rows: [o] } = await db.query('select company_name from public.orders where id = $1', [r.id]);
  assert.equal(o.company_name, null);
});

await test('noto\'g\'ri order_type rad etiladi', async () => {
  await expectError(placeOrder(ANON, { type: 'vip', items: [{ product_id: P['ng-1'], quantity: 1 }] }), {
    hint: 'order_type',
  });
});

await test('mahsulot o\'chirilsa buyurtma tarixi saqlanadi', async () => {
  const r = await placeOrder(ANON, { items: [{ product_id: P['ng-2'], quantity: 4 }] });
  await asRole(db, ADMIN, (tx) => tx.query('delete from public.products where id = $1', [P['ng-2']]));
  const { rows: [item] } = await db.query('select product_id, product_name, price from public.order_items where order_id = $1', [r.id]);
  assert.equal(item.product_id, null);
  assert.equal(item.product_name, 'Mufta d25');
  assert.equal(Number(item.price), 2500);
});

await db.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} test o'tdi`);
if (failed.length) process.exit(1);
