import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toEntityId } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useIdentityUser, useIdentityUsers } from '../hooks/use-identity-users.js';
import { IdentityProvider } from '../providers/identity-provider.js';

import type { IdentityConfig } from '../providers/identity-provider.js';
import type { IdentityUser, IdentityUserPage } from '@granit/identity';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper(client: AxiosInstance, basePath?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: IdentityConfig = { client, basePath };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <IdentityProvider config={config}>{children}</IdentityProvider>
    );
  };
}

const mockUser: IdentityUser = {
  userId: toEntityId<'User'>('user-1'),
  username: 'jdoe',
  email: 'jdoe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  enabled: true,
  extraProperties: {},
};

const mockPage: IdentityUserPage = {
  items: [mockUser],
  totalCount: 1,
  hasMore: false,
  nextCursor: null,
};

// ---------------------------------------------------------------------------
// Tests — useIdentityUsers
// ---------------------------------------------------------------------------

describe('useIdentityUsers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches users with default basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: mockPage });

    const { result } = renderHook(() => useIdentityUsers(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockPage);
    expect(client.get).toHaveBeenCalledWith('/identity/users/', { params: undefined });
  });

  it('passes search params to the API', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: mockPage });
    const params = { search: 'john', page: 2 };

    const { result } = renderHook(() => useIdentityUsers(params), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/identity/users/', { params });
  });

  it('uses custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: mockPage });

    const { result } = renderHook(() => useIdentityUsers(), {
      wrapper: createWrapper(client, '/custom/path'),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/custom/path/', { params: undefined });
  });

  it('exposes error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useIdentityUsers(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Network error');
  });
});

// ---------------------------------------------------------------------------
// Tests — useIdentityUser
// ---------------------------------------------------------------------------

describe('useIdentityUser', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches a single user by ID', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: mockUser });

    const { result } = renderHook(() => useIdentityUser(toEntityId<'User'>('user-1')), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockUser);
  });

  it('is disabled when userId is empty', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useIdentityUser(toEntityId<'User'>('')), {
      wrapper: createWrapper(client),
    });

    expect(result.current.isFetching).toBe(false);
    expect(client.get).not.toHaveBeenCalled();
  });

  it('exposes error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useIdentityUser(toEntityId<'User'>('user-1')), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Not found');
  });
});
