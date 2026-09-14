// /sitemap.xml — bazadan dinamik (vercel.json rewrite orqali).
// Sayt hash-routing ishlatadi (#product/...), qidiruv tizimlari esa #'dan keyingi
// qismni alohida sahifa deb hisoblamaydi. Shuning uchun mahsulotlar /p/<slug>
// manzillari bilan beriladi (api/share.js — nomi, tavsifi, rasmi bor sahifa).

import { restGet, siteOrigin, escapeHtml } from './_lib.js';

const PAGE = 1000;

export default async function handler(req, res) {
  const origin = siteOrigin(req);
  const urls = [{ loc: `${origin}/`, changefreq: 'weekly', priority: '1.0' }];

  try {
    for (let offset = 0; ; offset += PAGE) {
      const rows = await restGet(
        `products?select=slug,updated_at&in_stock=is.true&order=id.asc&limit=${PAGE}&offset=${offset}`
      );
      for (const p of rows) {
        urls.push({ loc: `${origin}/p/${p.slug}`, lastmod: String(p.updated_at || '').slice(0, 10), changefreq: 'weekly', priority: '0.7' });
      }
      if (rows.length < PAGE) break;
    }
  } catch (err) {
    console.error('sitemap:', err.message);
    res.statusCode = 503;
    res.setHeader('Retry-After', '600');
    res.setHeader('Cache-Control', 'no-store');
    return res.end('Sitemap vaqtincha mavjud emas');
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${escapeHtml(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
  )
  .join('\n')}
</urlset>
`;
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.end(body);
}
