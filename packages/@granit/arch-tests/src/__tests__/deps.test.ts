import { scanUndeclaredDeps } from '@granit/arch-tests-kit';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT, listPackages, toModules } from './helpers';

const packages = listPackages();
const ctx = { modules: toModules(packages), repoRoot: REPO_ROOT };

describe('deps (delegated to kit)', () => {
  it('every bare import is declared in the package own package.json', () => {
    expect(scanUndeclaredDeps(ctx)).toEqual([]);
  });
});

describe('deps: react-* declares its core counterpart', () => {
  const coreNames = new Set(packages.map((p) => p.name));
  // Only react-* packages whose core sibling actually exists in the workspace.
  const reactWithCore = packages.filter(
    (p) => p.isReact && coreNames.has(`@granit/${p.dirName.replace(/^react-/, '')}`)
  );

  it.each(reactWithCore.map((p) => [p.name, p]))(
    '%s lists its core @granit/* counterpart as a (peer)dependency',
    (_n, pkg) => {
      const core = `@granit/${pkg.dirName.replace(/^react-/, '')}`;
      const declared = {
        ...((pkg.packageJson.dependencies ?? {}) as Record<string, string>),
        ...((pkg.packageJson.peerDependencies ?? {}) as Record<string, string>),
      };
      expect(
        Object.keys(declared),
        `react package ${pkg.name} must declare its core counterpart ${core}`
      ).toContain(core);
    }
  );
});
