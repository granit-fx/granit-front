import { mergeParty, previewPartyMerge } from '@granit/parties';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildPartiesQueryKey, usePartiesConfig } from '../providers/parties-provider.js';

import type { PartyId, PartyMergeRequest, PartyMergeResponse } from '@granit/parties';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/**
 * Generate a fresh idempotency key for a merge submission. Prefers
 * `crypto.randomUUID()` when available; falls back to a Math.random-based UUID
 * v4 string for older runtimes.
 */
function newIdempotencyKey(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Dry-run merge preview for a (survivor, loser) pair. Cached per pair under
 * `[parties, 'merge', 'preview', survivorId, loserId]` so opening the same
 * wizard twice doesn't re-hit the backend.
 *
 * @example
 * ```tsx
 * const { data: preview } = useMergePartyPreviewQuery({ survivorId, loserId });
 * ```
 */
export function useMergePartyPreviewQuery(args: {
  readonly survivorId: PartyId | null | undefined;
  readonly loserId: PartyId | null | undefined;
}): UseQueryResult<PartyMergeResponse> {
  const config = usePartiesConfig();
  const basePath = config.basePath!;
  const { survivorId, loserId } = args;

  return useQuery({
    queryKey: buildPartiesQueryKey(config, 'merge', 'preview', survivorId, loserId),
    queryFn: () =>
      previewPartyMerge(config.client, basePath, survivorId as PartyId, loserId as PartyId),
    enabled: survivorId != null && loserId != null && survivorId !== loserId,
  });
}

/**
 * Variables expected by {@link useMergePartyMutation}. Survivor id is fixed
 * for the lifetime of the wizard and supplied on instantiation; the per-submit
 * payload carries `loserId`, the resolved per-field `choices`, an optional
 * `reason`, and `dryRun`.
 *
 * `idempotencyKey` is auto-generated when omitted (one per submit). Pass an
 * explicit value only for tests or to force a retry of a previous attempt.
 */
export interface MergePartyMutationVariables {
  readonly request: PartyMergeRequest;
  readonly idempotencyKey?: string;
}

/**
 * Run the live merge of `request.loserId` into `survivorId`. Generates a fresh
 * UUID idempotency key per submission so retries are safe — the backend caches
 * the first result and surfaces 409 when the same key is reused with a
 * different payload.
 *
 * On success, invalidates:
 * - the parties list query (the loser disappears, the survivor may have moved)
 * - the survivor's detail query (new merged values, possibly new metadata)
 * - the loser's detail query (now tombstoned)
 * - any cached preview for the (survivor, loser) pair (no longer applicable)
 */
export function useMergePartyMutation(
  survivorId: PartyId
): UseMutationResult<PartyMergeResponse, Error, MergePartyMutationVariables> {
  const config = usePartiesConfig();
  const basePath = config.basePath!;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ request, idempotencyKey }) =>
      mergeParty(
        config.client,
        basePath,
        survivorId,
        request,
        idempotencyKey ?? newIdempotencyKey()
      ),
    onSuccess: (_data, { request }) => {
      // Live merges only — dry-runs never commit so don't invalidate caches.
      if (request.dryRun) return;

      void queryClient.invalidateQueries({
        queryKey: buildPartiesQueryKey(config, 'list'),
      });
      void queryClient.invalidateQueries({
        queryKey: buildPartiesQueryKey(config, 'detail', survivorId),
      });
      void queryClient.invalidateQueries({
        queryKey: buildPartiesQueryKey(config, 'detail', request.loserId),
      });
      void queryClient.invalidateQueries({
        queryKey: buildPartiesQueryKey(config, 'merge', 'preview', survivorId, request.loserId),
      });
    },
  });
}
