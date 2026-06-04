import fs from 'node:fs';
import path from 'node:path';

import { isTestFile, isTestingDir, readFile, rel, stripComments, walkSourceFiles } from '../fs';

import type { AllowlistedScanContext, Violation } from '../types';

// DOM-script sinks that, under CSP `require-trusted-types-for 'script'`, need a
// TrustedHTML / TrustedScriptURL minted by a named policy. A package writing to
// any of these MUST expose a `<pkg>/csp` subpath with an idempotent
// installPolicy() so its CSP requirement stays co-located with the code that
// needs it. See granit-docs/frontend/security/csp.mdx.
//
// NOSONAR: these regexes run only on bounded developer source files — no user
// input, no ReDoS risk.
const SINK_PATTERNS: ReadonlyArray<RegExp> = [
  /\.innerHTML\s*=/,
  /\.outerHTML\s*=/,
  /\.insertAdjacentHTML\s*\(/,
  /\bsetAttribute\s*\(\s*['"]src['"]/,
];

export interface DomScriptSinksOptions extends AllowlistedScanContext {
  /**
   * Path to the CSP policy entry, relative to each module's `srcDir`. A module
   * with sinks satisfies the rule when this file exists (it backs the
   * `<pkg>/csp` subpath). Defaults to `csp/index.ts`.
   */
  cspSubpath?: string;
}

function findSinkFile(srcDir: string): { file: string; count: number } | undefined {
  let first: string | undefined;
  let count = 0;
  for (const f of walkSourceFiles(srcDir, (file) => !isTestFile(file) && !isTestingDir(file))) {
    const src = stripComments(readFile(f));
    if (SINK_PATTERNS.some((re) => re.test(src))) {
      first ??= f;
      count++;
    }
  }
  return first ? { file: first, count } : undefined;
}

/**
 * Every module that writes to a DOM-script sink (`.innerHTML`, `.outerHTML`,
 * `.insertAdjacentHTML`, `setAttribute('src', …)`) MUST ship a `<pkg>/csp`
 * subpath (default `src/csp/index.ts`) exposing an idempotent `installPolicy()`.
 * Mirrors `scripts/check-csp-policies.mjs` so apps can enforce the same rule
 * inside their own Vitest suite.
 */
export function scanDomScriptSinks(opts: DomScriptSinksOptions): Violation[] {
  const cspSubpath = opts.cspSubpath ?? path.join('csp', 'index.ts');
  const allow = new Set(opts.allowedModules ?? []);
  const allowedFiles = opts.allowedFiles ?? [];
  const out: Violation[] = [];

  for (const m of opts.modules) {
    if (allow.has(m.name)) continue;
    const hit = findSinkFile(m.srcDir);
    if (!hit) continue;

    const relPath = rel(hit.file, opts.repoRoot);
    if (allowedFiles.some((needle) => relPath.includes(needle))) continue;

    if (fs.existsSync(path.join(m.srcDir, cspSubpath))) continue;

    out.push({
      rule: 'csp-subpath',
      module: m.name,
      file: relPath,
      message: `writes to a DOM-script sink (${hit.count} file(s)) but ships no ${cspSubpath} — add it with an idempotent installPolicy() and a "./csp" exports entry (see granit-docs/frontend/security/csp.mdx)`,
    });
  }

  return out;
}
