import {
  scanAnonymousDefaultExports,
  scanUseFormResolver,
  scanWallClockInApi,
} from '@granit/arch-tests-kit';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT, listPackages, toModules } from './helpers';

const ctx = { modules: toModules(listPackages()), repoRoot: REPO_ROOT };

describe('patterns (delegated to kit)', () => {
  it('no anonymous `export default` (breaks DevTools labels & stack traces)', () => {
    expect(scanAnonymousDefaultExports(ctx)).toEqual([]);
  });

  it('api/ helpers do not read the wall clock (Date.now / new Date)', () => {
    expect(scanWallClockInApi(ctx)).toEqual([]);
  });

  it('every useForm() call pairs with a resolver (no silent validation skips)', () => {
    // `react-entities/use-entity-form` is a generic form hook for apps that
    // bring their own validation contract — see the JSDoc on the export.
    expect(
      scanUseFormResolver({
        ...ctx,
        allowedFiles: ['react-entities/src/hooks/use-entity-form.ts'],
      })
    ).toEqual([]);
  });
});
