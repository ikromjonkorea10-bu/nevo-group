// Lokal Supabase emulyatori — Supabase akkaunti va Docker'siz saytni
// to'liq ishga tushirish va sinash uchun.
//
//   npm run supabase:local            (bo'sh baza)
//   npm run supabase:local -- --seed  (katalog: seed-data/nevo-katalog.csv)
//
// Ichida PGlite (haqiqiy Postgres, WASM) ishlaydi va
// supabase/migrations/ dagi migratsiyalar qo'llanadi, shuning uchun RLS,
// huquqlar va place_order() xuddi Supabase'dagidek ishlaydi.
//
// Emulyatsiya qilinadigan qism — loyiha ishlatadigan PostgREST va Auth
// imkoniyatlari: select/filtr/order/limit/offset/count, insert/upsert,
// update, delete, rpc, email+parol bilan kirish. Ro'yxatdan o'tish yo'q.
//
// FAQAT LOKAL ISHLAB CHIQISH VA TEST UCHUN. Ma'lumotlar xotirada saqlanadi.

import http from 'node:http';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createSupabaseDb, asRole, createAuthUser } from './lib/pglite-supabase.mjs';
import { readCatalog } from './lib/catalog-csv.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const argValue = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = Number(argValue('--port', process.env.LOCAL_SUPABASE_PORT || 54321));
const LATENCY_MS = Number(argValue('--latency', 0));
const SEED = args.includes('--seed');
const ADMIN_EMAIL = argValue('--admin-email', process.env.LOCAL_ADMIN_EMAIL || 'admin@nevo.local');
const ADMIN_PASSWORD = argValue('--admin-password', process.env.LOCAL_ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url'));
const JWT_SECRET = crypto.randomBytes(32);
const TOKEN_TTL_S = 3600;

const IDENT = /^[a-z_][a-z0-9_]*$/;
const TABLES = new Set(['categories', 'products', 'orders', 'order_items', 'admin_users']);

// ---------------------------------------------------------------------
// Baza
// ---------------------------------------------------------------------
const db = await createSupabaseDb();
const users = new Map(); // email -> { id, email, password, created_at }
const refreshTokens = new Map(); // token -> user id

const adminId = await createAuthUser(db, ADMIN_EMAIL);
await db.query('insert into public.admin_users (user_id) values ($1)', [adminId]);
users.set(ADMIN_EMAIL, { id: adminId, email: ADMIN_EMAIL, password: ADMIN_PASSWORD, created_at: new Date().toISOString() });

if (SEED) {
  const categories = JSON.parse(await readFile(path.join(HERE, 'seed-data', 'categories.json'), 'utf8'));
  const catalog = await readCatalog();
  await db.query(
    `insert into public.categories (slug, name_uz, short_desc_uz, image_url, sort_order)
     select slug, name_uz, short_desc_uz, image_url, sort_order
     from json_populate_recordset(null::public.categories, $1::json)`,
    [JSON.stringify(categories)]
  );
  // import-catalog.js bilan bir xil qatorlar; kategoriya name_uz bo'yicha bog'lanadi
  const { rows: [{ inserted }] } = await db.query(
    `with ins as (
       insert into public.products (category_id, slug, sku, name_uz, group_name, size, size_label, pack_qty, unit,
                                    price, manba_narx, manba_valyuta, brand, subcategory_uz, supplier, price_date,
                                    in_stock, featured, sort_order)
       select c.id, p.slug, p.sku, p.name_uz, p.group_name, p.size, p.size_label, p.pack_qty, p.unit,
              p.price, p.manba_narx, p.manba_valyuta, p.brand, p.subcategory_uz, p.supplier, p.price_date,
              p.in_stock, p.featured, p.sort_order
       from json_to_recordset($1::json) as p(category_name text, slug text, sku text, name_uz text, group_name text,
              size text, size_label text, pack_qty text, unit text, price bigint, manba_narx numeric,
              manba_valyuta text, brand text, subcategory_uz text, supplier text, price_date date,
              in_stock boolean, featured boolean, sort_order int)
       join public.categories c on c.name_uz = p.category_name
       returning 1
     ) select count(*)::int as inserted from ins`,
    [JSON.stringify(catalog.map(({ categoryName, row }) => ({ category_name: categoryName, ...row })))]
  );
  if (inserted !== catalog.length) {
    throw new Error(`Emulyator seed: ${catalog.length} ta mahsulotdan ${inserted} tasi yozildi (kategoriya topilmadi?)`);
  }
}

// ---------------------------------------------------------------------
// JWT (HS256)
// ---------------------------------------------------------------------
const b64url = (buf) => Buffer.from(buf).toString('base64url');

function signJwt(payload) {
  const head = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(crypto.createHmac('sha256', JWT_SECRET).update(`${head}.${body}`).digest());
  return `${head}.${body}.${sig}`;
}

function verifyJwt(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const expected = b64url(crypto.createHmac('sha256', JWT_SECRET).update(`${parts[0]}.${parts[1]}`).digest());
  if (expected.length !== parts[2].length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts[2]))) {
    return null;
  }
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  if (payload.exp && payload.exp * 1000 < Date.now()) return null;
  return payload;
}

