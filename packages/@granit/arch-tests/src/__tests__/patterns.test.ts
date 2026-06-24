import {
  scanAnonymousDefaultExports,
  scanEmptyCatch,
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

  it('no empty catch blocks (errors must be logged, rethrown, or handled)', () => {
    // Each exemption is a reviewed, genuinely-benign swallow — NOT an unhandled
    // error. New empty catches outside this list must log, rethrow, or fall back.
    expect(
      scanEmptyCatch({
        ...ctx,
        allowedFiles: [
          // Error surfaces via state and is already logged in the owning hook —
          // the catch only prevents an unhandled rejection (double-logging would
          // be worse than this empty body).
          'react-blob-storage/src/components/blob-upload-field.tsx',
          'react-documents/src/components/upload-button.tsx',
          // Defensive HTMLDialogElement.showModal() — throws only on an
          // already-open dialog (jsdom corner case); nothing to handle.
          'react-documents/src/components/document-quick-look.tsx',
          'react-documents/src/components/document-search-palette.tsx',
          'react-documents/src/components/transfer-ownership-dialog.tsx',
          // Best-effort localStorage writes — quota/disabled is ignorable and
          // the package ships no logger; reads already fall back to null.
          'react-documents/src/hooks/use-document-bookmarks.ts',
          'react-documents/src/hooks/use-view-preferences.ts',
          // Build-time conformance tool (not shipped runtime) — skipping an
          // unreadable/out-of-tree import is normal operation.
          'contract-tests/src/conformance.ts',
        ],
      })
    ).toEqual([]);
  });

  it('every useForm() call pairs with a resolver (no silent validation skips)', () => {
    // `react-entities/use-entity-form` is a generic form hook for apps that
    // bring their own validation contract — see the JSDoc on the export.
    expect(
      scanUseFormResolver({
        ...ctx,
        allowedFiles: [
          'react-entities/src/hooks/use-entity-form.ts',
          // Storybook demo: FormDialog is form-agnostic (the host owns the
          // form); the story wires a throwaway useForm purely to render the
          // dialog chrome, so it needs no validation contract.
          'react-ui-kit/src/form-dialog/form-dialog.stories.tsx',
        ],
      })
    ).toEqual([]);
  });
});
