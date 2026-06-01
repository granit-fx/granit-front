import { previewMerge } from '@granit/entity-merge';
import { useQuery } from '@tanstack/react-query';

import { buildEntityMergeQueryKey, useEntityMergeConfig } from '../providers/entity-merge-provider';

import { entityMergeKeys } from './query-keys';

import type { MergeResult } from '@granit/entity-merge';
import type { UseQueryResult } from '@tanstack/react-query';

export interface UseMergePreviewOptions {
  /** Defaults to `true`; the query also self-disables on missing/equal ids. */
  readonly enabled?: boolean;
}

/**
 * Dry-run merge preview for a `(survivor, loser)` pair, cached per pair under
 * `[...prefix, 'merge', 'preview', survivorId, loserId]`. Disabled until both
 * ids are present and distinct.
 *
 * @example
 * ```tsx
 * const { data: preview } = useMergePreview(survivorId, loserId);
 * ```
 */
export function useMergePreview<TId extends string = string>(
  survivorId: TId | null | undefined,
  loserId: TId | null | undefined,
  options?: UseMergePreviewOptions
): UseQueryResult<MergeResult<TId>> {
  const config = useEntityMergeConfig();
  const enabled =
    (options?.enabled ?? true) && survivorId != null && loserId != null && survivorId !== loserId;

  return useQuery({
    queryKey: buildEntityMergeQueryKey(
      config,
      ...entityMergeKeys.preview(survivorId ?? '', loserId ?? '')
    ),
    queryFn: () =>
      previewMerge<TId>(config.client, config.basePath, survivorId as TId, loserId as TId),
    enabled,
  });
}
