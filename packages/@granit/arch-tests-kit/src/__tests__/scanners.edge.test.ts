import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { findSubdirs } from '../fs';
import {
  scanAnonymousDefaultExports,
  scanAxiosImports,
  scanBarrelDefaultExports,
  scanComponentNaming,
  scanConsole,
  scanDomScriptSinks,
  scanEmptyCatch,
  scanFetch,
  scanHookNaming,
  scanKebabCase,
  scanLeakedInternals,
  scanLocaleParity,
  scanReadmePresence,
  scanSharedDepVersions,
  scanUndeclaredDeps,
  scanUseClientDirective,
  scanUseFormResolver,
} from '../index';

import type { Module } from '../types';

// Edge-case coverage for the arch-tests-kit scanners — allowlist branches,
// empty/absent inputs, custom-option overrides, and the directory-skip paths
// the behavioural fixture suite does not exercise.

let root: string;
let seq = 0;

beforeAll(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'arch-kit-edge-'));
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
  src?: Record<string, string>;
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

describe('fs.findSubdirs', () => {
  it('skips node_modules and dist while finding the named directory', () => {
    const mod = makeModule({
      src: {
        'api/x.ts': 'export const x = 1;',
        'node_modules/api/y.ts': 'export const y = 1;',
        'dist/api/z.ts': 'export const z = 1;',
      },
    });
    const found = findSubdirs(mod.srcDir, 'api');
    expect(found).toHaveLength(1);
    expect(found[0]).toContain(`${path.sep}api`);
    expect(found[0]).not.toContain('node_modules');
  });

  it('returns an empty list when the root does not exist', () => {
    expect(findSubdirs(path.join(root, 'does-not-exist'), 'api')).toEqual([]);
  });

  it('recurses into nested non-matching directories to find deeper matches', () => {
    const mod = makeModule({ src: { 'feature/widgets/api/x.ts': 'export const x = 1;' } });
    expect(findSubdirs(mod.srcDir, 'api')).toHaveLength(1);
  });
});

describe('scanKebabCase — allowlist', () => {
  it('exempts a file whose relative path matches an allowedFiles needle', () => {
    const mod = makeModule({ src: { 'BadName.ts': 'export const x = 1;' } });
    const relPath = path.relative(root, path.join(mod.srcDir, 'BadName.ts'));
    expect(scanKebabCase({ ...ctxFor(mod), allowedFiles: [relPath] })).toEqual([]);
  });
});

describe('scanHookNaming — non-hook files', () => {
  it('ignores a hooks/ file not prefixed with use-', () => {
    const mod = makeModule({ src: { 'hooks/create-store.ts': 'export const value = 1;' } });
    expect(scanHookNaming(ctxFor(mod))).toEqual([]);
  });

  it('accepts a use-*.ts that re-exports a useXxx symbol', () => {
    const mod = makeModule({ src: { 'hooks/use-foo.ts': 'export { useFoo } from "./impl";' } });
    expect(scanHookNaming(ctxFor(mod))).toEqual([]);
  });
});

describe('scanComponentNaming — helper & non-tsx files', () => {
  it('skips conventional helper files (index.ts, constants.ts, …)', () => {
    const mod = makeModule({
      src: {
        'components/index.ts': 'export const x = 1;',
        'components/constants.ts': 'export const Y = 1;',
      },
    });
    expect(scanComponentNaming(ctxFor(mod))).toEqual([]);
  });

  it('skips a non-.tsx file in components/', () => {
    const mod = makeModule({ src: { 'components/util.ts': 'export const x = 1;' } });
    expect(scanComponentNaming(ctxFor(mod))).toEqual([]);
  });

  it('accepts a re-exported PascalCase component', () => {
    const mod = makeModule({ src: { 'components/widget.tsx': 'export { Widget } from "./w";' } });
    expect(scanComponentNaming(ctxFor(mod))).toEqual([]);
  });
});

