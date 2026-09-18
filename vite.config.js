import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// `npm run preview` production'dagi kabi xavfsizlik sarlavhalarini bersin:
// vercel.json'dagi butun sayt uchun ("/(.*)") sarlavhalar shu yerdan o'qiladi.
const vercelConfig = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8'));
const siteHeaders = Object.fromEntries(
  (vercelConfig.headers.find((rule) => rule.source === '/(.*)')?.headers ?? []).map(({ key, value }) => [key, value])
);

export default defineConfig({
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
