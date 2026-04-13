import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toEntityId } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useAddUserToGroup,
  useGroups,
  useRemoveUserFromGroup,
  useUserGroups,
} from '../hooks/use-identity-groups.js';
import { IdentityProvider } from '../providers/identity-provider.js';

import type { IdentityProviderProps } from '../providers/identity-provider.js';
import type { IdentityGroup } from '@granit/identity';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

const sampleGroup: IdentityGroup = {
  id: toEntityId<'IdentityGroup'>('group-1'),
  name: 'developers',
  path: '/developers',
  subGroups: [],
};

function createWrapper(client: AxiosInstance, providerBasePath?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: IdentityProviderProps['config'] = { client, providerBasePath };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <IdentityProvider config={config}>{children}</IdentityProvider>
    );
  };
}

describe('use-identity-groups', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useGroups', () => {
    it('fetches all groups', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleGroup] });

      const { result } = renderHook(() => useGroups(), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/identity/provider/groups');
      expect(result.current.data).toEqual([sampleGroup]);
    });
  });

  describe('useUserGroups', () => {
    it('fetches groups for a user', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleGroup] });

      const { result } = renderHook(() => useUserGroups(toEntityId<'User'>('user-1')), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/identity/provider/users/user-1/groups');
    });

    it('is disabled when userId is empty', async () => {
      const client = createMockClient();

      const { result } = renderHook(() => useUserGroups(toEntityId<'User'>('')), {
        wrapper: createWrapper(client),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(client.get).not.toHaveBeenCalled();
    });
  });

  describe('useAddUserToGroup', () => {
    it('adds user to group via PUT', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useAddUserToGroup(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ userId: toEntityId<'User'>('user-1'), groupId: 'group-1' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.put).toHaveBeenCalledWith(
        '/api/v1/identity/provider/users/user-1/groups/group-1'
      );
    });
  });

  describe('useRemoveUserFromGroup', () => {
    it('removes user from group via DELETE', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useRemoveUserFromGroup(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ userId: toEntityId<'User'>('user-1'), groupId: 'group-1' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.delete).toHaveBeenCalledWith(
        '/api/v1/identity/provider/users/user-1/groups/group-1'
      );
    });

    it('exposes error state on failure', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockRejectedValue(new Error('Not found'));

      const { result } = renderHook(() => useRemoveUserFromGroup(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ userId: toEntityId<'User'>('user-1'), groupId: 'group-1' });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe('Not found');
    });
  });
});