describe('scanConsole / scanFetch / scanAxiosImports — file allowlist', () => {
  it('scanConsole exempts a file matched by allowedFiles', () => {
    const mod = makeModule({ src: { 'boot.ts': 'console.log("x");' } });
    const relPath = path.relative(root, path.join(mod.srcDir, 'boot.ts'));
    expect(scanConsole({ ...ctxFor(mod), allowedFiles: [relPath] })).toEqual([]);
  });

  it('scanConsole skips test and testing files', () => {
    const mod = makeModule({
      src: { 'a.test.ts': 'console.log("x");', 'testing/handlers.ts': 'console.log("y");' },
    });
    expect(scanConsole(ctxFor(mod))).toEqual([]);
  });

  it('scanFetch exempts a file matched by allowedFiles', () => {
    const mod = makeModule({ src: { 'boot.ts': 'const r = fetch("/api");' } });
    const relPath = path.relative(root, path.join(mod.srcDir, 'boot.ts'));
    expect(scanFetch({ ...ctxFor(mod), allowedFiles: [relPath] })).toEqual([]);
  });

  it('scanAxiosImports exempts a file matched by allowedFiles', () => {
    const mod = makeModule({ src: { 'boot.ts': 'import axios from "axios";' } });
    const relPath = path.relative(root, path.join(mod.srcDir, 'boot.ts'));
    expect(scanAxiosImports({ ...ctxFor(mod), allowedFiles: [relPath] })).toEqual([]);
  });

  it('scanAxiosImports flags an axios subpath import', () => {
    const mod = makeModule({ src: { 'a.ts': 'import { x } from "axios/lib";' } });
    expect(scanAxiosImports(ctxFor(mod))).not.toHaveLength(0);
  });

  it('scanAxiosImports honours the per-module allowlist', () => {
    const mod = makeModule({ name: 'api-client', src: { 'a.ts': 'import axios from "axios";' } });
    expect(scanAxiosImports({ ...ctxFor(mod), allowedModules: ['api-client'] })).toEqual([]);
  });
});

describe('scanBarrelDefaultExports / scanLeakedInternals — barrel presence & custom path', () => {
  it('skips a module with no barrel file', () => {
    const mod = makeModule({ src: { 'other.ts': 'export default {};' } });
    expect(scanBarrelDefaultExports(ctxFor(mod))).toEqual([]);
    expect(scanLeakedInternals(ctxFor(mod))).toEqual([]);
  });

  it('honours a custom barrelFile path', () => {
    const mod = makeModule({ src: { 'public.ts': 'export default {};' } });
    expect(scanBarrelDefaultExports({ ...ctxFor(mod), barrelFile: 'public.ts' })).not.toHaveLength(
      0
    );
  });

  it('scanLeakedInternals honours a custom barrelFile path', () => {
    const mod = makeModule({ src: { 'public.ts': 'export const _secret = 1;' } });
    expect(scanLeakedInternals({ ...ctxFor(mod), barrelFile: 'public.ts' })).not.toHaveLength(0);
  });
});

describe('scanLocaleParity — fr export & no-locales', () => {
  it('does nothing when the module has no locales/ directory', () => {
    const mod = makeModule({ src: { 'index.ts': 'export {};' } });
    expect(scanLocaleParity(ctxFor(mod))).toEqual([]);
  });

  it('flags an fr.ts missing the TranslationsFr export but valid en.ts', () => {
    const mod = makeModule({
      src: {
        'locales/en.ts': 'export const fooTranslationsEn = {};',
        'locales/fr.ts': 'export const wrong = {};',
        'locales/index.ts': 'export {};',
      },
    });
    const v = scanLocaleParity(ctxFor(mod));
    expect(v).toContainEqual(
      expect.objectContaining({ rule: 'locale-export', message: expect.stringContaining('Fr') })
    );
    expect(v.some((x) => x.message.includes('En'))).toBe(false);
  });
});

describe('scanAnonymousDefaultExports — branch forms', () => {
  it('skips files with no export default at all', () => {
    const mod = makeModule({ src: { 'a.ts': 'export const x = 1;' } });
    expect(scanAnonymousDefaultExports(ctxFor(mod))).toEqual([]);
  });

  it('accepts a named default class', () => {
    const mod = makeModule({ src: { 'a.ts': 'export default class Foo {}' } });
    expect(scanAnonymousDefaultExports(ctxFor(mod))).toEqual([]);
  });

  it('accepts a named default function', () => {
    const mod = makeModule({ src: { 'a.ts': 'export default function foo() {}' } });
    expect(scanAnonymousDefaultExports(ctxFor(mod))).toEqual([]);
  });

  it('flags an anonymous default object literal', () => {
    const mod = makeModule({ src: { 'a.ts': 'export default {};' } });
    expect(scanAnonymousDefaultExports(ctxFor(mod))).not.toHaveLength(0);
  });
});

