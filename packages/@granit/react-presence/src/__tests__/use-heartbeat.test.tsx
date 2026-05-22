import { createMockClient } from '@granit/react-testing';
import { toEntityId, toISODateString } from '@granit/types';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useHeartbeat } from '../hooks/use-heartbeat.js';

import { createPresenceTestHarness } from './test-utils.js';

import type { PresenceResponse } from '@granit/presence';
import type { UserId } from '@granit/types';

vi.mock('@granit/presence', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, sendHeartbeat: vi.fn() };
});

const { sendHeartbeat } = await import('@granit/presence');

const snapshot: PresenceResponse = {
  userId: toEntityId<'User'>('user-1') as UserId,
  effectiveStatus: 'Online',
  manualOverride: null,
  overrideUntilUtc: null,
  lastSeenUtc: toISODateString('2026-05-22T10:00:00Z'),
};

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
  vi.mocked(sendHeartbeat).mockResolvedValue(snapshot);
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
    expect(sendHeartbeat).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(sendHeartbeat).toHaveBeenCalledTimes(2);
  });

  it('suspends when hidden and resumes when visible', async () => {
    const client = createMockClient();
    const { wrapper } = createPresenceTestHarness(client);

    renderHook(() => useHeartbeat({ intervalMs: 1_000 }), { wrapper });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(sendHeartbeat).toHaveBeenCalledTimes(1);

    act(() => setVisibility('hidden'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(sendHeartbeat).toHaveBeenCalledTimes(1);

    act(() => setVisibility('visible'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(sendHeartbeat).toHaveBeenCalledTimes(2);
  });

  it('does nothing when disabled', async () => {
    const client = createMockClient();
    const { wrapper } = createPresenceTestHarness(client);

    renderHook(() => useHeartbeat({ disabled: true, intervalMs: 1_000 }), { wrapper });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(sendHeartbeat).not.toHaveBeenCalled();
  });
});
