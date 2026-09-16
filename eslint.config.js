// ESLint (flat config) — faqat haqiqiy xatolarni tutish uchun: eslint:recommended.
// Formatlash qoidalari yo'q — uslub Prettier'da (.prettierrc), u avtomatik ishga tushmaydi.
import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['dist/', 'node_modules/', 'supabase/.temp/'],
  },
  js.configs.recommended,
  {
    // Brauzer kodi (Vite ilova va admin panel)
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
    },
  },
  {
    // Node: Vercel funksiyalari, skriptlar, konfiguratsiya fayllari
    files: ['api/**/*.js', 'scripts/**/*.{js,mjs}', '*.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
  {
    rules: {
      // "_" bilan boshlangan argumentlar va `{ olibTashlanadi, ...qolgani }` ataylab ishlatilmaydi
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none', ignoreRestSiblings: true }],
    },
  },
];
