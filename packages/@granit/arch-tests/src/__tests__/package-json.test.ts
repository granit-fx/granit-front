import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { listPackages } from './helpers';

const packages = listPackages();

const FORBIDDEN_RUNTIME_DEPS = new Set([
  'react',
  'react-dom',
  'react-i18next',
  'react-hook-form',
  '@tanstack/react-query',
  '@tanstack/query-core',
  '@tanstack/react-virtual',
]);

describe('package.json: name matches directory', () => {
  it.each(packages.map((p) => [p.dirName, p]))('%s name === @granit/<dir>', (_n, pkg) => {
    expect(pkg.packageJson.name).toBe(`@granit/${pkg.dirName}`);
  });
});

describe('package.json: type=module', () => {
  it.each(packages.map((p) => [p.name, p]))('%s declares "type": "module"', (_n, pkg) => {
    expect(pkg.packageJson.type).toBe('module');
  });
});

describe('package.json: exports points at src/index.ts', () => {
  it.each(packages.map((p) => [p.name, p]))('%s exports["."] === ./src/index.ts', (_n, pkg) => {
    const exp = pkg.packageJson.exports as Record<string, unknown> | undefined;
    expect(exp).toBeDefined();
    expect(exp!['.']).toBe('./src/index.ts');
  });
});

describe('package.json: no main/module/types at root (source-direct)', () => {
  it.each(packages.map((p) => [p.name, p]))('%s has no main/module/types', (_n, pkg) => {
    expect(pkg.packageJson.main, 'main must not be set').toBeUndefined();
    expect(pkg.packageJson.module, 'module must not be set').toBeUndefined();
    expect(pkg.packageJson.types, 'types must not be set').toBeUndefined();
  });
});

describe('package.json: license is declared', () => {
  it.each(packages.map((p) => [p.name, p]))('%s declares license', (_n, pkg) => {
    expect(typeof pkg.packageJson.license).toBe('string');
  });
});

describe('package.json: framework runtime deps live in peerDependencies', () => {
  it.each(packages.map((p) => [p.name, p]))(
    '%s does not list react/tanstack in dependencies',
    (_n, pkg) => {
      const deps = (pkg.packageJson.dependencies ?? {}) as Record<string, string>;
      const offenders = Object.keys(deps).filter((d) => FORBIDDEN_RUNTIME_DEPS.has(d));
      expect(offenders, `move to peerDependencies: ${offenders.join(', ')}`).toEqual([]);
    }
  );
});

describe('package.json: workspace siblings are referenced via workspace:* protocol', () => {
  it.each(packages.map((p) => [p.name, p]))(
    '%s uses workspace:* for any @granit/* dep',
    (_n, pkg) => {
      const allDeps: Record<string, string> = {
        ...((pkg.packageJson.dependencies ?? {}) as Record<string, string>),
        ...((pkg.packageJson.peerDependencies ?? {}) as Record<string, string>),
        ...((pkg.packageJson.devDependencies ?? {}) as Record<string, string>),
      };
      const offenders: string[] = [];
      for (const [dep, ver] of Object.entries(allDeps)) {
        if (!dep.startsWith('@granit/')) continue;
        // peerDeps may use "*" or "workspace:*"; runtime/dev MUST use workspace:*.
        if (ver === '*') continue;
        if (!ver.startsWith('workspace:')) offenders.push(`${dep}@${ver}`);
      }
      expect(offenders).toEqual([]);
    }
  );
});

describe('package.json: no lockfile committed inside a package', () => {
  it.each(packages.map((p) => [p.name, p]))(
    '%s has no package-lock.json / yarn.lock',
    (_n, pkg) => {
      expect(fs.existsSync(path.join(pkg.dir, 'package-lock.json'))).toBe(false);
      expect(fs.existsSync(path.join(pkg.dir, 'yarn.lock'))).toBe(false);
    }
  );
});
