import type { PartiesConfig } from '../providers/parties-provider';

/** Builds a consistent React Query key for parties operations. */
export function buildPartiesQueryKey(
  config: PartiesConfig,
  ...segments: readonly unknown[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['parties'];
  return [...prefix, ...segments];
}
