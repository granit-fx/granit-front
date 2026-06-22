import { isTestFile, isTestingDir, readFile, rel, stripComments, walkSourceFiles } from '../fs';

import type { AllowlistedScanContext, Violation } from '../types';

// React APIs that establish a client boundary: using any of them in a module
// imported by a React Server Components app (e.g. the Next.js CMS renderer)
// requires a top-of-file `'use client'` directive, or the build errors.
// Alternatives are all distinct after the `use` prefix so no catastrophic backtracking occurs.
const CLIENT_API_RE = // NOSONAR S5852: bounded developer source files only — no user input
  /\buse(?:State|Effect|LayoutEffect|InsertionEffect|Reducer|Ref|Context|Memo|Callback|Id|SyncExternalStore|Transition|DeferredValue|ImperativeHandle)\s*\(|\bcreateContext\s*\(/;

const USE_CLIENT_RE = /^\s*['"]use client['"]\s*(?:;\s*)?$/;

/** True when `'use client'` appears as one of the file's first statements. */
function hasUseClientDirective(src: string): boolean {
  let seen = 0;
  for (const line of src.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '') continue;
    if (USE_CLIENT_RE.test(trimmed)) return true;
    // The directive is only valid before any import/statement. Give it a few
    // lines of slack (a leading line break after stripped comments) then stop.
    if (++seen >= 3) return false;
  }
  return false;
}

/**
 * For modules consumed by a React Server Components app, every file using a
 * client-only React API must carry a `'use client'` directive. This scanner is
 * **opt-in**: pass only the RSC-consumed modules in `ctx.modules` (the framework
 * suite scopes it to the packages the CMS renderer imports). Server-safe files
 * (pure types, constants, server utilities) are untouched.
 */
export function scanUseClientDirective(opts: AllowlistedScanContext): Violation[] {
  const allow = new Set(opts.allowedModules ?? []);
  const allowedFiles = opts.allowedFiles ?? [];
  const out: Violation[] = [];

  for (const m of opts.modules) {
    if (allow.has(m.name)) continue;
    for (const f of walkSourceFiles(m.srcDir, (file) => !isTestFile(file) && !isTestingDir(file))) {
      const relPath = rel(f, opts.repoRoot);
      if (allowedFiles.some((needle) => relPath.includes(needle))) continue;
      const stripped = stripComments(readFile(f));
      if (!CLIENT_API_RE.test(stripped)) continue;
      if (hasUseClientDirective(stripped)) continue;
      out.push({
        rule: 'use-client-directive',
        module: m.name,
        file: relPath,
        message:
          "uses a client-only React hook but has no 'use client' directive — add it as the first line so the file is RSC-safe",
      });
    }
  }

  return out;
}
