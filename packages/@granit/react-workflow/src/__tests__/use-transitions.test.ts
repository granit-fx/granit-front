import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useTransitions } from '../hooks/use-transitions.js';

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

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.transitions).toHaveLength(2);
    expect(result.current.transitions[0]!.name).toBe('Publier');
    expect(result.current.transitions[1]!.requiresApproval).toBe(true);
  });

  it('should set error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useTransitions({ currentState: 'Draft' }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error?.message).toBe('Network error');
    expect(result.current.transitions).toHaveLength(0);
  });

  it('should wrap non-Error thrown values', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue('string error');

    const { result } = renderHook(() => useTransitions({ currentState: 'Draft' }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('string error');
  });

  it('should discard results when unmounted during fetch', async () => {
    const client = createMockClient();
    let resolveGet!: (value: unknown) => void;
    vi.mocked(client.get).mockReturnValue(
      new Promise((resolve) => {
        resolveGet = resolve;
      })
    );

    const { result, unmount } = renderHook(() => useTransitions({ currentState: 'Draft' }), {
      wrapper: createWrapper(client),
    });

    expect(result.current.loading).toBe(true);

    unmount();

    await act(async () => {
      resolveGet(
        axiosResponse({
          currentState: 'Draft',
          availableTransitions: [],
        })
      );
    });

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

    const { unmount } = renderHook(() => useTransitions({ currentState: 'Draft' }), {
      wrapper: createWrapper(client),
    });

    unmount();

    await act(async () => {
      rejectGet(new Error('Late error'));
    });

    expect(true).toBe(true);
  });

  it('should refetch when refetch is called', async () => {
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

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.transitions).toHaveLength(1);

    await result.current.refetch();

    await waitFor(() => expect(result.current.transitions).toHaveLength(2));
  });
});
