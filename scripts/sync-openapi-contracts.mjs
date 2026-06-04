#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Vendor the backend OpenAPI contract snapshots into the front repo.
//
// The specs are build artifacts of `Granit.OpenApi.Generator` (granit-dotnet)
// — one document per module, emitted at build time with no running host. They
// are NOT committed on the backend side, so we vendor a snapshot here to keep
// the conformance oracle (@granit/contract-tests) hermetic in CI.
//
// Source → target:
//   <generator>/generated/Granit.OpenApi.Generator_<slug>.json
//     → contracts/openapi/<slug>.json
//
// Usage (from repo root):
//   node scripts/sync-openapi-contracts.mjs                 # all modules
//   node scripts/sync-openapi-contracts.mjs background-jobs # selected slugs
//   GRANIT_DOTNET=/path/to/granit-dotnet node scripts/sync-openapi-contracts.mjs
// ---------------------------------------------------------------------------

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TARGET_DIR = join(REPO_ROOT, 'contracts', 'openapi');

const GRANIT_DOTNET =
  process.env.GRANIT_DOTNET ?? join(os.homedir(), 'dev', 'granit-fx', 'granit-dotnet');
const SOURCE_DIR = join(GRANIT_DOTNET, 'src', 'Granit.OpenApi.Generator', 'generated');

const PREFIX = 'Granit.OpenApi.Generator_';
const filter = process.argv.slice(2);

function slugOf(file) {
  if (!file.startsWith(PREFIX) || !file.endsWith('.json')) return null;
  return file.slice(PREFIX.length, -'.json'.length);
}

if (!existsSync(SOURCE_DIR)) {
  console.error(
    `Source specs not found: ${SOURCE_DIR}\n` +
      `Build Granit.OpenApi.Generator (dotnet build) or set GRANIT_DOTNET to the repo root.`
  );
  process.exit(1);
}

mkdirSync(TARGET_DIR, { recursive: true });

let written = 0;
for (const file of readdirSync(SOURCE_DIR)) {
  const slug = slugOf(file);
  if (!slug) continue; // skips the empty default doc (no _<slug> suffix)
  if (filter.length && !filter.includes(slug)) continue;
  const json = readFileSync(join(SOURCE_DIR, file), 'utf8');
  writeFileSync(join(TARGET_DIR, `${slug}.json`), json);
  console.log(`  vendored ${slug}.json`);
  written++;
}

console.log(`\n${written} contract(s) synced into contracts/openapi/`);
if (written === 0 && filter.length) {
  console.error(`No spec matched the filter: ${filter.join(', ')}`);
  process.exit(1);
}
