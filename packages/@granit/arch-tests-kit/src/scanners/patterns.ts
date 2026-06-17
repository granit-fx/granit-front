import {
  findSubdirs,
  isTestFile,
  isTestingDir,
  readFile,
  rel,
  stripComments,
  walkSourceFiles,
} from '../fs';

import type { AllowlistedScanContext, ScanContext, Violation } from '../types';

// `export default <X>` is OK only when <X> is a named declaration or a bare
// identifier reference — both give React DevTools / stack traces a useful
// label. Anonymous values (`() => ...`, `function () {}`, `{}`, `[]`, literals)
// fail the rule.
//
// Split into three simpler regexes to stay within Sonar's regex-complexity threshold:
//   NAMED_FUNC_RE  — named function declaration (sync or async)
//   NAMED_CLASS_RE — named class declaration
//   NAMED_IDENT_RE — bare identifier reference (followed by end of statement)
const NAMED_FUNC_RE = /\bexport\s+default\s+(?:async\s+)?function\s+\w+/m;
const NAMED_CLASS_RE = /\bexport\s+default\s+class\s+\w+/m;
const NAMED_IDENT_RE = /\bexport\s+default\s+[A-Za-z_$][\w$]*\s*(?:;|$|\n)/m;
const ANY_DEFAULT_RE = /\bexport\s+default\b/;

function isNamedDefaultExport(src: string): boolean {
  return NAMED_FUNC_RE.test(src) || NAMED_CLASS_RE.test(src) || NAMED_IDENT_RE.test(src);
}

export function scanAnonymousDefaultExports(ctx: ScanContext): Violation[] {
  const out: Violation[] = [];
  for (const m of ctx.modules) {
    for (const f of walkSourceFiles(m.srcDir, (file) => !isTestFile(file) && !isTestingDir(file))) {
      const src = stripComments(readFile(f));
      if (!ANY_DEFAULT_RE.test(src)) continue;
      if (isNamedDefaultExport(src)) continue;
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

// An empty `try { … } catch { }` swallows the error with no log, no rethrow,
// and no fallback — the canonical "silent failure" anti-pattern. A catch block
// must DO something: log via createLogger, rethrow, return a fallback, or set
// an error state. Comments are stripped first, so `catch { /* ignore */ }`
// counts as empty too — "ignoring" must be a deliberate, visible decision.
//
// Promise `.catch(() => …)` handlers are intentionally OUT of scope: the
// framework uses `.catch(() => undefined)` as an accepted fire-and-forget idiom
// for non-critical work (e.g. React-Query cache invalidation after a mutation
// that already succeeded).
const EMPTY_CATCH_RE = /\bcatch\s*(?:\([^)]*\))?\s*\{\s*\}/g;

export function scanEmptyCatch(opts: AllowlistedScanContext): Violation[] {
  const out: Violation[] = [];
  const allowedModules = new Set(opts.allowedModules ?? []);
  const allowedFiles = opts.allowedFiles ?? [];
  for (const m of opts.modules) {
    if (allowedModules.has(m.name)) continue;
    for (const f of walkSourceFiles(m.srcDir, (file) => !isTestFile(file) && !isTestingDir(file))) {
      const relPath = rel(f, opts.repoRoot);
      if (allowedFiles.some((needle) => relPath.includes(needle))) continue;
      // stripComments collapses block comments (shifting line numbers), so we
      // report at file granularity — the message points the dev to the fix.
      const src = stripComments(readFile(f));
      if (EMPTY_CATCH_RE.test(src)) {
        out.push({
          rule: 'no-empty-catch',
          module: m.name,
          file: relPath,
          message:
            'empty catch swallows the error silently — log it via createLogger from @granit/logger, rethrow, return a fallback, or set an error state',
        });
      }
      EMPTY_CATCH_RE.lastIndex = 0;
    }
  }
  return out;
}
