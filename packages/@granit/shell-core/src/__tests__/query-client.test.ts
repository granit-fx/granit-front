import { createAppQueryClient } from '../query-client';

import type { QueryClient } from '@tanstack/query-core';

function mutationRetry(client: QueryClient) {
  const retry = client.getDefaultOptions().mutations?.retry;
  if (typeof retry !== 'function') throw new Error('expected a retry function');
  return retry as (failureCount: number, error: unknown) => boolean;
}

describe('createAppQueryClient', () => {
  it('applies the standard query defaults', () => {
    const client = createAppQueryClient({ onApiError: vi.fn() });
    const queries = client.getDefaultOptions().queries;
    expect(queries?.retry).toBe(1);
    expect(queries?.refetchOnWindowFocus).toBe(false);
    expect(queries?.staleTime).toBe(60_000);
  });

  it('honours a custom staleTime', () => {
    const client = createAppQueryClient({ onApiError: vi.fn(), staleTimeMs: 5_000 });
    expect(client.getDefaultOptions().queries?.staleTime).toBe(5_000);
  });

  it('routes query and mutation errors to onApiError', () => {
    const onApiError = vi.fn();
    const client = createAppQueryClient({ onApiError });
    const error = new Error('boom');

    client.getQueryCache().config.onError?.(error, {} as never);
    client.getMutationCache().config.onError?.(error, undefined, undefined, {} as never);

    expect(onApiError).toHaveBeenCalledTimes(2);
    expect(onApiError.mock.calls[0][0]).toBe(error);
    expect(onApiError.mock.calls[1][0]).toBe(error);
  });

  it('retries mutations until the default max attempts (2)', () => {
    const retry = mutationRetry(createAppQueryClient({ onApiError: vi.fn() }));
    expect(retry(0, new Error())).toBe(true);
    expect(retry(1, new Error())).toBe(true);
    expect(retry(2, new Error())).toBe(false);
  });

  it('honours a custom mutationMaxAttempts', () => {
    const retry = mutationRetry(
      createAppQueryClient({ onApiError: vi.fn(), mutationMaxAttempts: 1 })
    );
    expect(retry(0, new Error())).toBe(true);
    expect(retry(1, new Error())).toBe(false);
  });

  it('never retries a tombstoned idempotent mutation', () => {
    const retry = mutationRetry(createAppQueryClient({ onApiError: vi.fn() }));
    const tombstoned = {
      isAxiosError: true,
      response: { status: 413, headers: { 'x-idempotency-tombstone': 'true' } },
    };
    expect(retry(0, tombstoned)).toBe(false);
  });
});
