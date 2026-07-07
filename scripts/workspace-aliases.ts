/**
 * Auto-discovers the Vite/Vitest alias map for every workspace package by
 * reading each `packages/@granit/<pkg>/package.json` `exports` field — the
 * single source of truth for entry points. Replaces the hand-maintained
 * alias lists that had to be edited for every new package or subpath.
 *
 * Ordering matters: alias matching is prefix-based, so subpath entries
 * (`@granit/x/testing`) are emitted before their base entry (`@granit/x`),
 * otherwise the base alias would shadow the subpath.
 */
import fs from 'node:fs';
import path from 'node:path';

export function granitWorkspaceAliases(rootDir: string): Record<string, string> {
  const packagesDir = path.join(rootDir, 'packages', '@granit');
  const subpathAliases: Record<string, string> = {};
  const baseAliases: Record<string, string> = {};

  for (const entry of fs.readdirSync(packagesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const manifestPath = path.join(packagesDir, entry.name, 'package.json');
    if (!fs.existsSync(manifestPath)) {
      continue;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
      name?: unknown;
      exports?: unknown;
    };
    const { name, exports: exportsMap } = manifest;
    if (typeof name !== 'string' || typeof exportsMap !== 'object' || exportsMap === null) {
      continue;
    }

    for (const [subpath, target] of Object.entries(exportsMap)) {
      if (typeof target !== 'string' || !subpath.startsWith('.')) {
        continue;
      }
      const specifier = subpath === '.' ? name : `${name}/${subpath.slice(2)}`;
      const resolved = path.join(packagesDir, entry.name, target);
      if (subpath === '.') {
        baseAliases[specifier] = resolved;
      } else {
        subpathAliases[specifier] = resolved;
      }
    }
  }

  return { ...subpathAliases, ...baseAliases };
}
