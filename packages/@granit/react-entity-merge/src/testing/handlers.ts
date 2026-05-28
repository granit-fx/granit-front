import { http, HttpResponse } from 'msw';

import { mockMergeResult, MOCK_BASE_PATH } from './data.js';

import type { MergeResult } from '@granit/entity-merge';
import type { RequestHandler } from 'msw';

export interface CreateEntityMergeHandlersOptions {
  /** Collection root the handlers mount under (default: `/api/v1/mergeables`). */
  readonly basePath?: string;
  /** Preview/commit fixture to return (default: {@link mockMergeResult}). */
  readonly result?: MergeResult;
}

/**
 * MSW handlers for the entity-merge endpoints. `GET .../merge/preview` returns
 * the fixture as a dry-run; `POST .../merge` echoes it with `dryRun` reflecting
 * the request body so a single test can exercise preview and commit.
 */
export function createEntityMergeHandlers(
  options: CreateEntityMergeHandlersOptions = {}
): RequestHandler[] {
  const basePath = options.basePath ?? MOCK_BASE_PATH;
  const result = options.result ?? mockMergeResult;

  return [
    http.get(`${basePath}/:survivorId/merge/preview`, ({ params, request }) => {
      const loserId = new URL(request.url).searchParams.get('loserId') ?? result.loserId;
      return HttpResponse.json({
        ...result,
        survivorId: params.survivorId as string,
        loserId,
        dryRun: true,
      });
    }),

    http.post(`${basePath}/:survivorId/merge`, async ({ params, request }) => {
      const body = (await request.json().catch(() => ({}))) as {
        loserId?: string;
        dryRun?: boolean;
      };
      return HttpResponse.json({
        ...result,
        survivorId: params.survivorId as string,
        loserId: body.loserId ?? result.loserId,
        dryRun: body.dryRun ?? false,
      });
    }),
  ];
}