// Emulyatorda anon key tekshirilmaydi: sessiya tokeni bo'lmagan har qanday
// so'rov anon rolida bajariladi. Shu sababli kalit o'zgarmas.
const ANON_KEY = 'nevo-local-anon-key';

function authFromRequest(req) {
  const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const claims = verifyJwt(bearer);
  if (claims?.role === 'authenticated' && claims.sub) {
    return { role: 'authenticated', sub: claims.sub, email: claims.email };
  }
  return { role: 'anon' };
}

function publicUser(u) {
  return {
    id: u.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: u.email,
    email_confirmed_at: u.created_at,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    created_at: u.created_at,
    updated_at: u.created_at,
  };
}

function createSession(u) {
  const now = Math.floor(Date.now() / 1000);
  const accessToken = signJwt({
    aud: 'authenticated', role: 'authenticated', sub: u.id, email: u.email,
    iat: now, exp: now + TOKEN_TTL_S, session_id: crypto.randomUUID(),
  });
  const refreshToken = crypto.randomBytes(24).toString('base64url');
  refreshTokens.set(refreshToken, u.email);
  return {
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: TOKEN_TTL_S,
    expires_at: now + TOKEN_TTL_S,
    refresh_token: refreshToken,
    user: publicUser(u),
  };
}

// ---------------------------------------------------------------------
// HTTP yordamchilari
// ---------------------------------------------------------------------
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,HEAD,OPTIONS',
  'Access-Control-Allow-Headers': 'authorization,apikey,content-type,prefer,accept,accept-profile,content-profile,range,x-client-info,x-supabase-api-version',
  'Access-Control-Expose-Headers': 'content-range,x-supabase-api-version',
};

function send(res, status, body, extraHeaders = {}) {
  const headers = { ...CORS, ...extraHeaders };
  if (body === undefined) {
    res.writeHead(status, headers);
    return res.end();
  }
  headers['Content-Type'] = 'application/json; charset=utf-8';
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    throw Object.assign(new Error('Invalid JSON body'), { status: 400, code: 'PGRST102' });
  }
}

class ApiError extends Error {
  constructor(status, code, message, details = null, hint = null) {
    super(message);
    Object.assign(this, { status, code, details, hint });
  }
}

function pgErrorToHttp(err, auth) {
  if (err instanceof ApiError) return err;
  const code = err.code || 'XX000';
  let status = 500;
  if (code === '42501') status = auth.role === 'anon' ? 401 : 403;
  else if (code === '23505' || code === '23503') status = 409;
  else if (['23514', '23502', '22P02', '22023', '22003', 'P0001', '42703', '42P01', '42883'].includes(code)) status = 400;
  return new ApiError(status, code, err.message, err.detail ?? null, err.hint ?? null);
}

// ---------------------------------------------------------------------
// PostgREST → SQL
// ---------------------------------------------------------------------
const quote = (id) => {
  if (!IDENT.test(id)) throw new ApiError(400, 'PGRST100', `Noto'g'ri identifikator: ${id}`);
  return `"${id}"`;
};

