// Mahsulot rasmini avtomatik "do'kon rasmi"ga aylantirish — hammasi brauzerda, bepul.
//   1. Fonni olib tashlash: BiRefNet_lite (MIT litsenziya, tijoriy foydalanish mumkin),
//      512x512 kirishli ONNX nusxasi — asl 1024x1024 brauzerda (WASM) xotiraga sig'maydi.
//      Transformers.js + ONNX Runtime Web (WebGPU bo'lsa GPU, bo'lmasa WASM).
//   2. Oq balans, yorug'lik/kontrast (mahsulot piksellari bo'yicha).
//   3. 1200x1200 oq kanvas o'rtasida, ~8% chegara, yengil soya, ozgina sharpen.
//   4. Xiralik bahosi (Laplacian variance).
// Bu modul faqat admin panelda, rasm tanlanganda import() orqali yuklanadi —
// ochiq saytga ta'sir qilmaydi. Model (~100 MB) bir marta yuklanib, brauzer keshida qoladi.

import { drawToCanvas } from './imageUpload.js';
import ortWasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.wasm?url';
import ortMjsUrl from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.mjs?url';

// ZhengPeng7/BiRefNet_lite (MIT) og'irliklarining 512x512 ONNX eksporti
const MODEL_ID = 'studioludens/birefnet-lite-512';
// Model o'zgarib qolmasligi uchun aniq versiya (commit) mahkamlangan
const MODEL_REVISION = '4a3c40c36c94093cc1e724d9ea428b8fa4b57dc7';

const OUT_SIZE = 1200;
const MARGIN = 0.08;
const WORK_SIDE = 1600;
// Laplacian variance shu qiymatdan past bo'lsa — rasm xira (sinov rasmlarida sozlangan)
export const BLUR_THRESHOLD = 60;

let modelPromise = null;

// Model brauzerning asosiy oqimida ishlaydi va bir necha soniya sahifani band qiladi.
// Holat matni ekranga chiqib ulgurishi uchun og'ir qadamdan oldin bir kadr kutamiz.
// Yashirin tabda (telefonda boshqa ilovaga o'tilganda) kadr kelmaydi — 100 ms dan keyin davom etamiz.
const nextPaint = () =>
  new Promise((resolve) => {
    let done = false;
    const go = () => {
      if (!done) {
        done = true;
        setTimeout(resolve, 0);
      }
    };
    requestAnimationFrame(go);
    setTimeout(go, 100);
  });

// BiRefNet WebGPU'da bitta shader uchun 10 tadan ko'p storage buffer talab qiladi.
// Apple qurilmalari (Mac, iPhone, iPad) va ko'p telefonlarda chegara 10 — u yerda
// WebGPU ishga tushganidan keyin xato beradi va ORT uni qayta almashtira olmaydi.
// Shuning uchun WebGPU faqat chegara yetarli bo'lsa tanlanadi, aks holda CPU (WASM).
const MIN_STORAGE_BUFFERS = 16;

async function pickDevice() {
  try {
    const adapter = navigator.gpu && (await navigator.gpu.requestAdapter());
    if (adapter && adapter.limits.maxStorageBuffersPerShaderStage >= MIN_STORAGE_BUFFERS) return 'webgpu';
  } catch {
    // WebGPU yo'q
  }
  return 'wasm';
}

function loadModel(onStatus) {
  modelPromise ??= (async () => {
    const tf = await import('@huggingface/transformers');
    tf.env.allowLocalModels = false;
    // ONNX Runtime fayllari CDN'dan emas, saytning o'zidan. useWasmCache o'chiq:
    // aks holda .mjs blob: URL'dan import qilinadi va admin CSP (script-src 'self') uni bloklaydi.
    tf.env.useWasmCache = false;
    tf.env.backends.onnx.wasm.wasmPaths = { mjs: ortMjsUrl, wasm: ortWasmUrl };

    const device = await pickDevice();
    let lastPct = -1;
    const progress_callback = (p) => {
      if (p.status === 'progress' && /\.onnx$/.test(p.file || '') && p.total) {
        const pct = Math.floor((p.loaded / p.total) * 100);
        if (pct !== lastPct) {
          lastPct = pct;
          onStatus?.(`Fonni olib tashlash modeli yuklanmoqda: ${pct}% (faqat birinchi marta, ~100 MB)`);
        }
      }
    };
    const opts = { revision: MODEL_REVISION, progress_callback };
    const [model, processor] = await Promise.all([
      tf.AutoModel.from_pretrained(MODEL_ID, { ...opts, dtype: 'fp16', device }),
      tf.AutoProcessor.from_pretrained(MODEL_ID, opts),
    ]);
    return { tf, model, processor, device };
  })();
  modelPromise.catch(() => {
    modelPromise = null;
  });
  return modelPromise;
}

