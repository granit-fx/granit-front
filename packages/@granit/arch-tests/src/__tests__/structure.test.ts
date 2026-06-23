import fs from 'node:fs';
import path from 'node:path';

import { scanForbiddenStructure } from '@granit/arch-tests-kit';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT, STORYBOOK_PAGE_BUDGET, listPackages, toModules } from './helpers';

const packages = listPackages();

/** Recursively collect `*-page.tsx` / `*-dialog.tsx` files under a src dir. */
function listPageDialogFiles(srcDir: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/-(page|dialog)\.tsx$/.test(entry.name)) out.push(full);
    }
  };
  walk(srcDir);
  return out;
}

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

// Storybook coverage ratchet (checklist 7f): a react-ui page/dialog component is
// "covered" when a same-name `*.stories.tsx` sits beside it. Each package must stay
// at or below its frozen budget of storyless pages, so no NEW page/dialog ships
// without a story and the budgets only ever shrink. Absent package ⇒ budget 0.
describe('structure: Storybook coverage ratchet (react-ui page/dialog)', () => {
  const reactUiPackages = packages.filter((p) => p.dirName.startsWith('react-ui-'));

  it.each(reactUiPackages.map((p) => [p.name, p]))(
    '%s ships no more storyless page/dialog components than its frozen budget',
    (name, pkg) => {
      const storyless = listPageDialogFiles(pkg.srcDir)
        .filter((file) => !fs.existsSync(file.replace(/\.tsx$/, '.stories.tsx')))
        .map((file) => path.relative(REPO_ROOT, file));
      const budget = STORYBOOK_PAGE_BUDGET[name] ?? 0;
      // Custom message lists the offenders so a regression points at the file(s).
      expect(
        storyless.length,
        `${name} exceeds its Storybook budget (${budget}). Add a co-located ` +
          `*.stories.tsx (or lower the budget). Storyless page/dialog files:\n` +
          storyless.join('\n')
      ).toBeLessThanOrEqual(budget);
    }
  );
});
