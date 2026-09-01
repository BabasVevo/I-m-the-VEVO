/**
 * Verifies supabase/live-setup.sql against a REAL local Postgres 18 cluster
 * (embedded-postgres binaries):
 *   1. fresh database  -> full run must succeed, all 36 tables present
 *   2. re-run on same  -> must succeed idempotently (skips, no errors)
 *   3. partial database (original 0001 applied first) -> must succeed
 *
 * Usage: node scripts/verify-live-setup.mjs
 */
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BIN = path.join(root, 'node_modules', '@embedded-postgres', 'linux-x64', 'native', 'bin');
const initdb = path.join(BIN, 'initdb');
const pgctl = path.join(BIN, 'pg_ctl');
const POSTGRES = path.join(BIN, 'postgres');

const PORT = 54331;
const socketDir = mkdtempSync(path.join(tmpdir(), 'babas-pg-'));
const dataDir = path.join(socketDir, 'data');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function stopCluster() {
  try {
    execFileSync(pgctl, ['-D', dataDir, '-m', 'immediate', 'stop'], { stdio: 'ignore' });
  } catch {
    /* already stopped */
  }
  try {
    rmSync(socketDir, { recursive: true, force: true });
  } catch {
    /* best effort */
  }
}

let cluster;
try {
  console.log('== initdb ==');
  execFileSync(initdb, ['-D', dataDir, '-U', 'postgres', '--auth-local=trust', '--auth-host=trust', '-E', 'UTF8'], {
    stdio: 'inherit',
  });

  console.log('== starting cluster on 127.0.0.1:%d ==', PORT);
  cluster = spawn(
    POSTGRES,
    [
      '-D', dataDir,
      '-c', `port=${PORT}`,
      '-c', 'listen_addresses=127.0.0.1',
      '-c', `unix_socket_directories=${socketDir}`,
      '-c', 'shared_buffers=16MB',
      '-c', 'dynamic_shared_memory_type=posix',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );
  let up = false;
  for (let i = 0; i < 50; i++) {
    await sleep(200);
    try {
      const t = new pg.Client({ host: '127.0.0.1', port: PORT, user: 'postgres', database: 'postgres' });
      await t.connect();
      const r = await t.query('select 1');
      await t.end();
      if (r) {
        up = true;
        break;
      }
    } catch {
      /* not up yet */
    }
  }
  if (!up) throw new Error('postgres did not come up: ' + (cluster.stdout && cluster.stdout.read()));

  const notes = [];
  const client = new pg.Client({ host: '127.0.0.1', port: PORT, user: 'postgres', database: 'postgres' });
  client.on('notice', (n) => notes.push(n.message.trim()));
  await client.connect();

  // ---- Emulate the Supabase platform objects the migrations expect ----------
  console.log('== emulating Supabase platform objects ==');
  const emulate = async (db) => {
    const c = new pg.Client({ host: '127.0.0.1', port: PORT, user: 'postgres', database: db });
    c.on('notice', () => {});
    await c.connect();
    await c.query(`
      DO $r$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
      END $r$;
      CREATE SCHEMA IF NOT EXISTS auth;
      CREATE TABLE IF NOT EXISTS auth.users (
        id uuid PRIMARY KEY,
        email text,
        raw_user_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
        LANGUAGE sql STABLE AS $fn$
          SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
        $fn$;
    `);
    await c.end();
  };
  await emulate('postgres');

  const setupSql = readFileSync(path.join(root, 'supabase', 'live-setup.sql'), 'utf8');
  const mig1 = readFileSync(
    path.join(root, 'supabase', 'migrations', '20260828132533_0001_phase1_foundation.sql'),
    'utf8'
  );

  async function countTables(db) {
    const q = new pg.Client({ host: '127.0.0.1', port: PORT, user: 'postgres', database: db });
    q.on('notice', () => {});
    await q.connect();
    const r = await q.query(
      `SELECT count(*)::int FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'`
    );
    await q.end();
    return r.rows[0].count;
  }

  let failures = 0;
  const check = (name, ok, detail = '') => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
    if (!ok) failures++;
  };

  // ---- 1. fresh run ----------------------------------------------------------
  console.log('== 1) live-setup.sql on FRESH database ==');
  notes.length = 0;
  try {
    await client.query(setupSql);
    check('fresh run: no errors', true);
  } catch (e) {
    check('fresh run: no errors', false, e.message.slice(0, 300));
  }
  check('fresh run: 36 tables present', (await countTables('postgres')) === 36,
    `found ${await countTables('postgres')}`);
  const fn = notes.filter((n) => n.startsWith('['));
  const skippedFresh = fn.filter((n) => n.startsWith('[skip'));
  check('fresh run: nothing skipped (clean apply)', skippedFresh.length === 0,
    skippedFresh.length ? `${skippedFresh.length} skipped` : 'clean');

  // ---- 2. idempotent re-run --------------------------------------------------
  console.log('== 2) re-run on same database (idempotency) ==');
  notes.length = 0;
  try {
    await client.query(setupSql);
    check('re-run: no errors', true);
  } catch (e) {
    check('re-run: no errors', false, e.message.slice(0, 300));
  }
  check('re-run: still exactly 36 tables', (await countTables('postgres')) === 36,
    `found ${await countTables('postgres')}`);
  const skippedAgain = notes.filter((n) => n.startsWith('[skip'));
  check('re-run: objects correctly detected as present', skippedAgain.length >= 11,
    `${skippedAgain.length} skips reported`);
  console.log('  sample skips:', skippedAgain.slice(0, 4).map((s) => s.slice(0, 70)).join(' | '));
  // seed data must not be duplicated (any system role name more than once)
  const dups = await client.query(
    `SELECT name, count(*)::int AS c FROM public.roles WHERE is_system = true GROUP BY name HAVING count(*) > 1`
  );
  check('re-run: no duplicated system roles', dups.rows.length === 0,
    dups.rows.length ? dups.rows.map((r) => `${r.name} x${r.c}`).join(', ') : `${(await client.query('SELECT count(*)::int FROM public.roles WHERE is_system = true')).rows[0].count} system roles, all unique`);

  // ---- 2b. pre-existing duplicates get repaired by the 0.5 dedup section -----
  console.log('== 2b) pre-existing duplicate system roles are repaired ==');
  await client.query(`
    INSERT INTO public.roles (name, description, is_system)
    SELECT name, 'dup', true FROM public.roles WHERE is_system = true AND name = 'cashier';
  `);
  const beforeDedup = (await client.query(`SELECT count(*)::int FROM public.roles WHERE is_system AND name='cashier'`)).rows[0].count;
  notes.length = 0;
  try {
    await client.query(setupSql);
    check('dedup re-run: no errors', true);
  } catch (e) {
    check('dedup re-run: no errors', false, e.message.slice(0, 200));
  }
  const afterDedup = (await client.query(`SELECT count(*)::int FROM public.roles WHERE is_system AND name='cashier'`)).rows[0].count;
  check('dedup: duplicate cashier role removed', beforeDedup === 2 && afterDedup === 1,
    `before=${beforeDedup} after=${afterDedup}`);

  // ---- 3. partial database: original 0001 first, then full setup -------------
  console.log('== 3) live-setup.sql on PARTIAL database (0001 pre-applied) ==');
  await client.query('CREATE DATABASE partial');
  await emulate('partial');
  const p = new pg.Client({ host: '127.0.0.1', port: PORT, user: 'postgres', database: 'partial' });
  p.on('notice', () => {});
  await p.connect();
  let partialOk = true;
  try {
    await p.query(mig1);
  } catch (e) {
    partialOk = false;
    console.log('  (0001 pre-apply error: ' + e.message.slice(0, 120) + ')');
  }
  try {
    await p.query(setupSql);
    check('partial db: live-setup run ok', true);
  } catch (e) {
    check('partial db: live-setup run ok', false, e.message.slice(0, 300));
  }
  check('partial db: 36 tables present', (await countTables('partial')) === 36,
    `found ${await countTables('partial')}`);

  await client.end();
  p.end();

  console.log(failures === 0 ? '\n===== LIVE-SETUP VERIFICATION: ALL PASS =====' : `\n===== ${failures} CHECKS FAILED =====`);
  process.exitCode = failures === 0 ? 0 : 1;
} finally {
  stopCluster();
}
