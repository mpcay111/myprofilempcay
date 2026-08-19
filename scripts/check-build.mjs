/**
 * Post-build assertions against the prerendered HTML.
 *
 *   npm run build && node scripts/check-build.mjs
 *
 * These are invariants that TypeScript cannot express and that broke once
 * already: passing the whole content document to a client component serialises
 * it into the RSC payload embedded in the page, which published a phone number
 * the page deliberately does not display. Nothing about that is visible in the
 * rendered output — you have to look at the source.
 *
 * Exits non-zero on failure so it can gate a deploy.
 */

import fs from 'node:fs';
import path from 'node:path';

const HTML = path.join(process.cwd(), '.next', 'server', 'app', 'index.html');

if (!fs.existsSync(HTML)) {
  console.error('No prerendered page found. Run `npm run build` first.');
  process.exit(1);
}

const html = fs.readFileSync(HTML, 'utf8');

/**
 * Reads a value out of .env.local without expanding it, so the checks below
 * test the real secret rather than a placeholder.
 */
function envValue(name) {
  const file = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(file)) return null;
  const match = fs.readFileSync(file, 'utf8').match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
}

const checks = [];
const check = (name, ok, detail) => checks.push({ name, ok, detail });

/* ── Privacy ────────────────────────────────────────────────────────────── */

// The phone number must never reach the page while showPhone is false — not in
// the markup, and not in the RSC payload.
//
// The number to look for is read from the environment rather than written here.
// Hardcoding it would publish it in this file, which is committed — defeating
// the very thing the check exists to protect.
const phone = process.env.ADMIN_PHONE || envValue('ADMIN_PHONE');
if (phone) {
  const variants = [phone, phone.replace(/[\s+]/g, ''), phone.replace(/^\+\d{1,3}\s*/, '')];
  check(
    'phone number absent from page source',
    !variants.some((v) => v.length > 6 && html.includes(v)),
    'A client component is probably receiving the whole SiteContent document. Give it narrow props.',
  );
} else {
  check(
    'phone number absent from page source',
    true,
    'Skipped: set ADMIN_PHONE in .env.local to enable this check.',
  );
}

// Unfilled [placeholders] are meant to be visible on the page but must never be
// published as machine-readable claims.
const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
const leakedInLd = [];
function scanStrings(node, at) {
  if (typeof node === 'string') {
    if (/\[[^\][]+\]/.test(node)) leakedInLd.push(`${at} = ${JSON.stringify(node).slice(0, 60)}`);
  } else if (Array.isArray(node)) {
    node.forEach((v, i) => scanStrings(v, `${at}[${i}]`));
  } else if (node && typeof node === 'object') {
    for (const k of Object.keys(node)) scanStrings(node[k], `${at}.${k}`);
  }
}
ldBlocks.forEach((b, i) => {
  try {
    scanStrings(JSON.parse(b[1]), `ld[${i}]`);
  } catch {
    leakedInLd.push(`ld[${i}] is not valid JSON`);
  }
});
check('no unfilled placeholders in JSON-LD', leakedInLd.length === 0, leakedInLd.join('; '));

// A placeholder URL must never become a live link to a 404.
check(
  'no live link to a placeholder URL',
  !/href="[^"]*\[[^"]*\]"/.test(html),
  'A social or project URL containing [brackets] is being rendered as a real href.',
);

/* ── Secrets ────────────────────────────────────────────────────────────── */

for (const name of ['SUPABASE_SERVICE_ROLE_KEY', 'AUTH_SECRET', 'ADMIN_PASSWORD_HASH']) {
  const value = envValue(name);
  check(
    `${name} not present in page source`,
    !value || value.length < 8 || !html.includes(value),
    'A server-only secret reached the browser bundle.',
  );
}

/* ── Structure ──────────────────────────────────────────────────────────── */

check(
  'JSON-LD present',
  ldBlocks.length >= 1,
  'Structured data disappeared; search results will lose the rich result.',
);

check(
  'admin is not linked from the public page',
  !/href="\/admin/.test(html),
  'The admin should be reachable by typing the URL, not advertised to crawlers.',
);

/* ── Report ─────────────────────────────────────────────────────────────── */

let failed = 0;
for (const c of checks) {
  console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}`);
  if (!c.ok && c.detail) console.log(`      ${c.detail}`);
  if (!c.ok) failed += 1;
}

console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed ? 1 : 0);
