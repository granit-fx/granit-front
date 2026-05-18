import { scanLocaleParity } from '@granit/arch-tests-kit';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT, listPackages, toModules } from './helpers.js';

const ctx = { modules: toModules(listPackages()), repoRoot: REPO_ROOT };

describe('i18n (delegated to kit)', () => {
  it('every locales/ ships en.ts, fr.ts, index.ts + matching TranslationsEn/Fr constants', () => {
    expect(scanLocaleParity(ctx)).toEqual([]);
  });
});
