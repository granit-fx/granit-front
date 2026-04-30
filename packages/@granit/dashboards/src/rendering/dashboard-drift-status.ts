/**
 * Wire format for `Granit.Dashboards.Endpoints.Dtos.DashboardDriftStatus`
 * (ADR-038 §3). Surfaced on {@link DashboardRenderResponse.driftStatus} —
 * server-side comparison between the persisted dashboard's
 * `sourceDefinitionVersion` and the currently-registered descriptor's
 * `version`. PascalCase string literals match the backend's
 * `JsonStringEnumConverter` output.
 *
 * Comparison is semver-aware: the backend parses `MAJOR.MINOR.PATCH`
 * with optional pre-release / build suffix and orders numerically.
 * Mismatched suffixes or unparseable strings collapse to `'Unknown'`.
 *
 * - `'NotApplicable'`: ad-hoc dashboard, no source definition. Hide
 *   drift UI entirely.
 * - `'Aligned'`: persisted version matches the registered descriptor.
 *   No action.
 * - `'Behind'`: persisted is older than the registered descriptor —
 *   the source module shipped a new revision since import. Surface
 *   "Click to resync".
 * - `'Ahead'`: persisted is newer than the registered descriptor —
 *   the host loaded an older module than at import. Resync would
 *   downgrade; offer as an explicit force-resync.
 * - `'Unknown'`: versions cannot be ordered (unparseable or mismatched
 *   pre-release suffixes). Treat like `'Aligned'` for the main banner;
 *   expose a tooltip with both raw versions for manual reconciliation.
 * - `'SourceUnregistered'`: source definition is no longer registered
 *   in the host. Resync impossible; surface a terminal warning.
 *
 * Distinct from {@link DashboardVersionDrift} — that 5-state union is
 * computed client-side by `detectVersionDrift` from the list page's
 * summary + catalog data when no render response is available.
 */
export type DashboardDriftStatus =
  | 'NotApplicable'
  | 'Aligned'
  | 'Behind'
  | 'Ahead'
  | 'Unknown'
  | 'SourceUnregistered';
