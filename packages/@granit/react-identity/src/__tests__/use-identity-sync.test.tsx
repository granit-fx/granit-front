import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toEntityId } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useIdentitySync } from '../hooks/use-identity-sync';
import { IdentityProvider } from '../providers/identity-provider';

import type { IdentityProviderProps } from '../providers/identity-provider';
import type {
  IdentityUserCacheSyncAllResponse,
  IdentityUserCacheSyncStaleResponse,
} from '@granit/identity';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper(client: AxiosInstance, basePath?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: IdentityProviderProps['config'] = { client, basePath };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <IdentityProvider config={config}>{children}</IdentityProvider>
    );
  };
}

const mockSyncAllResult: IdentityUserCacheSyncAllResponse = { syncedCount: 42 };
const mockSyncStaleResult: IdentityUserCacheSyncStaleResponse = { refreshedCount: 5 };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useIdentitySync', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sync mutation posts user IDs', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useIdentitySync(), {
      wrapper: createWrapper(client),
    });

    result.current.sync.mutate([toEntityId<'User'>('user-1'), toEntityId<'User'>('user-2')]);

    await waitFor(() => expect(result.current.sync.isSuccess).toBe(true));
    expect(client.post).toHaveBeenCalledWith('/api/v1/identity/users/sync', {
      userIds: [toEntityId<'User'>('user-1'), toEntityId<'User'>('user-2')],
    });
    expect(result.current.sync.data).toEqual([]);
  });

  it('syncAll mutation triggers full sync', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ data: mockSyncAllResult });

    const { result } = renderHook(() => useIdentitySync(), {
      wrapper: createWrapper(client),
    });

    result.current.syncAll.mutate();

    await waitFor(() => expect(result.current.syncAll.isSuccess).toBe(true));
    expect(result.current.syncAll.data).toEqual(mockSyncAllResult);
    expect(client.post).toHaveBeenCalledWith('/api/v1/identity/users/sync-all');
  });

  it('syncStale mutation triggers stale sync', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ data: mockSyncStaleResult });

    const { result } = renderHook(() => useIdentitySync(), {
      wrapper: createWrapper(client),
    });

    result.current.syncStale.mutate();

    await waitFor(() => expect(result.current.syncStale.isSuccess).toBe(true));
    expect(result.current.syncStale.data).toEqual(mockSyncStaleResult);
    expect(client.post).toHaveBeenCalledWith('/api/v1/identity/users/sync-stale');
  });

  it('uses custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ data: undefined });

    const { result } = renderHook(() => useIdentitySync(), {
      wrapper: createWrapper(client, '/custom/path'),
    });

    result.current.sync.mutate([toEntityId<'User'>('user-1')]);

    await waitFor(() => expect(result.current.sync.isSuccess).toBe(true));
    expect(client.post).toHaveBeenCalledWith('/custom/path/sync', {
      userIds: [toEntityId<'User'>('user-1')],
    });
  });

  it('exposes error state on sync failure', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValue(new Error('Sync failed'));

    const { result } = renderHook(() => useIdentitySync(), {
      wrapper: createWrapper(client),
    });

    result.current.syncAll.mutate();

    await waitFor(() => expect(result.current.syncAll.isError).toBe(true));
    expect(result.current.syncAll.error?.message).toBe('Sync failed');
  });
});
