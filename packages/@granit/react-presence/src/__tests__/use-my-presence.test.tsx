import { createMockClient } from '@granit/react-testing';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockMyPresence } from '@granit/react-presence/testing';

import { useMyPresence } from '../hooks/use-my-presence';

import { createPresenceTestHarness } from './test-utils';

vi.mock('@granit/presence', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, getMyPresence: vi.fn() };
});

const { getMyPresence } = await import('@granit/presence');

const snapshot = mockMyPresence;

afterEach(() => {
  vi.clearAllMocks();
});

describe('useMyPresence', () => {
  it('fetches with the default basePath via the provider', async () => {
    const client = createMockClient();
    vi.mocked(getMyPresence).mockResolvedValue(snapshot);
    const { wrapper } = createPresenceTestHarness(client);

    const { result } = renderHook(() => useMyPresence(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMyPresence).toHaveBeenCalledWith(client, '/api/v1');
    expect(result.current.data).toEqual(snapshot);
  });
});
