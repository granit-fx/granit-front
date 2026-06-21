import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  collectImports,
  hasBannedConsole,
  isTestFile,
  isTestingDir,
  scanAnonymousDefaultExports,
  scanAxiosImports,
  scanBarrelDefaultExports,
  scanComponentNaming,
  scanConsole,
  scanDomScriptSinks,
  scanEmptyCatch,
  scanFetch,
  scanFetchVerbInApi,
  scanForbiddenStructure,
  scanHookNaming,
  scanKebabCase,
  scanLeakedInternals,
  scanLocaleParity,
  scanOnlySkip,
  scanReadmePresence,
  scanSharedDepVersions,
  scanUndeclaredDeps,
  scanUseClientDirective,
  scanUseFormResolver,
  scanWallClockInApi,
  stripComments,
  walkSourceFiles,
} from '../index';

import type { Module } from '../types';

// These scanners are negative assertions in the framework suite (run against a
// clean monorepo: `expect(scan(ctx)).toEqual([])`). That proves they DON'T
// false-positive, but a scanner whose regex silently matches nothing would also
// pass — the classic always-green trap. The fixtures below feed each scanner a
// crafted violation and assert it IS caught, then a clean counterpart and assert
// it is NOT. Together they pin the scanner's real behaviour.

let root: string;
let seq = 0;

beforeAll(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'arch-kit-fixtures-'));
});

