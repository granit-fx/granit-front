import { createMockClient } from '@granit/react-testing';
import { toISODateString } from '@granit/types';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockMyPresence, mockOtherPresences, mockUsers } from '@granit/react-presence/testing';

import { useMyPresence } from '../hooks/use-my-presence';
import { useSetMyPresence } from '../hooks/use-set-my-presence';

import { createPresenceTestHarness } from './test-utils';

vi.mock('@granit/presence', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    getMyPresence: vi.fn(),
    setMyPresence: vi.fn(),
  };
});

const { getMyPresence, setMyPresence } = await import('@granit/presence');

const baseSnapshot = mockMyPresence;

afterEach(() => {
  vi.clearAllMocks();
});

describe('useSetMyPresence', () => {
  it('optimistically updates the cache and confirms on success', async () => {
    const client = createMockClient();
    vi.mocked(getMyPresence).mockResolvedValue(baseSnapshot);
    const serverDnd = mockOtherPresences[mockUsers[3]!.id]!;
    vi.mocked(setMyPresence).mockResolvedValue(serverDnd);

    const { wrapper } = createPresenceTestHarness(client);
    const { result } = renderHook(
      () => ({ query: useMyPresence(), mutation: useSetMyPresence() }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));

    await result.current.mutation.mutateAsync({
      manualStatus: 'DoNotDisturb',
      untilUtc: toISODateString('2026-05-22T11:00:00Z'),
    });

    await waitFor(() => expect(result.current.query.data).toEqual(serverDnd));
  });

  it('rolls back when the server returns 400', async () => {
    const client = createMockClient();
    vi.mocked(getMyPresence).mockResolvedValue(baseSnapshot);
    vi.mocked(setMyPresence).mockRejectedValue(new Error('400 Bad Request'));

    const { wrapper } = createPresenceTestHarness(client);
    const { result } = renderHook(
      () => ({ query: useMyPresence(), mutation: useSetMyPresence() }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));

    await expect(
      result.current.mutation.mutateAsync({
        manualStatus: 'Busy',
        untilUtc: toISODateString('1999-01-01T00:00:00Z'),
      })
    ).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.query.data).toEqual(baseSnapshot);
    });
  });
});
