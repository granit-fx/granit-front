/**
 * Query-key factory for analytics queries — variadic `build*QueryKey` idiom,
 * aligned with `@granit/react-catalog`'s `buildCatalogQueryKey` and
 * `@granit/react-data-exchange`'s `buildExportQueryKey`/`buildImportQueryKey`
 * (`[...prefix, ...segments]`).
 *
 * react-analytics has no config provider (`useMetric` resolves the Axios client
 * directly via `useGranitClient`), so the prefix is fixed rather than sourced
 * from a `config.queryKeyPrefix`. The metric key shape
 * `['analytics', 'metric', name, request]` IS the future SSE subscription
 * identity (proposals doc P2.4) — keep it byte-identical; any push transport
 * reuses the same composition to address subscriptions.
 */
const ANALYTICS_QUERY_KEY_PREFIX = ['analytics'] as const;

/** Builds a consistent React Query key for analytics operations. */
export function buildAnalyticsQueryKey(...segments: readonly unknown[]): readonly unknown[] {
  return [...ANALYTICS_QUERY_KEY_PREFIX, ...segments];
}
