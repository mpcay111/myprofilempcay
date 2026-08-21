/**
 * Fills gaps in the stored document from content/profile.ts.
 *
 *   node scripts/seed-missing.mjs            # report only
 *   node scripts/seed-missing.mjs --write    # apply
 *
 * Why this exists: the site stores its content as one JSON document, and the
 * schema gives new fields a default. So the moment a feature adds a field, the
 * already-saved document is missing it and quietly renders the empty default —
 * the seed written in profile.ts never appears, because the database row wins.
 *
 * This only ever ADDS. A key already present and non-empty in the stored
 * document is left alone whatever it contains, and a key whose seed is itself
 * empty is skipped. It cannot overwrite anything written in the admin, which is
 * the point: running it by mistake should be boring.
 *
 * The field list is read out of siteContentSchema rather than written here, so
 * profile.ts's derived helpers (orderedProjects, allTechnologies) and its
 * legacy `navigation` export are never mistaken for document fields.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { createClient } from '@supabase/supabase-js';

const WRITE = process.argv.includes('--write');

/** The top-level keys of siteContentSchema, read from the schema source. */
function documentFields() {
  const src = fs.readFileSync(path.join(process.cwd(), 'lib', 'content', 'schema.ts'), 'utf8');
  const start = src.indexOf('export const siteContentSchema = z.object({');
  if (start === -1) throw new Error('siteContentSchema not found in lib/content/schema.ts');

  // Walk braces from the opening one so nested objects cannot end the block early.
  let depth = 0;
  let end = -1;
  for (let i = src.indexOf('{', start); i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) throw new Error('Could not find the end of siteContentSchema');

  const body = src.slice(src.indexOf('{', start) + 1, end);

  // Top-level keys sit at exactly two spaces of indentation.
  return [...body.matchAll(/^ {2}(\w+):/gm)].map((m) => m[1]);
}

async function main() {
  /* ── Environment ──────────────────────────────────────────────────────── */

  const envFile = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    return 1;
  }

  /* ── Load the seed ────────────────────────────────────────────────────── */

  // profile.ts is types and object literals with no imports, so transpiling it
  // standalone is enough — no module resolution, no bundler.
  const source = fs.readFileSync(path.join(process.cwd(), 'content', 'profile.ts'), 'utf8');
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seed-'));
  const tmp = path.join(dir, 'profile.mjs');
  fs.writeFileSync(tmp, js, 'utf8');

  let seed;
  try {
    seed = await import(pathToFileURL(tmp).href);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }

  const fields = documentFields();

  /* ── Compare ──────────────────────────────────────────────────────────── */

  const isEmpty = (v) =>
    v === undefined ||
    v === null ||
    (Array.isArray(v) && v.length === 0) ||
    (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);

  const missing = (doc, k) => !(k in doc) || isEmpty(doc[k]);

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: row, error } = await supabase
    .from('site_content')
    .select('data')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    console.error('Read failed:', error.message);
    return 1;
  }
  if (!row) {
    console.log('No stored document yet — the site is serving the seed already. Nothing to do.');
    return 0;
  }

  const stored = row.data;
  const additions = {};
  const noSeed = [];

  for (const field of fields) {
    if (!missing(stored, field)) continue;
    if (!(field in seed)) {
      noSeed.push(field);
      continue;
    }
    if (isEmpty(seed[field])) continue;
    additions[field] = seed[field];
  }

  const keys = Object.keys(additions);

  if (noSeed.length > 0) {
    console.log(`(no seed value in profile.ts, left alone: ${noSeed.join(', ')})\n`);
  }

  if (keys.length === 0) {
    console.log('Stored document already has every seeded field. Nothing to add.');
    return 0;
  }

  for (const k of keys) {
    const v = additions[k];
    const size = Array.isArray(v) ? `${v.length} items` : typeof v;
    console.log(`+ ${k} (${size})${k in stored ? '  [present but empty]' : '  [absent]'}`);
  }

  if (!WRITE) {
    console.log(`\n${keys.length} field(s) would be added. Re-run with --write to apply.`);
    return 0;
  }

  const { error: writeError } = await supabase
    .from('site_content')
    .update({ data: { ...stored, ...additions } })
    .eq('id', 1);

  if (writeError) {
    console.error('Write failed:', writeError.message);
    return 1;
  }

  // Verify from a fresh read rather than trusting the write.
  const { data: after } = await supabase
    .from('site_content')
    .select('data')
    .eq('id', 1)
    .maybeSingle();

  const stillMissing = keys.filter((k) => missing(after.data, k));
  if (stillMissing.length > 0) {
    console.error(`\nFAILED — still missing after write: ${stillMissing.join(', ')}`);
    return 1;
  }

  console.log(`\nAdded ${keys.length} field(s). Verified by re-reading the row.`);
  console.log(
    '\nNote: the site caches the document and only revalidates it on an admin\n' +
      'save, so a running site keeps serving the old copy until it is rebuilt or\n' +
      'saved once in the admin. A deploy picks this up on its own, because the\n' +
      'pages are prerendered against a fresh read at build time.',
  );
  return 0;
}

process.exitCode = await main();
