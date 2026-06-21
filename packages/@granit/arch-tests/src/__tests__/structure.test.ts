import fs from 'node:fs';
import path from 'node:path';

import { scanForbiddenStructure } from '@granit/arch-tests-kit';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT, listPackages, toModules } from './helpers';

const packages = listPackages();

describe('structure: src/index.ts barrel', () => {
  it.each(packages.map((p) => [p.name, p]))('%s has a single src/index.ts barrel', (_name, pkg) => {
    expect(fs.existsSync(path.join(pkg.srcDir, 'index.ts'))).toBe(true);
    // No competing barrels
    for (const sibling of ['main.ts', 'public.ts', 'index.tsx']) {
      expect(fs.existsSync(path.join(pkg.srcDir, sibling))).toBe(false);
    }
  });
});

describe('structure: no flat types.ts at src root', () => {
  it.each(packages.map((p) => [p.name, p]))('%s does not have src/types.ts', (_name, pkg) => {
    expect(fs.existsSync(path.join(pkg.srcDir, 'types.ts'))).toBe(false);
  });
});

describe('structure: no endpoints/ directory', () => {
  it.each(packages.map((p) => [p.name, p]))('%s has no src/endpoints/', (_name, pkg) => {
    expect(fs.existsSync(path.join(pkg.srcDir, 'endpoints'))).toBe(false);
  });
});

describe('structure: core/react layering seam (delegated to kit)', () => {
  it('core packages carry no React dirs; react packages carry no api/', () => {
    // scanForbiddenStructure reads the seam from Module.isReact: core →
    // no hooks/components/providers/field-components, react → no api/.
    expect(scanForbiddenStructure({ modules: toModules(packages), repoRoot: REPO_ROOT })).toEqual(
      []
    );
  });
});

describe('structure: query-keys factory only in react packages', () => {
  const cores = packages.filter((p) => !p.isReact);
  it.each(cores.map((p) => [p.name, p]))(
    '%s does not declare query-keys.ts (belongs in react-*)',
    (_n, pkg) => {
      expect(fs.existsSync(path.join(pkg.srcDir, 'hooks', 'query-keys.ts'))).toBe(false);
      expect(fs.existsSync(path.join(pkg.srcDir, 'query-keys.ts'))).toBe(false);
    }
  );
});

describe('structure: permissions.ts lives only in core packages', () => {
  const reacts = packages.filter((p) => p.isReact);
  it.each(reacts.map((p) => [p.name, p]))('%s does not declare permissions.ts', (_n, pkg) => {
    expect(fs.existsSync(path.join(pkg.srcDir, 'permissions.ts'))).toBe(false);
  });
});

describe('structure: tests are co-located in __tests__/ or *.test.ts', () => {
  it.each(packages.map((p) => [p.name, p]))(
    '%s has no root tests/ or test/ directory',
    (_n, pkg) => {
      expect(fs.existsSync(path.join(pkg.dir, 'tests'))).toBe(false);
      expect(fs.existsSync(path.join(pkg.dir, 'test'))).toBe(false);
    }
  );
});
