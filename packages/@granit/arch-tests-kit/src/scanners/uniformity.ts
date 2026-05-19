import fs from 'node:fs';
import path from 'node:path';

import { rel } from '../fs.js';

import type { AllowlistedScanContext, ScanContext, Violation } from '../types.js';

const H1_RE = /^#\s+(.+?)\s*$/m;

/**
 * Every module ships a `README.md` introducing it. The H1 (first `#` heading,
 * not necessarily the first line — leading `<img>` / badges are allowed)
 * must read `# <expectedHeading>` so the doc is recognizable without
 * opening it.
 *
 * `expectedHeading` defaults to the module's name, which works for packages
 * (`@granit/foo` matches the published name). Apps can pass a custom
 * resolver via {@link ReadmePresenceOptions.expectedHeading}.
 */
export interface ReadmePresenceOptions extends AllowlistedScanContext {
  /** Compute the expected H1 text for a given module. Defaults to `m.name`. */
  expectedHeading?: (moduleName: string) => string;
}

export function scanReadmePresence(opts: ReadmePresenceOptions): Violation[] {
  const out: Violation[] = [];
  const allowedModules = new Set(opts.allowedModules ?? []);
  const allowedFiles = opts.allowedFiles ?? [];
  const heading = opts.expectedHeading ?? ((name) => name);

  for (const m of opts.modules) {
    if (allowedModules.has(m.name)) continue;
    const readme = path.join(m.dir, 'README.md');
    const relPath = rel(readme, opts.repoRoot);
    if (allowedFiles.some((needle) => relPath.includes(needle))) continue;

    if (!fs.existsSync(readme)) {
      out.push({
        rule: 'readme-presence',
        module: m.name,
        file: relPath,
        message: 'missing README.md (every module ships one for onboarding)',
      });
      continue;
    }
    const src = fs.readFileSync(readme, 'utf8');
    const match = src.match(H1_RE);
    if (!match) {
      out.push({
        rule: 'readme-h1',
        module: m.name,
        file: relPath,
        message: 'README.md has no `# H1` heading',
      });
      continue;
    }
    const expected = heading(m.name);
    if (match[1] !== expected) {
      out.push({
        rule: 'readme-h1',
        module: m.name,
        file: relPath,
        message: `README.md H1 is "${match[1]}", expected "${expected}"`,
      });
    }
  }
  return out;
}

/**
 * For a curated list of dependencies that every package must agree on
 * (React, TanStack Query, …), ensures every package that lists the dep
 * uses the same version constraint. Drift is the most common source of
 * upgrade pain — one package pinning `^5.0.0` while another pins
 * `^5.95.0` produces two resolved versions and breaks shared singletons.
 */
export interface SharedDepVersionsOptions extends ScanContext {
  /**
   * Dependency names to scan. Each must use a single shared version
   * across all packages that declare it.
   */
  deps: ReadonlyArray<string>;
  /**
   * Where to read the `package.json` for each module. Defaults to
   * `<dir>/package.json` (works for npm packages).
   */
  packageJsonPath?: (m: { dir: string }) => string;
  /**
   * Sections to inspect. Defaults to dependencies + peerDependencies +
   * devDependencies — versions must agree across all three.
   */
  sections?: ReadonlyArray<'dependencies' | 'peerDependencies' | 'devDependencies'>;
}

const DEFAULT_SECTIONS = ['dependencies', 'peerDependencies', 'devDependencies'] as const;

export function scanSharedDepVersions(opts: SharedDepVersionsOptions): Violation[] {
  const sections = opts.sections ?? DEFAULT_SECTIONS;
  const resolvePkgJson = opts.packageJsonPath ?? ((m) => path.join(m.dir, 'package.json'));
  const out: Violation[] = [];

  // dep -> Map<version, modules using it>
  const byDep = new Map<string, Map<string, string[]>>();
  for (const dep of opts.deps) byDep.set(dep, new Map());

  for (const m of opts.modules) {
    const f = resolvePkgJson(m);
    if (!fs.existsSync(f)) continue;
    const pkg = JSON.parse(fs.readFileSync(f, 'utf8')) as Record<
      string,
      Record<string, string> | undefined
    >;
    for (const dep of opts.deps) {
      const versions = new Set<string>();
      for (const section of sections) {
        const v = pkg[section]?.[dep];
        if (v !== undefined && !v.startsWith('workspace:') && v !== '*') versions.add(v);
      }
      const distinct = [...versions];
      if (distinct.length === 0) continue;
      if (distinct.length > 1) {
        out.push({
          rule: 'shared-dep-version-drift-within-package',
          module: m.name,
          file: rel(f, opts.repoRoot),
          message: `${dep} is declared with multiple versions in this package: ${distinct.join(', ')}`,
        });
      }
      const v = distinct[0];
      if (v === undefined) continue;
      const slot = byDep.get(dep);
      if (!slot) continue;
      const existing = slot.get(v) ?? [];
      existing.push(m.name);
      slot.set(v, existing);
    }
  }

  for (const dep of opts.deps) {
    const slot = byDep.get(dep);
    if (!slot || slot.size <= 1) continue;
    // More than one distinct version across the workspace.
    const summary = [...slot.entries()]
      .map(([ver, modules]) => `${ver} (${modules.length}× — e.g. ${modules.slice(0, 3).join(', ')})`)
      .join(' vs ');
    // Attribute the violation to the minority versions so the report
    // points at the packages to align.
    const sorted = [...slot.entries()].sort((a, b) => b[1].length - a[1].length);
    const majorityModules = sorted[0]?.[1] ?? [];
    const majority = new Set(majorityModules);
    for (const m of opts.modules) {
      if (majority.has(m.name)) continue;
      // Only flag modules that declared the dep with a non-majority version.
      let declares = false;
      for (const [, modules] of sorted.slice(1)) {
        if (modules.includes(m.name)) {
          declares = true;
          break;
        }
      }
      if (!declares) continue;
      out.push({
        rule: 'shared-dep-version-drift',
        module: m.name,
        file: rel(resolvePkgJson(m), opts.repoRoot),
        message: `${dep} version differs from the majority — align with the dominant constraint. Workspace state: ${summary}`,
      });
    }
  }

  return out;
}
