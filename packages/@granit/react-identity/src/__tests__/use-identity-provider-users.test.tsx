import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useCreateUser,
  useProviderUser,
  useProviderUsers,
  useSetUserEnabled,
  useUpdateUser,
} from '../hooks/use-identity-provider-users.js';
import { IdentityProvider } from '../providers/identity-provider.js';

import type { IdentityConfig } from '../providers/identity-provider.js';
import type { IdentityUser } from '@granit/identity';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

const sampleUser: IdentityUser = {
  userId: 'user-1',
  username: 'jdoe',
  email: 'jdoe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  enabled: true,
  extraProperties: {},
};

function createWrapper(client: AxiosInstance, providerBasePath?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: IdentityConfig = { client, providerBasePath };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <IdentityProvider config={config}>{children}</IdentityProvider>
    );
  };
}

describe('use-identity-provider-users', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useProviderUsers', () => {
    it('fetches users from provider', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleUser] });

      const { result } = renderHook(() => useProviderUsers(), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/identity/provider/users', {
        params: undefined,
      });
      expect(result.current.data).toEqual([sampleUser]);
    });

    it('passes search params', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [] });

      const params = { search: 'john', max: 10 };
      const { result } = renderHook(() => useProviderUsers(params), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/identity/provider/users', { params });
    });

    it('uses custom providerBasePath', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [] });

      const { result } = renderHook(() => useProviderUsers(), {
        wrapper: createWrapper(client, '/custom/provider'),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/custom/provider/users', {
        params: undefined,
      });
    });
  });

  describe('useProviderUser', () => {
    it('fetches a single user by ID', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleUser });

      const { result } = renderHook(() => useProviderUser('user-1'), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/identity/provider/users/user-1');
      expect(result.current.data).toEqual(sampleUser);
    });

    it('is disabled when userId is empty', async () => {
      const client = createMockClient();

      const { result } = renderHook(() => useProviderUser(''), {
        wrapper: createWrapper(client),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(client.get).not.toHaveBeenCalled();
    });
  });

  describe('useCreateUser', () => {
    it('creates a user via POST', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleUser });

      const { result } = renderHook(() => useCreateUser(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ username: 'jdoe', email: 'jdoe@example.com', enabled: true });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith('/identity/provider/users', {
        username: 'jdoe',
        email: 'jdoe@example.com',
        enabled: true,
      });
    });
  });

  describe('useUpdateUser', () => {
    it('updates a user via PUT', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue({ data: sampleUser });

      const { result } = renderHook(() => useUpdateUser(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ userId: 'user-1', request: { email: 'new@example.com' } });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.put).toHaveBeenCalledWith('/identity/provider/users/user-1', {
        email: 'new@example.com',
      });
    });
  });

  describe('useSetUserEnabled', () => {
    it('disables a user via PATCH', async () => {
      const client = createMockClient();
      vi.mocked(client.patch).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useSetUserEnabled(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ userId: 'user-1', enabled: false });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.patch).toHaveBeenCalledWith('/identity/provider/users/user-1/enabled', {
        enabled: false,
      });
    });

    it('exposes error state on failure', async () => {
      const client = createMockClient();
      vi.mocked(client.patch).mockRejectedValue(new Error('Forbidden'));

      const { result } = renderHook(() => useSetUserEnabled(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ userId: 'user-1', enabled: false });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe('Forbidden');
    });
  });
});
