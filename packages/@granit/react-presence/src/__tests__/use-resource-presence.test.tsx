import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { cleanup, act, renderHook } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useResourcePresence } from '../hooks/use-resource-presence.js';
import { PresenceProvider } from '../providers/presence-provider.js';

import type { AxiosInstance } from '@granit/api-client';
import type { ResourceRoomResponse } from '@granit/presence';

vi.mock('@granit/presence', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    joinResourceRoom: vi.fn(),
    leaveResourceRoom: vi.fn(),
  };
});

const { joinResourceRoom, leaveResourceRoom } = await import('@granit/presence');

// ---------------------------------------------------------------------------
// Test harness — stable config avoids spurious effect restarts on re-renders
// ---------------------------------------------------------------------------

/**
 * Creates a wrapper with a **stable** PresenceProvider config so that
 * React state updates inside the hook do not recreate the config object,
 * which would cause spurious effect cleanup/restart cycles.
 */
function makeWrapper(client: AxiosInstance) {
  const queryClient = createTestQueryClient();
  // Stable reference: defined outside JSX so it never changes between renders.
  const presenceConfig = { client };

  function Wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
      <QueryClientProvider client={queryClient}>
        <PresenceProvider config={presenceConfig}>{children}</PresenceProvider>
      </QueryClientProvider>
    );
  }

  return { queryClient, wrapper: Wrapper };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SYSTEM_TIME = new Date('2026-05-28T10:00:00Z');

function makeRoom(ageMs: number[] = [0]): ResourceRoomResponse {
  return {
    kind: 'cms.page',
    id: 'doc-1',
    participants: ageMs.map((ms, i) => ({
      userId: `user-${i}`,
      lastSeenUtc: new Date(SYSTEM_TIME.getTime() - ms).toISOString(),
      metadata: null,
    })),
  };
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(SYSTEM_TIME);
  setVisibility('visible');
  vi.mocked(joinResourceRoom).mockResolvedValue(makeRoom());
  vi.mocked(leaveResourceRoom).mockResolvedValue(undefined);
});

