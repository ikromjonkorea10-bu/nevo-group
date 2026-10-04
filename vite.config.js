import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

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

export default defineConfig({
  plugins: [adminPreviewHeaders],
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
});
