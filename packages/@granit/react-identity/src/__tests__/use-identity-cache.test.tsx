import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toEntityId, toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useBatchResolveUsers, useIdentityCacheStats } from '../hooks/use-identity-cache';
import { IdentityProvider } from '../providers/identity-provider';

import type { IdentityProviderProps } from '../providers/identity-provider';
import type { IdentityUser, IdentityUserCacheStats } from '@granit/identity';
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

const mockStats: IdentityUserCacheStats = {
  totalEntries: 100,
  staleEntries: 5,
  oldestSyncAt: toISODateString('2026-01-01T00:00:00Z'),
  newestSyncAt: toISODateString('2026-03-17T00:00:00Z'),
};

const mockUsers: IdentityUser[] = [
  {
    userId: toEntityId<'User'>('user-1'),
    username: 'jdoe',
    email: 'jdoe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    enabled: true,
    metadata: {},
  },
];

// ---------------------------------------------------------------------------
// Tests — useIdentityCacheStats
// ---------------------------------------------------------------------------

describe('useIdentityCacheStats', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches cache statistics', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: mockStats });

    const { result } = renderHook(() => useIdentityCacheStats(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockStats);
    expect(client.get).toHaveBeenCalledWith('/api/v1/identity/users/stats');
  });

  it('uses custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: mockStats });

    const { result } = renderHook(() => useIdentityCacheStats(), {
      wrapper: createWrapper(client, '/custom/path'),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/custom/path/stats');
  });

  it('exposes error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useIdentityCacheStats(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Network error');
  });
});

// ---------------------------------------------------------------------------
// Tests — useBatchResolveUsers
// ---------------------------------------------------------------------------

describe('useBatchResolveUsers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves users by IDs', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ data: mockUsers });

    const { result } = renderHook(() => useBatchResolveUsers(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate([toEntityId<'User'>('user-1')]);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockUsers);
    expect(client.post).toHaveBeenCalledWith('/api/v1/identity/users/batch', {
      userIds: [toEntityId<'User'>('user-1')],
    });
  });

  it('exposes error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useBatchResolveUsers(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate([toEntityId<'User'>('user-1')]);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Server error');
  });
});
