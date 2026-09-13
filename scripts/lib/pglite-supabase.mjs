// PGlite (WASM Postgres) ichida Supabase muhitining minimal nusxasi:
// anon / authenticated / service_role rollari, auth.users, auth.uid()
// va Supabase'ning standart (keng) huquqlari. Migratsiyalar shu muhitda
// qo'llanadi — shunda RLS va huquqlar haqiqiy Supabase'dagidek sinaladi.
//
// Faqat test va lokal ishlab chiqish uchun.

import { PGlite } from '@electric-sql/pglite';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const MIGRATIONS_DIR = path.join(ROOT, 'supabase', 'migrations');

const SUPABASE_BOOTSTRAP = `
  create role anon nologin noinherit;
  create role authenticated nologin noinherit;
  create role service_role nologin noinherit bypassrls;

  create schema auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text unique not null,
    created_at timestamptz not null default now()
  );

  create function auth.uid() returns uuid
  language sql stable as $$
    select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid
  $$;

  create function auth.role() returns text
  language sql stable as $$
    select current_setting('request.jwt.claims', true)::jsonb ->> 'role'
  $$;

  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on all functions in schema auth to anon, authenticated, service_role;
  grant usage on schema public to anon, authenticated, service_role;

  -- Supabase standarti: public sxemadagi yangi obyektlarga hamma rollar
  -- to'liq huquq oladi. Himoya RLS va migratsiyadagi REVOKE'larga tayanadi.
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`;

export async function listMigrations() {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  return Promise.all(
    files.map(async (name) => ({ name, sql: await readFile(path.join(MIGRATIONS_DIR, name), 'utf8') }))
  );
}

export async function createSupabaseDb() {
  const db = new PGlite();
  await db.exec(SUPABASE_BOOTSTRAP);
  for (const m of await listMigrations()) {
    try {
      await db.exec(m.sql);
    } catch (err) {
      err.message = `Migratsiya xatosi (${m.name}): ${err.message}`;
      throw err;
    }
  }
  return db;
}

/**
 * SQL'ni berilgan rol va JWT claim'lari bilan bitta tranzaksiyada bajaradi
 * (PostgREST aynan shunday qiladi).
 * @param {PGlite} db
 * @param {{ role: 'anon'|'authenticated'|'service_role', sub?: string, email?: string }} auth
 * @param {(tx: any) => Promise<any>} fn
 */
export async function asRole(db, auth, fn) {
  const claims = JSON.stringify({ role: auth.role, sub: auth.sub ?? null, email: auth.email ?? null });
  return db.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claims', $1, true)`, [claims]);
    await tx.exec(`set local role ${auth.role}`);
    return fn(tx);
  });
}

export async function createAuthUser(db, email) {
  const { rows } = await db.query('insert into auth.users (email) values ($1) returning id', [email]);
  return rows[0].id;
}
