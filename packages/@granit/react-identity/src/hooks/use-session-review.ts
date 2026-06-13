import { getSessionReviewContext, submitSessionReview } from '@granit/identity';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildIdentityQueryKey, useIdentityConfig } from '../providers/identity-provider';

import type {
  SessionReviewContextResponse,
  SessionReviewDecisionRequest,
  SessionReviewResultResponse,
} from '@granit/identity';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// "Was this you?" session-review hooks — anonymous, token-protected flow behind
// the security-alert email CTA (granit-dotnet #2669). The token from the email
// link is the only credential; the page renders without an authenticated
// session. Served at `/sessions/review` (sessionsBasePath — the API root).
// ---------------------------------------------------------------------------

/**
 * Fetch the side-effect-free review context for a token
 * (`GET /sessions/review?token=…`). Disabled until a token is present, and not
 * retried so an invalid/expired token (400) surfaces immediately.
 *
 * A 400 surfaces as the query error — inspect `error` for an AxiosError with
 * `response.status === 400`.
 *
 * @example
 * ```tsx
 * const { data, isPending, isError } = useSessionReviewContext(token);
 * ```
 */
export function useSessionReviewContext(
  token: string | null | undefined
): UseQueryResult<SessionReviewContextResponse> {
  const config = useIdentityConfig();
  const basePath = config.sessionsBasePath;

  return useQuery({
    queryKey: buildIdentityQueryKey(config, 'session-review', token ?? ''),
    queryFn: () => getSessionReviewContext(config.client, basePath, token!),
    enabled: Boolean(token),
    retry: false,
  });
}

/**
 * Commit a review decision (`POST /sessions/review`). Single-use: a second
 * submission for the same token resolves with `applied: false`. On success the
 * cached review context for the token is primed with the recorded decision so a
 * re-render shows the outcome without a refetch.
 *
 * @example
 * ```tsx
 * const submit = useSubmitSessionReview();
 * const { decision, applied } = await submit.mutateAsync({ token, decision: 'Denied' });
 * ```
 */
export function useSubmitSessionReview(): UseMutationResult<
  SessionReviewResultResponse,
  Error,
  SessionReviewDecisionRequest
> {
  const config = useIdentityConfig();
  const queryClient = useQueryClient();
  const basePath = config.sessionsBasePath;

  return useMutation({
    mutationFn: (request: SessionReviewDecisionRequest) =>
      submitSessionReview(config.client, basePath, request),
    onSuccess: (result, variables) => {
      queryClient.setQueryData<SessionReviewContextResponse>(
        buildIdentityQueryKey(config, 'session-review', variables.token),
        (previous) => ({ country: previous?.country ?? null, decision: result.decision })
      );
    },
  });
}
