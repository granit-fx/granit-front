import {
  dismissPartyDuplicate,
  listDuplicatesForParty,
  mergePartyFromDuplicate,
} from '@granit/parties';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildPartiesQueryKey, usePartiesConfig } from '../providers/parties-provider';

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
  // Fallback for older runtimes — relies on Web Crypto's getRandomValues
  // (always available wherever `crypto` is) to avoid the Math.random
  // safety warning. Builds a v4 UUID byte-by-byte per RFC 4122.
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
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
    // Covers both the per-party badge (`[parties, 'duplicates', 'for-party', …]`)
    // and the inbox grid when its `<QueryProvider>` is configured with
    // `queryKeyPrefix: ['parties', 'duplicates', 'inbox']` — the default
    // <DuplicatesInbox> below wires that automatically.
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: buildPartiesQueryKey(config, 'duplicates'),
      }),
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
    onSuccess: async (data, { request }) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: buildPartiesQueryKey(config, 'duplicates'),
        }),
        queryClient.invalidateQueries({
          queryKey: buildPartiesQueryKey(config, 'list'),
        }),
        queryClient.invalidateQueries({
          queryKey: buildPartiesQueryKey(config, 'detail', request.survivorId),
        }),
        queryClient.invalidateQueries({
          queryKey: buildPartiesQueryKey(config, 'detail', data.loserId),
        }),
      ]);
    },
  });
}
