import fs from 'node:fs';
import path from 'node:path';

import { readFile, rel } from '../fs';

import type { ScanContext, Violation } from '../types';

export interface BarrelScanOptions extends ScanContext {
  /** Path to the barrel, relative to each module's `srcDir`. Defaults to `index.ts`. */
  barrelFile?: string;
}

const DEFAULT_BARREL = 'index.ts';
const DEFAULT_EXPORT_RE = /^export\s+default\b/m;
const LEAK_RE =
  /^export\s+(?:\{[^}]*\b_[A-Za-z0-9_]+\b)|^export\s+(?:const|function|class|interface|type|enum)\s+_/m;

/** Forbids `export default` in the module barrel — keeps tree-shaking happy. */
export function scanBarrelDefaultExports(opts: BarrelScanOptions): Violation[] {
  const barrelFile = opts.barrelFile ?? DEFAULT_BARREL;
  const out: Violation[] = [];
  for (const m of opts.modules) {
    const barrel = path.join(m.srcDir, barrelFile);
    if (!fs.existsSync(barrel)) continue;
    if (DEFAULT_EXPORT_RE.test(readFile(barrel))) {
      out.push({
        rule: 'no-default-export-in-barrel',
        module: m.name,
        file: rel(barrel, opts.repoRoot),
        message: 'barrels must use named exports (better tree-shaking, easier refactors)',
      });
    }
  }
  return out;
}

/** Underscore-prefixed exports leaking out of a public barrel. */
export function scanLeakedInternals(opts: BarrelScanOptions): Violation[] {
  const barrelFile = opts.barrelFile ?? DEFAULT_BARREL;
  const out: Violation[] = [];
  for (const m of opts.modules) {
    const barrel = path.join(m.srcDir, barrelFile);
    if (!fs.existsSync(barrel)) continue;
    if (LEAK_RE.test(readFile(barrel))) {
      out.push({
        rule: 'no-leaked-internal',
        module: m.name,
        file: rel(barrel, opts.repoRoot),
        message: 'underscore-prefixed exports must stay internal',
      });
    }
  }
  return out;
}