/** Fon niqobi: har bir piksel uchun 0 (fon) … 255 (mahsulot). */
async function segment(canvas, onStatus) {
  const { tf, model, processor, device } = await loadModel(onStatus);
  onStatus?.(
    device === 'webgpu'
      ? 'Fon olib tashlanmoqda…'
      : 'Fon olib tashlanmoqda… (telefonda 10–40 soniya, sahifa biroz qotib turadi)'
  );
  await nextPaint();
  const image = (await tf.RawImage.fromCanvas(canvas)).rgb();
  const { pixel_values } = await processor(image);
  const out = await model({ input_image: pixel_values });
  const logits = out.output_image ?? Object.values(out)[0];
  const mask = await tf.RawImage.fromTensor(logits[0].sigmoid().mul(255).to('uint8')).resize(
    canvas.width,
    canvas.height
  );
  return { mask: mask.data, device };
}

const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

function percentile(hist, total, p) {
  const target = total * p;
  let acc = 0;
  for (let i = 0; i < 256; i++) {
    acc += hist[i];
    if (acc >= target) return i;
  }
  return 255;
}

function maskBox(alpha, w, h, threshold = 128) {
  let x0 = w,
    y0 = h,
    x1 = -1,
    y1 = -1,
    count = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (alpha[y * w + x] >= threshold) {
        count++;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return { count, fraction: count / (w * h), x0, y0, x1, y1 };
}

/**
 * Xiralik: kulrang rasmda Laplacian variance. Natija o'lchamga bog'liq bo'lmasligi
 * uchun mahsulot qismi eng uzun tomoni 640px bo'lgan holatda hisoblanadi.
 * alpha berilsa — faqat mahsulot (va uning chegarasi) hisobga olinadi.
 */
export function blurScore(px, w, h, alpha = null, box = { x0: 0, y0: 0, x1: w - 1, y1: h - 1 }) {
  const bw = box.x1 - box.x0 + 1;
  const bh = box.y1 - box.y0 + 1;
  const s = Math.min(1, 640 / Math.max(bw, bh));
  const sw = Math.max(3, Math.round(bw * s));
  const sh = Math.max(3, Math.round(bh * s));
  const gray = new Float32Array(sw * sh);
  const inside = new Uint8Array(sw * sh);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const ox = Math.min(w - 1, box.x0 + Math.floor(x / s));
      const oy = Math.min(h - 1, box.y0 + Math.floor(y / s));
      const i = oy * w + ox;
      gray[y * sw + x] = lum(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]);
      inside[y * sw + x] = alpha ? (alpha[i] > 40 ? 1 : 0) : 1;
    }
  }
  let sum = 0,
    sum2 = 0,
    n = 0;
  for (let y = 1; y < sh - 1; y++) {
    for (let x = 1; x < sw - 1; x++) {
      const i = y * sw + x;
      if (!inside[i]) continue;
      const l = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - sw] - gray[i + sw];
      sum += l;
      sum2 += l * l;
      n++;
    }
  }
  if (!n) return 0;
  return sum2 / n - (sum / n) ** 2;
}

/**
 * Oq balans + yorug'lik/kontrast uchun LUT (har kanalga alohida jadval).
 * Oq balans neytral (kulrang/oq) fondan yoki mahsulotdagi oq yaltirashlardan olinadi;
 * fon rangli bo'lsa (sariq devor va h.k.) tegilmaydi — aks holda rang buziladi.
 */
