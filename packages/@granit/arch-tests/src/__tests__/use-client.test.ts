import { scanUseClientDirective } from '@granit/arch-tests-kit';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT, RSC_PACKAGES, listPackages, toModules } from './helpers';

const rscSet = new Set(RSC_PACKAGES);
const ctx = {
  modules: toModules(listPackages()).filter((m) => rscSet.has(m.name)),
  repoRoot: REPO_ROOT,
};

describe('use-client (delegated to kit)', () => {
  it("RSC-consumed packages mark every client-hook file with 'use client'", () => {
    expect(scanUseClientDirective(ctx)).toEqual([]);
  });
});
