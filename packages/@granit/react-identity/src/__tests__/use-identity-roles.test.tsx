import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toEntityId } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useAssignRole,
  useRemoveRole,
  useRoleMembers,
  useRoles,
  useUserRoles,
} from '../hooks/use-identity-roles.js';
import { IdentityProvider } from '../providers/identity-provider.js';

import type { IdentityConfig } from '../providers/identity-provider.js';
import type { IdentityRole } from '@granit/identity';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

const sampleRole: IdentityRole = {
  id: toEntityId<'IdentityRole'>('role-1'),
  name: 'admin',
  description: 'Administrator',
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

describe('use-identity-roles', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useRoles', () => {
    it('fetches all roles', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleRole] });

      const { result } = renderHook(() => useRoles(), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/identity/provider/roles');
      expect(result.current.data).toEqual([sampleRole]);
    });
  });

  describe('useUserRoles', () => {
    it('fetches roles for a user', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleRole] });

      const { result } = renderHook(() => useUserRoles(toEntityId<'User'>('user-1')), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/identity/provider/users/user-1/roles');
    });

    it('is disabled when userId is empty', async () => {
      const client = createMockClient();

      const { result } = renderHook(() => useUserRoles(toEntityId<'User'>('')), {
        wrapper: createWrapper(client),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(client.get).not.toHaveBeenCalled();
    });
  });

  describe('useRoleMembers', () => {
    it('fetches members of a role', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [] });

      const { result } = renderHook(() => useRoleMembers('admin'), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/identity/provider/roles/admin/members');
    });

    it('is disabled when roleName is empty', async () => {
      const client = createMockClient();

      const { result } = renderHook(() => useRoleMembers(''), {
        wrapper: createWrapper(client),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(client.get).not.toHaveBeenCalled();
    });
  });

  describe('useAssignRole', () => {
    it('assigns a role via PUT', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useAssignRole(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ userId: toEntityId<'User'>('user-1'), roleName: 'admin' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.put).toHaveBeenCalledWith('/identity/provider/users/user-1/roles/admin');
    });
  });

  describe('useRemoveRole', () => {
    it('removes a role via DELETE', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useRemoveRole(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ userId: toEntityId<'User'>('user-1'), roleName: 'admin' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.delete).toHaveBeenCalledWith('/identity/provider/users/user-1/roles/admin');
    });

    it('uses custom providerBasePath', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useRemoveRole(), {
        wrapper: createWrapper(client, '/custom/provider'),
      });

      result.current.mutate({ userId: toEntityId<'User'>('user-1'), roleName: 'admin' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.delete).toHaveBeenCalledWith('/custom/provider/users/user-1/roles/admin');
    });
  });
});
