import type {
  PartyDuplicateCandidateId,
  PartyDuplicateCandidateResponse,
  PartyDuplicateMergeRequest,
  PartyId,
  PartyMergeResponse,
} from '../types.js';
import type { AxiosInstance } from '@granit/api-client';

/**
 * List pending duplicate-candidate pairs that involve the given party. Flat —
 * no paging — backed by `GET /parties/{id}/duplicate-candidates`.
 *
 * For the paginated/filterable inbox view, use the QueryEngine endpoint at
 * `GET /parties/duplicates` via `useQueryEndpoint` from
 * `@granit/react-query-engine` instead — there is no dedicated wrapper here
 * because the QueryEngine primitives already cover that surface.
 *
 * `GET {basePath}/{id}/duplicate-candidates`
 */
export async function listDuplicatesForParty(
  client: AxiosInstance,
  basePath: string,
  partyId: PartyId
): Promise<readonly PartyDuplicateCandidateResponse[]> {
  const response = await client.get<readonly PartyDuplicateCandidateResponse[]>(
    `${basePath}/${encodeURIComponent(partyId)}/duplicate-candidates`
  );
  return response.data;
}

/**
 * Mark a candidate pair as "not a duplicate". Idempotent — repeated dismisses
 * of the same row return 204; only a missing row returns 404.
 *
 * `POST {basePath}/duplicates/{id}/dismiss`
 */
export async function dismissPartyDuplicate(
  client: AxiosInstance,
  basePath: string,
  id: PartyDuplicateCandidateId
): Promise<void> {
  await client.post(`${basePath}/duplicates/${encodeURIComponent(id)}/dismiss`);
}

/**
 * One-click merge from a duplicate row. The loser is inferred server-side
 * from the candidate pair (the other end of `partyId` / `candidateId`); 422 if
 * `request.survivorId` is not part of that pair.
 *
 * Pass `idempotencyKey` (UUID v4 recommended) to make retries safe.
 *
 * `POST {basePath}/duplicates/{id}/merge` (with optional `Idempotency-Key` header)
 */
export async function mergePartyFromDuplicate(
  client: AxiosInstance,
  basePath: string,
  id: PartyDuplicateCandidateId,
  request: PartyDuplicateMergeRequest,
  idempotencyKey?: string
): Promise<PartyMergeResponse> {
  const response = await client.post<PartyMergeResponse>(
    `${basePath}/duplicates/${encodeURIComponent(id)}/merge`,
    request,
    idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined
  );
  return response.data;
}
