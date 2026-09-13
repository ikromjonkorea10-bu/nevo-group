// Eski (qo'lda yozilgan) katalog ma'lumotlarini Supabase bazasiga ko'chiradi.
// Bir marta ishga tushiriladi: npm run seed
//
// Service role key ISHLATILMAYDI. Skript anon key bilan admin
// foydalanuvchi sifatida kiradi va RLS qoidalari doirasida yozadi.
//
// Kerakli o'zgaruvchilar (.env faylida yoki muhitda):
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
//   SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
//
// Bayroqlar:
//   --force   bazada mahsulotlar bo'lsa ham qayta yozadi (slug bo'yicha
//             yangilaydi, yangi qo'shilmagan mahsulotlarni o'chirmaydi)

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

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

async function readJson(name) {
  return JSON.parse(await readFile(path.join(HERE, 'seed-data', name), 'utf8'));
}

function fail(step, error) {
  console.error(`Xato (${step}): ${error.message}`);
  if (error.hint) console.error(`  Maslahat: ${error.hint}`);
  process.exit(1);
}

async function main() {
  loadEnv();
  requireEnv(['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'SEED_ADMIN_EMAIL', 'SEED_ADMIN_PASSWORD']);
  const force = process.argv.includes('--force');

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
    console.error('Xato: bu foydalanuvchi admin_users jadvalida yo\'q. README\'dagi "Admin foydalanuvchi qo\'shish" bo\'limiga qarang.');
    process.exit(1);
  }

  const { count, error: countError } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true });
  if (countError) fail('mahsulotlarni sanash', countError);
  if (count > 0 && !force) {
    console.log(`Bazada allaqachon ${count} ta mahsulot bor — seed o'tkazib yuborildi.`);
    console.log('Qayta yozish kerak bo\'lsa: npm run seed -- --force');
    await supabase.auth.signOut();
    return;
  }

  const categories = await readJson('categories.json');
  const products = await readJson('products.json');

  const { data: savedCategories, error: catError } = await supabase
    .from('categories')
    .upsert(categories, { onConflict: 'slug' })
    .select('id, slug');
  if (catError) fail('kategoriyalarni yozish', catError);

  const categoryIds = new Map(savedCategories.map((c) => [c.slug, c.id]));
  console.log(`✓ ${savedCategories.length} ta kategoriya`);

  const rows = products.map(({ category_slug, ...p }) => {
    const categoryId = categoryIds.get(category_slug);
    if (!categoryId) {
      console.error(`Xato: "${p.slug}" mahsuloti uchun "${category_slug}" kategoriyasi topilmadi`);
      process.exit(1);
    }
    return { ...p, category_id: categoryId };
  });

  let written = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('products').upsert(batch, { onConflict: 'slug' });
    if (error) fail(`mahsulotlarni yozish (${i + 1}–${i + batch.length})`, error);
    written += batch.length;
    process.stdout.write(`\r✓ ${written}/${rows.length} ta mahsulot`);
  }
  process.stdout.write('\n');

  await supabase.auth.signOut();
  console.log('Seed muvaffaqiyatli yakunlandi.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
