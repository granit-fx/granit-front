import fs from 'node:fs';
import path from 'node:path';

import { isTestFile, isTestingDir, rel, walkSourceFiles } from '../fs';

import { collectImports } from './imports';

import type { ScanContext, Violation } from '../types';

export interface UndeclaredDepsOptions extends ScanContext {
  /**
   * Where to read each module's `package.json`. Defaults to
   * `<dir>/package.json` (works for npm packages).
   */
  packageJsonPath?: (m: { dir: string }) => string;
  /**
   * Bare specifiers (or package names) to never flag — e.g. ambient
   * globals provided by the build that have no `package.json` entry.
   */
  ignore?: ReadonlyArray<string>;
}

type DepSection = Record<string, string>;
interface PkgJson {
  name?: string;
  dependencies?: DepSection;
  peerDependencies?: DepSection;
  devDependencies?: DepSection;
  optionalDependencies?: DepSection;
}

/** Reduce an import specifier to the npm package name (scope-aware). */
function packageName(spec: string): string {
  if (spec.startsWith('@')) {
    const [scope = spec, name] = spec.split('/');
    return name ? `${scope}/${name}` : scope;
  }
  return spec.split('/')[0] ?? spec;
}

/**
 * A specifier we should not resolve to an npm package: relative paths, Node
 * builtins, Vite virtual/query modules, and tsconfig path aliases (`@/…`,
 * `~/…`). Bare scopes with no package name (`@/lib`) are aliases, not packages.
 */
function isNonPackageSpecifier(spec: string): boolean {
  return (
    spec.startsWith('.') ||
    spec.startsWith('node:') ||
    spec.startsWith('virtual:') ||
    spec.startsWith('@/') ||
    spec.startsWith('~') ||
    spec.includes('?')
  );
}

function declaredDeps(pkg: PkgJson): Set<string> {
  return new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
    ...Object.keys(pkg.optionalDependencies ?? {}),
  ]);
}

function isRuntimeFile(file: string): boolean {
  return !isTestFile(file) && !isTestingDir(file);
}

function scanModuleImports(
  m: UndeclaredDepsOptions['modules'][number],
  declared: Set<string>,
  self: string,
  ignore: Set<string>,
  repoRoot: string
): Violation[] {
  const reported = new Set<string>();
  const violations: Violation[] = [];
  for (const f of walkSourceFiles(m.srcDir, isRuntimeFile)) {
    for (const spec of collectImports(f)) {
      if (isNonPackageSpecifier(spec) || ignore.has(spec)) continue;
      const name = packageName(spec);
      if (name === self || ignore.has(name) || declared.has(name) || reported.has(name)) continue;
      reported.add(name);
      violations.push({
        rule: 'no-undeclared-dep',
        module: m.name,
        file: rel(f, repoRoot),
        message: `imports "${name}" but it is not declared in package.json (add it to dependencies / peerDependencies / devDependencies)`,
      });
    }
  }
  return violations;
}

/**
 * Every bare import in a module's runtime source must be declared in that
 * module's own `package.json` (any of deps / peerDeps / devDeps /
 * optionalDeps). Source-direct packages are consumed by `link:`, so an
 * undeclared dep resolves through the workspace hoist locally but breaks for
 * external consumers — this catches the phantom before it ships.
 *
 * Test and `testing/` files are skipped (their tooling is provided by the
 * consuming context). Comments are stripped, so documented `import` examples
 * in JSDoc never false-positive.
 */
export function scanUndeclaredDeps(opts: UndeclaredDepsOptions): Violation[] {
  const resolvePkgJson = opts.packageJsonPath ?? ((m) => path.join(m.dir, 'package.json'));
  const ignore = new Set(opts.ignore ?? []);
  const out: Violation[] = [];

  for (const m of opts.modules) {
    const pkgPath = resolvePkgJson(m);
    if (!fs.existsSync(pkgPath)) continue;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as PkgJson;
    const declared = declaredDeps(pkg);
    const self = pkg.name ?? m.name;
    out.push(...scanModuleImports(m, declared, self, ignore, opts.repoRoot));
  }

  return out;
}
