import { HttpResponse } from 'msw';

import type { PagedResult } from '@granit/query-engine';

/**
 * Build a JSON response wrapping items in a `PagedResult<T>`.
 *
 * @param items  - page of results to return
 * @param totalCount - total across all pages (defaults to `items.length`)
 */
export function pagedResponse<T>(items: readonly T[], totalCount: number = items.length) {
  const body: PagedResult<T> = { items, totalCount };
  return HttpResponse.json(body);
}

/** 204 No Content — typical for successful mutations. */
export function noContent() {
  return new HttpResponse(null, { status: 204 });
}

/** 404 Not Found. */
export function notFound() {
  return new HttpResponse(null, { status: 404 });
}

/** 202 Accepted — for asynchronous operations. */
export function accepted() {
  return new HttpResponse(null, { status: 202 });
}
