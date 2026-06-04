import {
  collectImports,
  hasBannedConsole,
  isTestFile,
  isTestingDir,
  rel,
  scanAxiosImports,
  scanConsole,
  scanFetch,
  walkSourceFiles,
} from '@granit/arch-tests-kit';
import { describe, expect, it } from 'vitest';

import {
  AXIOS_ALLOWLIST,
  CONSOLE_ALLOWLIST,
  FETCH_ALLOWLIST,
  REPO_ROOT,
  listPackages,
  toModules,
} from './helpers';

const packages = listPackages();
const modules = toModules(packages);
const ctx = { modules, repoRoot: REPO_ROOT };

describe('imports — shared rules (delegated to kit)', () => {
  it('no console.* in runtime code', () => {
    expect(scanConsole({ ...ctx, allowedModules: CONSOLE_ALLOWLIST })).toEqual([]);
  });

  it('the console ban covers the global-object bypass, not just direct calls', () => {
    // Direct calls — already enforced historically.
    expect(hasBannedConsole('console.log(x)')).toBe(true);
    expect(hasBannedConsole(';console.error(x)')).toBe(true);
    // Global-object bypass — the regression this rule was hardened against.
    expect(hasBannedConsole('globalThis.console.log(x)')).toBe(true);
    expect(hasBannedConsole('window.console.error(x)')).toBe(true);
    expect(hasBannedConsole('self.console.debug(x)')).toBe(true);
    expect(hasBannedConsole("globalThis['console'].info(x)")).toBe(true);
    expect(hasBannedConsole('const c = globalThis.console;')).toBe(true);
    // Must not flag unrelated identifiers or non-global `.console` properties.
    expect(hasBannedConsole('myconsole.log(x)')).toBe(false);
    expect(hasBannedConsole('telemetry.console.send(x)')).toBe(false);
    expect(hasBannedConsole('createLogger().info(x)')).toBe(false);
  });

  it('no native fetch() outside the infra allowlist', () => {
    expect(scanFetch({ ...ctx, allowedModules: FETCH_ALLOWLIST })).toEqual([]);
  });

  it('no direct `axios` import outside the api-client façade', () => {
    expect(scanAxiosImports({ ...ctx, allowedModules: AXIOS_ALLOWLIST })).toEqual([]);
  });
});

describe('imports — granit-specific rules', () => {
  it('never bypass a package barrel via @granit/<name>/src/...', () => {
    const offenders: string[] = [];
    for (const pkg of packages) {
      for (const f of walkSourceFiles(pkg.srcDir)) {
        for (const spec of collectImports(f)) {
          if (/^@granit\/[a-z0-9-]+\/src(\/|$)/.test(spec)) {
            offenders.push(`${rel(f, REPO_ROOT)} :: ${spec}`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('core packages do not depend on their react sibling', () => {
    const offenders: string[] = [];
    for (const pkg of packages) {
      if (pkg.isReact) continue;
      for (const f of walkSourceFiles(pkg.srcDir, (file) => !isTestFile(file))) {
        for (const spec of collectImports(f)) {
          if (/^@granit\/react-/.test(spec)) offenders.push(`${rel(f, REPO_ROOT)} :: ${spec}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the @granit/* package dependency graph is acyclic', () => {
    const isTestSupport = (file: string): boolean =>
      isTestFile(file) || isTestingDir(file) || /test-utils\.tsx?$/.test(file);

    const graph = new Map<string, Set<string>>();
    for (const pkg of packages) {
      const deps = new Set<string>();
      for (const f of walkSourceFiles(pkg.srcDir, (file) => !isTestSupport(file))) {
        for (const spec of collectImports(f)) {
          if (/^@granit\/[a-z0-9-]+\/(testing|test-utils)\b/.test(spec)) continue;
          const m = /^(@granit\/[a-z0-9-]+)/.exec(spec);
          if (m && m[1] && m[1] !== pkg.name) deps.add(m[1]);
        }
      }
      graph.set(pkg.name, deps);
    }

    const WHITE = 0,
      GRAY = 1,
      BLACK = 2;
    const color = new Map<string, number>();
    const cycles: string[] = [];
    const stack: string[] = [];

    function dfs(node: string): void {
      color.set(node, GRAY);
      stack.push(node);
      for (const next of graph.get(node) ?? []) {
        if (!graph.has(next)) continue;
        const c = color.get(next) ?? WHITE;
        if (c === GRAY) {
          const idx = stack.indexOf(next);
          cycles.push(stack.slice(idx).concat(next).join(' -> '));
        } else if (c === WHITE) {
          dfs(next);
        }
      }
      stack.pop();
      color.set(node, BLACK);
    }

    for (const n of graph.keys()) if ((color.get(n) ?? WHITE) === WHITE) dfs(n);
    expect(cycles).toEqual([]);
  });
});
