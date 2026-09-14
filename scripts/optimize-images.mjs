// public/images/products/ dagi PNG/JPG rasmlarni WebP'ga o'giradi va asl fayllarni o'chiradi.
//
//   node scripts/optimize-images.mjs            (sifat 85)
//   node scripts/optimize-images.mjs --quality 80
//
// Maqsad — har fayl 60 KB dan kichik; oshganlari ro'yxatda ko'rsatiladi.

import sharp from 'sharp';
import { readdir, stat, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images', 'products');
const LIMIT_KB = 60;
const args = process.argv.slice(2);
const qIndex = args.indexOf('--quality');
const QUALITY = qIndex >= 0 ? Number(args[qIndex + 1]) : 85;

const sources = (await readdir(DIR)).filter((f) => /\.(png|jpe?g)$/i.test(f));
if (!sources.length) {
  console.log(`O'giriladigan PNG/JPG yo'q: ${path.relative(process.cwd(), DIR)}`);
}

for (const name of sources) {
  const src = path.join(DIR, name);
  const dest = path.join(DIR, name.replace(/\.(png|jpe?g)$/i, '.webp'));
  const before = (await stat(src)).size;
  await sharp(src).webp({ quality: QUALITY }).toFile(dest);
  await unlink(src);
  const after = (await stat(dest)).size;
  console.log(`${name} → ${path.basename(dest)}  ${(before / 1024).toFixed(1)} KB → ${(after / 1024).toFixed(1)} KB`);
}

const webps = (await readdir(DIR)).filter((f) => f.endsWith('.webp'));
const sizes = await Promise.all(webps.map(async (f) => ({ f, size: (await stat(path.join(DIR, f))).size })));
const total = sizes.reduce((s, x) => s + x.size, 0);
const over = sizes.filter((x) => x.size >= LIMIT_KB * 1024);
console.log(`\nJami: ${webps.length} ta WebP, ${(total / 1024).toFixed(1)} KB, eng kattasi ${(Math.max(...sizes.map((x) => x.size)) / 1024).toFixed(1)} KB`);
if (over.length) {
  console.log(`${LIMIT_KB} KB dan katta: ${over.map((x) => `${x.f} (${(x.size / 1024).toFixed(1)} KB)`).join(', ')}`);
  process.exitCode = 1;
}