afterEach(() => {
  // Explicitly clean up RTL components BEFORE clearing mocks so that any
  // leaveResourceRoom calls triggered by auto-unmount are counted in this
  // test's afterEach, not leaked into the next test.
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useResourcePresence', () => {
  it('fires an immediate join on mount and populates participants', async () => {
    const { wrapper } = makeWrapper(createMockClient());

    const { result } = renderHook(
      () => useResourcePresence('cms.page', 'doc-1', { heartbeatIntervalMs: 1_000 }),
      { wrapper }
    );

    expect(result.current.isJoining).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(joinResourceRoom).toHaveBeenCalledTimes(1);
    expect(result.current.participants).toHaveLength(1);
    expect(result.current.isJoining).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('re-heartbeats on the interval tick', async () => {
    const { wrapper } = makeWrapper(createMockClient());

    renderHook(() => useResourcePresence('cms.page', 'doc-1', { heartbeatIntervalMs: 1_000 }), {
      wrapper,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(joinResourceRoom).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(joinResourceRoom).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(joinResourceRoom).toHaveBeenCalledTimes(3);
  });

  it('suspends heartbeats when tab is hidden and resumes when visible', async () => {
    const { wrapper } = makeWrapper(createMockClient());

    renderHook(() => useResourcePresence('cms.page', 'doc-1', { heartbeatIntervalMs: 1_000 }), {
      wrapper,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(joinResourceRoom).toHaveBeenCalledTimes(1);

    act(() => setVisibility('hidden'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(joinResourceRoom).toHaveBeenCalledTimes(1);

    act(() => setVisibility('visible'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(joinResourceRoom).toHaveBeenCalledTimes(2);
  });

  it('fires leave on unmount', async () => {
    const { wrapper } = makeWrapper(createMockClient());

    const { unmount } = renderHook(
      () => useResourcePresence('cms.page', 'doc-1', { heartbeatIntervalMs: 1_000 }),
      { wrapper }
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    const callsBefore = vi.mocked(leaveResourceRoom).mock.calls.length;
    unmount();

    // Unmount must have added exactly one more leave call with the right args.
    expect(vi.mocked(leaveResourceRoom).mock.calls.length).toBe(callsBefore + 1);
    expect(leaveResourceRoom).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'cms.page',
      'doc-1'
    );
  });

  it('leaves the old room and joins the new one when kind/id changes', async () => {
    const { wrapper } = makeWrapper(createMockClient());

    let kind = 'cms.page';
    let id = 'doc-1';

    const { rerender } = renderHook(
      () => useResourcePresence(kind, id, { heartbeatIntervalMs: 1_000 }),
      { wrapper }
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(joinResourceRoom).toHaveBeenCalledTimes(1);

    const leavesBeforeSwitch = vi.mocked(leaveResourceRoom).mock.calls.length;
    kind = 'cms.section';
    id = 'doc-2';
    rerender();

    // Effect cleanup for the old kind/id must fire exactly one leave.
    expect(vi.mocked(leaveResourceRoom).mock.calls.length).toBe(leavesBeforeSwitch + 1);
    expect(leaveResourceRoom).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'cms.page',
      'doc-1'
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(joinResourceRoom).toHaveBeenCalledTimes(2);
    expect(joinResourceRoom).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.anything(),
      'cms.section',
      'doc-2',
      expect.anything(),
      expect.any(AbortSignal)
    );
  });

  it('drops stale participants beyond staleThresholdMs', async () => {
    const { wrapper } = makeWrapper(createMockClient());

    vi.mocked(joinResourceRoom).mockResolvedValue(makeRoom([5_000, 50_000]));

    const { result } = renderHook(
      () =>
        useResourcePresence('cms.page', 'doc-1', {
          heartbeatIntervalMs: 1_000,
          staleThresholdMs: 45_000,
        }),
      { wrapper }
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.participants).toHaveLength(1);
    expect(result.current.participants[0]!.userId).toBe('user-0');
  });

  it('sorts participants freshest-first', async () => {
    const { wrapper } = makeWrapper(createMockClient());

    vi.mocked(joinResourceRoom).mockResolvedValue(makeRoom([10_000, 2_000, 7_000]));

    const { result } = renderHook(
      () => useResourcePresence('cms.page', 'doc-1', { heartbeatIntervalMs: 1_000 }),
      { wrapper }
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    const ages = result.current.participants.map(
      (p) => SYSTEM_TIME.getTime() - new Date(p.lastSeenUtc).getTime()
    );
    expect(ages).toEqual([2_000, 7_000, 10_000]);
  });

  it('is inert when enabled is false', async () => {
    const { wrapper } = makeWrapper(createMockClient());

    renderHook(
      () =>
        useResourcePresence('cms.page', 'doc-1', { enabled: false, heartbeatIntervalMs: 1_000 }),
      { wrapper }
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });

    expect(joinResourceRoom).not.toHaveBeenCalled();
    expect(leaveResourceRoom).not.toHaveBeenCalled();
  });

  it('surfaces a validation error for an invalid kind without fetching', async () => {
    const { wrapper } = makeWrapper(createMockClient());

    const { result } = renderHook(
      () => useResourcePresence('INVALID KIND!', 'doc-1', { heartbeatIntervalMs: 1_000 }),
      { wrapper }
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Hook validates before calling the API function.
    expect(result.current.error).toBeInstanceOf(TypeError);
    expect(joinResourceRoom).not.toHaveBeenCalled();
  });

  it('preserves last good participants after all retries fail', async () => {
    const { wrapper } = makeWrapper(createMockClient());

    vi.mocked(joinResourceRoom)
      .mockResolvedValueOnce(makeRoom())
      .mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(
      () => useResourcePresence('cms.page', 'doc-1', { heartbeatIntervalMs: 1_000 }),
      { wrapper }
    );

    // First tick: success → participants populated.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.participants).toHaveLength(1);
    expect(result.current.error).toBeNull();

    // Second tick (at 1 000ms) fails and exhausts retries:
    //   attempt 0 → fail → wait 1 000ms
    //   attempt 1 → fail → wait 2 000ms
    //   attempt 2 → fail → wait 4 000ms
    //   attempt 3 → fail → error surfaced
    // Total advancement needed: 1 000 (interval) + 7 000 (retry delays) = 8 000ms.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8_000);
    });

    expect(result.current.participants).toHaveLength(1);
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('is StrictMode-safe: participants are correct after double-mount cycle', async () => {
    const client = createMockClient();
    const queryClient = createTestQueryClient();
    const presenceConfig = { client };

    function StrictWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
      return (
        <React.StrictMode>
          <QueryClientProvider client={queryClient}>
            <PresenceProvider config={presenceConfig}>{children}</PresenceProvider>
          </QueryClientProvider>
        </React.StrictMode>
      );
    }

    const { result, unmount } = renderHook(
      () => useResourcePresence('cms.page', 'doc-1', { heartbeatIntervalMs: 1_000 }),
      { wrapper: StrictWrapper }
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Core invariant: after the double-mount cycle settles, the hook must have
    // joined the room and populated participants without errors.
    expect(result.current.participants).toHaveLength(1);
    expect(result.current.isJoining).toBe(false);
    expect(result.current.error).toBeNull();

    // Leave must be called at least once on unmount.
    const leavesBeforeUnmount = vi.mocked(leaveResourceRoom).mock.calls.length;
    unmount();
    expect(vi.mocked(leaveResourceRoom).mock.calls.length).toBeGreaterThan(leavesBeforeUnmount);
  });
});
