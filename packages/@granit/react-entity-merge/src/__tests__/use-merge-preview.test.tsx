import { axiosResponse, createMockClient } from '@granit/testing';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useMergePreview } from '../hooks/use-merge-preview';
import { mockMergeResult } from '../testing/data';

import { createEntityMergeHarness } from './test-utils';

afterEach(() => vi.restoreAllMocks());

describe('useMergePreview', () => {
  it('fetches the dry-run preview for a (survivor, loser) pair', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(mockMergeResult));
    const { wrapper } = createEntityMergeHarness(client);

    const { result } = renderHook(() => useMergePreview('s1', 'l1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockMergeResult);
    expect(client.get).toHaveBeenCalledWith('/api/v1/mergeables/s1/merge/preview', {
      params: { loserId: 'l1' },
    });
  });

  it('is disabled when survivor and loser are the same', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(mockMergeResult));
    const { wrapper } = createEntityMergeHarness(client);

    const { result } = renderHook(() => useMergePreview('same', 'same'), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('is disabled when an id is missing', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(mockMergeResult));
    const { wrapper } = createEntityMergeHarness(client);

    const { result } = renderHook(() => useMergePreview('s1', null), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('honours an explicit enabled: false', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(mockMergeResult));
    const { wrapper } = createEntityMergeHarness(client);

    const { result } = renderHook(() => useMergePreview('s1', 'l1', { enabled: false }), {
      wrapper,
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});