function parseSelect(select) {
  if (!select || select === '*') return '*';
  return select
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((col) => {
      if (col === '*') return '*';
      if (col.includes('(')) throw new ApiError(400, 'PGRST100', 'Emulyator embedded resource\'larni qo\'llab-quvvatlamaydi');
      return quote(col);
    })
    .join(', ');
}

const RESERVED_PARAMS = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns']);

function parseFilters(searchParams, params) {
  const clauses = [];
  for (const [key, raw] of searchParams) {
    if (RESERVED_PARAMS.has(key)) continue;
    const col = quote(key);
    const dot = raw.indexOf('.');
    if (dot < 0) throw new ApiError(400, 'PGRST100', `Filtr noto'g'ri: ${key}=${raw}`);
    let op = raw.slice(0, dot);
    let value = raw.slice(dot + 1);
    let negate = false;
    if (op === 'not') {
      negate = true;
      const d2 = value.indexOf('.');
      op = value.slice(0, d2);
      value = value.slice(d2 + 1);
    }
    let clause;
    const add = (v) => {
      params.push(v);
      return `$${params.length}`;
    };
    switch (op) {
      case 'eq': clause = `${col}::text = ${add(value)}`; break;
      case 'neq': clause = `${col}::text <> ${add(value)}`; break;
      case 'gt': clause = `${col} > ${add(value)}`; break;
      case 'gte': clause = `${col} >= ${add(value)}`; break;
      case 'lt': clause = `${col} < ${add(value)}`; break;
      case 'lte': clause = `${col} <= ${add(value)}`; break;
      case 'like': clause = `${col}::text like ${add(value.replaceAll('*', '%'))}`; break;
      case 'ilike': clause = `${col}::text ilike ${add(value.replaceAll('*', '%'))}`; break;
      case 'is': {
        const v = value.toLowerCase();
        if (!['null', 'true', 'false'].includes(v)) throw new ApiError(400, 'PGRST100', `is.${value} qo'llab-quvvatlanmaydi`);
        clause = `${col} is ${v}`;
        break;
      }
      case 'in': {
        const list = value.replace(/^\(|\)$/g, '').split(',').map((v) => v.replace(/^"|"$/g, ''));
        clause = `${col}::text = any(${add(list)}::text[])`;
        break;
      }
      default:
        throw new ApiError(400, 'PGRST100', `Operator qo'llab-quvvatlanmaydi: ${op}`);
    }
    clauses.push(negate ? `not (${clause})` : clause);
  }
  return clauses.length ? `where ${clauses.join(' and ')}` : '';
}

function parseOrder(order) {
  if (!order) return '';
  const parts = order.split(',').map((part) => {
    const [col, ...mods] = part.split('.');
    let sql = quote(col);
    for (const m of mods) {
      if (m === 'asc' || m === 'desc') sql += ` ${m}`;
      else if (m === 'nullsfirst') sql += ' nulls first';
      else if (m === 'nullslast') sql += ' nulls last';
      else throw new ApiError(400, 'PGRST100', `order modifikatori noto'g'ri: ${m}`);
    }
    return sql;
  });
  return `order by ${parts.join(', ')}`;
}

function parsePrefer(req) {
  const prefer = {};
  for (const token of String(req.headers.prefer || '').split(',')) {
    const [k, v] = token.trim().split('=');
    if (k) prefer[k] = v;
  }
  return prefer;
}

function wantsSingle(req) {
  return String(req.headers.accept || '').includes('application/vnd.pgrst.object+json');
}

function shapeRows(req, rows) {
  if (!wantsSingle(req)) return rows;
  if (rows.length !== 1) {
    throw new ApiError(406, 'PGRST116', 'JSON object requested, multiple (or no) rows returned',
      `The result contains ${rows.length} rows`);
  }
  return rows[0];
}

