// Admin paneldan mahsulot rasmini yuklash: o'qish, siqish, Storage'ga yuklash.
// Rasm brauzerda siqiladi: EXIF burilishi to'g'rilanadi, eng uzun tomoni MAX_SIDE
// dan oshmaydi, WebP (Safari WebP yoza olmasa JPEG) ~TARGET_BYTES gacha. Canvas'ga
// qayta chizish barcha EXIF ma'lumotlarini (GPS, kamera modeli, sana) olib tashlaydi.
// Fonni olib tashlash va "do'kon rasmi" ishlovi — productPhoto.js (alohida yuklanadi).

export const IMAGE_BUCKET = 'product-images';

const MAX_SIDE = 1200;
const MIN_SIDE = 600;
const TARGET_BYTES = 200 * 1024;
const MAX_INPUT_BYTES = 30 * 1024 * 1024;
const QUALITIES = [0.85, 0.78, 0.7, 0.62, 0.55];
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

const HEIC_RE = /\.(heic|heif)$/i;

export class ImageError extends Error {}

function isHeic(file) {
  return /image\/hei[cf]/i.test(file.type) || HEIC_RE.test(file.name || '');
}

async function decodeBlob(blob) {
  // createImageBitmap EXIF burilishini o'zi qo'llaydi (imageOrientation: 'from-image').
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(blob, { imageOrientation: 'from-image' });
    } catch {
      // pastdagi <img> usuliga o'tamiz
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// iPhone HEIC rasmini brauzer o'zi o'qiy olmasa (Chrome, Android), heic2any bilan
// JPEG'ga o'giramiz. Kutubxona (~1.3 MB) faqat shu holatda yuklanadi.
async function heicToJpeg(file) {
  const { default: heic2any } = await import('heic2any');
  const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
  return Array.isArray(out) ? out[0] : out;
}

/**
 * Faylni o'qiydi va to'g'ri burilgan rasm qaytaradi (ImageBitmap yoki <img>).
 * Tushunarli xato bo'lsa ImageError tashlaydi.
 */
export async function loadImage(file, { onStatus } = {}) {
  if (!file) throw new ImageError('Fayl tanlanmadi');
  if (!/^image\//.test(file.type) && !isHeic(file)) {
    throw new ImageError('Bu rasm fayli emas. JPEG, PNG, WebP yoki HEIC rasm tanlang.');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageError('Rasm juda katta (30 MB dan ortiq). Kichikroq rasm tanlang.');
  }
  try {
    return await decodeBlob(file);
  } catch {
    if (!isHeic(file)) {
      throw new ImageError("Rasmni o'qib bo'lmadi — fayl buzilgan bo'lishi mumkin. Boshqa rasm tanlang.");
    }
  }
  try {
    onStatus?.("iPhone (HEIC) rasmi JPEG'ga o'girilmoqda…");
    return await decodeBlob(await heicToJpeg(file));
  } catch {
    throw new ImageError("HEIC rasmni o'qib bo'lmadi. Rasmni JPEG qilib yoki boshqa rasm bilan qayta urinib ko'ring.");
  }
}

/** Rasmni eng uzun tomoni `side` bo'lgan oq fonli canvas'ga chizadi (kattalashtirmaydi). */
export function drawToCanvas(source, side = MAX_SIDE) {
  const w0 = source.width;
  const h0 = source.height;
  const scale = Math.min(1, side / Math.max(w0, h0));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w0 * scale));
  canvas.height = Math.max(1, Math.round(h0 * scale));
  const ctx = canvas.getContext('2d');
  // Shaffof PNG qora fon bo'lib qolmasin
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function encode(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Canvas/rasmni WebP (yoki JPEG) qilib ~TARGET_BYTES gacha siqadi.
 * Natija: { blob, type, ext, width, height }.
 */
export async function encodeImage(source) {
  let side = MAX_SIDE;
  let best = null;
  for (;;) {
    const canvas = drawToCanvas(source, side);
    for (const q of QUALITIES) {
      let blob = await encode(canvas, 'image/webp', q);
      // Safari canvas'dan WebP yoza olmaydi — PNG qaytaradi. Unda JPEG ishlatamiz.
      if (!blob || blob.type !== 'image/webp') blob = await encode(canvas, 'image/jpeg', q);
      if (!blob) throw new ImageError("Rasmni siqib bo'lmadi. Boshqa brauzerda urinib ko'ring.");
      best = {
        blob,
        type: blob.type,
        ext: blob.type === 'image/webp' ? 'webp' : 'jpg',
        width: canvas.width,
        height: canvas.height,
      };
      if (blob.size <= TARGET_BYTES) return best;
    }
    if (side <= MIN_SIDE) return best;
    side = Math.max(MIN_SIDE, Math.round(side * 0.8));
  }
}

/** Faylni o'qib, ishlovsiz siqadi ("Asl rasm" yo'li). */
export async function compressImage(file) {
  const source = await loadImage(file);
  try {
    return await encodeImage(source);
  } finally {
    source.close?.();
  }
}

// Telegram/WhatsApp ulashish kartochkasi: 1200x630 oq fonda mahsulot rasmi (JPEG —
// WebP'ni hamma messenjer ham ko'rsatmaydi). api/share.js shu nom bilan topadi.
async function makeOgCard(source) {
  const canvas = document.createElement('canvas');
  canvas.width = OG_WIDTH;
  canvas.height = OG_HEIGHT;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);
  const box = OG_HEIGHT * 0.92;
  const scale = Math.min(box / source.width, box / source.height);
  const w = source.width * scale;
  const h = source.height * scale;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, (OG_WIDTH - w) / 2, (OG_HEIGHT - h) / 2, w, h);
  return encode(canvas, 'image/jpeg', 0.85);
}

function safeName(baseName) {
  return (
    (baseName || 'mahsulot')
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'mahsulot'
  );
}

/**
 * Tayyor rasmni (canvas yoki ImageBitmap) siqib Storage'ga yuklaydi, yoniga
 * ulashish kartochkasini (og/<nom>.jpg) qo'yadi va ochiq URL qaytaradi.
 */
export async function uploadProductImage(supabase, source, baseName) {
  const img = await encodeImage(source);
  const name = `${safeName(baseName)}-${Date.now().toString(36)}`;
  const path = `products/${name}.${img.ext}`;
  const bucket = supabase.storage.from(IMAGE_BUCKET);
  const { error } = await bucket.upload(path, img.blob, {
    contentType: img.type,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw error;

  // Ulashish kartochkasi bo'lmasa ham rasm ishlaydi (share.js umumiy kartochkaga qaytadi)
  const og = await makeOgCard(source);
  if (og) {
    await bucket.upload(`og/${name}.jpg`, og, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false });
  }

  const { data } = bucket.getPublicUrl(path);
  return { url: data.publicUrl, ...img };
}
