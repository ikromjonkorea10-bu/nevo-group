// /k/<slug> — kategoriya sahifasining qidiruv/ulashish nusxasi (vercel.json rewrite orqali).
//
// Ilova hash-routing ishlatadi (#bolim/<slug>), qidiruv tizimlari esa #'dan keyingi
// qismni alohida sahifa deb hisoblamaydi. Bu funksiya kategoriya nomi, tavsifi va
// mahsulotlar ro'yxati bilan HTML qaytaradi, odam esa darhol ilovaga yo'naltiriladi.
// api/share.js (mahsulotlar uchun /p/<slug>) bilan bir xil naqsh.

import { SLUG_RE, restGet, siteOrigin, escapeHtml } from './_lib.js';

const SITE = 'NEVO GROUP';
const PRODUCT_LIMIT = 200;

// dbError: baza javob bermadi — kategoriya bor-yo'qligi noma'lum, shuning uchun ilovadagi bo'limga yo'naltiramiz
function renderPage({ origin, slug, category, products, dbError = false }) {
  const target = category || dbError ? `/#bolim/${slug}` : '/#catalog';
  const url = `${origin}/k/${slug}`;
  const title = category ? `${category.name_uz} — ${SITE}` : dbError ? SITE : `Bo'lim topilmadi — ${SITE}`;
  const description = category
    ? `${category.name_uz}` +
      (products.length ? `: ${products.length} ta mahsulot narxi bilan.` : '.') +
      (category.short_desc_uz ? ` ${category.short_desc_uz}.` : '') +
      " O'zbekiston bo'ylab yetkazib berish."
    : "Santexnika va qurilish mahsulotlari: truba va fitinglar, zapor armatura, yong'in va elektr jihozlari.";
  const image = `${origin}/og-image.jpg`;
  const e = escapeHtml;

  return `<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${e(title)}</title>
<meta name="description" content="${e(description)}" />
${category ? `<link rel="canonical" href="${e(url)}" />` : '<meta name="robots" content="noindex" />'}
<meta property="og:site_name" content="${SITE}" />
<meta property="og:locale" content="uz_UZ" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${e(url)}" />
<meta property="og:title" content="${e(title)}" />
<meta property="og:description" content="${e(description)}" />
<meta property="og:image" content="${e(image)}" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="${e(category ? category.name_uz : SITE)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${e(title)}" />
<meta name="twitter:description" content="${e(description)}" />
<meta name="twitter:image" content="${e(image)}" />
<link rel="icon" href="/favicon.ico" sizes="any" />
<script>location.replace(${JSON.stringify(target)});</script>
</head>
<body style="font-family: system-ui, sans-serif; padding: 40px 20px; max-width: 720px; margin: 0 auto;">
<h1>${e(category ? category.name_uz : dbError ? SITE : "Bo'lim topilmadi")}</h1>
<p>${e(description)}</p>
${
  products.length
    ? `<ul>\n${products.map((p) => `<li><a href="/p/${e(p.slug)}">${e(p.name_uz)}</a></li>`).join('\n')}\n</ul>`
    : ''
}
<p><a href="${e(target)}">${e(category ? category.name_uz : dbError ? "Bo'lim" : 'Katalog')}</a> sahifasiga o'tilmoqda…</p>
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
  let category = null;
  let products = [];
  try {
    const rows = await restGet(
      `categories?select=id,name_uz,short_desc_uz&slug=eq.${encodeURIComponent(slug)}&limit=1`
    );
    category = rows[0] || null;
    if (category) {
      products = await restGet(
        `products?select=slug,name_uz&category_id=eq.${category.id}&in_stock=is.true` +
          `&order=sort_order.asc,id.asc&limit=${PRODUCT_LIMIT}`
      );
    }
  } catch (err) {
    // Baza vaqtincha javob bermasa ham havola ishlasin: ilovadagi bo'limga yo'naltiramiz
    console.error('category:', err.message);
    res.statusCode = 200;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(renderPage({ origin, slug, category: null, products: [], dbError: true }));
  }

  res.statusCode = category ? 200 : 404;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', category ? 'public, s-maxage=3600, stale-while-revalidate=86400' : 'public, s-maxage=300');
  res.end(renderPage({ origin, slug, category, products }));
}
