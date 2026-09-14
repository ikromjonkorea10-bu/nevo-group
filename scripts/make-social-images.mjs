// Ulashish (Open Graph) rasmlari va favicon'larni yasaydi.
//
//   node scripts/make-social-images.mjs
//
// Natija (public/ ichida, git'ga qo'shiladi):
//   og-image.jpg                  1200×630 — sayt uchun umumiy ulashish rasmi
//   images/og/<rasm>.jpg          1200×630 — har bir mahsulot surati uchun ulashish kartasi
//                                 (images/products/<rasm>.webp dan; mavjudlari qayta yasalmaydi,
//                                 --force bilan hammasi qayta yasaladi)
//   favicon.ico, favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png
//
// Yangi mahsulot rasmlari qo'shilganda optimize-images.mjs dan keyin ishga tushiring.

import sharp from 'sharp';
import { readdir, stat, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const LOGO = path.join(PUBLIC, 'brand', 'nevo-logo.png');
const PRODUCTS_DIR = path.join(PUBLIC, 'images', 'products');
const OG_DIR = path.join(PUBLIC, 'images', 'og');
const W = 1200;
const H = 630;
const FONT = "'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif";
const force = process.argv.includes('--force');

const exists = (file) => stat(file).then(() => true, () => false);
const kb = async (file) => `${((await stat(file)).size / 1024).toFixed(1)} KB`;

const background = `
  <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#0f1e3e"/>
        <stop offset="1" stop-color="#1d4ed8"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.85" cy="0.1" r="0.6">
        <stop offset="0" stop-color="#60a5fa" stop-opacity="0.35"/>
        <stop offset="1" stop-color="#60a5fa" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
  </svg>`;

/** Chap tomondagi brend bloki: logo, nom, shior */
function brandText({ subtitle, footer, top = 250 }) {
  return `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <text x="72" y="${top}" font-family="${FONT}" font-size="64" font-weight="800" fill="#ffffff" letter-spacing="-1">NEVO GROUP</text>
      <text x="72" y="${top + 62}" font-family="${FONT}" font-size="34" font-weight="600" fill="#dbeafe">Santexnika va qurilish</text>
      <text x="72" y="${top + 106}" font-family="${FONT}" font-size="34" font-weight="600" fill="#dbeafe">mahsulotlari</text>
      ${subtitle ? `<text x="72" y="${top + 170}" font-family="${FONT}" font-size="24" font-weight="500" fill="#93c5fd">${subtitle}</text>` : ''}
      ${footer ? `<text x="72" y="${H - 56}" font-family="${FONT}" font-size="22" font-weight="600" fill="#bfdbfe">${footer}</text>` : ''}
    </svg>`;
}

/** Oq, burchagi yumaloq kartaga joylangan mahsulot surati */
async function productTile(file, size) {
  const pad = Math.round(size * 0.08);
  const radius = Math.round(size * 0.08);
  const img = await sharp(file).resize(size - pad * 2, size - pad * 2, { fit: 'contain', background: '#ffffff' }).toBuffer();
  const card = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" rx="${radius}" fill="#ffffff"/></svg>`
  );
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" rx="${radius}" fill="#fff"/></svg>`
  );
  return sharp(card)
    .composite([{ input: img, top: pad, left: pad }, { input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

const logo = (size) => sharp(LOGO).resize(size, size).png().toBuffer();

async function makeSiteImage() {
  const pick = ['nevo-ppr-truba-pn16', 'nevo-zadvizhka-chugunnaya', 'china-pe-troynik', 'ktp-ktps'];
  const tile = 236;
  const gap = 22;
  const gridLeft = W - 72 - tile * 2 - gap;
  const gridTop = Math.round((H - tile * 2 - gap) / 2);
  const tiles = await Promise.all(pick.map((name) => productTile(path.join(PRODUCTS_DIR, `${name}.webp`), tile)));

  const out = path.join(PUBLIC, 'og-image.jpg');
  await sharp(Buffer.from(background))
    .composite([
      { input: await logo(120), top: 72, left: 72 },
      { input: Buffer.from(brandText({ subtitle: 'Truba · Fiting · Zapor armatura · Elektr', footer: "Narxlar so'mda · O'zbekiston bo'ylab yetkazib berish" })) },
      ...tiles.map((input, i) => ({ input, left: gridLeft + (i % 2) * (tile + gap), top: gridTop + Math.floor(i / 2) * (tile + gap) })),
    ])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(out);
  console.log(`✓ og-image.jpg (${await kb(out)})`);
}

async function makeProductCards() {
  await mkdir(OG_DIR, { recursive: true });
  const sources = (await readdir(PRODUCTS_DIR)).filter((f) => f.endsWith('.webp'));
  const tile = 470;
  let made = 0;
  for (const name of sources) {
    const out = path.join(OG_DIR, name.replace(/\.webp$/, '.jpg'));
    if (!force && (await exists(out))) continue;
    await sharp(Buffer.from(background))
      .composite([
        { input: await logo(110), top: 80, left: 72 },
        { input: Buffer.from(brandText({ top: 262, footer: "Narxlar so'mda · Buyurtma bering" })) },
        { input: await productTile(path.join(PRODUCTS_DIR, name), tile), left: W - 80 - tile, top: Math.round((H - tile) / 2) },
      ])
      .jpeg({ quality: 84, mozjpeg: true })
      .toFile(out);
    made += 1;
  }
  console.log(`✓ images/og: ${made} ta yangi karta (${sources.length} ta mahsulot surati)`);
}

/** PNG'ni ICO konteyneriga o'raydi (zamonaviy brauzerlar PNG-ICO'ni qo'llaydi) */
function pngToIco(pngs) {
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, data }, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt8(0, e + 2);
    header.writeUInt8(0, e + 3);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(data.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...pngs.map((p) => p.data)]);
}

async function makeFavicons() {
  const png = (size, opts = {}) => sharp(LOGO).resize(size, size, opts).png({ compressionLevel: 9 }).toBuffer();
  const icoParts = await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(size) })));
  await writeFile(path.join(PUBLIC, 'favicon.ico'), pngToIco(icoParts));
  await writeFile(path.join(PUBLIC, 'favicon-32.png'), await png(32));
  await writeFile(path.join(PUBLIC, 'icon-192.png'), await png(192));
  await writeFile(path.join(PUBLIC, 'icon-512.png'), await png(512));
  // iOS shaffof fonni qora qiladi — oq fon ustiga
  await sharp({ create: { width: 180, height: 180, channels: 3, background: '#ffffff' } })
    .composite([{ input: await png(164), top: 8, left: 8 }])
    .png()
    .toFile(path.join(PUBLIC, 'apple-touch-icon.png'));
  console.log(`✓ favicon.ico (${await kb(path.join(PUBLIC, 'favicon.ico'))}), favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png`);
}

await makeSiteImage();
await makeProductCards();
await makeFavicons();
