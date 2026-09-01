/**
 * Verifies the BABAS POS RLS policies on a real local Postgres 18 cluster
 * (embedded-postgres binaries) after applying supabase/live-setup.sql:
 *
 *   - RLS is enabled on every public table
 *   - user A sees only their own business's data (products/sales/customers)
 *   - same-business colleagues are visible in profiles (team visibility)
 *   - cross-business reads return 0 rows
 *   - cross-business writes are rejected by RLS
 *   - a user with no/unknown auth claim sees nothing
 *
 * Usage: node scripts/verify-rls.mjs
 */
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BIN = path.join(root, 'node_modules', '@embedded-postgres', 'linux-x64', 'native', 'bin');
const PORT = 54332;
const socketDir = mkdtempSync(path.join(tmpdir(), 'babas-rls-'));
const dataDir = path.join(socketDir, 'data');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

try {
  execFileSync(path.join(BIN, 'initdb'), ['-D', dataDir, '-U', 'postgres', '--auth-local=trust', '--auth-host=trust', '-E', 'UTF8'], { stdio: 'ignore' });
  const server = spawn(
    path.join(BIN, 'postgres'),
    ['-D', dataDir, '-c', `port=${PORT}`, '-c', 'listen_addresses=127.0.0.1', '-c', `unix_socket_directories=${socketDir}`, '-c', 'shared_buffers=16MB'],
    { stdio: 'ignore' }
  );
  let up = false;
  for (let i = 0; i < 50; i++) {
    await sleep(200);
    try {
      const t = new pg.Client({ host: '127.0.0.1', port: PORT, user: 'postgres', database: 'postgres' });
      await t.connect();
      await t.query('select 1');
      await t.end();
      up = true;
      break;
    } catch { /* retry */ }
  }
  if (!up) throw new Error('postgres did not come up');

  const admin = new pg.Client({ host: '127.0.0.1', port: PORT, user: 'postgres', database: 'postgres' });
  admin.on('notice', () => {});
  await admin.connect();

  // platform emulation
  await admin.query(`
    CREATE ROLE authenticated NOLOGIN;
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY, email text);
    CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
      LANGUAGE sql STABLE AS $fn$
        SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
      $fn$;
  `);

  console.log('== applying live-setup.sql ==');
  await admin.query(readFileSync(path.join(root, 'supabase', 'live-setup.sql'), 'utf8'));

  console.log('== seeding two isolated businesses ==');
  const u1 = '11111111-1111-1111-1111-111111111111';
  const u2 = '22222222-2222-2222-2222-222222222222';
  const u3 = '33333333-3333-3333-3333-333333333333'; // colleague of u1 in business 1
  await admin.query(`
    INSERT INTO auth.users (id, email) VALUES
      ('${u1}', 'owner1@test.bi'),
      ('${u2}', 'owner2@test.bi'),
      ('${u3}', 'staff1@test.bi');
    INSERT INTO public.businesses (id, name) VALUES
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Business One'),
      ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Business Two');
    INSERT INTO public.branches (id, business_id, name) VALUES
      ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Branch 1A'),
      ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Branch 2A');
    INSERT INTO public.profiles (id, business_id, branch_id, full_name) VALUES
      ('${u1}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Owner One'),
      ('${u2}', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Owner Two'),
      ('${u3}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Staff One');
    INSERT INTO public.products (id, business_id, name) VALUES
      ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Product P1'),
      ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Product P2');
    INSERT INTO public.sales (id, business_id, branch_id, receipt_number, total_amount) VALUES
      ('99999999-9999-9999-9999-999999999991', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'R-0001', 100),
      ('99999999-9999-9999-9999-999999999992', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'R-0002', 200);
    INSERT INTO public.customers (business_id, name) VALUES
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Customer C1'),
      ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Customer C2');
  `);

  /** Run a query as a given user (or null = no auth claim) */
  async function as(user, query) {
    const c = new pg.Client({ host: '127.0.0.1', port: PORT, user: 'postgres', database: 'postgres' });
    c.on('notice', () => {});
    await c.connect();
    try {
      if (user) {
        await c.query('SET ROLE authenticated');
        await c.query(`SET "request.jwt.claim.sub" = '${user}'`);
      } else {
        await c.query('SET ROLE authenticated');
      }
      return await c.query(query);
    } finally {
      await c.end();
    }
  }

  const count = (table) => (r) => r.rows[0].count;

  console.log('== 1) RLS enabled on every public table ==');
  const rlsOff = await admin.query(
    `SELECT count(*)::int FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity`
  );
  check('RLS enabled on all tables', rlsOff.rows[0].count === 0,
    `${rlsOff.rows[0].count} tables without RLS`);

  console.log('== 2) user 1 sees only Business One ==');
  check('products: 1 (own business)', (await as(u1, 'SELECT count(*)::int AS count FROM public.products')).rows[0].count === 1);
  check('sales: 1 (own business)', (await as(u1, 'SELECT count(*)::int AS count FROM public.sales')).rows[0].count === 1);
  check('customers: 1 (own business)', (await as(u1, 'SELECT count(*)::int AS count FROM public.customers')).rows[0].count === 1);
  check('businesses: 1 (own business)', (await as(u1, 'SELECT count(*)::int AS count FROM public.businesses')).rows[0].count === 1);
  check('profiles: 2 (self + same-business colleague)',
    (await as(u1, 'SELECT count(*)::int AS count FROM public.profiles')).rows[0].count === 2);
  const crossRead = await as(u1, `SELECT count(*)::int AS count FROM public.products WHERE id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'`);
  check('cross-business product readable by id: 0 rows', crossRead.rows[0].count === 0);

  console.log('== 3) user 1 cannot write into Business Two ==');
  let writeBlocked = null;
  try {
    await as(u2 ? u1 : u1, `INSERT INTO public.products (business_id, name) VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Sneaky product')`);
  } catch (e) {
    writeBlocked = /row-level security|permission/i.test(e.message) || e.code === '42501';
  }
  check('cross-business INSERT rejected', writeBlocked === true);
  const sneaky = await admin.query(`SELECT count(*)::int FROM public.products WHERE name = 'Sneaky product'`);
  check('cross-business INSERT not persisted', sneaky.rows[0].count === 0);

  console.log('== 4) user 1 can write into own business ==');
  let ownWriteOk = true;
  try {
    await as(u1, `INSERT INTO public.products (business_id, name) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Own product')`);
  } catch (e) {
    ownWriteOk = false;
    console.log('   own-write error: ' + e.message.slice(0, 120));
  }
  check('own-business INSERT succeeds', ownWriteOk);
  await admin.query(`DELETE FROM public.products WHERE name = 'Own product'`);

  console.log('== 5) user 2 sees only Business Two ==');
  check('products: 1', (await as(u2, 'SELECT count(*)::int AS count FROM public.products')).rows[0].count === 1);
  const p1Visible = await as(u2, `SELECT count(*)::int AS count FROM public.products WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'`);
  check('user 1 product invisible to user 2', p1Visible.rows[0].count === 0);

  console.log('== 6) unauthenticated claim sees nothing ==');
  check('products: 0', (await as(null, 'SELECT count(*)::int AS count FROM public.products')).rows[0].count === 0);
  check('profiles: 0', (await as(null, 'SELECT count(*)::int AS count FROM public.profiles')).rows[0].count === 0);
  const ghost = '99999999-0000-0000-0000-000000000000';
  check('unknown user id: products 0', (await as(ghost, 'SELECT count(*)::int AS count FROM public.products')).rows[0].count === 0);

  await admin.end();
  console.log(failures === 0 ? '\n===== RLS VERIFICATION: ALL PASS =====' : `\n===== ${failures} RLS CHECKS FAILED =====`);
  process.exitCode = failures === 0 ? 0 : 1;
} finally {
  try {
    execFileSync(path.join(BIN, 'pg_ctl'), ['-D', dataDir, '-m', 'immediate', 'stop'], { stdio: 'ignore' });
  } catch { /* ignore */ }
  try { rmSync(socketDir, { recursive: true, force: true }); } catch { /* ignore */ }
}
