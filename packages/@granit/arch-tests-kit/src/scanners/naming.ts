import path from 'node:path';

import { findSubdirs, isTestFile, readFile, rel, walkSourceFiles } from '../fs';

import type { AllowlistedScanContext, ScanContext, Violation } from '../types';

// Kebab-case base name, plus any number of `.qualifier` segments
// (e.g. `foo-bar.stories.tsx`, `leaflet-css.d.ts`). Each segment must itself
// be lowercase kebab-case.
const KEBAB_RE = /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)*\.tsx?$/;

export function scanKebabCase(opts: AllowlistedScanContext): Violation[] {
  const out: Violation[] = [];
  const allowedFiles = opts.allowedFiles ?? [];
  for (const m of opts.modules) {
    for (const f of walkSourceFiles(m.srcDir, (file) => !isTestFile(file))) {
      const relPath = rel(f, opts.repoRoot);
      if (allowedFiles.some((needle) => relPath.includes(needle))) continue;
      const base = path.basename(f);
      if (!KEBAB_RE.test(base)) {
        out.push({
          rule: 'kebab-case',
          module: m.name,
          file: relPath,
          message: `file name must be kebab-case (got "${base}")`,
        });
      }
    }
  }
  return out;
}

// NOSONAR: these regexes run only on bounded developer source files — no user input, no ReDoS risk
const HOOK_DECL_RE = /\bexport\s+(?:async\s+)?(?:function|const)\s+use[A-Z]\w*/;
const HOOK_REEXPORT_RE = /\bexport\s*\{[^}]*\buse[A-Z]\w*/;

function checkHookFile(f: string, moduleName: string, repoRoot: string, out: Violation[]): void {
  const base = path.basename(f);
  // Factories (create-*.ts) and conventional non-hook files are allowed.
  if (!base.startsWith('use-')) return;
  const src = readFile(f);
  if (!HOOK_DECL_RE.test(src) && !HOOK_REEXPORT_RE.test(src)) {
    out.push({
      rule: 'hook-naming',
      module: moduleName,
      file: rel(f, repoRoot),
      message: 'hooks/use-*.ts must export a useXxx symbol',
    });
  }
}

export function scanHookNaming(ctx: ScanContext): Violation[] {
  const out: Violation[] = [];
  for (const m of ctx.modules) {
    for (const hooksDir of findSubdirs(m.srcDir, 'hooks')) {
      for (const f of walkSourceFiles(hooksDir, (file) => !isTestFile(file))) {
        checkHookFile(f, m.name, ctx.repoRoot, out);
      }
    }
  }
  return out;
}

// Accepts:
//   export function Foo / export const Foo / export class Foo
//   export const createFoo (factory)
//   export const useFoo (hook collocated with its component)
//   export { Foo } / export { x as Foo }  (shadcn-style re-exports)
// NOSONAR: these regexes run only on bounded developer source files — no user input, no ReDoS risk
const PASCAL_EXPORT_RE =
  /\bexport\s+(?:async\s+)?(?:function|const|class)\s+(?:[A-Z]\w*|create[A-Z]\w*|use[A-Z]\w*)/;
const PASCAL_REEXPORT_RE = /\bexport\s*\{[^}]*\b[A-Z]\w*/;
const COMPONENT_HELPER_FILES = new Set([
  'index.ts',
  'index.tsx',
  'types.ts',
  'constants.ts',
  'helpers.ts',
  'utils.ts',
]);

function checkComponentFile(
  f: string,
  moduleName: string,
  repoRoot: string,
  out: Violation[]
): void {
  const base = path.basename(f);
  if (COMPONENT_HELPER_FILES.has(base)) return;
  if (!f.endsWith('.tsx')) return;
  const src = readFile(f);
  if (!PASCAL_EXPORT_RE.test(src) && !PASCAL_REEXPORT_RE.test(src)) {
    out.push({
      rule: 'component-naming',
      module: moduleName,
      file: rel(f, repoRoot),
      message: 'components/<file>.tsx must export a PascalCase function/const/class',
    });
  }
}

export function scanComponentNaming(ctx: ScanContext): Violation[] {
  const out: Violation[] = [];
  for (const m of ctx.modules) {
    for (const compDir of findSubdirs(m.srcDir, 'components')) {
      for (const f of walkSourceFiles(compDir, (file) => !isTestFile(file))) {
        checkComponentFile(f, m.name, ctx.repoRoot, out);
      }
    }
  }
  return out;
}

const FETCH_VERB_RE = /^export\s+(?:async\s+)?(?:function|const)\s+(fetch[A-Z]\w*)/gm;

/**
 * In api/ files, function names must use get/list/etc. — never fetch.
 * Mirrors the .NET backend's verb conventions (see memory/feedback).
 */
export function scanFetchVerbInApi(ctx: ScanContext): Violation[] {
  const out: Violation[] = [];
  for (const m of ctx.modules) {
    for (const apiDir of findSubdirs(m.srcDir, 'api')) {
      for (const f of walkSourceFiles(apiDir, (file) => !isTestFile(file))) {
        const src = readFile(f);
        for (const match of src.matchAll(FETCH_VERB_RE)) {
          out.push({
            rule: 'fetch-verb-in-api',
            module: m.name,
            file: rel(f, ctx.repoRoot),
            message: `rename "${match[1]}" -> get/list (mirrors .NET backend verbs)`,
          });
        }
      }
    }
  }
  return out;
}
