import { axiosResponse, createMockClient } from '@granit/testing';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useMergeMutation } from '../hooks/use-merge-mutation.js';
import { mockMergeResult } from '../testing/data.js';

import { createEntityMergeHarness } from './test-utils.js';

afterEach(() => vi.restoreAllMocks());

describe('useMergeMutation', () => {
  it('executes the merge with a generated idempotency key and invalidates the preview', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse({ ...mockMergeResult, dryRun: false }));
    const { wrapper, queryClient } = createEntityMergeHarness(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const onInvalidate = vi.fn();

    const { result } = renderHook(() => useMergeMutation<string>('s1', { onInvalidate }), {
      wrapper,
    });

    result.current.mutate({ request: { loserId: 'l1', dryRun: false } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [, , config] = vi.mocked(client.post).mock.calls[0]!;
    expect(config).toMatchObject({
      headers: { 'Idempotency-Key': expect.stringMatching(/^[0-9a-f-]{36}$/i) },
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['entity-merge', 'merge', 'preview', 's1', 'l1'],
    });
    expect(onInvalidate).toHaveBeenCalledTimes(1);
  });

  it('forwards an explicit idempotency key', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse({ ...mockMergeResult, dryRun: false }));
    const { wrapper } = createEntityMergeHarness(client);

    const { result } = renderHook(() => useMergeMutation<string>('s1'), { wrapper });
    result.current.mutate({ request: { loserId: 'l1' }, idempotencyKey: 'fixed-key' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const [, , config] = vi.mocked(client.post).mock.calls[0]!;
    expect(config).toMatchObject({ headers: { 'Idempotency-Key': 'fixed-key' } });
  });

  it('does not invalidate caches for a dry-run', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(mockMergeResult));
    const { wrapper, queryClient } = createEntityMergeHarness(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const onInvalidate = vi.fn();

    const { result } = renderHook(() => useMergeMutation<string>('s1', { onInvalidate }), {
      wrapper,
    });
    result.current.mutate({ request: { loserId: 'l1', dryRun: true } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(onInvalidate).not.toHaveBeenCalled();
  });
});
