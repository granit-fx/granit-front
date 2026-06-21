import fs from 'node:fs';
import path from 'node:path';

import { rel } from '../fs';

import type { ScanContext, Violation } from '../types';

export interface ForbiddenStructureOptions extends ScanContext {
  /**
   * Directory names that must NOT appear directly under a non-React (core)
   * module's `srcDir`. Defaults to the React-only layers — a core package keeps
   * to types/api, its React siblings own the UI.
   */
  coreForbidden?: ReadonlyArray<string>;
  /**
   * Directory names that must NOT appear directly under a React module's
   * `srcDir`. Defaults to `api` — HTTP calls live in the core package; the
   * React package consumes them through hooks.
   */
  reactForbidden?: ReadonlyArray<string>;
}

const DEFAULT_CORE_FORBIDDEN = ['hooks', 'components', 'providers', 'field-components'] as const;
const DEFAULT_REACT_FORBIDDEN = ['api'] as const;

/**
 * Enforces the core/React layering seam: a core `@granit/{module}` carries no
 * React-only directories (`hooks/`, `components/`, `providers/`,
 * `field-components/`), and a `react-{module}` carries no server-side `api/`
 * directory (its hooks call the core package's API functions). Mirrors the
 * "Forbidden" structure rules in the framework CLAUDE.md, extracted here so any
 * app slicing code into core/React module pairs can enforce the same seam.
 *
 * The React/core split is read from {@link Module.isReact}.
 */
export function scanForbiddenStructure(opts: ForbiddenStructureOptions): Violation[] {
  const coreForbidden = opts.coreForbidden ?? DEFAULT_CORE_FORBIDDEN;
  const reactForbidden = opts.reactForbidden ?? DEFAULT_REACT_FORBIDDEN;
  const out: Violation[] = [];

  for (const m of opts.modules) {
    const forbidden = m.isReact ? reactForbidden : coreForbidden;
    const layer = m.isReact ? 'react' : 'core';
    for (const dir of forbidden) {
      const full = path.join(m.srcDir, dir);
      if (fs.existsSync(full)) {
        out.push({
          rule: 'forbidden-structure',
          module: m.name,
          file: rel(full, opts.repoRoot),
          message: `${layer} package must not contain src/${dir}/ (wrong layer for this module kind)`,
        });
      }
    }
  }

  return out;
}
