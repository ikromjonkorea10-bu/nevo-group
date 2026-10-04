// Admin paneldan mahsulot rasmini yuklash.
// Rasm Supabase Storage'ga ketishidan oldin brauzerda siqiladi: EXIF burilishi
// to'g'rilanadi, eng uzun tomoni MAX_SIDE dan oshmaydi, WebP (Safari WebP yozolmasa
// JPEG) ~TARGET_BYTES gacha. Canvas'ga qayta chizish barcha EXIF ma'lumotlarini
// (GPS, kamera modeli, sana) olib tashlaydi.

export const IMAGE_BUCKET = 'product-images';

const MAX_SIDE = 1200;
const MIN_SIDE = 600;
const TARGET_BYTES = 200 * 1024;
const MAX_INPUT_BYTES = 30 * 1024 * 1024;
const QUALITIES = [0.85, 0.78, 0.7, 0.62, 0.55];

const HEIC_RE = /\.(heic|heif)$/i;

export class ImageError extends Error {}

function isHeic(file) {
  return /image\/hei[cf]/i.test(file.type) || HEIC_RE.test(file.name || '');
}

async function decode(file) {
  // createImageBitmap EXIF burilishini o'zi qo'llaydi (imageOrientation: 'from-image').
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // pastdagi <img> usuliga o'tamiz
    }
  }
  const url = URL.createObjectURL(file);
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

function encode(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function draw(source, side) {
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

/**
 * Faylni siqadi. Natija: { blob, type, ext, width, height }.
 * Tushunarli xato bo'lsa ImageError tashlaydi.
 */
export async function compressImage(file) {
  if (!file) throw new ImageError('Fayl tanlanmadi');
  if (!/^image\//.test(file.type) && !isHeic(file)) {
    throw new ImageError('Bu rasm fayli emas. JPEG, PNG, WebP yoki HEIC rasm tanlang.');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageError('Rasm juda katta (30 MB dan ortiq). Kichikroq rasm tanlang.');
  }

  let source;
  try {
    source = await decode(file);
  } catch {
    if (isHeic(file)) {
      throw new ImageError(
        "Bu brauzer HEIC (iPhone) rasmini o'qiy olmadi. Rasmni iPhone'dagi Safari orqali yuklang " +
          "yoki iPhone'da: Sozlamalar → Kamera → Formatlar → «Eng mos» (Most Compatible) ni tanlab, qayta suratga oling."
      );
    }
    throw new ImageError("Rasmni o'qib bo'lmadi — fayl buzilgan bo'lishi mumkin. Boshqa rasm tanlang.");
  }

  try {
    let side = MAX_SIDE;
    let best = null;
    for (;;) {
      const canvas = draw(source, side);
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
  } finally {
    source.close?.();
  }
}

/**
 * Siqilgan rasmni Storage'ga yuklaydi va ochiq URL qaytaradi.
 */
export async function uploadProductImage(supabase, file, baseName) {
  const img = await compressImage(file);
  const safe =
    (baseName || 'mahsulot')
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'mahsulot';
  const path = `products/${safe}-${Date.now().toString(36)}.${img.ext}`;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, img.blob, {
    contentType: img.type,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, ...img };
}
