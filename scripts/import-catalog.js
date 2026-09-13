// NEVO GROUP prays-listidan tuzilgan katalogni (CSV) Supabase bazasiga yozadi.
//
//   npm run import:catalog                        (scripts/seed-data/nevo-katalog.csv)
//   node scripts/import-catalog.js boshqa-fayl.csv
//   node scripts/import-catalog.js --dry-run      (faqat tekshiradi, bazaga yozmaydi)
//
// Nima qiladi:
//   1. CSV'ni o'qiydi va har qatorni tekshiradi (xato bo'lsa hech narsa yozilmaydi)
//   2. category_uz ni categories.name_uz ga bog'laydi (kategoriya bazada
//      bo'lmasa, seed-data/categories.json dan qo'shadi)
//   3. CSV'da yo'q mahsulotlarni (eski namuna mahsulotlar) O'CHIRADI.
//      Buyurtma tarixi saqlanadi: order_items.product_id NULL bo'ladi,
//      nomi va narxi nusxasi qoladi.
//   4. Qatorlarni slug bo'yicha upsert qiladi — qayta ishga tushirsa dublikat yo'q.
//
// Service role key ishlatilmaydi, anon key + admin login, RLS doirasida.
// Kerakli o'zgaruvchilar (.env yoki muhitda — muhitdagisi ustun):
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { DEFAULT_CSV, readCatalog } from './lib/catalog-csv.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BATCH_SIZE = 100;

function loadEnv() {
  try {
    process.loadEnvFile(path.join(HERE, '..', '.env'));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

function requireEnv(names) {
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length) {
    console.error(`Xato: quyidagi o'zgaruvchilar topilmadi: ${missing.join(', ')}`);
    console.error('.env.example faylidan nusxa olib, .env ni to\'ldiring.');
    process.exit(1);
  }
}

function fail(step, error) {
  console.error(`Xato (${step}): ${error.message}`);
  if (error.hint) console.error(`  Maslahat: ${error.hint}`);
  process.exit(1);
}

async function resolveCategories(supabase, names) {
  const { data: existing, error } = await supabase.from('categories').select('id, slug, name_uz');
  if (error) fail('kategoriyalarni o\'qish', error);
  const byName = new Map(existing.map((c) => [c.name_uz, c.id]));

  const missing = names.filter((n) => !byName.has(n));
  if (missing.length) {
    const known = JSON.parse(await readFile(path.join(HERE, 'seed-data', 'categories.json'), 'utf8'));
    const toInsert = missing.map((name) => {
      const cat = known.find((c) => c.name_uz === name);
      if (!cat) {
        console.error(`Xato: "${name}" kategoriyasi bazada ham, categories.json'da ham yo'q`);
        process.exit(1);
      }
      return cat;
    });
    const { data: inserted, error: insError } = await supabase
      .from('categories')
      .upsert(toInsert, { onConflict: 'slug' })
      .select('id, name_uz');
    if (insError) fail('kategoriyalarni qo\'shish', insError);
    inserted.forEach((c) => byName.set(c.name_uz, c.id));
    console.log(`✓ ${inserted.length} ta yangi kategoriya qo'shildi: ${missing.join(', ')}`);
  }
  return byName;
}

async function fetchAllProductSlugs(supabase) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('products')
      .select('id, slug')
      .order('id', { ascending: true })
      .range(from, from + 999);
    if (error) fail('mahsulotlarni o\'qish', error);
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}

async function main() {
  const args = process.argv.slice(2);
  // npm `--dry-run` ni o'zi yutib, skriptga yetkazmaydi (ayniqsa PowerShell'da
  // `--` ajratgich tushib qoladi) — shuning uchun npm_config_dry_run ham tekshiriladi.
  const dryRun = args.includes('--dry-run') || process.env.npm_config_dry_run === 'true';
  const csvPath = path.resolve(args.find((a) => !a.startsWith('--')) || DEFAULT_CSV);

  let items;
  try {
    items = await readCatalog(csvPath);
  } catch (err) {
    console.error(`Xato: ${err.message}\nBazaga hech narsa yozilmadi.`);
    process.exit(1);
  }
  const categoryNames = [...new Set(items.map((i) => i.categoryName))];
  console.log(`CSV: ${path.relative(process.cwd(), csvPath)} — ${items.length} ta mahsulot, ${categoryNames.length} ta kategoriya`);
  if (dryRun) {
    console.log('--dry-run: CSV to\'g\'ri, bazaga yozilmadi.');
    return;
  }

  loadEnv();
  requireEnv(['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'SEED_ADMIN_EMAIL', 'SEED_ADMIN_PASSWORD']);
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`Supabase: ${process.env.VITE_SUPABASE_URL}`);
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: process.env.SEED_ADMIN_EMAIL,
    password: process.env.SEED_ADMIN_PASSWORD,
  });
  if (loginError) fail('admin sifatida kirish', loginError);
  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
  if (adminError) fail('admin huquqini tekshirish', adminError);
  if (!isAdmin) {
    console.error('Xato: bu foydalanuvchi admin_users jadvalida yo\'q.');
    process.exit(1);
  }

  const categoryIds = await resolveCategories(supabase, categoryNames);
  const rows = items.map(({ categoryName, row }) => ({ ...row, category_id: categoryIds.get(categoryName) }));

  // Eski (CSV'da yo'q) mahsulotlarni tozalash — upsert'dan OLDIN, aks holda
  // eski mahsulotning sku'si yangisiniki bilan to'qnashishi mumkin.
  const csvSlugs = new Set(rows.map((r) => r.slug));
  const before = await fetchAllProductSlugs(supabase);
  const staleIds = before.filter((p) => !csvSlugs.has(p.slug)).map((p) => p.id);
  for (let i = 0; i < staleIds.length; i += BATCH_SIZE) {
    const { error } = await supabase.from('products').delete().in('id', staleIds.slice(i, i + BATCH_SIZE));
    if (error) fail('eski mahsulotlarni o\'chirish', error);
  }
  console.log(`✓ ${staleIds.length} ta eski mahsulot o'chirildi (bazada ${before.length} ta edi)`);

  const existingSlugs = new Set(before.map((p) => p.slug));
  let written = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('products').upsert(batch, { onConflict: 'slug' });
    if (error) fail(`mahsulotlarni yozish (${i + 1}–${i + batch.length})`, error);
    written += batch.length;
    process.stdout.write(`\r✓ ${written}/${rows.length} ta mahsulot yozildi`);
  }
  process.stdout.write('\n');

  const updated = rows.filter((r) => existingSlugs.has(r.slug)).length;
  const { count, error: countError } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true });
  if (countError) fail('yakuniy sanash', countError);

  await supabase.auth.signOut();
  console.log(`Yakunlandi: ${rows.length - updated} ta yangi, ${updated} ta yangilangan. Bazada jami ${count} ta mahsulot.`);
  if (count !== rows.length) {
    console.error(`Ogohlantirish: bazadagi soni (${count}) CSV'dagi (${rows.length}) bilan mos emas!`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
