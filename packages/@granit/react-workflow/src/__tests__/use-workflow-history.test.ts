import { toISODateString } from '@granit/types';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useWorkflowHistory } from '../hooks/use-workflow-history';

import { axiosResponse, createMockClient, createWrapper } from './test-utils.tsx';

import type { WorkflowTransitionHistoryResponse } from '@granit/workflow';

const sampleHistory: WorkflowTransitionHistoryResponse[] = [
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
      axiosResponse({
        items: sampleHistory,
        totalCount: sampleHistory.length,
        hasMore: false,
        nextCursor: null,
      })
    );

    const { result } = renderHook(
      () => useWorkflowHistory({ entityType: 'Document', entityId: 'doc-1' }),
      { wrapper: createWrapper(client) }
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.items).toHaveLength(2);
    expect(result.current.data?.items[0]!.newState).toBe('PendingReview');
    expect(result.current.data?.items[1]!.transitionedBy).toBe('Dr. Marchand');
    expect(result.current.data?.hasMore).toBe(false);
  });

  it('should set error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(
      () => useWorkflowHistory({ entityType: 'Document', entityId: 'doc-1' }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Not found');
    expect(result.current.data).toBeUndefined();
  });

  it('should not fetch when enabled is false', () => {
    const client = createMockClient();

    const { result } = renderHook(
      () => useWorkflowHistory({ entityType: 'Document', entityId: 'doc-1', enabled: false }),
      { wrapper: createWrapper(client) }
    );

    expect(client.get).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('should pass page and pageSize params', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({
        items: sampleHistory,
        totalCount: 40,
        hasMore: true,
        nextCursor: null,
      })
    );

    const { result } = renderHook(
      () =>
        useWorkflowHistory({ entityType: 'Document', entityId: 'doc-1', page: 2, pageSize: 10 }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(client.get).toHaveBeenCalledWith(
      expect.stringContaining('/Document/doc-1/history'),
      expect.objectContaining({ params: { page: 2, pageSize: 10 } })
    );
    expect(result.current.data?.hasMore).toBe(true);
    expect(result.current.data?.totalCount).toBe(40);
  });

  it('should refetch when refetch is called', async () => {
    const client = createMockClient();
    vi.mocked(client.get)
      .mockResolvedValueOnce(
        axiosResponse({
          items: [sampleHistory[0]],
          totalCount: 1,
          hasMore: false,
          nextCursor: null,
        })
      )
      .mockResolvedValueOnce(
        axiosResponse({
          items: sampleHistory,
          totalCount: sampleHistory.length,
          hasMore: false,
          nextCursor: null,
        })
      );

    const { result } = renderHook(
      () => useWorkflowHistory({ entityType: 'Document', entityId: 'doc-1' }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.items).toHaveLength(1);

    await result.current.refetch();

    await waitFor(() => expect(result.current.data?.items).toHaveLength(2));
  });
});
