import { executeMerge, generateMergeIdempotencyKey } from '@granit/entity-merge';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  buildEntityMergeQueryKey,
  useEntityMergeConfig,
} from '../providers/entity-merge-provider.js';

import { entityMergeKeys } from './query-keys.js';

import type { MergeRequest, MergeResult } from '@granit/entity-merge';
import type { UseMutationResult } from '@tanstack/react-query';

/**
 * Variables for {@link useMergeMutation}. The survivor id is fixed for the
 * lifetime of the wizard and supplied on instantiation; each submit carries the
 * {@link MergeRequest} payload. `idempotencyKey` is auto-generated when omitted
 * (one per submit) — pass an explicit value only in tests or to force a retry.
 */
export interface MergeMutationVariables<TId extends string = string> {
  readonly request: MergeRequest<TId>;
  readonly idempotencyKey?: string;
}

/**
 * Run the live merge of `request.loserId` into `survivorId`. Generates a fresh
 * UUID idempotency key per submission so retries are safe. On a committed merge
 * (not a dry-run) it invalidates the cached preview for the pair; pass
 * `onInvalidate` to also refresh aggregate-specific queries (list, detail, …).
 */
export function useMergeMutation<TId extends string = string>(
  survivorId: TId,
  options?: {
    readonly onInvalidate?: (variables: MergeMutationVariables<TId>) => Promise<void> | void;
  }
): UseMutationResult<MergeResult<TId>, Error, MergeMutationVariables<TId>> {
  const config = useEntityMergeConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ request, idempotencyKey }) =>
      executeMerge<TId>(
        config.client,
        config.basePath,
        survivorId,
        request,
        idempotencyKey ?? generateMergeIdempotencyKey()
      ),
    onSuccess: async (_data, variables) => {
      // Dry-runs never commit, so they leave caches untouched.
      if (variables.request.dryRun) return;
      await queryClient.invalidateQueries({
        queryKey: buildEntityMergeQueryKey(
          config,
          ...entityMergeKeys.preview(survivorId, variables.request.loserId)
        ),
      });
      await options?.onInvalidate?.(variables);
    },
  });
}