describe('scanUseFormResolver — allowlists', () => {
  it('honours the per-module allowlist', () => {
    const mod = makeModule({ name: 'forms', src: { 'a.ts': 'const f = useForm();' } });
    expect(scanUseFormResolver({ ...ctxFor(mod), allowedModules: ['forms'] })).toEqual([]);
  });

  it('honours the per-file allowlist', () => {
    const mod = makeModule({ src: { 'a.ts': 'const f = useForm();' } });
    const relPath = path.relative(root, path.join(mod.srcDir, 'a.ts'));
    expect(scanUseFormResolver({ ...ctxFor(mod), allowedFiles: [relPath] })).toEqual([]);
  });

  it('skips files that never call useForm', () => {
    const mod = makeModule({ src: { 'a.ts': 'export const x = 1;' } });
    expect(scanUseFormResolver(ctxFor(mod))).toEqual([]);
  });
});

describe('scanEmptyCatch — allowlists', () => {
  it('honours the per-module allowlist', () => {
    const mod = makeModule({ name: 'legacy', src: { 'a.ts': 'try { run(); } catch {}' } });
    expect(scanEmptyCatch({ ...ctxFor(mod), allowedModules: ['legacy'] })).toEqual([]);
  });

  it('honours the per-file allowlist', () => {
    const mod = makeModule({ src: { 'a.ts': 'try { run(); } catch {}' } });
    const relPath = path.relative(root, path.join(mod.srcDir, 'a.ts'));
    expect(scanEmptyCatch({ ...ctxFor(mod), allowedFiles: [relPath] })).toEqual([]);
  });

  it('flags an empty catch with a binding parameter (catch (e) {})', () => {
    const mod = makeModule({ src: { 'a.ts': 'try { run(); } catch (e) {}' } });
    expect(scanEmptyCatch(ctxFor(mod))).not.toHaveLength(0);
  });
});

describe('scanReadmePresence — H1 branches & allowlists', () => {
  it('flags a README with no H1 heading', () => {
    const mod = makeModule({
      name: 'fixture',
      rootFiles: { 'README.md': 'just prose, no heading' },
    });
    expect(scanReadmePresence(ctxFor(mod))).toContainEqual(
      expect.objectContaining({ rule: 'readme-h1', message: expect.stringContaining('no `# H1`') })
    );
  });

  it('flags a README whose H1 does not match the expected heading', () => {
    const mod = makeModule({ name: 'fixture', rootFiles: { 'README.md': '# Wrong Title\n' } });
    expect(scanReadmePresence(ctxFor(mod))).toContainEqual(
      expect.objectContaining({ rule: 'readme-h1', message: expect.stringContaining('expected') })
    );
  });

  it('accepts a custom expectedHeading resolver', () => {
    const mod = makeModule({ name: 'pkg', rootFiles: { 'README.md': '# @scope/pkg\n' } });
    expect(scanReadmePresence({ ...ctxFor(mod), expectedHeading: (n) => `@scope/${n}` })).toEqual(
      []
    );
  });

  it('honours the per-module allowlist', () => {
    const mod = makeModule({ name: 'skip-me' });
    expect(scanReadmePresence({ ...ctxFor(mod), allowedModules: ['skip-me'] })).toEqual([]);
  });

  it('honours the per-file allowlist', () => {
    const mod = makeModule({ name: 'fixture' });
    const relPath = path.relative(root, path.join(mod.dir, 'README.md'));
    expect(scanReadmePresence({ ...ctxFor(mod), allowedFiles: [relPath] })).toEqual([]);
  });
});

