import type {
  SessionReviewContextResponse,
  SessionReviewDecisionRequest,
  SessionReviewResultResponse,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

// ---------------------------------------------------------------------------
// "Was this you?" session review — anonymous, token-protected endpoints behind
// the security-alert email CTA (granit-dotnet #2669). No bearer auth: the token
// is the only credential. These go through the centralized Axios client like
// every other session call, but the caller is unauthenticated, so the auth
// interceptor simply has nothing to attach.
//
// The token travels in the query string (GET) or request body (POST) by design
// — the standard email-action pattern. It is never logged or echoed back.
// ---------------------------------------------------------------------------

/**
 * Fetch the side-effect-free review context for a token
 * (`GET {basePath}/sessions/review?token=…`). Safe to call on page load.
 *
 * @throws AxiosError with `response.status === 400` when the token is invalid
 *   or expired.
 */
export async function getSessionReviewContext(
  client: AxiosInstance,
  basePath: string,
  token: string
): Promise<SessionReviewContextResponse> {
  const response = await client.get<SessionReviewContextResponse>(`${basePath}/sessions/review`, {
    params: { token },
  });
  return response.data;
}

/**
 * Commit a review decision (`POST {basePath}/sessions/review`). Single-use: a
 * second submission for the same token resolves with `applied: false` and the
 * already-recorded decision.
 *
 * @throws AxiosError with `response.status === 400` when the token is invalid
 *   or expired.
 */
export async function submitSessionReview(
  client: AxiosInstance,
  basePath: string,
  request: SessionReviewDecisionRequest
): Promise<SessionReviewResultResponse> {
  const response = await client.post<SessionReviewResultResponse>(
    `${basePath}/sessions/review`,
    request
  );
  return response.data;
}
