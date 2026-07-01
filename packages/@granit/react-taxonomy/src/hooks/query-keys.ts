import type { ResolvedTaxonomyConfig } from '../providers/taxonomy-provider';

/** Builds a consistent React Query key for taxonomy operations. */
export function buildTaxonomyQueryKey(
  config: ResolvedTaxonomyConfig,
  ...segments: readonly unknown[]
): readonly unknown[] {
  return [...config.queryKeyPrefix, ...segments];
}
