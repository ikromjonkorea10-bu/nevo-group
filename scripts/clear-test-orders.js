// Test buyurtmalarni o'chiradigan bir martalik skript (saytni ishga tushirishdan oldin).
//
//   node scripts/clear-test-orders.js --ids 1,2          ko'rsatadi, hech narsa o'chirmaydi
//   node scripts/clear-test-orders.js --ids 1,2 --yes    o'chiradi
//
// - Faqat --ids da aniq ko'rsatilgan buyurtmalar o'chiriladi (order_items — cascade).
// - O'chirilgandan keyin orders jadvali BO'SH qolsa, buyurtma raqami (id) 1 dan qayta
//   boshlanadi (NG-000001). Boshqa buyurtmalar qolsa, raqamlash davom etadi —
//   haqiqiy buyurtma raqamlari takrorlanmasin.
// - O'chirish va raqamni qayta boshlash bitta atomar SQL buyrug'ida.
//
// Supabase CLI orqali bog'langan (supabase link) loyihaga ulanadi: sequence'ni qayta
// boshlash SQL talab qiladi, uni anon kalit / RLS orqali qilib bo'lmaydi.

import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const idsArg = args[args.indexOf('--ids') + 1];
const confirmed = args.includes('--yes');

if (!args.includes('--ids') || !idsArg || !/^\d+(,\d+)*$/.test(idsArg)) {
  console.error('Foydalanish: node scripts/clear-test-orders.js --ids 1,2 [--yes]');
  process.exit(1);
}
const ids = [...new Set(idsArg.split(',').map(Number))];
const idList = ids.join(',');

function query(sql) {
  // SQL stdin orqali beriladi — argument sifatida Windows shell'ida ko'p qatorli matn buziladi
  const out = execFileSync('npx', ['supabase', 'db', 'query', '--linked'], {
    input: sql,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const parsed = JSON.parse(out.slice(out.indexOf('{')));
  if (parsed.error) throw new Error(`SQL xatosi: ${parsed.error.message || JSON.stringify(parsed.error)}`);
  return parsed.rows ?? [];
}

const fmt = (id) => `NG-${String(id).padStart(6, '0')}`;
const nextIdSql = `
  select case when s.is_called then s.last_value + 1 else s.last_value end as next_id
  from public.orders_id_seq s`;

const orders = query(`
  select o.id, o.customer_name, o.phone, o.total_amount, o.status, o.created_at,
         (select count(*) from public.order_items i where i.order_id = o.id)::int as items
  from public.orders o
  order by o.id`);

const targets = orders.filter((o) => ids.includes(Number(o.id)));
const missing = ids.filter((id) => !orders.some((o) => Number(o.id) === id));
const remaining = orders.length - targets.length;

console.log(`Bazada ${orders.length} ta buyurtma. O'chiriladi: ${targets.length} ta`);
for (const o of targets) {
  console.log(`  ${fmt(o.id)}  ${o.created_at}  ${o.customer_name}  ${o.phone}  ${o.total_amount} so'm  ${o.items} pozitsiya  [${o.status}]`);
}
if (missing.length) console.log(`  Topilmadi (o'tkazib yuboriladi): ${missing.map(fmt).join(', ')}`);
console.log(
  remaining === 0
    ? "O'chirilgach jadval bo'sh qoladi — buyurtma raqami NG-000001 dan qayta boshlanadi."
    : `O'chirilgach ${remaining} ta buyurtma qoladi — raqamlash qayta boshlanMAYDI.`
);

if (!targets.length) process.exit(0);
if (!confirmed) {
  console.log('\nHech narsa o\'chirilmadi. Tasdiqlash uchun --yes qo\'shing.');
  process.exit(0);
}

// DO blok — bitta buyruq, ya'ni atomar: yo o'chirish ham, raqamni qayta boshlash ham, yo hech biri
const result = query(`
  do $$
  begin
    delete from public.orders where id in (${idList});
    if not exists (select 1 from public.orders) then
      perform setval(pg_get_serial_sequence('public.orders', 'id'), 1, false);
      perform setval(pg_get_serial_sequence('public.order_items', 'id'), 1, false);
    end if;
  end $$;
  select (select count(*) from public.orders)::int as orders_left,
         (select count(*) from public.order_items where order_id in (${idList}))::int as items_left,
         (${nextIdSql}) as next_id;`);

const { orders_left: left, items_left: itemsLeft, next_id: nextId } = result[0] ?? {};
console.log(`\n✓ O'chirildi. Qolgan buyurtmalar: ${left}, o'chirilganlarning qatorlari: ${itemsLeft}`);
console.log(`  Keyingi buyurtma raqami: ${fmt(nextId)}`);
