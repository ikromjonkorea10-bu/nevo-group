import { defineConfig, loadEnv } from 'vite';
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// `npm run preview` production'dagi kabi xavfsizlik sarlavhalarini bersin:
// vercel.json'dagi butun sayt uchun ("/(.*)") sarlavhalar shu yerdan o'qiladi.
const vercelConfig = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8'));
const headersOf = (source) =>
  Object.fromEntries(
    (vercelConfig.headers.find((rule) => rule.source === source)?.headers ?? []).map(({ key, value }) => [key, value])
  );
const siteHeaders = headersOf('/(.*)');
const adminHeaders = headersOf('/admin/(.*)');

// Vercel'dagidek /admin/ sahifalarida keyingi qoida ("/admin/(.*)") ustun keladi —
// admin CSP'si (fonni olib tashlash modeli, WASM) preview'da ham sinalsin.
const adminPreviewHeaders = {
  name: 'admin-preview-headers',
  configurePreviewServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url?.startsWith('/admin')) {
        // preview.headers keyinroq qo'yiladi — shuning uchun javob yozilishidan oldin almashtiramiz
        const writeHead = res.writeHead;
        res.writeHead = function (...args) {
          for (const [key, value] of Object.entries(adminHeaders)) res.setHeader(key, value);
          return writeHead.apply(this, args);
        };
      }
      next();
    });
  },
};

function seoRobotsPlugin(isLive) {
  const robotsDisallow = `User-agent: *\nDisallow: /\n`;
  const robotsAllow = `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: https://nevogroup.uz/sitemap.xml\n`;
  const emptySitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n`;
  const fullSitemapPath = fileURLToPath(new URL('./scripts/seed-data/sitemap.full.xml', import.meta.url));

  return {
    name: 'seo-robots-plugin',
    transformIndexHtml(html, ctx) {
      const isMainApp = ctx.path === '/index.html' || ctx.filename?.endsWith('/index.html');
      if (isMainApp && !ctx.filename?.includes('/admin/')) {
        const replacement = isLive
          ? '<meta name="robots" content="index,follow" />'
          : '<meta name="robots" content="noindex,nofollow" />';
        if (/<meta\s+name=["']robots["'][^>]*\/?>/i.test(html)) {
          return html.replace(/<meta\s+name=["']robots["'][^>]*\/?>/i, replacement);
        }
        return html.replace('</head>', `  ${replacement}\n  </head>`);
      }
      return html;
    },
    closeBundle() {
      const distDir = fileURLToPath(new URL('./dist', import.meta.url));
      const robotsDest = path.join(distDir, 'robots.txt');
      const sitemapDest = path.join(distDir, 'sitemap.xml');

      try {
        if (isLive) {
          writeFileSync(robotsDest, robotsAllow, 'utf8');
          try {
            copyFileSync(fullSitemapPath, sitemapDest);
          } catch (e) {
            console.warn('Could not copy full sitemap:', e.message);
          }
        } else {
          writeFileSync(robotsDest, robotsDisallow, 'utf8');
          writeFileSync(sitemapDest, emptySitemap, 'utf8');
        }
      } catch (err) {
        console.warn('seoRobotsPlugin closeBundle error:', err.message);
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/robots.txt') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end(isLive ? robotsAllow : robotsDisallow);
          return;
        }
        if (req.url === '/sitemap.xml') {
          res.setHeader('Content-Type', 'application/xml; charset=utf-8');
          res.end(isLive ? readFileSync(fullSitemapPath, 'utf8') : emptySitemap);
          return;
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/robots.txt') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end(isLive ? robotsAllow : robotsDisallow);
          return;
        }
        if (req.url === '/sitemap.xml') {
          res.setHeader('Content-Type', 'application/xml; charset=utf-8');
          res.end(isLive ? readFileSync(fullSitemapPath, 'utf8') : emptySitemap);
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isLive =
    String(env.VITE_SITE_LIVE ?? process.env.VITE_SITE_LIVE ?? '').toLowerCase() === 'true' ||
    env.VITE_SITE_LIVE === '1' ||
    process.env.VITE_SITE_LIVE === '1';

  return {
    plugins: [adminPreviewHeaders, seoRobotsPlugin(isLive)],
    preview: {
      headers: siteHeaders,
    },
    build: {
      rollupOptions: {
        input: {
          main: fileURLToPath(new URL('./index.html', import.meta.url)),
          admin: fileURLToPath(new URL('./admin/index.html', import.meta.url)),
        },
      },
    },
  };
});
