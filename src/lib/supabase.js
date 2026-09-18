// Faqat anon (public) kalit. Service role key frontend'da HECH QACHON
// ishlatilmaydi — barcha himoya RLS va place_order() funksiyasida.
//
// @supabase/supabase-js boshlang'ich bundle'ga kirmaydi: u faqat buyurtma
// yuborishda va admin panelda import() orqali yuklanadi. Ochiq saytning
// katalogi kutubxonasiz, to'g'ridan-to'g'ri PostgREST'dan o'qiladi (selectRows).
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

// Kutubxonani bir marta yuklab, client yaratadi. Yuklash xatosida (internet uzilgan)
// keyingi chaqiruv qayta urinadi.
function lazyClient(options) {
  let promise = null;
  return () => {
    assertConfigured();
    promise ??= import('@supabase/supabase-js')
      .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_ANON_KEY, options))
      .catch((error) => {
        promise = null;
        throw error;
      });
    return promise;
  };
}

/** Ochiq sayt uchun client — sessiya saqlamaydi. */
export function getSupabase() {
  publicClient ??= lazyClient({
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return publicClient();
}

/** Admin panel uchun client — email+parol sessiyasini saqlaydi. */
export function getAdminSupabase() {
  adminClient ??= lazyClient({
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: 'nevo-admin-auth',
    },
  });
  return adminClient();
}

/**
 * Jadvaldan ochiq (RLS ruxsat bergan) qatorlarni o'qiydi — kutubxonasiz GET /rest/v1/<table>.
 * params: PostgREST query parametrlari (select, order, limit, offset...).
 * Xato supabase-js bilan bir xil shaklda tashlanadi (message, code, details, hint).
 */
export async function selectRows(table, params) {
  assertConfigured();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${new URLSearchParams(params)}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: 'application/json',
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw Object.assign(new Error(body?.message || `HTTP ${res.status}`), body, { status: res.status });
  }
  return body;
}

/** Tarmoq xatosi (internet yo'q, server javob bermadi) ekanini aniqlaydi. */
export function isNetworkError(error) {
  if (!error) return false;
  const text = `${error.name || ''} ${error.message || ''} ${error.details || ''}`;
  return /Failed to fetch|NetworkError|Load failed|fetch failed|network/i.test(text);
}
