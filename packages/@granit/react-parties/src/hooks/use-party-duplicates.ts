import {
  dismissPartyDuplicate,
  listDuplicatesForParty,
  mergePartyFromDuplicate,
} from '@granit/parties';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildPartiesQueryKey, usePartiesConfig } from '../providers/parties-provider.js';

import type {
  PartyDuplicateCandidateId,
  PartyDuplicateCandidateResponse,
  PartyDuplicateMergeRequest,
  PartyId,
  PartyMergeResponse,
} from '@granit/parties';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/**
 * Generate a fresh idempotency key for a duplicate-shortcut merge.
 * Same fallback as `useMergePartyMutation` — kept private to avoid coupling
 * the two hooks via a shared util module.
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
 * List the pending duplicate-candidate pairs that involve a specific party.
 * Powers the per-Party "Potential duplicates" badge on the detail page.
 *
 * Cached under `[parties, 'duplicates', 'for-party', partyId]` so the badge
 * and any inline panel share a single cache entry.
 *
 * @example
 * ```tsx
 * const { data: candidates } = usePartyDuplicateCandidatesForPartyQuery(party.id);
 * if (candidates && candidates.length > 0) return <PartyDuplicatesBadge ... />;
 * ```
 */
export function usePartyDuplicateCandidatesForPartyQuery(
  partyId: PartyId | null | undefined
): UseQueryResult<readonly PartyDuplicateCandidateResponse[]> {
  const config = usePartiesConfig();
  const basePath = config.basePath!;

  return useQuery({
    queryKey: buildPartiesQueryKey(config, 'duplicates', 'for-party', partyId),
    queryFn: () => listDuplicatesForParty(config.client, basePath, partyId as PartyId),
    enabled: partyId != null,
  });
}

/**
 * Mark a candidate pair as "not a duplicate". Idempotent server-side. On
 * success, invalidates the inbox list (via `useQueryEndpoint`'s
 * `[parties, 'list', …]` keys), every per-party candidates cache, and any
 * cached merge preview that touched the involved parties.
 */
export function useDismissPartyDuplicateMutation(): UseMutationResult<
  void,
  Error,
  { readonly id: PartyDuplicateCandidateId }
> {
  const config = usePartiesConfig();
  const basePath = config.basePath!;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }) => dismissPartyDuplicate(config.client, basePath, id),
    onSuccess: () => {
      // Covers both the per-party badge (`[parties, 'duplicates', 'for-party', …]`)
      // and the inbox grid when its `<QueryProvider>` is configured with
      // `queryKeyPrefix: ['parties', 'duplicates', 'inbox']` — the default
      // <DuplicatesInbox> below wires that automatically.
      void queryClient.invalidateQueries({
        queryKey: buildPartiesQueryKey(config, 'duplicates'),
      });
    },
  });
}

/**
 * Variables for {@link useMergePartyFromDuplicateMutation} — the candidate row
 * id plus the standard merge body. `idempotencyKey` is auto-generated when
 * omitted so retries are safe.
 */
export interface MergePartyFromDuplicateMutationVariables {
  readonly id: PartyDuplicateCandidateId;
  readonly request: PartyDuplicateMergeRequest;
  readonly idempotencyKey?: string;
}

/**
 * Execute the duplicate-row merge shortcut. The loser is inferred server-side
 * from the candidate pair (the other end of `partyId` / `candidateId`); 422 if
 * `survivorId` is not part of the pair.
 *
 * On success, invalidates: the duplicates cache (per-party + inbox), both
 * party detail caches, and the parties list — same coverage as the standard
 * merge mutation since the same orchestrator runs underneath.
 */
export function useMergePartyFromDuplicateMutation(): UseMutationResult<
  PartyMergeResponse,
  Error,
  MergePartyFromDuplicateMutationVariables
> {
  const config = usePartiesConfig();
  const basePath = config.basePath!;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request, idempotencyKey }) =>
      mergePartyFromDuplicate(
        config.client,
        basePath,
        id,
        request,
        idempotencyKey ?? newIdempotencyKey()
      ),
    onSuccess: (data, { request }) => {
      void queryClient.invalidateQueries({
        queryKey: buildPartiesQueryKey(config, 'duplicates'),
      });
      void queryClient.invalidateQueries({
        queryKey: buildPartiesQueryKey(config, 'list'),
      });
      void queryClient.invalidateQueries({
        queryKey: buildPartiesQueryKey(config, 'detail', request.survivorId),
      });
      void queryClient.invalidateQueries({
        queryKey: buildPartiesQueryKey(config, 'detail', data.loserId),
      });
    },
  });
}
