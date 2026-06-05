#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Vendor the backend OpenAPI contract snapshots into the front repo.
//
// The specs are build artifacts of the backend OpenAPI generators — one
// document per module, emitted at build time with no running host. They are
// NOT committed on the backend side, so we vendor a snapshot here to keep the
// conformance oracle (@granit/contract-tests) hermetic in CI.
//
// Two backend sources, one per generator:
//   - granit-dotnet  → Granit.OpenApi.Generator     (framework modules)
//   - granit-website → Granit.Cms.OpenApi.Generator (CMS bounded context)
//
// Source → target:
//   <generator>/generated/<prefix><slug>.json → contracts/openapi/<slug>.json
//
// Usage (from repo root):
//   node scripts/sync-openapi-contracts.mjs                 # all modules
//   node scripts/sync-openapi-contracts.mjs background-jobs # selected slugs
//   GRANIT_DOTNET=/path/to/granit-dotnet \
//   GRANIT_WEBSITE=/path/to/granit-website \
//     node scripts/sync-openapi-contracts.mjs
// ---------------------------------------------------------------------------

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TARGET_DIR = join(REPO_ROOT, 'contracts', 'openapi');

const GRANIT_DOTNET =
  process.env.GRANIT_DOTNET ?? join(os.homedir(), 'dev', 'granit-fx', 'granit-dotnet');
const GRANIT_WEBSITE =
  process.env.GRANIT_WEBSITE ?? join(os.homedir(), 'dev', 'granit-fx', 'granit-website');

// Each backend generator: its build-time output dir + the filename prefix it stamps.
const SOURCES = [
  {
    label: 'granit-dotnet',
    dir: join(GRANIT_DOTNET, 'src', 'Granit.OpenApi.Generator', 'generated'),
    prefix: 'Granit.OpenApi.Generator_',
  },
  {
    label: 'granit-website',
    dir: join(GRANIT_WEBSITE, 'src', 'Granit.Cms.OpenApi.Generator', 'generated'),
    prefix: 'Granit.Cms.OpenApi.Generator_',
  },
];

const filter = process.argv.slice(2);

function slugOf(file, prefix) {
  if (!file.startsWith(prefix) || !file.endsWith('.json')) return null;
  return file.slice(prefix.length, -'.json'.length);
}

mkdirSync(TARGET_DIR, { recursive: true });

let written = 0;
let anySource = false;
for (const { label, dir, prefix } of SOURCES) {
  if (!existsSync(dir)) {
    console.warn(`  skipped ${label}: source specs not found at ${dir} (build the generator?)`);
    continue;
  }
  anySource = true;
  for (const file of readdirSync(dir)) {
    const slug = slugOf(file, prefix);
    if (!slug) continue; // skips the empty default doc (no _<slug> suffix)
    if (filter.length && !filter.includes(slug)) continue;
    const json = readFileSync(join(dir, file), 'utf8');
    writeFileSync(join(TARGET_DIR, `${slug}.json`), json);
    console.log(`  vendored ${slug}.json (${label})`);
    written++;
  }
}

if (!anySource) {
  console.error(
    'No backend generator output found. Build Granit.OpenApi.Generator (granit-dotnet) ' +
      'and/or Granit.Cms.OpenApi.Generator (granit-website), or set GRANIT_DOTNET / GRANIT_WEBSITE.'
  );
  process.exit(1);
}

console.log(`\n${written} contract(s) synced into contracts/openapi/`);
if (written === 0 && filter.length) {
  console.error(`No spec matched the filter: ${filter.join(', ')}`);
  process.exit(1);
}
