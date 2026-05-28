import type { MergeRequest, MergeResult } from '../types/index.js';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Compute a dry-run preview of merging `loserId` into `survivorId`. Returns
 * per-field conflicts (with the recommended winner pre-populated) and the
 * cross-module rewrite counts a live merge would apply. Pure read — no DB
 * changes.
 *
 * `GET {basePath}/{survivorId}/merge/preview?loserId={loserId}`
 *
 * @param basePath Collection root of the mergeable aggregate, e.g.
 *   `/api/v1/parties`. The `/{survivorId}/merge/preview` suffix is appended,
 *   so the same call shape works for `/api/v1/products`, `/api/v1/leads`, …
 */
export async function previewMerge<TId extends string = string>(
  client: AxiosInstance,
  basePath: string,
  survivorId: TId,
  loserId: TId
): Promise<MergeResult<TId>> {
  const response = await client.get<MergeResult<TId>>(
    `${basePath}/${encodeURIComponent(survivorId)}/merge/preview`,
    { params: { loserId } }
  );
  return response.data;
}

/**
 * Run the live merge of `request.loserId` into `survivorId` (or a dry-run when
 * `request.dryRun` is set). The loser is tombstoned and cross-module foreign
 * keys are rewritten onto the survivor inside a single transaction.
 *
 * Pass an `idempotencyKey` (UUID recommended — see
 * `generateMergeIdempotencyKey`) to make retries safe: the orchestrator caches
 * the first result and returns 409 when the same key is reused with a
 * different payload.
 *
 * `POST {basePath}/{survivorId}/merge` (with optional `Idempotency-Key` header)
 */
export async function executeMerge<TId extends string = string>(
  client: AxiosInstance,
  basePath: string,
  survivorId: TId,
  request: MergeRequest<TId>,
  idempotencyKey?: string
): Promise<MergeResult<TId>> {
  const response = await client.post<MergeResult<TId>>(
    `${basePath}/${encodeURIComponent(survivorId)}/merge`,
    request,
    idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined
  );
  return response.data;
}
