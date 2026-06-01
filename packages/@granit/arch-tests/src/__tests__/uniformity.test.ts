import { scanReadmePresence, scanSharedDepVersions } from '@granit/arch-tests-kit';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT, listPackages, toModules } from './helpers';

const ctx = { modules: toModules(listPackages()), repoRoot: REPO_ROOT };

describe('uniformity (delegated to kit)', () => {
  it('every package ships a README.md with `# @granit/<name>` as the H1', () => {
    expect(scanReadmePresence(ctx)).toEqual([]);
  });

  it('shared deps use the same version constraint across every package', () => {
    expect(
      scanSharedDepVersions({
        ...ctx,
        deps: [
          'react',
          'react-dom',
          '@tanstack/react-query',
          'react-i18next',
          'react-hook-form',
          'i18next',
          'date-fns',
          'zod',
          'clsx',
          'tailwind-merge',
        ],
      })
    ).toEqual([]);
  });
});
