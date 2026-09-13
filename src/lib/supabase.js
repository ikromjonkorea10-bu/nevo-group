import { createClient } from '@supabase/supabase-js';

// Faqat anon (public) kalit. Service role key frontend'da HECH QACHON
// ishlatilmaydi — barcha himoya RLS va place_order() funksiyasida.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let publicClient = null;
let adminClient = null;

function assertConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase sozlanmagan: VITE_SUPABASE_URL va VITE_SUPABASE_ANON_KEY .env faylida bo\'lishi kerak');
  }
}

/** Ochiq sayt uchun client — sessiya saqlamaydi. */
export function getSupabase() {
  assertConfigured();
  if (!publicClient) {
    publicClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return publicClient;
}

/** Admin panel uchun client — email+parol sessiyasini saqlaydi. */
export function getAdminSupabase() {
  assertConfigured();
  if (!adminClient) {
    adminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'nevo-admin-auth',
      },
    });
  }
  return adminClient;
}

/** Tarmoq xatosi (internet yo'q, server javob bermadi) ekanini aniqlaydi. */
export function isNetworkError(error) {
  if (!error) return false;
  const text = `${error.name || ''} ${error.message || ''} ${error.details || ''}`;
  return /Failed to fetch|NetworkError|Load failed|fetch failed|network/i.test(text);
}
