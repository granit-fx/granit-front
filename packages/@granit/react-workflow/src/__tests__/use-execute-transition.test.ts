import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useExecuteTransition } from '../hooks/use-execute-transition';

import { axiosResponse, createMockClient, createWrapper } from './test-utils.tsx';

import type { WorkflowTransitionResultResponse } from '@granit/workflow';

describe('useExecuteTransition', () => {
  it('should execute a transition successfully', async () => {
    const client = createMockClient();
    const transitionResult: WorkflowTransitionResultResponse = {
      succeeded: true,
      resultingState: 'Published',
      outcome: 'Completed',
    };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(transitionResult));
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useExecuteTransition({ onSuccess }), {
      wrapper: createWrapper(client),
    });

    let returned: WorkflowTransitionResultResponse | null = null;
    await act(async () => {
      returned = await result.current.transition('Draft', 'Published', 'Approved');
    });

    expect(client.post).toHaveBeenCalledWith(
      '/api/v1/workflow/transitions',
      { targetState: 'Published', comment: 'Approved' },
      { params: { currentState: 'Draft' } }
    );
    expect(returned).toEqual(transitionResult);
    await waitFor(() => expect(result.current.data).toEqual(transitionResult));
    expect(onSuccess).toHaveBeenCalledWith(transitionResult);
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it('should handle transition error', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValue(new Error('Forbidden'));
    const onError = vi.fn();

    const { result } = renderHook(() => useExecuteTransition({ onError }), {
      wrapper: createWrapper(client),
    });

    let returned: WorkflowTransitionResultResponse | null = null;
    await act(async () => {
      returned = await result.current.transition('Draft', 'Published');
    });

    expect(returned).toBeNull();
    await waitFor(() => expect(result.current.error?.message).toBe('Forbidden'));
    expect(onError).toHaveBeenCalled();
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it('should set isPending state during transition', async () => {
    const client = createMockClient();
    let resolvePost!: (value: unknown) => void;
    vi.mocked(client.post).mockReturnValue(
      new Promise((resolve) => {
        resolvePost = resolve;
      })
    );

    const { result } = renderHook(() => useExecuteTransition(), {
      wrapper: createWrapper(client),
    });

    expect(result.current.isPending).toBe(false);

    let promise: Promise<unknown>;
    act(() => {
      promise = result.current.transition('Draft', 'Published');
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    await act(async () => {
      resolvePost(
        axiosResponse({
          succeeded: true,
          resultingState: 'Published',
          outcome: 'Completed',
        })
      );
      await promise!;
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it('should handle approval-requested outcome', async () => {
    const client = createMockClient();
    const transitionResult: WorkflowTransitionResultResponse = {
      succeeded: true,
      resultingState: 'PendingReview',
      outcome: 'ApprovalRequested',
    };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(transitionResult));

    const { result } = renderHook(() => useExecuteTransition(), {
      wrapper: createWrapper(client),
    });

    let returned: WorkflowTransitionResultResponse | null = null;
    await act(async () => {
      returned = await result.current.transition('Draft', 'Published');
    });

    expect(returned!.outcome).toBe('ApprovalRequested');
    expect(returned!.resultingState).toBe('PendingReview');
  });
});
