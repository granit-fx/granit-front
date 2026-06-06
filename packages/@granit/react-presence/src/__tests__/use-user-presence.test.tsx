import { createMockClient } from '@granit/react-testing';
import { toEntityId, toISODateString } from '@granit/types';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useUserPresence } from '../hooks/use-user-presence';

import { createPresenceTestHarness } from './test-utils';

import type { PresenceResponse } from '@granit/presence';
import type { UserId } from '@granit/types';

vi.mock('@granit/presence', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, getUserPresence: vi.fn() };
});

const { getUserPresence } = await import('@granit/presence');

const USER_ID = toEntityId<'User'>('user-1') as UserId;

const MOCK_PRESENCE: PresenceResponse = {
  userId: USER_ID,
  effectiveStatus: 'Online',
  manualOverride: null,
  overrideUntilUtc: null,
  lastSeenUtc: toISODateString('2026-06-06T12:00:00Z'),
};

afterEach(() => vi.clearAllMocks());

describe('useUserPresence', () => {
  it('fetches presence for a valid user id', async () => {
    const client = createMockClient();
    vi.mocked(getUserPresence).mockResolvedValue(MOCK_PRESENCE);

    const { wrapper } = createPresenceTestHarness(client);
    const { result } = renderHook(() => useUserPresence(USER_ID), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(MOCK_PRESENCE);
  });

  it('does not fetch when userId is empty', () => {
    const client = createMockClient();
    const emptyId = '' as UserId;

    const { wrapper } = createPresenceTestHarness(client);
    const { result } = renderHook(() => useUserPresence(emptyId), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getUserPresence).not.toHaveBeenCalled();
  });

  it('does not fetch when enabled is false', () => {
    const client = createMockClient();

    const { wrapper } = createPresenceTestHarness(client);
    const { result } = renderHook(() => useUserPresence(USER_ID, { enabled: false }), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getUserPresence).not.toHaveBeenCalled();
  });
});