function colorLuts(px, alpha, n) {
  // 1) Oq balans
  let bgR = 0,
    bgG = 0,
    bgB = 0,
    bgN = 0,
    bgAll = 0;
  const bgHist = new Uint32Array(256);
  for (let i = 0; i < n; i++) {
    if (alpha[i] < 20) {
      bgAll++;
      bgHist[Math.round(lum(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]))]++;
    }
  }
  const bgBright = bgAll ? percentile(bgHist, bgAll, 0.6) : 255;
  for (let i = 0; i < n; i++) {
    if (alpha[i] >= 20) continue;
    const r = px[i * 4],
      g = px[i * 4 + 1],
      b = px[i * 4 + 2];
    const mx = Math.max(r, g, b),
      mn = Math.min(r, g, b);
    if (lum(r, g, b) >= bgBright && mx > 40 && (mx - mn) / mx < 0.55) {
      bgR += r;
      bgG += g;
      bgB += b;
      bgN++;
    }
  }
  let gain = [1, 1, 1];
  if (bgN > bgAll * 0.05 && bgN > 500) {
    const m = [bgR / bgN, bgG / bgN, bgB / bgN];
    const mx = Math.max(...m),
      mn = Math.min(...m);
    // Fon taxminan neytral bo'lsa (sariq/ko'k tus — chiroq rangi), uni kulrangga keltiramiz.
    // Iliq lampa ostida ko'k kanal ~1.5 baravar kamayadi, shuning uchun chegara 0.7–1.5.
    if ((mx - mn) / mx < 0.5) {
      const gray = (m[0] + m[1] + m[2]) / 3;
      gain = m.map((c) => Math.min(1.5, Math.max(0.7, gray / c)));
    }
  }

  // 2) Mahsulot yorqinligi (oq balansdan keyin) va butun sahna yorqinligi
  const fgHist = new Uint32Array(256);
  const allHist = new Uint32Array(256);
  let fgN = 0;
  for (let i = 0; i < n; i++) {
    const l = Math.min(255, Math.round(lum(px[i * 4] * gain[0], px[i * 4 + 1] * gain[1], px[i * 4 + 2] * gain[2])));
    allHist[l]++;
    if (alpha[i] > 200) {
      fgHist[l]++;
      fgN++;
    }
  }
  const lo = percentile(fgHist, fgN, 0.005);
  const hi = percentile(fgHist, fgN, 0.995);
  const sceneMedian = percentile(allHist, n, 0.5);
  // Qora nuqtani qisman tushiramiz, yorqin nuqtani 250 ga cho'zamiz (haddan oshirmasdan)
  const black = Math.min(lo, 25) * 0.8;
  const scale = Math.min(1.7, Math.max(1, 250 / Math.max(1, hi - black)));
  // Sahna umuman qorong'i bo'lsa (kam yorug'lik) — o'rta tonlarni ko'taramiz.
  // Faqat mahsulot qora bo'lsa (qora fiting oq fonda) — tegilmaydi.
  const gamma =
    sceneMedian < 90
      ? Math.max(0.65, Math.min(1, Math.log(0.45) / Math.log(Math.max(8, sceneMedian * scale) / 255)))
      : 1;

  return gain.map((g) => {
    const lut = new Uint8ClampedArray(256);
    for (let v = 0; v < 256; v++) {
      const lin = Math.max(0, (v * g - black) * scale) / 255;
      lut[v] = Math.round(255 * Math.min(1, lin) ** gamma);
    }
    return lut;
  });
}

function sharpen(ctx, size, amount = 0.45) {
  const img = ctx.getImageData(0, 0, size, size);
  const src = img.data;
  const out = new Uint8ClampedArray(src);
  const row = size * 4;
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const i = y * row + x * 4;
      if (src[i] === 255 && src[i + 1] === 255 && src[i + 2] === 255) continue;
      for (let c = 0; c < 3; c++) {
        const k = i + c;
        const blur = (src[k - 4] + src[k + 4] + src[k - row] + src[k + row] + src[k]) / 5;
        out[k] = src[k] + amount * (src[k] - blur);
      }
    }
  }
  img.data.set(out);
  ctx.putImageData(img, 0, 0);
}

