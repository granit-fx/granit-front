import { isTestFile, isTestingDir, readFile, rel, stripComments, walkSourceFiles } from '../fs';

import type { AllowlistedScanContext, ScanContext, Violation } from '../types';

const IMPORT_RE = /from\s+['"]([^'"\n]+)['"]/g;

export function collectImports(file: string): string[] {
  // Strip comments first — JSDoc examples often quote `import … from '@granit/x'`
  // which would otherwise be miscounted as a real dep and create phantom cycles.
  const out: string[] = [];
  for (const m of stripComments(readFile(file)).matchAll(IMPORT_RE)) {
    if (m[1]) out.push(m[1]);
  }
  return out;
}

function isAllowedFile(
  relativePath: string,
  allowedFiles: ReadonlyArray<string> | undefined
): boolean {
  if (!allowedFiles || allowedFiles.length === 0) return false;
  return allowedFiles.some((needle) => relativePath.includes(needle));
}

const CONSOLE_RE = /(^|[^a-zA-Z_.$])console\s*\.\s*(log|warn|error|info|debug|trace)\s*\(/;

/**
 * Bans `console.*` runtime calls outside allowlisted modules (typically the
 * logger and its transports). Comments/JSDoc are ignored.
 */
export function scanConsole(opts: AllowlistedScanContext): Violation[] {
  const allow = new Set(opts.allowedModules ?? []);
  const out: Violation[] = [];
  for (const m of opts.modules) {
    if (allow.has(m.name)) continue;
    for (const f of walkSourceFiles(m.srcDir, (file) => !isTestFile(file) && !isTestingDir(file))) {
      const relPath = rel(f, opts.repoRoot);
      if (isAllowedFile(relPath, opts.allowedFiles)) continue;
      if (CONSOLE_RE.test(stripComments(readFile(f)))) {
        out.push({
          rule: 'no-console',
          module: m.name,
          file: relPath,
          message: 'use createLogger from @granit/logger instead of console.*',
        });
      }
    }
  }
  return out;
}

const FETCH_CALL_RE = /(^|[^a-zA-Z_.$])fetch\s*\(/;

/**
 * Bans native `fetch()` calls outside allowlisted modules. Use the centralized
 * Axios client; for streaming, use `axios` with `adapter: 'fetch'`.
 */
export function scanFetch(opts: AllowlistedScanContext): Violation[] {
  const allow = new Set(opts.allowedModules ?? []);
  const out: Violation[] = [];
  for (const m of opts.modules) {
    if (allow.has(m.name)) continue;
    for (const f of walkSourceFiles(m.srcDir, (file) => !isTestFile(file) && !isTestingDir(file))) {
      const relPath = rel(f, opts.repoRoot);
      if (isAllowedFile(relPath, opts.allowedFiles)) continue;
      if (FETCH_CALL_RE.test(stripComments(readFile(f)))) {
        out.push({
          rule: 'no-fetch',
          module: m.name,
          file: relPath,
          message: 'native fetch() bypasses the centralized Axios client',
        });
      }
    }
  }
  return out;
}

/**
 * Bans direct `axios` imports outside the api-client façade (and any other
 * module in {@link AllowlistedScanContext.allowedModules}).
 */
export function scanAxiosImports(opts: AllowlistedScanContext): Violation[] {
  const allow = new Set(opts.allowedModules ?? []);
  const out: Violation[] = [];
  for (const m of opts.modules) {
    if (allow.has(m.name)) continue;
    for (const f of walkSourceFiles(m.srcDir, (file) => !isTestFile(file))) {
      const relPath = rel(f, opts.repoRoot);
      if (isAllowedFile(relPath, opts.allowedFiles)) continue;
      for (const spec of collectImports(f)) {
        if (spec === 'axios' || spec.startsWith('axios/')) {
          out.push({
            rule: 'no-direct-axios',
            module: m.name,
            file: relPath,
            message: `import "${spec}" -> use @granit/api-client instead`,
          });
        }
      }
    }
  }
  return out;
}

/**
 * Test hygiene — no committed `.only` / `.skip` left behind.
 */
export function scanOnlySkip(ctx: ScanContext): Violation[] {
  const ONLY_RE = /\b(?:describe|it|test)\.only\s*\(/;
  const SKIP_RE = /\b(?:describe|it|test)\.skip\s*\(/;
  const out: Violation[] = [];
  for (const m of ctx.modules) {
    for (const f of walkSourceFiles(m.srcDir, isTestFile)) {
      const src = readFile(f);
      if (ONLY_RE.test(src)) {
        out.push({
          rule: 'no-test-only',
          module: m.name,
          file: rel(f, ctx.repoRoot),
          message: 'remove .only() before merging',
        });
      }
      if (SKIP_RE.test(src)) {
        out.push({
          rule: 'no-test-skip',
          module: m.name,
          file: rel(f, ctx.repoRoot),
          message: 'remove .skip() before merging (or convert to a TODO comment)',
        });
      }
    }
  }
  return out;
}
