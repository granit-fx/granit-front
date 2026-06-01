import fs from 'node:fs';
import path from 'node:path';

import { isTestFile, isTestingDir, readFile, rel, stripComments, walkSourceFiles } from '../fs';

import type { AllowlistedScanContext, ScanContext, Violation } from '../types';

function findSubdirs(root: string, name: string): string[] {
  if (!fs.existsSync(root)) return [];
  const out: string[] = [];
  const stack = [root];
  while (stack.length) {
    const cur = stack.pop();
    if (cur === undefined) break;
    for (const entry of fs.readdirSync(cur, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      const full = path.join(cur, entry.name);
      if (entry.name === name) out.push(full);
      else stack.push(full);
    }
  }
  return out;
}

// `export default <X>` is OK only when <X> is a named declaration or a bare
// identifier reference — both give React DevTools / stack traces a useful
// label. Anonymous values (`() => ...`, `function () {}`, `{}`, `[]`, literals)
// fail the rule.
const NAMED_DEFAULT_RE =
  /\bexport\s+default\s+(?:(?:async\s+)?function\s+\w+|class\s+\w+|[A-Za-z_$][\w$]*\s*(?:;|$|\n))/m;
const ANY_DEFAULT_RE = /\bexport\s+default\b/;

export function scanAnonymousDefaultExports(ctx: ScanContext): Violation[] {
  const out: Violation[] = [];
  for (const m of ctx.modules) {
    for (const f of walkSourceFiles(m.srcDir, (file) => !isTestFile(file) && !isTestingDir(file))) {
      const src = stripComments(readFile(f));
      if (!ANY_DEFAULT_RE.test(src)) continue;
      if (NAMED_DEFAULT_RE.test(src)) continue;
      out.push({
        rule: 'no-anonymous-default-export',
        module: m.name,
        file: rel(f, ctx.repoRoot),
        message:
          'export default <anonymous> breaks React DevTools labels and stack traces — give the value a name (function Foo() {} / const Foo = ...)',
      });
    }
  }
  return out;
}

// Wall-clock reads inside HTTP layers cause timezone drift between server and
// client, and make API helpers untestable. Pass dates in from the caller.
const WALLCLOCK_RE = /(^|[^a-zA-Z_.$])(Date\.now\s*\(|new\s+Date\s*\()/;

export function scanWallClockInApi(ctx: ScanContext): Violation[] {
  const out: Violation[] = [];
  for (const m of ctx.modules) {
    for (const apiDir of findSubdirs(m.srcDir, 'api')) {
      for (const f of walkSourceFiles(apiDir, (file) => !isTestFile(file) && !isTestingDir(file))) {
        const src = stripComments(readFile(f));
        if (WALLCLOCK_RE.test(src)) {
          out.push({
            rule: 'no-wallclock-in-api',
            module: m.name,
            file: rel(f, ctx.repoRoot),
            message:
              'api/ must not read the wall clock (Date.now() / new Date()) — accept the value from the caller for testability and timezone consistency',
          });
        }
      }
    }
  }
  return out;
}

// react-hook-form without a resolver silently skips validation. Every
// `useForm()` invocation should pair with a `zodResolver(...)` (or any
// other declared `resolver:` option). Heuristic: if a file calls useForm()
// and contains no `resolver:` key anywhere, flag it.
const USE_FORM_CALL_RE = /\buseForm\s*[<(]/;
const RESOLVER_KEY_RE = /\bresolver\s*:/;

export function scanUseFormResolver(opts: AllowlistedScanContext): Violation[] {
  const out: Violation[] = [];
  const allowedModules = new Set(opts.allowedModules ?? []);
  const allowedFiles = opts.allowedFiles ?? [];
  for (const m of opts.modules) {
    if (allowedModules.has(m.name)) continue;
    for (const f of walkSourceFiles(m.srcDir, (file) => !isTestFile(file) && !isTestingDir(file))) {
      const relPath = rel(f, opts.repoRoot);
      if (allowedFiles.some((needle) => relPath.includes(needle))) continue;
      const src = stripComments(readFile(f));
      if (!USE_FORM_CALL_RE.test(src)) continue;
      if (RESOLVER_KEY_RE.test(src)) continue;
      out.push({
        rule: 'use-form-needs-resolver',
        module: m.name,
        file: relPath,
        message:
          'useForm() without resolver silently skips validation — pass resolver: zodResolver(schema) (or another declared resolver)',
      });
    }
  }
  return out;
}
