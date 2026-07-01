import { shouldRetryIgnoringTombstone } from '@granit/idempotency';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/query-core';

export interface CreateAppQueryClientOptions {
  /**
   * Called on every query/mutation error. Inject the app's presentation (e.g. a
   * toast built from ProblemDetails) so this factory stays free of any UI
   * library. Errors already handled elsewhere (401/403 redirects) should be
   * filtered by the handler itself.
   */
  onApiError: (error: unknown) => void;
  /**
   * Max mutation attempts before giving up. Mutations carrying an
   * Idempotency-Key short-circuit on a tombstoned response (413 +
   * X-Idempotency-Tombstone) regardless. Defaults to 2.
   */
  mutationMaxAttempts?: number;
  /** Query staleTime in ms. Defaults to 60_000. */
  staleTimeMs?: number;
}

/**
 * Build the app's TanStack QueryClient with Granit's standard policy: surface
 * errors via the injected handler, sensible query defaults, and idempotency-
 * aware mutation retries. Framework-agnostic (QueryClient core).
 */
export function createAppQueryClient(options: CreateAppQueryClientOptions): QueryClient {
  const { onApiError, mutationMaxAttempts = 2, staleTimeMs = 1000 * 60 } = options;
  return new QueryClient({
    queryCache: new QueryCache({ onError: onApiError }),
    mutationCache: new MutationCache({ onError: onApiError }),
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: staleTimeMs,
      },
      mutations: {
        retry: (failureCount, error) =>
          shouldRetryIgnoringTombstone(failureCount, error, mutationMaxAttempts),
      },
    },
  });
}
