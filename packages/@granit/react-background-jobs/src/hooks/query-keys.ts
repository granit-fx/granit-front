import type { BackgroundJobsConfig } from '../providers/background-jobs-provider';

export const DEFAULT_BACKGROUND_JOBS_KEY_PREFIX = ['background-jobs'] as const;

/**
 * Builds a consistent React Query key for background-jobs operations.
 *
 * @param config - Provider config carrying an optional `queryKeyPrefix`.
 * @param segments - Additional segments appended after the prefix.
 */
export function buildBackgroundJobsQueryKey(
  config: Pick<BackgroundJobsConfig, 'queryKeyPrefix'>,
  ...segments: readonly unknown[]
): readonly unknown[] {
  return [...(config.queryKeyPrefix ?? DEFAULT_BACKGROUND_JOBS_KEY_PREFIX), ...segments];
}
