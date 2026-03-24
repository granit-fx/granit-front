import type { AxiosInstance } from 'axios';

/** Configuration for a single query endpoint. */
export interface QueryConfig {
  /** Axios instance (from @granit/api-client). */
  readonly client: AxiosInstance;
  /** API base path (e.g. "/api/v1/patients"). */
  readonly basePath: string;
  /**
   * TanStack Query key prefix.
   * Defaults to basePath segments (e.g. ["api", "patients"]).
   */
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * Build a TanStack Query key from the provider config + extra segments.
 */
export function buildQueryKey(
  config: QueryConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? config.basePath.split('/').filter(Boolean);
  return [...prefix, ...segments];
}