describe('scanSharedDepVersions — within-package drift & options', () => {
  it('flags a dep declared with two versions inside one package', () => {
    const mod = makeModule({
      name: 'a',
      rootFiles: {
        'package.json': '{"dependencies":{"react":"^1.0.0"},"peerDependencies":{"react":"^2.0.0"}}',
      },
    });
    expect(scanSharedDepVersions({ ...ctxFor(mod), deps: ['react'] })).toContainEqual(
      expect.objectContaining({ rule: 'shared-dep-version-drift-within-package' })
    );
  });

  it('ignores workspace: and * version constraints', () => {
    const a = makeModule({
      name: 'a',
      rootFiles: { 'package.json': '{"dependencies":{"react":"workspace:*"}}' },
    });
    const b = makeModule({
      name: 'b',
      rootFiles: { 'package.json': '{"dependencies":{"react":"*"}}' },
    });
    expect(scanSharedDepVersions({ ...ctxFor(a, b), deps: ['react'] })).toEqual([]);
  });

  it('skips a module whose package.json is absent', () => {
    const a = makeModule({ name: 'a' }); // no package.json written
    expect(scanSharedDepVersions({ ...ctxFor(a), deps: ['react'] })).toEqual([]);
  });

  it('honours a custom sections list', () => {
    const a = makeModule({
      name: 'a',
      rootFiles: { 'package.json': '{"devDependencies":{"vite":"^1.0.0"}}' },
    });
    const b = makeModule({
      name: 'b',
      rootFiles: { 'package.json': '{"devDependencies":{"vite":"^2.0.0"}}' },
    });
    expect(
      scanSharedDepVersions({ ...ctxFor(a, b), deps: ['vite'], sections: ['devDependencies'] })
    ).not.toHaveLength(0);
  });

  it('attributes cross-workspace drift to the minority modules only', () => {
    const majority1 = makeModule({
      name: 'maj1',
      rootFiles: { 'package.json': '{"dependencies":{"zod":"^3.0.0"}}' },
    });
    const majority2 = makeModule({
      name: 'maj2',
      rootFiles: { 'package.json': '{"dependencies":{"zod":"^3.0.0"}}' },
    });
    const minority = makeModule({
      name: 'min',
      rootFiles: { 'package.json': '{"dependencies":{"zod":"^4.0.0"}}' },
    });
    const v = scanSharedDepVersions({
      ...ctxFor(majority1, majority2, minority),
      deps: ['zod'],
    });
    const drift = v.filter((x) => x.rule === 'shared-dep-version-drift');
    expect(drift).toHaveLength(1);
    expect(drift[0]?.module).toBe('min');
  });
});

describe('scanDomScriptSinks — branches', () => {
  it('does nothing for a module with no sink writers', () => {
    const mod = makeModule({ src: { 'a.ts': 'export const x = 1;' } });
    expect(scanDomScriptSinks(ctxFor(mod))).toEqual([]);
  });

  it('honours the per-module allowlist', () => {
    const mod = makeModule({ name: 'renderer', src: { 'r.ts': 'node.innerHTML = html;' } });
    expect(scanDomScriptSinks({ ...ctxFor(mod), allowedModules: ['renderer'] })).toEqual([]);
  });

  it('honours the per-file allowlist', () => {
    const mod = makeModule({ src: { 'r.ts': 'node.innerHTML = html;' } });
    const relPath = path.relative(root, path.join(mod.srcDir, 'r.ts'));
    expect(scanDomScriptSinks({ ...ctxFor(mod), allowedFiles: [relPath] })).toEqual([]);
  });

  it('counts multiple sink files and reports the first', () => {
    const mod = makeModule({
      src: {
        'a.ts': 'node.outerHTML = html;',
        'b.ts': "el.insertAdjacentHTML('beforeend', html);",
      },
    });
    const v = scanDomScriptSinks(ctxFor(mod));
    expect(v).toHaveLength(1);
    expect(v[0]?.message).toContain('2 file(s)');
  });

  it('honours a custom cspSubpath that satisfies the rule', () => {
    const mod = makeModule({
      src: {
        'r.ts': 'node.innerHTML = html;',
        'security/policy.ts': 'export function installPolicy() {}',
      },
    });
    expect(
      scanDomScriptSinks({ ...ctxFor(mod), cspSubpath: path.join('security', 'policy.ts') })
    ).toEqual([]);
  });

  it('detects a setAttribute("src", …) sink', () => {
    const mod = makeModule({ src: { 'r.ts': "iframe.setAttribute('src', url);" } });
    expect(scanDomScriptSinks(ctxFor(mod))).not.toHaveLength(0);
  });
});

