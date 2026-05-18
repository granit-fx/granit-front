import {
  scanComponentNaming,
  scanFetchVerbInApi,
  scanHookNaming,
  scanKebabCase,
} from '@granit/arch-tests-kit';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT, listPackages, toModules } from './helpers.js';

const modules = toModules(listPackages());
const ctx = { modules, repoRoot: REPO_ROOT };

describe('naming (delegated to @granit/arch-tests-kit)', () => {
  it('every source file is kebab-case', () => {
    expect(scanKebabCase(ctx)).toEqual([]);
  });

  it('hooks/use-*.ts exports a useXxx symbol', () => {
    expect(scanHookNaming(ctx)).toEqual([]);
  });

  it('components/<file>.tsx exports a PascalCase symbol', () => {
    expect(scanComponentNaming(ctx)).toEqual([]);
  });

  it('api/ functions never use the fetch* verb (use get*/list*)', () => {
    expect(scanFetchVerbInApi(ctx)).toEqual([]);
  });
});
