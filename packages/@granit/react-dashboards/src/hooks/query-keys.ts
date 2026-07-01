import type { DashboardsConfig } from '../providers/dashboards-provider';

/**
 * Single query-key factory for the dashboards package — the family-standard
 * `build{Module}QueryKey(config, ...segments)` shape (mirrors
 * `buildBlobStorageQueryKey` / `buildTaxonomyQueryKey` in sibling packages).
 *
 * When the provider supplies a `queryKeyPrefix` it is prepended; otherwise the
 * `segments` alone form the tuple. The per-operation factories in this package
 * are thin, `@deprecated` wrappers over this builder that pass their historical
 * literal roots as the leading segments, so every produced tuple stays
 * **byte-identical** to the pre-refactor keys.
 *
 * @remarks
 * Byte-identity matters: the SSE push path (`usePushedDashboard`) writes
 * per-widget cache entries via `setQueryData(dashboardWidgetQueryKey(...))` and
 * the passive reader (`useDashboardWidget`) reads the same key. Any drift
 * between the two would silently break real-time widget updates.
 *
 * @param config - Provider config carrying an optional `queryKeyPrefix`.
 * @param segments - Segments appended after the (optional) prefix.
 */
export function buildDashboardsQueryKey(
  config: Pick<DashboardsConfig, 'queryKeyPrefix'>,
  ...segments: readonly unknown[]
): readonly unknown[] {
  return [...(config.queryKeyPrefix ?? []), ...segments];
}
