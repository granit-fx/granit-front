/**
 * Outcome of comparing a persisted dashboard's
 * `sourceDefinitionVersion` against the catalog entry's `version`.
 * Mirrors the drift-detection contract in ADR-038.
 *
 * - `'aligned'`: persisted instance is on the same version as the
 *   catalog. No re-sync needed.
 * - `'behind'`: persisted instance carries an older semver than the
 *   catalog. The author shipped a new revision since import; the
 *   user can re-sync to pick up changes.
 * - `'ahead'`: persisted instance is on a newer semver than the
 *   catalog (catalog rolled back, dev environment runs an older
 *   build, etc.). Surfaced for visibility but not an actionable
 *   state — re-syncing would downgrade.
 * - `'ad-hoc'`: persisted instance has no source definition (created
 *   from scratch in the editor). Not driftable.
 * - `'unknown'`: catalog doesn't expose the source definition (e.g.
 *   the dashboard was imported from a definition that's no longer
 *   registered in the host's module DI graph). Surfaced as a soft
 *   warning — the user can archive or migrate manually.
 */
export type DashboardVersionDrift = 'aligned' | 'behind' | 'ahead' | 'ad-hoc' | 'unknown';

/**
 * Parses a `M.m.p` semver tuple into a 3-element array. Returns
 * `null` for shapes the framework's version field doesn't promise to
 * match (pre-release tags, build metadata, etc.) — callers fall back
 * to string comparison when the parse fails.
 */
function parseSemver(version: string): [number, number, number] | null {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) return null;
  return [
    Number.parseInt(match[1] ?? '0', 10),
    Number.parseInt(match[2] ?? '0', 10),
    Number.parseInt(match[3] ?? '0', 10),
  ];
}

/**
 * Compares two semver tuples. Returns `1` if `a > b`, `-1` if
 * `a < b`, `0` if equal.
 */
function compareSemver(a: [number, number, number], b: [number, number, number]): number {
  for (let i = 0; i < 3; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av !== bv) return av > bv ? 1 : -1;
  }
  return 0;
}

/**
 * Detects whether a persisted dashboard has drifted from its source
 * definition. Pure function, no React deps — used inline in
 * `<DashboardListPage>` and any catalog-aware UI.
 *
 * Falls back to string equality when either version doesn't match
 * the conventional `M.m.p` shape. Identical strings always return
 * `'aligned'` regardless of shape so apps shipping pre-release
 * versions (`1.0.0-alpha.3`) don't get false `'unknown'` results.
 *
 * @param persistedSourceVersion The persisted instance's
 *   `sourceDefinitionVersion` — `null` when the dashboard was
 *   composed ad-hoc in the editor.
 * @param catalogVersion The catalog entry's `version` for the same
 *   `sourceDefinitionName`. Pass `undefined` when the catalog
 *   doesn't expose the source definition.
 */
export function detectVersionDrift(
  persistedSourceVersion: string | null,
  catalogVersion: string | undefined
): DashboardVersionDrift {
  if (persistedSourceVersion === null) return 'ad-hoc';
  if (catalogVersion === undefined) return 'unknown';
  if (persistedSourceVersion === catalogVersion) return 'aligned';

  const persistedTuple = parseSemver(persistedSourceVersion);
  const catalogTuple = parseSemver(catalogVersion);
  if (persistedTuple === null || catalogTuple === null) {
    // One side has a non-conventional version string. Already
    // checked equality above; falling through means they differ
    // somehow but we can't order them safely.
    return 'unknown';
  }
  const cmp = compareSemver(persistedTuple, catalogTuple);
  if (cmp === 0) return 'aligned';
  return cmp < 0 ? 'behind' : 'ahead';
}
