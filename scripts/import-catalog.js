// NEVO GROUP prays-listidan tuzilgan katalogni (CSV) Supabase bazasiga yozadi.
//
//   npm run import:catalog                        (scripts/seed-data/nevo-katalog.csv)
//   node scripts/import-catalog.js boshqa-fayl.csv
//   node scripts/import-catalog.js --dry-run      (faqat tekshiradi, bazaga yozmaydi)
//   node scripts/import-catalog.js --images       (faqat rasmlar: seed-data/rasm-biriktirish.csv)
//
// Nima qiladi:
//   1. CSV'ni o'qiydi va har qatorni tekshiradi (xato bo'lsa hech narsa yozilmaydi)
//   2. category_uz ni categories.name_uz ga bog'laydi (kategoriya bazada
//      bo'lmasa, seed-data/categories.json dan qo'shadi)
//   3. CSV'da yo'q mahsulotlarni (eski namuna mahsulotlar) O'CHIRADI.
//      Buyurtma tarixi saqlanadi: order_items.product_id NULL bo'ladi,
//      nomi va narxi nusxasi qoladi.
//   4. Qatorlarni slug bo'yicha upsert qiladi — qayta ishga tushirsa dublikat yo'q.
//      image_url rasm-biriktirish.csv dan olinadi (jadvalda yo'q mahsulotda — NULL).
//      featured faqat yangi mahsulotga yoziladi — mavjudlarida admin panelda belgilangani saqlanadi.
//
// --images rejimi katalogni qayta import qilmaydi: bazadagi mavjud mahsulotlarning
// faqat image_url ustunini rasm-biriktirish.csv bo'yicha yangilaydi (o'zgarganlarini).
//
// Service role key ishlatilmaydi, anon key + admin login, RLS doirasida.
// Kerakli o'zgaruvchilar (.env yoki muhitda — muhitdagisi ustun):
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { DEFAULT_CSV, readCatalog, readImageMap } from './lib/catalog-csv.mjs';

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
      .select('id, slug, image_url')
      .order('id', { ascending: true })
      .range(from, from + 999);
    if (error) fail('mahsulotlarni o\'qish', error);
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}

async function connect() {
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
  return supabase;
}

/** Faqat image_url: bazadagi mavjud mahsulotlarga, qiymati o'zgarganlariga qo'llanadi. */
async function applyImages(supabase, imageMap) {
  const products = await fetchAllProductSlugs(supabase);
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const unknown = [...imageMap.keys()].filter((slug) => !bySlug.has(slug));

  // Bir xil rasmli mahsulotlar bitta so'rovda yangilanadi
  const byUrl = new Map();
  let unchanged = 0;
  for (const [slug, url] of imageMap) {
    const product = bySlug.get(slug);
    if (!product) continue;
    if (product.image_url === url) {
      unchanged += 1;
      continue;
    }
    if (!byUrl.has(url)) byUrl.set(url, []);
    byUrl.get(url).push(slug);
  }

  let updated = 0;
  for (const [url, slugs] of byUrl) {
    for (let i = 0; i < slugs.length; i += BATCH_SIZE) {
      const batch = slugs.slice(i, i + BATCH_SIZE);
      const { data, error } = await supabase.from('products').update({ image_url: url }).in('slug', batch).select('id');
      if (error) fail(`rasmni yozish (${url})`, error);
      updated += data.length;
    }
  }

  const withImage = products.filter((p) => (imageMap.get(p.slug) ?? p.image_url)).length;
  console.log(`✓ Rasmlar: ${updated} ta yangilandi, ${unchanged} ta o'zgarmagan (${new Set(imageMap.values()).size} xil rasm)`);
  console.log(`  Bazada ${products.length} ta mahsulotdan ${withImage} tasida rasm bor.`);
  if (unknown.length) {
    console.warn(`  Ogohlantirish: rasm CSV'idagi ${unknown.length} ta slug bazada yo'q: ${unknown.slice(0, 10).join(', ')}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  // npm `--dry-run` ni o'zi yutib, skriptga yetkazmaydi (ayniqsa PowerShell'da
  // `--` ajratgich tushib qoladi) — shuning uchun npm_config_dry_run ham tekshiriladi.
  const dryRun = args.includes('--dry-run') || process.env.npm_config_dry_run === 'true';
  const imagesOnly = args.includes('--images');
  const csvPath = path.resolve(args.find((a) => !a.startsWith('--')) || DEFAULT_CSV);

  let items = [];
  let imageMap;
  try {
    if (!imagesOnly) items = await readCatalog(csvPath);
    imageMap = await readImageMap();
  } catch (err) {
    console.error(`Xato: ${err.message}\nBazaga hech narsa yozilmadi.`);
    process.exit(1);
  }
  const categoryNames = [...new Set(items.map((i) => i.categoryName))];
  if (!imagesOnly) {
    console.log(`CSV: ${path.relative(process.cwd(), csvPath)} — ${items.length} ta mahsulot, ${categoryNames.length} ta kategoriya`);
  }
  console.log(`Rasmlar: ${imageMap.size} ta mahsulotga ${new Set(imageMap.values()).size} xil rasm (fayllar joyida)`);
  if (dryRun) {
    console.log('--dry-run: CSV to\'g\'ri, bazaga yozilmadi.');
    return;
  }

  const supabase = await connect();

  if (imagesOnly) {
    await applyImages(supabase, imageMap);
    await supabase.auth.signOut();
    return;
  }

  const categoryIds = await resolveCategories(supabase, categoryNames);
  const rows = items.map(({ categoryName, row }) => ({
    ...row,
    category_id: categoryIds.get(categoryName),
    image_url: imageMap.get(row.slug) ?? null,
  }));

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
  // "Tanlangan" (featured) admin paneldan boshqariladi: CSV'dagi qiymat faqat yangi
  // mahsulotga yoziladi, mavjudlarida ustun umuman yuborilmaydi (qo'lda belgilangani saqlanadi).
  // Guruhlar alohida yoziladi — bitta so'rovda aralashsa, yo'q ustun NULL bo'lib ketardi.
  const groups = [
    rows.filter((r) => !existingSlugs.has(r.slug)),
    rows.filter((r) => existingSlugs.has(r.slug)).map(({ featured, ...rest }) => rest),
  ];
  let written = 0;
  for (const group of groups) {
    for (let i = 0; i < group.length; i += BATCH_SIZE) {
      const batch = group.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('products').upsert(batch, { onConflict: 'slug' });
      if (error) fail(`mahsulotlarni yozish (${written + 1}–${written + batch.length})`, error);
      written += batch.length;
      process.stdout.write(`\r✓ ${written}/${rows.length} ta mahsulot yozildi`);
    }
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
