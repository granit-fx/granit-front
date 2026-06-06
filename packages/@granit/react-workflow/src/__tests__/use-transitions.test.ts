import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useTransitions } from '../hooks/use-transitions';

import { axiosResponse, createMockClient, createWrapper } from './test-utils.tsx';

import type { WorkflowStatus } from '@granit/workflow';

describe('useTransitions', () => {
  it('should load transitions on mount', async () => {
    const client = createMockClient();
    const status: WorkflowStatus = {
      currentState: 'Draft',
      availableTransitions: [
        { targetState: 'Published', name: 'Publier', allowed: true, requiresApproval: false },
        { targetState: 'Archived', name: 'Archiver', allowed: false, requiresApproval: true },
      ],
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(status));

    const { result } = renderHook(() => useTransitions({ currentState: 'Draft' }), {
      wrapper: createWrapper(client),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.availableTransitions).toHaveLength(2);
    expect(result.current.data?.availableTransitions[0]!.name).toBe('Publier');
    expect(result.current.data?.availableTransitions[1]!.requiresApproval).toBe(true);
  });

  it('should set error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useTransitions({ currentState: 'Draft' }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Network error');
    expect(result.current.data).toBeUndefined();
  });

  it('should not fetch when enabled is false', () => {
    const client = createMockClient();

    const { result } = renderHook(
      () => useTransitions({ currentState: 'Draft', enabled: false }),
      { wrapper: createWrapper(client) }
    );

    expect(client.get).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('should refetch on manual refetch call', async () => {
    const client = createMockClient();
    const status1: WorkflowStatus = {
      currentState: 'Draft',
      availableTransitions: [
        { targetState: 'Published', name: 'Publier', allowed: true, requiresApproval: false },
      ],
    };
    const status2: WorkflowStatus = {
      currentState: 'Draft',
      availableTransitions: [
        { targetState: 'Published', name: 'Publier', allowed: true, requiresApproval: false },
        { targetState: 'Archived', name: 'Archiver', allowed: true, requiresApproval: false },
      ],
    };
    vi.mocked(client.get)
      .mockResolvedValueOnce(axiosResponse(status1))
      .mockResolvedValueOnce(axiosResponse(status2));

    const { result } = renderHook(() => useTransitions({ currentState: 'Draft' }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.availableTransitions).toHaveLength(1);

    await result.current.refetch();

    await waitFor(() =>
      expect(result.current.data?.availableTransitions).toHaveLength(2)
    );
  });
});