/**
 * Asosiy funksiya. Natija:
 *   { ok: true, canvas, blur, blurry }               — tayyor 1200x1200 do'kon rasmi
 *   { ok: false, reason, message, blur, blurry }     — fonni ajratib bo'lmadi
 */
export async function makeStorePhoto(source, { onStatus } = {}) {
  const work = drawToCanvas(source, WORK_SIDE);
  const w = work.width;
  const h = work.height;
  const wctx = work.getContext('2d', { willReadFrequently: true });
  const imgData = wctx.getImageData(0, 0, w, h);
  const px = imgData.data;

  let alpha;
  let device;
  try {
    ({ mask: alpha, device } = await segment(work, onStatus));
  } catch (err) {
    console.error(err);
    const blur = blurScore(px, w, h);
    return {
      ok: false,
      reason: 'model',
      message:
        "Fonni olib tashlash modelini ishga tushirib bo'lmadi (internet yoki brauzer). Asl rasmni ishlatishingiz mumkin.",
      blur,
      blurry: blur < BLUR_THRESHOLD,
    };
  }

  onStatus?.("Rang va yorug'lik to'g'rilanmoqda…");
  await nextPaint();
  const box = maskBox(alpha, w, h);
  if (box.fraction < 0.01 || box.fraction > 0.97) {
    const blur = blurScore(px, w, h);
    return {
      ok: false,
      reason: 'mask',
      message:
        "Rasmda mahsulotni aniq ajratib bo'lmadi. Asl rasmni ishlating yoki mahsulotni yaqinroqdan suratga oling.",
      blur,
      blurry: blur < BLUR_THRESHOLD,
    };
  }
  const blur = blurScore(px, w, h, alpha, box);

  // Rang tuzatish + shaffof kesma (faqat mahsulot qutisi)
  const luts = colorLuts(px, alpha, w * h);
  const bw = box.x1 - box.x0 + 1;
  const bh = box.y1 - box.y0 + 1;
  const cut = document.createElement('canvas');
  cut.width = bw;
  cut.height = bh;
  const cctx = cut.getContext('2d');
  const cutData = cctx.createImageData(bw, bh);
  const d = cutData.data;
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const si = (box.y0 + y) * w + box.x0 + x;
      const di = (y * bw + x) * 4;
      const a = alpha[si];
      d[di] = luts[0][px[si * 4]];
      d[di + 1] = luts[1][px[si * 4 + 1]];
      d[di + 2] = luts[2][px[si * 4 + 2]];
      // Yarim shaffof chekka shovqinini tozalash
      d[di + 3] = a < 16 ? 0 : a > 240 ? 255 : a;
    }
  }
  cctx.putImageData(cutData, 0, 0);

  // 1200x1200 oq kanvas, ~8% chegara, yengil soya
  const out = document.createElement('canvas');
  out.width = OUT_SIZE;
  out.height = OUT_SIZE;
  const octx = out.getContext('2d', { willReadFrequently: true });
  octx.fillStyle = '#ffffff';
  octx.fillRect(0, 0, OUT_SIZE, OUT_SIZE);
  const inner = OUT_SIZE * (1 - 2 * MARGIN);
  const s = Math.min(inner / bw, inner / bh);
  const dw = bw * s;
  const dh = bh * s;
  octx.imageSmoothingQuality = 'high';
  octx.shadowColor = 'rgba(0, 0, 0, 0.16)';
  octx.shadowBlur = OUT_SIZE * 0.03;
  octx.shadowOffsetY = OUT_SIZE * 0.012;
  octx.drawImage(cut, (OUT_SIZE - dw) / 2, (OUT_SIZE - dh) / 2, dw, dh);
  octx.shadowColor = 'transparent';
  sharpen(octx, OUT_SIZE);

  return { ok: true, canvas: out, blur, blurry: blur < BLUR_THRESHOLD, device };
}