afterAll(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

function writeFiles(baseDir: string, files: Record<string, string>): void {
  for (const [relPath, content] of Object.entries(files)) {
    const full = path.join(baseDir, relPath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
}

interface FixtureOptions {
  /** Files written under the module's `src/`. */
  src?: Record<string, string>;
  /** Files written at the module root (package.json, README.md, …). */
  rootFiles?: Record<string, string>;
  isReact?: boolean;
  name?: string;
}

function makeModule(opts: FixtureOptions): Module {
  const dir = path.join(root, `m${seq++}`);
  const srcDir = path.join(dir, 'src');
  fs.mkdirSync(srcDir, { recursive: true });
  if (opts.src) writeFiles(srcDir, opts.src);
  if (opts.rootFiles) writeFiles(dir, opts.rootFiles);
  return { name: opts.name ?? 'fixture', dir, srcDir, isReact: opts.isReact };
}

function ctxFor(...modules: Module[]) {
  return { modules, repoRoot: root };
}

describe('naming scanners', () => {
  it('scanKebabCase flags PascalCase file names, accepts kebab-case + qualifiers', () => {
    const dirty = ctxFor(makeModule({ src: { 'BadName.ts': 'export const x = 1;' } }));
    expect(scanKebabCase(dirty)).not.toHaveLength(0);

    const clean = ctxFor(
      makeModule({
        src: { 'good-name.ts': 'export const x = 1;', 'widget.stories.tsx': 'export const S = 1;' },
      })
    );
    expect(scanKebabCase(clean)).toEqual([]);
  });

  it('scanHookNaming flags a hooks/use-*.ts that exports no useXxx symbol', () => {
    const dirty = ctxFor(makeModule({ src: { 'hooks/use-foo.ts': 'export const value = 1;' } }));
    expect(scanHookNaming(dirty)).not.toHaveLength(0);

    const clean = ctxFor(
      makeModule({ src: { 'hooks/use-foo.ts': 'export function useFoo() { return 1; }' } })
    );
    expect(scanHookNaming(clean)).toEqual([]);
  });

  it('scanComponentNaming flags a components/*.tsx with no PascalCase export', () => {
    const dirty = ctxFor(makeModule({ src: { 'components/widget.tsx': 'export const x = 1;' } }));
    expect(scanComponentNaming(dirty)).not.toHaveLength(0);

    const clean = ctxFor(
      makeModule({ src: { 'components/widget.tsx': 'export function Widget() { return null; }' } })
    );
    expect(scanComponentNaming(clean)).toEqual([]);
  });

  it('scanFetchVerbInApi flags api/ functions named fetch*, accepts get*/list*', () => {
    const dirty = ctxFor(
      makeModule({ src: { 'api/things.ts': 'export function fetchThings() { return []; }' } })
    );
    expect(scanFetchVerbInApi(dirty)).not.toHaveLength(0);

    const clean = ctxFor(
      makeModule({ src: { 'api/things.ts': 'export function listThings() { return []; }' } })
    );
    expect(scanFetchVerbInApi(clean)).toEqual([]);
  });
});

describe('import scanners', () => {
  it('scanConsole flags console.* and the globalThis.console bypass', () => {
    const direct = ctxFor(makeModule({ src: { 'a.ts': 'console.log("x");' } }));
    expect(scanConsole(direct)).not.toHaveLength(0);

    const bypass = ctxFor(makeModule({ src: { 'a.ts': 'globalThis.console.error("x");' } }));
    expect(scanConsole(bypass)).not.toHaveLength(0);

    const clean = ctxFor(makeModule({ src: { 'a.ts': 'export const log = (m: string) => m;' } }));
    expect(scanConsole(clean)).toEqual([]);
  });

  it('scanConsole honours the per-module allowlist', () => {
    const mod = makeModule({ name: 'logger', src: { 'a.ts': 'console.log("x");' } });
    expect(scanConsole({ ...ctxFor(mod), allowedModules: ['logger'] })).toEqual([]);
  });

  it('scanFetch flags native fetch(), allowlist exempts infra modules', () => {
    const dirty = ctxFor(makeModule({ src: { 'a.ts': 'const r = fetch("/api");' } }));
    expect(scanFetch(dirty)).not.toHaveLength(0);

    const bff = makeModule({ name: 'bff', src: { 'a.ts': 'const r = fetch("/api");' } });
    expect(scanFetch({ ...ctxFor(bff), allowedModules: ['bff'] })).toEqual([]);
  });

  it('scanAxiosImports flags a direct axios import', () => {
    const dirty = ctxFor(makeModule({ src: { 'a.ts': 'import axios from "axios";' } }));
    expect(scanAxiosImports(dirty)).not.toHaveLength(0);

    const clean = ctxFor(
      makeModule({ src: { 'a.ts': 'import { client } from "@granit/api-client";' } })
    );
    expect(scanAxiosImports(clean)).toEqual([]);
  });

  it('scanOnlySkip flags committed .only / .skip', () => {
    const only = ctxFor(makeModule({ src: { 'a.test.ts': 'it.only("x", () => {});' } }));
    expect(scanOnlySkip(only)).not.toHaveLength(0);

    const skip = ctxFor(makeModule({ src: { 'a.test.ts': 'describe.skip("x", () => {});' } }));
    expect(scanOnlySkip(skip)).not.toHaveLength(0);

    const clean = ctxFor(makeModule({ src: { 'a.test.ts': 'it("x", () => {});' } }));
    expect(scanOnlySkip(clean)).toEqual([]);
  });

  it('hasBannedConsole is a pure predicate over already-stripped source', () => {
    expect(hasBannedConsole('console.log(x)')).toBe(true);
    expect(hasBannedConsole("globalThis['console'].info(x)")).toBe(true);
    expect(hasBannedConsole('myconsole.log(x)')).toBe(false);
  });

  it('collectImports extracts real specifiers, ignoring comments and string literals', () => {
    const f = path.join(makeModule({ src: { 'a.ts': '' } }).srcDir, 'a.ts');
    fs.writeFileSync(
      f,
      [
        'import { a } from "real";',
        'export { b } from "./local";',
        '// import x from "commented";',
        'const msg = \'Delete redirect from "{{path}}"?\';', // not an import
        'const where = `select from "table"`;', // not an import
      ].join('\n')
    );
    expect(collectImports(f)).toEqual(['real', './local']);
  });
});

describe('barrel scanners', () => {
  it('scanBarrelDefaultExports flags `export default` in index.ts', () => {
    const dirty = ctxFor(makeModule({ src: { 'index.ts': 'export default {};' } }));
    expect(scanBarrelDefaultExports(dirty)).not.toHaveLength(0);

    const clean = ctxFor(makeModule({ src: { 'index.ts': 'export const api = {};' } }));
    expect(scanBarrelDefaultExports(clean)).toEqual([]);
  });

  it('scanLeakedInternals flags underscore-prefixed exports in the barrel', () => {
    const dirty = ctxFor(makeModule({ src: { 'index.ts': 'export const _internal = 1;' } }));
    expect(scanLeakedInternals(dirty)).not.toHaveLength(0);

    const clean = ctxFor(makeModule({ src: { 'index.ts': 'export const publicApi = 1;' } }));
    expect(scanLeakedInternals(clean)).toEqual([]);
  });
});

describe('i18n scanner', () => {
  it('scanLocaleParity flags a locales/ missing files or the TranslationsEn/Fr export', () => {
    const dirty = ctxFor(makeModule({ src: { 'locales/en.ts': 'export const wrongName = {};' } }));
    expect(scanLocaleParity(dirty)).not.toHaveLength(0);

    const clean = ctxFor(
      makeModule({
        src: {
          'locales/en.ts': 'export const fooTranslationsEn = {};',
          'locales/fr.ts': 'export const fooTranslationsFr = {};',
          'locales/index.ts': 'export {};',
        },
      })
    );
    expect(scanLocaleParity(clean)).toEqual([]);
  });
});

describe('pattern scanners', () => {
  it('scanAnonymousDefaultExports flags `export default () => …`, accepts named', () => {
    const dirty = ctxFor(makeModule({ src: { 'a.ts': 'export default () => 1;' } }));
    expect(scanAnonymousDefaultExports(dirty)).not.toHaveLength(0);

    const clean = ctxFor(
      makeModule({ src: { 'a.ts': 'function Foo() { return 1; }\nexport default Foo;' } })
    );
    expect(scanAnonymousDefaultExports(clean)).toEqual([]);
  });

  it('scanWallClockInApi flags Date.now()/new Date() inside api/', () => {
    const dirty = ctxFor(makeModule({ src: { 'api/a.ts': 'export const t = Date.now();' } }));
    expect(scanWallClockInApi(dirty)).not.toHaveLength(0);

    const clean = ctxFor(
      makeModule({ src: { 'api/a.ts': 'export const at = (t: number) => t;' } })
    );
    expect(scanWallClockInApi(clean)).toEqual([]);
  });

  it('scanUseFormResolver flags useForm() without a resolver', () => {
    const dirty = ctxFor(makeModule({ src: { 'a.ts': 'const form = useForm();' } }));
    expect(scanUseFormResolver(dirty)).not.toHaveLength(0);

    const clean = ctxFor(
      makeModule({ src: { 'a.ts': 'const form = useForm({ resolver: zodResolver(schema) });' } })
    );
    expect(scanUseFormResolver(clean)).toEqual([]);
  });

  it('scanEmptyCatch flags an empty catch block', () => {
    const dirty = ctxFor(makeModule({ src: { 'a.ts': 'try { run(); } catch {}' } }));
    expect(scanEmptyCatch(dirty)).not.toHaveLength(0);

    const clean = ctxFor(makeModule({ src: { 'a.ts': 'try { run(); } catch (e) { log(e); }' } }));
    expect(scanEmptyCatch(clean)).toEqual([]);
  });
});

describe('uniformity scanners', () => {
  it('scanReadmePresence flags a missing README and a mismatched H1', () => {
    const missing = ctxFor(makeModule({ name: 'fixture', src: { 'index.ts': 'export {};' } }));
    expect(scanReadmePresence(missing)).not.toHaveLength(0);

    const clean = ctxFor(
      makeModule({ name: 'fixture', rootFiles: { 'README.md': '# fixture\n\nhello' } })
    );
    expect(scanReadmePresence(clean)).toEqual([]);
  });

  it('scanSharedDepVersions flags version drift across packages', () => {
    const a = makeModule({
      name: 'a',
      rootFiles: { 'package.json': '{"dependencies":{"react":"^1.0.0"}}' },
    });
    const b = makeModule({
      name: 'b',
      rootFiles: { 'package.json': '{"dependencies":{"react":"^2.0.0"}}' },
    });
    expect(scanSharedDepVersions({ ...ctxFor(a, b), deps: ['react'] })).not.toHaveLength(0);

    const c = makeModule({
      name: 'c',
      rootFiles: { 'package.json': '{"dependencies":{"react":"^2.0.0"}}' },
    });
    const d = makeModule({
      name: 'd',
      rootFiles: { 'package.json': '{"dependencies":{"react":"^2.0.0"}}' },
    });
    expect(scanSharedDepVersions({ ...ctxFor(c, d), deps: ['react'] })).toEqual([]);
  });
});

describe('csp scanner', () => {
  it('scanDomScriptSinks flags a sink writer with no csp/index.ts subpath', () => {
    const dirty = ctxFor(makeModule({ src: { 'render.ts': 'node.innerHTML = html;' } }));
    expect(scanDomScriptSinks(dirty)).not.toHaveLength(0);

    const clean = ctxFor(
      makeModule({
        src: {
          'render.ts': 'node.innerHTML = html;',
          'csp/index.ts': 'export function installPolicy() {}',
        },
      })
    );
    expect(scanDomScriptSinks(clean)).toEqual([]);
  });
});

describe('deps scanner', () => {
  it('scanUndeclaredDeps flags a bare import absent from package.json', () => {
    const dirty = ctxFor(
      makeModule({
        src: { 'a.ts': 'import _ from "lodash";' },
        rootFiles: { 'package.json': '{"name":"@granit/fixture"}' },
      })
    );
    expect(scanUndeclaredDeps(dirty)).not.toHaveLength(0);

    const clean = ctxFor(
      makeModule({
        src: { 'a.ts': 'import _ from "lodash";' },
        rootFiles: { 'package.json': '{"name":"@granit/fixture","dependencies":{"lodash":"^4"}}' },
      })
    );
    expect(scanUndeclaredDeps(clean)).toEqual([]);
  });
});

describe('react scanner', () => {
  it("scanUseClientDirective flags a client hook without 'use client'", () => {
    const dirty = ctxFor(makeModule({ src: { 'widget.tsx': 'const x = useState(0);' } }));
    expect(scanUseClientDirective(dirty)).not.toHaveLength(0);

    const clean = ctxFor(
      makeModule({ src: { 'widget.tsx': "'use client';\nconst x = useState(0);" } })
    );
    expect(scanUseClientDirective(clean)).toEqual([]);
  });
});

describe('structure scanner', () => {
  it('scanForbiddenStructure flags React dirs in a core module', () => {
    const dirty = ctxFor(
      makeModule({ name: 'core', isReact: false, src: { 'hooks/use-x.ts': 'export const x = 1;' } })
    );
    expect(scanForbiddenStructure(dirty)).not.toHaveLength(0);

    const clean = ctxFor(
      makeModule({ name: 'core', isReact: false, src: { 'types/index.ts': 'export type X = 1;' } })
    );
    expect(scanForbiddenStructure(clean)).toEqual([]);
  });

  it('scanForbiddenStructure flags an api/ dir in a React module', () => {
    const dirty = ctxFor(
      makeModule({ name: 'react-x', isReact: true, src: { 'api/x.ts': 'export const x = 1;' } })
    );
    expect(scanForbiddenStructure(dirty)).not.toHaveLength(0);

    const clean = ctxFor(
      makeModule({
        name: 'react-x',
        isReact: true,
        src: { 'hooks/use-x.ts': 'export const x = 1;' },
      })
    );
    expect(scanForbiddenStructure(clean)).toEqual([]);
  });
});

describe('fs helpers', () => {
  it('walkSourceFiles collects .ts/.tsx and skips node_modules', () => {
    const mod = makeModule({
      src: { 'a.ts': '', 'sub/b.tsx': '', 'node_modules/dep/c.ts': '', 'readme.md': '' },
    });
    const files = walkSourceFiles(mod.srcDir)
      .map((f) => path.basename(f))
      .sort();
    expect(files).toEqual(['a.ts', 'b.tsx']);
  });

  it('isTestFile / isTestingDir recognise the conventional paths', () => {
    expect(isTestFile('src/a.test.ts')).toBe(true);
    expect(isTestFile('src/__tests__/a.ts')).toBe(true);
    expect(isTestFile('src/a.ts')).toBe(false);
    expect(isTestingDir('src/testing/handlers.ts')).toBe(true);
    expect(isTestingDir('src/api/a.ts')).toBe(false);
  });

  it('stripComments removes line, block and JSDoc comments', () => {
    const out = stripComments('const a = 1; // x\n/* y */\n/** z */\nconst b = 2;');
    expect(out).not.toContain('x');
    expect(out).not.toContain('y');
    expect(out).not.toContain('z');
    expect(out).toContain('const a = 1;');
    expect(out).toContain('const b = 2;');
  });
});
