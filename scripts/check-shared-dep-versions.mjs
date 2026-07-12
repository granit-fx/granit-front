#!/usr/bin/env node
// Fail fast on shared-dependency version drift across the @granit/* workspace.
//
// A handful of singleton libraries MUST resolve to a single copy across every
// package — React and its ecosystem (one renderer instance), the form/i18n/query
// runtimes, and the class-name helpers behind `cn`. When one package pins a
// different constraint (typically a partial Dependabot bump that only touched
// some of the 200+ manifests), pnpm resolves two physical copies and their
// invariant generic types stop matching across package boundaries — exactly the
// react-hook-form 7.80/7.81 split that broke `develop`.
//
// This is the canonical enforcement used by BOTH the `.husky/pre-push` hook and
// the `dep-uniformity` CI job. It is pure Node (no install, no deps) so it runs
// in well under a second. The arch-test `uniformity` (in @granit/arch-tests)
// keeps its own in-suite copy of this list as defense-in-depth — keep the two in
// sync when adding a dependency here.

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGES_DIR = join(REPO_ROOT, 'packages', '@granit');

/**
 * Dependencies that must carry an identical version constraint in every package
 * that declares them. Mirrors the `deps` list of the `uniformity` arch-test.
 */
export const SHARED_DEP_NAMES = [
  'react',
  'react-dom',
  '@tanstack/react-query',
  'react-i18next',
  'react-hook-form',
  'i18next',
  'date-fns',
  'zod',
  'clsx',
  'tailwind-merge',
];

const DEP_BUCKETS = ['dependencies', 'devDependencies', 'peerDependencies'];

/** @returns {Map<string, Map<string, string[]>>} dep -> (constraint -> package names) */
function collectConstraints() {
  const byDep = new Map(SHARED_DEP_NAMES.map((name) => [name, new Map()]));

  for (const entry of readdirSync(PACKAGES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifestPath = join(PACKAGES_DIR, entry.name, 'package.json');
    let manifest;
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    } catch {
      continue; // no package.json (or unreadable) — skip
    }

    for (const dep of SHARED_DEP_NAMES) {
      for (const bucket of DEP_BUCKETS) {
        const constraint = manifest[bucket]?.[dep];
        if (!constraint) continue;
        const seen = byDep.get(dep);
        if (!seen.has(constraint)) seen.set(constraint, []);
        const pkgs = seen.get(constraint);
        if (!pkgs.includes(manifest.name)) pkgs.push(manifest.name);
      }
    }
  }

  return byDep;
}

function main() {
  const byDep = collectConstraints();
  const drifted = [];

  for (const [dep, constraints] of byDep) {
    if (constraints.size <= 1) continue; // absent or uniform
    // Order by descending package count so the dominant constraint reads first.
    const ranked = [...constraints.entries()].sort((a, b) => b[1].length - a[1].length);
    drifted.push({ dep, ranked });
  }

  if (drifted.length === 0) {
    console.log(
      `✓ shared-dep versions uniform across the workspace (${SHARED_DEP_NAMES.length} tracked)`
    );
    return;
  }

  console.error('✗ shared-dependency version drift detected\n');
  for (const { dep, ranked } of drifted) {
    console.error(`  ${dep}:`);
    for (const [constraint, pkgs] of ranked) {
      const sample = pkgs.slice(0, 3).join(', ');
      const more = pkgs.length > 3 ? `, +${pkgs.length - 3} more` : '';
      console.error(`    ${constraint}  (${pkgs.length}×) — ${sample}${more}`);
    }
  }
  console.error(
    '\nAlign every package to a single constraint (usually the dominant one), then' +
      '\nrun `pnpm install` so the lockfile resolves one physical copy.'
  );
  process.exit(1);
}

main();
