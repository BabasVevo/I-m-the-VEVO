/**
 * Headless runtime smoke test for BABAS POS.
 * Mounts the real app in jsdom (demo mode), signs in, walks every route,
 * verifies no render crashes, then switches to a cashier role to verify RBAC.
 */
import { JSDOM } from 'jsdom';
import { setTimeout as sleep } from 'node:timers/promises';

const ROUTES = [
  '/dashboard', '/pos', '/sales', '/products', '/categories', '/stock',
  '/purchases', '/suppliers', '/expenses', '/approvals', '/notifications',
  '/customers', '/segments', '/customers/segments', '/reports', '/analytics',
  '/employees', '/staff', '/roles', '/activity-log', '/audit-log',
  '/branches', '/locations', '/settings', '/cash-register', '/campaigns',
  '/promotions', '/coupons', '/messages', '/automation', '/plans',
];

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:3000/',
  pretendToBeVisual: true,
  runScripts: 'outside-only',
});

const { window } = dom;

// ---- globals & polyfills -------------------------------------------------
const errors = [];
window.addEventListener('error', (e) => errors.push(`window.onerror: ${e.message}`));
process.on('unhandledRejection', (r) => errors.push(`unhandledRejection: ${r && r.message ? r.message : String(r)}`));

const realConsoleError = console.error.bind(console);
const consoleErrors = [];
console.error = (...args) => {
  consoleErrors.push(args.map(String).join(' ').slice(0, 300));
  realConsoleError(...args);
};

Object.assign(global, {
  window,
  document: window.document,
  localStorage: window.localStorage,
  history: window.history,
  location: window.location,
  HTMLElement: window.HTMLElement,
  Element: window.Element,
  Node: window.Node,
  Event: window.Event,
  PopStateEvent: window.PopStateEvent,
  CustomEvent: window.CustomEvent,
  MutationObserver: window.MutationObserver,
  getComputedStyle: window.getComputedStyle.bind(window),
  requestAnimationFrame: (cb) => setTimeout(() => cb(Date.now()), 16),
  cancelAnimationFrame: (id) => clearTimeout(id),
  URL: window.URL,
  Blob: window.Blob,
  Image: window.Image,
  CSS: window.CSS,
  DOMParser: window.DOMParser,
  atob: (s) => Buffer.from(s, 'base64').toString('binary'),
  btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
});
Object.defineProperty(global, 'navigator', {
  value: window.navigator,
  writable: true,
  configurable: true,
});

window.matchMedia = window.matchMedia || ((q) => ({
  matches: false,
  media: q,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
}));
class RO { observe() {} unobserve() {} disconnect() {} }
window.ResizeObserver = window.ResizeObserver || RO;
global.ResizeObserver = RO;
class IO { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
window.IntersectionObserver = window.IntersectionObserver || IO;
global.IntersectionObserver = IO;
window.HTMLElement.prototype.scrollIntoView = window.HTMLElement.prototype.scrollIntoView || (() => {});
window.URL.createObjectURL = window.URL.createObjectURL || (() => 'blob:mock');
window.URL.revokeObjectURL = window.URL.revokeObjectURL || (() => {});
window.HTMLCanvasElement.prototype.getContext = window.HTMLCanvasElement.prototype.getContext || (() => null);

// ---- helpers --------------------------------------------------------------
const $body = () => window.document.body;
const text = () => $body().textContent || '';
const isVisible = (t) => text().includes(t);
const clickButtonWith = (label) => {
  const all = Array.from(window.document.querySelectorAll('button, a, [role="button"], div, li, span, p'))
    .filter((el) => (el.textContent || '').includes(label));
  if (all.length === 0) throw new Error(`clickable element not found: "${label}"`);
  // Prefer the most specific element (text length closest to the label),
  // so e.g. a modal row's name span wins over an unrelated table cell.
  const l = label.length;
  const scored = all
    .map((el) => ({ el, dist: Math.abs((el.textContent || '').trim().length - l) }))
    .sort((a, b) => a.dist - b.dist);
  const best = scored.filter((s) => s.dist === scored[0].dist);
  const target = best[best.length - 1].el;
  target.click();
  return target;
};

// Wait until page content stops changing (router re-render complete)
async function settlePage(maxMs = 6000) {
  let prev = '';
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const cur = $body().textContent;
    if (cur === prev) return true;
    prev = cur;
    await sleep(250);
  }
  return false;
}

async function waitFor(cond, timeoutMs = 6000, stepMs = 80) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (cond()) return true;
    await sleep(stepMs);
  }
  return cond();
}

const results = [];
function report(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
}

// ---- boot ------------------------------------------------------------------
await import('../../dist-smoke/smoke.js');
await window.__boot();

// 1. Demo mode boots straight into the dashboard (instant demo session)
const dashShown = await waitFor(() => isVisible('Alex Rivera') && isVisible('BABAS'), 15000);
report('Demo session boots into Dashboard (Super Administrator)', dashShown);
report('No error boundary at boot', !isVisible('Application Notice'));

// 2. /login redirects authenticated users to /dashboard
window.__navigate('/login');
await sleep(500);
const loginRedirected = await waitFor(() => !isVisible('Quick Sign In') && $body().textContent.length > 200, 5000);
report('/login redirects to dashboard when a session exists', loginRedirected && !isVisible('Application Notice'));
window.__navigate('/dashboard');
await sleep(400);

// 3. Super admin sidebar has the full navigation
for (const label of ['Dashboard', 'New Sale', 'Products', 'Categories', 'Stock', 'Purchases',
  'Customers', 'Suppliers', 'Expenses', 'Reports', 'Employees', 'Roles & Permissions',
  'Activity Log', 'Branches', 'Notifications', 'Settings']) {
  if (!isVisible(label)) report(`Sidebar (super admin): ${label}`, false, 'label missing');
}
report('Sidebar (super admin): all sections visible',
  ['Products', 'Suppliers', 'Employees', 'Settings'].every(isVisible));