describe('scanUndeclaredDeps — branches', () => {
  it('skips a module with no package.json', () => {
    const mod = makeModule({ src: { 'a.ts': 'import _ from "lodash";' } });
    expect(scanUndeclaredDeps(ctxFor(mod))).toEqual([]);
  });

  it('ignores relative, node:, virtual:, alias and query specifiers', () => {
    const mod = makeModule({
      src: {
        'a.ts': [
          'import a from "./local";',
          'import b from "node:fs";',
          'import c from "virtual:thing";',
          'import d from "@/lib/x";',
          'import e from "~/lib/y";',
          'import f from "thing?worker";',
        ].join('\n'),
      },
      rootFiles: { 'package.json': '{"name":"@granit/fixture"}' },
    });
    expect(scanUndeclaredDeps(ctxFor(mod))).toEqual([]);
  });

  it('resolves a scoped package name and accepts it when declared', () => {
    const mod = makeModule({
      src: { 'a.ts': 'import { x } from "@scope/pkg/sub";' },
      rootFiles: {
        'package.json': '{"name":"@granit/fixture","dependencies":{"@scope/pkg":"^1"}}',
      },
    });
    expect(scanUndeclaredDeps(ctxFor(mod))).toEqual([]);
  });

  it('flags a bare scope import with no package segment', () => {
    const mod = makeModule({
      src: { 'a.ts': 'import x from "@bare";' },
      rootFiles: { 'package.json': '{"name":"@granit/fixture"}' },
    });
    expect(scanUndeclaredDeps(ctxFor(mod))).toContainEqual(
      expect.objectContaining({
        rule: 'no-undeclared-dep',
        message: expect.stringContaining('@bare'),
      })
    );
  });

  it('does not flag a self-import (the package importing its own name)', () => {
    const mod = makeModule({
      src: { 'a.ts': 'import { x } from "@granit/fixture/sub";' },
      rootFiles: { 'package.json': '{"name":"@granit/fixture"}' },
    });
    expect(scanUndeclaredDeps(ctxFor(mod))).toEqual([]);
  });

  it('honours the ignore list (bare specifier and package name)', () => {
    const mod = makeModule({
      src: { 'a.ts': 'import _ from "lodash";' },
      rootFiles: { 'package.json': '{"name":"@granit/fixture"}' },
    });
    expect(scanUndeclaredDeps({ ...ctxFor(mod), ignore: ['lodash'] })).toEqual([]);
  });

  it('uses the module name as self when package.json has no name', () => {
    const mod = makeModule({
      name: 'mypkg',
      src: { 'a.ts': 'import { x } from "mypkg/sub";' },
      rootFiles: { 'package.json': '{"dependencies":{}}' },
    });
    // self resolves to m.name ("mypkg"), so the self-import is not flagged.
    expect(scanUndeclaredDeps(ctxFor(mod))).toEqual([]);
  });

  it('reports each undeclared package only once per module', () => {
    const mod = makeModule({
      src: {
        'a.ts': 'import x from "missingpkg";',
        'b.ts': 'import y from "missingpkg/sub";',
      },
      rootFiles: { 'package.json': '{"name":"@granit/fixture"}' },
    });
    expect(
      scanUndeclaredDeps(ctxFor(mod)).filter((v) => v.rule === 'no-undeclared-dep')
    ).toHaveLength(1);
  });
});

describe('scanUseClientDirective — branches', () => {
  it('does nothing when no client-only React API is used', () => {
    const mod = makeModule({ src: { 'a.tsx': 'export const x = 1;' } });
    expect(scanUseClientDirective(ctxFor(mod))).toEqual([]);
  });

  it('accepts a directive after a leading blank line (slack before stop)', () => {
    const mod = makeModule({ src: { 'a.tsx': "\n'use client';\nconst x = useState(0);" } });
    expect(scanUseClientDirective(ctxFor(mod))).toEqual([]);
  });

  it('flags a client hook when the directive appears too late', () => {
    const mod = makeModule({
      src: {
        'a.tsx':
          'import x from "y";\nimport z from "w";\nimport q from "p";\n"use client";\nconst s = useState(0);',
      },
    });
    expect(scanUseClientDirective(ctxFor(mod))).not.toHaveLength(0);
  });

  it('detects createContext as a client API', () => {
    const mod = makeModule({ src: { 'a.tsx': 'const C = createContext(null);' } });
    expect(scanUseClientDirective(ctxFor(mod))).not.toHaveLength(0);
  });

  it('honours the per-module allowlist', () => {
    const mod = makeModule({ name: 'server-only', src: { 'a.tsx': 'const x = useState(0);' } });
    expect(scanUseClientDirective({ ...ctxFor(mod), allowedModules: ['server-only'] })).toEqual([]);
  });

  it('honours the per-file allowlist', () => {
    const mod = makeModule({ src: { 'a.tsx': 'const x = useState(0);' } });
    const relPath = path.relative(root, path.join(mod.srcDir, 'a.tsx'));
    expect(scanUseClientDirective({ ...ctxFor(mod), allowedFiles: [relPath] })).toEqual([]);
  });
});
