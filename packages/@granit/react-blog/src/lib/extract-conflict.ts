import { BlogErrorCodes } from '@granit/blog';

import type { BlogErrorCode } from '@granit/blog';

/** A parsed RFC 7807 conflict (`409`) body from a Blog endpoint. */
export interface BlogConflict {
  readonly status: 409;
  readonly code: BlogErrorCode | string | null;
  readonly detail: string | null;
}

/**
 * Extracts a Blog `409` conflict from a rejected mutation error, or `null` for
 * any other error (those are surfaced by the global MutationCache toast). Use to
 * drive a reload prompt on stale `concurrencyStamp` (`DraftConcurrency` /
 * `StalePost`) or a slug/author conflict dialog.
 */
export function extractBlogConflict(error: unknown): BlogConflict | null {
  if (typeof error !== 'object' || error === null || !('response' in error)) return null;
  const response = (error as { response?: { status?: number; data?: unknown } }).response;
  if (!response || response.status !== 409) return null;
  const data = (response.data ?? {}) as { code?: string; detail?: string };
  return { status: 409, code: data.code ?? null, detail: data.detail ?? null };
}

/** True when the error is a stale-stamp conflict (draft or post metadata). */
export function isBlogConcurrencyConflict(error: unknown): boolean {
  const code = extractBlogConflict(error)?.code;
  return code === BlogErrorCodes.DraftConcurrency || code === BlogErrorCodes.StalePost;
}
