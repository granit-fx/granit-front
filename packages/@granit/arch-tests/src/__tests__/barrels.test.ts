import {
  scanBarrelDefaultExports,
  scanLeakedInternals,
  scanOnlySkip,
} from '@granit/arch-tests-kit';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT, listPackages, toModules } from './helpers.js';

const ctx = { modules: toModules(listPackages()), repoRoot: REPO_ROOT };

describe('barrels & test hygiene (delegated to kit)', () => {
  it('src/index.ts has no `export default`', () => {
    expect(scanBarrelDefaultExports(ctx)).toEqual([]);
  });

  it('src/index.ts does not leak underscore-prefixed exports', () => {
    expect(scanLeakedInternals(ctx)).toEqual([]);
  });

  it('no committed .only / .skip in test files', () => {
    expect(scanOnlySkip(ctx)).toEqual([]);
  });
});
