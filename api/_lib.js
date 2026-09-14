// Vercel funksiyalari uchun umumiy yordamchilar (fayl nomi "_" bilan — alohida endpoint emas).
// Faqat anon (public) kalit ishlatiladi: products jadvalini RLS bo'yicha hamma o'qiy oladi.

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function supabaseConfig() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  return url && key ? { url: url.replace(/\/+$/, ''), key } : null;
}

/** PostgREST so'rovi: path — "products?select=..." */
export async function restGet(path) {
  const cfg = supabaseConfig();
  if (!cfg) throw new Error('Supabase sozlanmagan (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)');
  const res = await fetch(`${cfg.url}/rest/v1/${path}`, {
    headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.json();
}

/** Saytning to'liq manzili (https://domen) — so'rovning o'zidan olinadi */
export function siteOrigin(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, '');
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'nevo-group.vercel.app';
  const proto = req.headers['x-forwarded-proto'] || (String(host).startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export const formatPrice = (n) => `${Math.round(Number(n) || 0).toLocaleString('ru-RU').replace(/\s/g, ' ')} so'm`;
