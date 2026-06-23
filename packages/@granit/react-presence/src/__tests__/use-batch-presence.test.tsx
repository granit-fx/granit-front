import { createMockClient } from '@granit/react-testing';
import { toEntityId } from '@granit/types';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockOtherPresences, mockUsers } from '@granit/react-presence/testing';

import { useBatchPresence } from '../hooks/use-batch-presence';

import { createPresenceTestHarness } from './test-utils';

import type { BatchPresenceResponse, PresenceResponse } from '@granit/presence';
import type { UserId } from '@granit/types';

vi.mock('@granit/presence', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, getBatchPresence: vi.fn() };
});

const { getBatchPresence } = await import('@granit/presence');

function makeSnapshot(id: string): PresenceResponse {
  return { ...mockOtherPresences[mockUsers[1]!.id]!, userId: toEntityId<'User'>(id) as UserId };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('useBatchPresence', () => {
  it('chunks at MaxBatchSize (200) and merges the dictionaries', async () => {
    const client = createMockClient();
    const ids: UserId[] = Array.from(
      { length: 250 },
      (_, i) => toEntityId<'User'>(`user-${String(i).padStart(3, '0')}`) as UserId
    );

    vi.mocked(getBatchPresence).mockImplementation(async (_c, _b, request) => {
      const presences: Record<string, PresenceResponse> = {};
      for (const id of request.userIds) presences[id] = makeSnapshot(id);
      return { presences } satisfies BatchPresenceResponse;
    });

    const { wrapper } = createPresenceTestHarness(client);
    const { result } = renderHook(() => useBatchPresence(ids), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getBatchPresence).toHaveBeenCalledTimes(2);
    expect(Object.keys(result.current.data!.presences)).toHaveLength(250);
  });

  it('deduplicates and sorts the userIds before calling', async () => {
    const client = createMockClient();
    const userA = toEntityId<'User'>('user-a') as UserId;
    const userB = toEntityId<'User'>('user-b') as UserId;
    vi.mocked(getBatchPresence).mockResolvedValue({
      presences: { [userA]: makeSnapshot(userA), [userB]: makeSnapshot(userB) },
    });
    const { wrapper } = createPresenceTestHarness(client);

    const { result } = renderHook(() => useBatchPresence([userB, userA, userA]), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getBatchPresence).toHaveBeenCalledTimes(1);
    const sent = vi.mocked(getBatchPresence).mock.calls[0]![2].userIds;
    expect(sent).toEqual([userA, userB]);
  });
});
