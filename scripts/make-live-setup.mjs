/**
 * Generates supabase/live-setup.sql — a single, fully idempotent script that
 * brings a Supabase project to the complete BABAS POS schema (migrations
 * 0001-0008) regardless of its current state.
 *
 * Every statement is wrapped in a DO block that executes it and silently
 * skips "already exists" class errors (42P07, 42710, 42701, 23505, 0A000,
 * 428C9); any other error is re-raised so real problems still surface.
 *
 * Usage: node scripts/make-live-setup.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migDir = path.join(root, 'supabase', 'migrations');

const files = [
  '20260828132533_0001_phase1_foundation.sql',
  '20260828140000_0002_phase2_dashboard_sales_stock.sql',
  '20260828150000_0003_phase3_products_inventory_movements.sql',
  '20260828160000_0006_phase6_crm_customers_segments.sql',
  '20260828170000_0007_phase7_suppliers_purchases_expenses.sql',
  '20260901000000_0008_phase8_notifications_activity_approvals_returns.sql',
  '20260902000000_0009_rls_recursion_fix.sql',
];

// Split SQL text into top-level statements. Aware of $$ dollar-quotes,
// single quotes (with '' escapes), double quotes, and line/block comments.
function splitStatements(src) {
  const stmts = [];
  let cur = '';
  let i = 0;
  let inSQuote = false;
  let inDQuote = false;
  let dollarTag = null;
  while (i < src.length) {
    const ch = src[i];
    const two = src.slice(i, i + 2);

    if (dollarTag) {
      if (src.startsWith(dollarTag, i)) {
        cur += dollarTag;
        i += dollarTag.length;
        dollarTag = null;
      } else {
        cur += ch;
        i++;
      }
      continue;
    }
    if (inSQuote) {
      cur += ch;
      if (ch === "'") {
        if (src[i + 1] === "'") {
          cur += "'";
          i += 2;
          continue;
        }
        inSQuote = false;
      }
      i++;
      continue;
    }
    if (inDQuote) {
      cur += ch;
      if (ch === '"') inDQuote = false;
      i++;
      continue;
    }
    // Dollar-quote start: bare $$ or $tag$ (tag may be any non-$ text)
    const dollar = /^\$([^$]*)\$/.exec(src.slice(i));
    if (dollar) {
      dollarTag = `$${dollar[1]}$`;
      cur += dollarTag;
      i += dollarTag.length;
      continue;
    }
    if (ch === "'") {
      inSQuote = true;
      cur += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inDQuote = true;
      cur += ch;
      i++;
      continue;
    }
    if (two === '--') {
      const nl = src.indexOf('\n', i);
      const end = nl === -1 ? src.length : nl;
      cur += src.slice(i, end);
      i = end;
      continue;
    }
    if (two === '/*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end === -1 ? src.length : end + 2;
      cur += src.slice(i, stop);
      i = stop;
      continue;
    }
    if (ch === ';') {
      stmts.push(cur);
      cur = '';
      i++;
      continue;
    }
    cur += ch;
    i++;
  }
  if (cur.trim()) stmts.push(cur);
  return stmts;
}

const SKIP_CODES = "IN ('42P07','42710','42701','23505','0A000','428C9')";

function wrapInner(sqlText) {
  const escaped = sqlText.replace(/'/g, "''");
  return `DO $setup$
BEGIN
  EXECUTE '${escaped}';
EXCEPTION WHEN OTHERS THEN
  IF SQLSTATE ${SKIP_CODES} THEN
    RAISE NOTICE '[skip: already present] %', LEFT(SQLERRM, 90);
  ELSE
    RAISE;
  END IF;
END
$setup$;`;
}

// The system-roles seed has no unique constraint on name, so its
// "ON CONFLICT DO NOTHING" cannot stop duplicates on re-runs. Rewrite it
// as a name-guarded DO block that only inserts roles that don't exist yet.
const ROLES_SEED = /^INSERT INTO public\.roles\s*\(([^)]*)\)\s*VALUES\s*([\s\S]*?)\s*ON CONFLICT DO NOTHING\s*$/i;

function wrap(stmt) {
  const clean = stmt.trim();
  if (!clean) return '';
  // Statements may carry leading line-comments; anchor on the INSERT itself.
  const insertAt = clean.search(/^\s*INSERT INTO public\.roles/m);
  const body = insertAt === -1 ? clean : clean.slice(insertAt).trim();
  const prefix = insertAt === -1 ? '' : clean.slice(0, insertAt);
  const m = ROLES_SEED.exec(body);
  if (m) {
    const cols = m[1].split(',').map((c) => c.trim());
    // Type the NULL business_id columns so VALUES inference can't resolve
    // the column as text (breaks the uuid IS NOT DISTINCT FROM comparison).
    const values = m[2].replace(/\(\s*NULL\s*,/g, '(NULL::uuid,');
    return prefix + wrapInner(`DO $seed$
BEGIN
  INSERT INTO public.roles (${cols.join(', ')})
  SELECT v.*
  FROM (VALUES
${values}
  ) AS v(${cols.join(', ')})
  WHERE NOT EXISTS (
    SELECT 1 FROM public.roles r
    WHERE r.name = v.name
      AND r.is_system = true
      AND r.business_id IS NOT DISTINCT FROM v.business_id
  );
END
$seed$`);
  }
  return wrapInner(clean);
}

const out = [];
out.push(`-- ============================================================================
-- BABAS POS — LIVE SUPERBASE SETUP (single idempotent script)
-- Generated by scripts/make-live-setup.mjs from migrations 0001-0008.
--
-- HOW TO RUN:
--   1. Open your Supabase project → SQL Editor → New query.
--   2. Paste this ENTIRE file and click Run.
--   3. Check the "Schema state report" notices at the top of the output:
--      every table should end up [ok].
--
-- This script is IDEMPOTENT: safe to run on a fresh project, on a project
-- with a partial/old schema, or again later. "already present" objects are
-- skipped (notice), real errors still abort with a message.
-- ============================================================================
`);

// --- Section 0: schema state report (before) --------------------------------
const tables = new Set();
for (const f of files) {
  const src = readFileSync(path.join(migDir, f), 'utf8');
  for (const m of src.matchAll(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(?:public\.)?(\w+)/g)) {
    tables.add(m[1]);
  }
}
const tableList = [...tables].sort();
out.push(`
-- ---------------------------------------------------------------------------
-- 0. Schema state report (BEFORE applying)
-- ---------------------------------------------------------------------------
DO $report$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT x FROM unnest(ARRAY[${tableList.map((t) => `'${t}'`).join(', ')}]) x LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t.x) THEN
      RAISE NOTICE '[present]   %', t.x;
    ELSE
      RAISE NOTICE '[MISSING]   %', t.x;
    END IF;
  END LOOP;
END
$report$;
`);

// --- Section 0.5: repair duplicate system roles from earlier runs -------------
out.push(`
-- ---------------------------------------------------------------------------
-- 0.5 Repair duplicates (system roles) left by earlier non-idempotent runs
-- ---------------------------------------------------------------------------
DO $dedup$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'roles'
  ) THEN
    -- Keep only the oldest row per (name, business_id); drop all newer copies
    DELETE FROM public.roles a
    WHERE a.is_system = true
      AND EXISTS (
        SELECT 1 FROM public.roles b
        WHERE b.name = a.name
          AND b.is_system = true
          AND b.business_id IS NOT DISTINCT FROM a.business_id
          AND (b.created_at, b.id) < (a.created_at, a.id)
      );
  END IF;
END
$dedup$;
`);

// --- Sections 1..6: wrapped migrations ---------------------------------------
files.forEach((f, idx) => {
  const src = readFileSync(path.join(migDir, f), 'utf8');
  out.push(`
-- ---------------------------------------------------------------------------
-- ${idx + 1}. ${f}
-- ---------------------------------------------------------------------------
`);
  const stmts = splitStatements(src);
  for (const s of stmts) {
    const w = wrap(s);
    if (w) out.push(w + '\n');
  }
});

// --- Final report --------------------------------------------------------------
out.push(`
-- ---------------------------------------------------------------------------
-- Final report (AFTER applying)
-- ---------------------------------------------------------------------------
DO $report$
DECLARE
  t record;
  n bigint;
BEGIN
  FOR t IN SELECT x FROM unnest(ARRAY[${tableList.map((t) => `'${t}'`).join(', ')}]) x LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t.x) THEN
      RAISE EXCEPTION 'Table % is still MISSING after setup — check the errors above', t.x;
    END IF;
  END LOOP;
  SELECT count(*) INTO n FROM public.roles WHERE is_system = true;
  RAISE NOTICE 'system roles seeded: %', n;
  SELECT count(*) INTO n FROM public.permissions;
  RAISE NOTICE 'permissions seeded: %', n;
  SELECT count(*) INTO n FROM public.role_permissions;
  RAISE NOTICE 'role_permission links: %', n;
  RAISE NOTICE '=== LIVE SETUP COMPLETE: all % tables present ===', ${tableList.length};
END
$report$;
`);

const outPath = path.join(root, 'supabase', 'live-setup.sql');
writeFileSync(outPath, out.join('\n'));
console.log(`wrote ${outPath} (${out.join('\n').split('\n').length} lines, ${tableList.length} tables tracked)`);
