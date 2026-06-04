import { scanDomScriptSinks } from '@granit/arch-tests-kit';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT, listPackages, toModules } from './helpers';

const ctx = { modules: toModules(listPackages()), repoRoot: REPO_ROOT };

describe('csp (delegated to kit)', () => {
  it('every package writing to a DOM-script sink ships a <pkg>/csp subpath', () => {
    // Mirrors `pnpm check:csp` inside the Vitest suite. Packages that legitimately
    // touch a sink (react-map, react-authentication-keycloak) already ship
    // src/csp/index.ts and pass without an allowlist.
    expect(scanDomScriptSinks(ctx)).toEqual([]);
  });
});
