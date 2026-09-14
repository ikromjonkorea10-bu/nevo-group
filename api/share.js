// /p/<slug> — mahsulotning ulashish sahifasi (vercel.json rewrite orqali).
//
// Telegram, WhatsApp, Facebook botlari JavaScript'ni bajarmaydi va #hash'ni ko'rmaydi,
// shuning uchun /#product/<slug> havolasi doim bosh sahifa kartasi bilan chiqardi.
// Bu funksiya mahsulot nomi, narxi va surati bilan og:* teglarni qaytaradi,
// odam esa darhol saytdagi mahsulot sahifasiga yo'naltiriladi.

import { SLUG_RE, restGet, siteOrigin, escapeHtml, formatPrice } from './_lib.js';

const SITE = 'NEVO GROUP';

function ogImageFor(imageUrl) {
  // /images/products/<nom>.webp → /images/og/<nom>.jpg (scripts/make-social-images.mjs yasaydi)
  const m = /^\/images\/products\/([a-z0-9-]+)\.webp$/.exec(imageUrl || '');
  return m ? `/images/og/${m[1]}.jpg` : '/og-image.jpg';
}

function renderPage({ origin, slug, product }) {
  const target = `/#product/${slug}`;
  const title = product ? `${product.name_uz} — ${SITE}` : `Mahsulot topilmadi — ${SITE}`;
  const description = product
    ? `${formatPrice(product.price)} / ${product.unit}${product.brand ? ` · ${product.brand}` : ''}. ` +
      "Santexnika va qurilish mahsulotlari — buyurtma bering, operator narx va mavjudligini tasdiqlaydi."
    : "Santexnika va qurilish mahsulotlari: truba va fitinglar, zapor armatura, yong'in va elektr jihozlari.";
  const image = `${origin}${ogImageFor(product?.image_url)}`;
  const e = escapeHtml;

  return `<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${e(title)}</title>
<meta name="description" content="${e(description)}" />
<link rel="canonical" href="${e(`${origin}/p/${slug}`)}" />
<meta property="og:site_name" content="${SITE}" />
<meta property="og:locale" content="uz_UZ" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${e(`${origin}/p/${slug}`)}" />
<meta property="og:title" content="${e(product ? product.name_uz : title)}" />
<meta property="og:description" content="${e(description)}" />
<meta property="og:image" content="${e(image)}" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="${e(product ? product.name_uz : SITE)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${e(product ? product.name_uz : title)}" />
<meta name="twitter:description" content="${e(description)}" />
<meta name="twitter:image" content="${e(image)}" />
<link rel="icon" href="/favicon.ico" sizes="any" />
<script>location.replace(${JSON.stringify(target)});</script>
</head>
<body style="font-family: system-ui, sans-serif; padding: 40px 20px; text-align: center;">
<p><a href="${e(target)}">${e(product ? product.name_uz : SITE)}</a> sahifasiga o'tilmoqda…</p>
</body>
</html>`;
}

export default async function handler(req, res) {
  const slug = String(req.query?.slug || '').toLowerCase();
  if (!SLUG_RE.test(slug) || slug.length > 200) {
    res.statusCode = 302;
    res.setHeader('Location', '/');
    return res.end();
  }

  const origin = siteOrigin(req);
  let product = null;
  try {
    const rows = await restGet(
      `products?select=name_uz,price,unit,brand,image_url&slug=eq.${encodeURIComponent(slug)}&limit=1`
    );
    product = rows[0] || null;
  } catch (err) {
    // Baza vaqtincha javob bermasa ham havola ishlasin: umumiy karta + yo'naltirish
    console.error('share:', err.message);
    res.setHeader('Cache-Control', 'no-store');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(renderPage({ origin, slug, product: null }));
  }

  res.statusCode = product ? 200 : 404;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', product ? 'public, s-maxage=3600, stale-while-revalidate=86400' : 'public, s-maxage=300');
  res.end(renderPage({ origin, slug, product }));
}
