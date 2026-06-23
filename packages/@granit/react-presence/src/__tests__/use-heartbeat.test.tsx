import { createMockClient } from '@granit/react-testing';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mockMyPresence, mockOtherPresences, mockUsers } from '@granit/react-presence/testing';

import { presenceKeys } from '../hooks/query-keys';
import { useHeartbeat } from '../hooks/use-heartbeat';
import { useMyPresence } from '../hooks/use-my-presence';

import { createPresenceTestHarness } from './test-utils';

import type { PresenceResponse } from '@granit/presence';

vi.mock('@granit/presence', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, pollMyPresence: vi.fn(), getMyPresence: vi.fn() };
});

const { pollMyPresence, getMyPresence } = await import('@granit/presence');

const snapshot = mockMyPresence;

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  vi.useFakeTimers();
  setVisibility('visible');
  vi.mocked(pollMyPresence).mockResolvedValue(snapshot);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('useHeartbeat', () => {
  it('fires an immediate heartbeat and then polls on the interval', async () => {
    const client = createMockClient();
    const { wrapper } = createPresenceTestHarness(client);

    renderHook(() => useHeartbeat({ intervalMs: 1_000 }), { wrapper });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(pollMyPresence).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(pollMyPresence).toHaveBeenCalledTimes(2);
  });

  it('suspends when hidden and resumes when visible', async () => {
    const client = createMockClient();
    const { wrapper } = createPresenceTestHarness(client);

    renderHook(() => useHeartbeat({ intervalMs: 1_000 }), { wrapper });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(pollMyPresence).toHaveBeenCalledTimes(1);

    act(() => setVisibility('hidden'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(pollMyPresence).toHaveBeenCalledTimes(1);

    act(() => setVisibility('visible'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(pollMyPresence).toHaveBeenCalledTimes(2);
  });

  it('keeps the heartbeat snapshot when a concurrent useMyPresence GET resolves later with a staler one', async () => {
    const client = createMockClient();
    const { wrapper, queryClient } = createPresenceTestHarness(client);

    const offlineSnapshot = mockOtherPresences[mockUsers[4]!.id]!;
    let resolveGet: (value: PresenceResponse) => void = () => {};
    vi.mocked(getMyPresence).mockReturnValue(
      new Promise<PresenceResponse>((resolve) => {
        resolveGet = resolve;
      })
    );

    renderHook(
      () => {
        useMyPresence();
        useHeartbeat({ intervalMs: 1_000 });
      },
      { wrapper }
    );

    // Immediate heartbeat resolves (Online) and takes ownership of the cache,
    // cancelling the still-in-flight GET on the same key.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // The initial GET resolves last with a stale Offline snapshot — it must not
    // clobber the authoritative heartbeat result.
    await act(async () => {
      resolveGet(offlineSnapshot);
      await vi.advanceTimersByTimeAsync(0);
    });

    const cached = queryClient.getQueryData<PresenceResponse>(['presence', ...presenceKeys.my()]);
    expect(cached?.effectiveStatus).toBe('Online');
  });

  it('does nothing when disabled', async () => {
    const client = createMockClient();
    const { wrapper } = createPresenceTestHarness(client);

    renderHook(() => useHeartbeat({ disabled: true, intervalMs: 1_000 }), { wrapper });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(pollMyPresence).not.toHaveBeenCalled();
  });
});
