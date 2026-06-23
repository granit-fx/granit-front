import { createMockClient } from '@granit/react-testing';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockOtherPresences, mockUsers } from '@granit/react-presence/testing';

import { useUserPresence } from '../hooks/use-user-presence';

import { createPresenceTestHarness } from './test-utils';

import type { UserId } from '@granit/types';

vi.mock('@granit/presence', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, getUserPresence: vi.fn() };
});

const { getUserPresence } = await import('@granit/presence');

const USER_ID = mockUsers[1]!.id;
const MOCK_PRESENCE = mockOtherPresences[USER_ID]!;

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