// 4. Walk every route as super admin — no render crash, no "Access denied"
for (const route of ROUTES) {
  window.__navigate(route);
  await settlePage();
  const rendered = $body().textContent.length > 200;
  const crashed = isVisible('Application Notice');
  const denied = isVisible('Access denied');
  const empty = $body().textContent.trim().length < 50;
  report(`Route ${route}`, rendered && !crashed && !denied && !empty,
    crashed ? 'RENDER CRASH (error boundary shown)' : denied ? 'ACCESS DENIED (unexpected for super admin)' : empty ? 'EMPTY PAGE' : 'ok');
}

// 5. Key screens contain their characteristic content (super admin)
const contentChecks = [
  ['/pos', 'Cart', 'POS cart'],
  ['/products', 'Products', 'products heading'],
  ['/customers', 'Customers', 'customers heading'],
  ['/notifications', 'Notifications', 'notifications heading'],
  ['/reports', 'Reports', 'reports heading'],
  ['/settings', 'Settings', 'settings heading'],
  ['/purchases', 'Purchases', 'purchases heading'],
  ['/expenses', 'Expenses', 'expenses heading'],
  ['/employees', 'Employees', 'employees heading'],
  ['/sales', 'Sales', 'sales heading'],
  ['/stock', 'Stock', 'stock heading'],
  ['/suppliers', 'Suppliers', 'suppliers heading'],
];
for (const [route, marker, label] of contentChecks) {
  window.__navigate(route);
  await settlePage();
  report(`Content ${route} (${label})`, isVisible(marker) && !isVisible('Application Notice'));
}

// 6. RBAC — switch to cashier (Nadia Kaneza) via the Switch Role modal
window.__navigate('/dashboard');
await sleep(300);
clickButtonWith('Switch Role');
const switcherShown = await waitFor(() => isVisible('Nadia Kaneza'), 6000);
report('Switch-role modal opens with demo staff', switcherShown);

clickButtonWith('Nadia Kaneza');
const switched = await waitFor(
  () => (window.localStorage.getItem('babas_demo_prof') || '').includes('Nadia Kaneza'),
  8000
);
report('Identity switched to cashier (Nadia Kaneza)', switched);
await settlePage();

const cashierDenied = ['/settings', '/purchases', '/expenses', '/reports', '/employees', '/suppliers', '/approvals'];
for (const route of cashierDenied) {
  window.__navigate(route);
  await settlePage();
  const denied = await waitFor(() => isVisible('Access denied') || isVisible('Application Notice'), 5000);
  const crashed = isVisible('Application Notice');
  report(`RBAC cashier: ${route} denied`, denied && !crashed,
    crashed ? 'RENDER CRASH' : denied ? 'blocked correctly' : 'NOT blocked (unexpected)');
}

// /branches is viewable for the cashier via the app's alias rule
// (branches.view ← dashboard.view); mutations are gated inside BranchesPage.
const cashierAllowed = ['/dashboard', '/pos', '/sales', '/products', '/customers', '/notifications', '/branches'];
for (const route of cashierAllowed) {
  window.__navigate(route);
  // Wait for the router to actually re-render (previous page's markers must clear)
  const settled = await waitFor(() => !isVisible('Access denied') && !isVisible('Application Notice'), 6000);
  const denied = isVisible('Access denied');
  const crashed = isVisible('Application Notice');
  const ok = settled && $body().textContent.length > 200;
  report(`RBAC cashier: ${route} accessible`, ok && !denied && !crashed,
    denied ? 'unexpectedly blocked' : crashed ? 'RENDER CRASH' : 'ok');
}

// Cashier sidebar must not show admin sections (scoped to the sidebar element)
const sidebarEl = window.document.querySelector('nav aside, aside, nav');
const sbText = sidebarEl ? sidebarEl.textContent || '' : text();
const cashierSidebar = ['Settings', 'Suppliers', 'Employees', 'Reports']
  .every((l) => !sbText.includes(l));
report('RBAC cashier: admin sections hidden from sidebar', cashierSidebar,
  `sidebar contains: ${sbText.replace(/\s+/g, ' ').slice(0, 200)}`);

// 7. Switch back to super admin (full access restored)
window.__navigate('/dashboard');
await settlePage();
clickButtonWith('Switch Role');
const modal2 = await waitFor(() => isVisible('Quick Role & Employee Switcher'), 6000);
report('Switch-role modal reopens', modal2);
await sleep(400);
clickButtonWith('Alex Rivera');
const backSuper = await waitFor(() => isVisible('Settings') && isVisible('Suppliers'), 10000);
report('Switch back to Super Administrator restores full access', backSuper);
window.__navigate('/settings');
await settlePage();
const settingsOpen = !isVisible('Access denied') && isVisible('Settings');
report('Super admin: /settings accessible after switch back', settingsOpen);

// 8. Summary of runtime errors
const relevantErrors = errors.filter((e) =>
  !/favicon|Could not parse CSS|ResizeObserver loop/i.test(e)
);
console.log('\n--- Runtime window errors ---');
console.log(relevantErrors.length ? relevantErrors.slice(0, 20).join('\n') : '(none)');
console.log('--- console.error count ---', consoleErrors.length);

const failed = results.filter((r) => !r.ok);
console.log(`\n===== SMOKE TEST: ${results.length - failed.length}/${results.length} passed, ${failed.length} failed =====`);
if (failed.length) {
  console.log('Failed:');
  failed.forEach((f) => console.log(`  - ${f.name} ${f.detail}`));
  process.exit(1);
}
process.exit(0);