async function handleTable(req, res, table, url, auth) {
  if (!TABLES.has(table)) throw new ApiError(404, 'PGRST205', `Could not find the table 'public.${table}'`);
  const sp = url.searchParams;
  const prefer = parsePrefer(req);
  const tbl = `public.${quote(table)}`;
  const method = req.method;

  if (method === 'GET' || method === 'HEAD') {
    const params = [];
    const cols = parseSelect(sp.get('select'));
    const where = parseFilters(sp, params);
    const order = parseOrder(sp.get('order'));
    const limit = sp.has('limit') ? `limit ${Number.parseInt(sp.get('limit'), 10)}` : '';
    const offset = sp.has('offset') ? `offset ${Number.parseInt(sp.get('offset'), 10)}` : '';

    const { rows, total } = await asRole(db, auth, async (tx) => {
      const data = await tx.query(
        `select coalesce(json_agg(t), '[]'::json) as rows from (select ${cols} from ${tbl} ${where} ${order} ${limit} ${offset}) t`,
        params
      );
      let count = null;
      if (prefer.count) {
        const c = await tx.query(`select count(*)::int as c from ${tbl} ${where}`, params);
        count = c.rows[0].c;
      }
      return { rows: data.rows[0].rows, total: count };
    });

    const start = Number.parseInt(sp.get('offset') || '0', 10);
    const range = rows.length ? `${start}-${start + rows.length - 1}` : '*';
    const headers = { 'Content-Range': `${range}/${total ?? '*'}` };
    if (method === 'HEAD') return send(res, 200, undefined, headers);
    return send(res, 200, shapeRows(req, rows), headers);
  }

  if (method === 'POST' || method === 'PATCH') {
    const body = await readBody(req);
    const records = Array.isArray(body) ? body : [body];
    if (!records.length || records.some((r) => !r || typeof r !== 'object')) {
      throw new ApiError(400, 'PGRST102', 'Body JSON obyekt yoki obyektlar massivi bo\'lishi kerak');
    }
    const keys = sp.get('columns')
      ? sp.get('columns').split(',').map((c) => c.replace(/"/g, '').trim())
      : [...new Set(records.flatMap((r) => Object.keys(r)))];
    const colList = keys.map(quote).join(', ');
    const returnCols = parseSelect(sp.get('select'));
    const representation = prefer.return === 'representation';
    const params = [];

    let mutation;
    if (method === 'POST') {
      params.push(JSON.stringify(records));
      mutation = `insert into ${tbl} (${colList})
                  select ${colList} from json_populate_recordset(null::${tbl}, $1::json)`;
      if (sp.get('on_conflict') || prefer.resolution) {
        const conflictCols = (sp.get('on_conflict') || '').split(',').filter(Boolean).map(quote).join(', ');
        const target = conflictCols ? `(${conflictCols})` : '';
        if (prefer.resolution === 'ignore-duplicates') {
          mutation += ` on conflict ${target} do nothing`;
        } else {
          const updates = keys.map((k) => `${quote(k)} = excluded.${quote(k)}`).join(', ');
          mutation += ` on conflict ${target} do update set ${updates}`;
        }
      }
    } else {
      params.push(JSON.stringify(records[0]));
      const where = parseFilters(sp, params);
      if (!where) throw new ApiError(400, '21000', 'UPDATE requires a WHERE clause');
      mutation = `update ${tbl} set (${colList}) = (select ${colList} from json_populate_record(null::${tbl}, $1::json)) ${where}`;
    }

    const rows = await asRole(db, auth, async (tx) => {
      const r = await tx.query(
        `with t as (${mutation} returning *)
         select coalesce(json_agg(s), '[]'::json) as rows from (select ${returnCols} from t) s`,
        params
      );
      return r.rows[0].rows;
    });

    if (!representation) return send(res, method === 'POST' ? 201 : 204);
    return send(res, method === 'POST' ? 201 : 200, shapeRows(req, rows));
  }

  if (method === 'DELETE') {
    const params = [];
    const where = parseFilters(sp, params);
    if (!where) throw new ApiError(400, '21000', 'DELETE requires a WHERE clause');
    const returnCols = parseSelect(sp.get('select'));
    const rows = await asRole(db, auth, async (tx) => {
      const r = await tx.query(
        `with t as (delete from ${tbl} ${where} returning *)
         select coalesce(json_agg(s), '[]'::json) as rows from (select ${returnCols} from t) s`,
        params
      );
      return r.rows[0].rows;
    });
    if (prefer.return !== 'representation') return send(res, 204);
    return send(res, 200, shapeRows(req, rows));
  }

  throw new ApiError(405, 'PGRST000', `Method ${method} not allowed`);
}

async function handleRpc(req, res, fn, auth) {
  quote(fn);
  const body = (await readBody(req)) || {};
  const params = [];
  const namedArgs = Object.entries(body).map(([name, value]) => {
    quote(name);
    if (value !== null && typeof value === 'object') {
      params.push(JSON.stringify(value));
      return `${name} => $${params.length}::jsonb`;
    }
    params.push(value === null ? null : String(value));
    return `${name} => $${params.length}`;
  });
  const result = await asRole(db, auth, (tx) =>
    tx.query(`select to_jsonb(public.${quote(fn)}(${namedArgs.join(', ')})) as r`, params)
  );
  return send(res, 200, result.rows[0].r);
}

// ---------------------------------------------------------------------
// Auth (GoTrue)
// ---------------------------------------------------------------------
function authError(res, status, code, msg) {
  return send(res, status, { code: status, error_code: code, msg, message: msg });
}

async function handleAuth(req, res, url) {
  const route = url.pathname.replace(/^\/auth\/v1/, '');

  if (route === '/token' && req.method === 'POST') {
    const body = (await readBody(req)) || {};
    const grant = url.searchParams.get('grant_type');
    if (grant === 'password') {
      const u = users.get(String(body.email || '').toLowerCase());
      if (!u || u.password !== body.password) {
        return authError(res, 400, 'invalid_credentials', 'Invalid login credentials');
      }
      return send(res, 200, createSession(u));
    }
    if (grant === 'refresh_token') {
      const email = refreshTokens.get(body.refresh_token);
      if (!email) return authError(res, 400, 'refresh_token_not_found', 'Invalid Refresh Token: Refresh Token Not Found');
      refreshTokens.delete(body.refresh_token);
      return send(res, 200, createSession(users.get(email)));
    }
    return authError(res, 400, 'unsupported_grant_type', 'Unsupported grant type');
  }

  if (route === '/user' && req.method === 'GET') {
    const auth = authFromRequest(req);
    const u = [...users.values()].find((x) => x.id === auth.sub);
    if (!u) return authError(res, 401, 'bad_jwt', 'invalid JWT');
    return send(res, 200, publicUser(u));
  }

  if (route === '/logout' && req.method === 'POST') {
    return send(res, 204);
  }

  if (route === '/signup') {
    return authError(res, 422, 'signup_disabled', 'Signups not allowed for this instance');
  }

  if (route === '/settings' || route === '/health') {
    return send(res, 200, { external: { email: true }, disable_signup: true });
  }

  return authError(res, 404, 'not_found', 'Not found');
}

// ---------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204);
  if (LATENCY_MS) await new Promise((r) => setTimeout(r, LATENCY_MS));

  const url = new URL(req.url, `http://${req.headers.host}`);
  const auth = authFromRequest(req);
  try {
    if (url.pathname.startsWith('/auth/v1')) return await handleAuth(req, res, url);
    const rpc = url.pathname.match(/^\/rest\/v1\/rpc\/([^/]+)$/);
    if (rpc && req.method === 'POST') return await handleRpc(req, res, rpc[1], auth);
    const table = url.pathname.match(/^\/rest\/v1\/([^/]+)$/);
    if (table) return await handleTable(req, res, table[1], url, auth);
    return send(res, 404, { code: 'PGRST000', message: 'Not found', details: null, hint: null });
  } catch (err) {
    const e = pgErrorToHttp(err, auth);
    if (e.status >= 500) console.error(err);
    return send(res, e.status, { code: e.code, message: e.message, details: e.details, hint: e.hint });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`
Lokal Supabase emulyatori ishga tushdi
  URL:            http://127.0.0.1:${PORT}
  Anon key:       ${ANON_KEY}
  Admin email:    ${ADMIN_EMAIL}
  Admin parol:    ${ADMIN_PASSWORD}
  Seed:           ${SEED ? 'ha (katalog yuklandi)' : 'yo\'q'}${LATENCY_MS ? `\n  Kechikish:      ${LATENCY_MS} ms` : ''}

.env.local uchun:
  VITE_SUPABASE_URL=http://127.0.0.1:${PORT}
  VITE_SUPABASE_ANON_KEY=${ANON_KEY}
`);
});
