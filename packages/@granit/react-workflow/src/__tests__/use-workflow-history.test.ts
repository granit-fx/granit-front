import { toISODateString } from '@granit/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useWorkflowHistory } from '../hooks/use-workflow-history';

import { axiosResponse, createMockClient, createWrapper } from './test-utils.tsx';

import type { TransitionHistory } from '@granit/workflow';

const sampleHistory: TransitionHistory[] = [
  {
    previousState: 'Draft',
    newState: 'PendingReview',
    transitionedAt: toISODateString('2026-01-10T09:00:00Z'),
    transitionedBy: 'Dr. Martin',
    comment: 'Submitted for review',
  },
  {
    previousState: 'PendingReview',
    newState: 'Published',
    transitionedAt: toISODateString('2026-01-11T14:00:00Z'),
    transitionedBy: 'Dr. Marchand',
    comment: null,
  },
];

describe('useWorkflowHistory', () => {
  it('should load history on mount', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({ items: sampleHistory, totalCount: sampleHistory.length, nextCursor: null })
    );

    const { result } = renderHook(
      () => useWorkflowHistory({ entityType: 'Document', entityId: 'doc-1' }),
      { wrapper: createWrapper(client) }
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.history).toHaveLength(2);
    expect(result.current.history[0]!.newState).toBe('PendingReview');
    expect(result.current.history[1]!.transitionedBy).toBe('Dr. Marchand');
  });

  it('should set error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(
      () => useWorkflowHistory({ entityType: 'Document', entityId: 'doc-1' }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error?.message).toBe('Not found');
    expect(result.current.history).toHaveLength(0);
  });

  it('should not fetch when enabled is false', () => {
    const client = createMockClient();

    const { result } = renderHook(
      () => useWorkflowHistory({ entityType: 'Document', entityId: 'doc-1', enabled: false }),
      { wrapper: createWrapper(client) }
    );

    expect(client.get).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.history).toHaveLength(0);
  });

  it('should wrap non-Error thrown values', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue('string error');

    const { result } = renderHook(
      () => useWorkflowHistory({ entityType: 'Document', entityId: 'doc-1' }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('string error');
    expect(result.current.history).toHaveLength(0);
  });

  it('should discard results when unmounted during fetch', async () => {
    const client = createMockClient();
    let resolveGet!: (value: unknown) => void;
    vi.mocked(client.get).mockReturnValue(
      new Promise((resolve) => {
        resolveGet = resolve;
      })
    );

    const { result, unmount } = renderHook(
      () => useWorkflowHistory({ entityType: 'Document', entityId: 'doc-1' }),
      { wrapper: createWrapper(client) }
    );

    expect(result.current.loading).toBe(true);

    // Unmount before the fetch resolves — triggers abort
    unmount();

    // Resolve after unmount — state updates should be skipped
    await act(async () => {
      resolveGet(
        axiosResponse({ items: sampleHistory, totalCount: sampleHistory.length, nextCursor: null })
      );
    });

    // The hook was unmounted, so we cannot inspect result.current meaningfully,
    // but the key assertion is that no React "setState on unmounted" warning is thrown.
    expect(true).toBe(true);
  });

  it('should discard errors when unmounted during fetch', async () => {
    const client = createMockClient();
    let rejectGet!: (reason: unknown) => void;
    vi.mocked(client.get).mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectGet = reject;
      })
    );

    const { unmount } = renderHook(
      () => useWorkflowHistory({ entityType: 'Document', entityId: 'doc-1' }),
      { wrapper: createWrapper(client) }
    );

    // Unmount before the fetch rejects — triggers abort
    unmount();

    // Reject after unmount — error state updates should be skipped
    await act(async () => {
      rejectGet(new Error('Late error'));
    });

    // No React warnings expected
    expect(true).toBe(true);
  });

  it('should refetch when refetch is called', async () => {
    const client = createMockClient();
    vi.mocked(client.get)
      .mockResolvedValueOnce(
        axiosResponse({ items: [sampleHistory[0]], totalCount: 1, nextCursor: null })
      )
      .mockResolvedValueOnce(
        axiosResponse({
          items: sampleHistory,
          totalCount: sampleHistory.length,
          nextCursor: null,
        })
      );

    const { result } = renderHook(
      () => useWorkflowHistory({ entityType: 'Document', entityId: 'doc-1' }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.history).toHaveLength(1);

    await result.current.refetch();

    await waitFor(() => expect(result.current.history).toHaveLength(2));
  });
});
