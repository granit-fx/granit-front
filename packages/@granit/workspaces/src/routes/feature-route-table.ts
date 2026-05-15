/**
 * Frontend route table primitive (ADR-057 §5).
 *
 * Features carry **route names** (`invoicing.invoices.list`), not URLs.
 * The host app ships a `FeatureRouteTable` mapping each route name to a
 * SPA path; the workspace renderer looks the path up at click time.
 *
 * Two benefits worth recalling here:
 *
 * 1. The frontend owns its URLs — renaming `/invoicing` → `/billing/invoices`
 *    no longer requires a backend deployment.
 * 2. Different hosts can map the same feature to different paths.
 */

/**
 * One row of the route table.
 *
 * Intentionally minimal: we expose the SPA path only. Host-specific
 * concerns (the React element, route guards, lazy boundaries) stay in
 * the host's route table and never reach `@granit/workspaces`.
 */
export interface FeatureRouteSpec {
  /** SPA path the React router resolves (e.g. `/invoicing/invoices`). */
  readonly path: string;
}

/**
 * Host-supplied lookup table from feature route name (per ADR-057 §5,
 * convention `{module}.{entity-plural}.{view}`) to a `FeatureRouteSpec`.
 *
 * Hosts construct this once at startup and pass it to the workspace
 * renderer via context.
 */
export type FeatureRouteTable = Readonly<Record<string, FeatureRouteSpec>>;

/**
 * Thrown when `resolveFeatureRoute` is called with an empty / blank
 * feature name — a programmer error, never a runtime miss.
 */
export class InvalidFeatureNameError extends Error {
  constructor() {
    super('Feature name must be a non-empty string.');
    this.name = 'InvalidFeatureNameError';
  }
}

/**
 * Look up the SPA path for a feature route name. Returns `null` when the
 * host's route table has no entry — the renderer should hide the item or
 * render a placeholder rather than navigate (ADR-057 §5).
 *
 * @throws {InvalidFeatureNameError} if `featureName` is empty / whitespace.
 */
export function resolveFeatureRoute(
  table: FeatureRouteTable,
  featureName: string
): FeatureRouteSpec | null {
  if (typeof featureName !== 'string' || featureName.trim().length === 0) {
    throw new InvalidFeatureNameError();
  }
  return table[featureName] ?? null;
}
