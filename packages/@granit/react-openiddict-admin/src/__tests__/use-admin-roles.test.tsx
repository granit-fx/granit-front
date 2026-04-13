import { createRole, deleteRole, getRoleMembers, listRoles } from '@granit/openiddict-admin';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useAdminRoleMembers,
  useAdminRoles,
  useCreateAdminRole,
  useDeleteAdminRole,
} from '../hooks/use-admin-roles.js';
import { OpenIddictAdminProvider } from '../providers/openiddict-admin-provider.js';

import type { AdminRole, AdminRoleMember } from '@granit/openiddict-admin';

vi.mock('@granit/openiddict-admin', () => ({
  listRoles: vi.fn(),
  createRole: vi.fn(),
  deleteRole: vi.fn(),
  getRoleMembers: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function createWrapper() {
  const queryClient = createTestQueryClient();
  const client = createMockClient();
  return {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <OpenIddictAdminProvider config={{ client }}>{children}</OpenIddictAdminProvider>
      </QueryClientProvider>
    ),
    queryClient,
    client,
  };
}

const mockRole: AdminRole = {
  name: 'admin',
  description: 'Administrator role',
};

const mockRoles: readonly AdminRole[] = [
  mockRole,
  { name: 'user', description: 'Standard user role' },
];

describe('useAdminRoles', () => {
  it('should fetch all roles', async () => {
    vi.mocked(listRoles).mockResolvedValueOnce(mockRoles);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAdminRoles(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(listRoles).toHaveBeenCalledWith(expect.anything(), '/admin');
    expect(result.current.data).toEqual(mockRoles);
  });

  it('should handle fetch error', async () => {
    vi.mocked(listRoles).mockRejectedValueOnce(new Error('Forbidden'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAdminRoles(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Forbidden');
  });
});

describe('useCreateAdminRole', () => {
  it('should create a role and invalidate roles query', async () => {
    vi.mocked(createRole).mockResolvedValueOnce(mockRole);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateAdminRole(), { wrapper });

    result.current.mutate({ name: 'admin', description: 'Administrator role' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(createRole).toHaveBeenCalledWith(expect.anything(), '/admin', {
      name: 'admin',
      description: 'Administrator role',
    });
    expect(result.current.data).toEqual(mockRole);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['openiddict-admin', 'roles'],
    });
  });

  it('should handle creation error', async () => {
    vi.mocked(createRole).mockRejectedValueOnce(new Error('Conflict'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateAdminRole(), { wrapper });

    result.current.mutate({ name: 'admin' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Conflict');
  });
});

describe('useAdminRoleMembers', () => {
  const mockMembers: readonly AdminRoleMember[] = [
    {
      userId: 'usr-001',
      username: 'admin',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
    },
  ];

  it('should fetch role members', async () => {
    vi.mocked(getRoleMembers).mockResolvedValueOnce(mockMembers);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAdminRoleMembers('admin'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getRoleMembers).toHaveBeenCalledWith(expect.anything(), '/admin', 'admin');
    expect(result.current.data).toEqual(mockMembers);
  });

  it('should be disabled when roleName is empty', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAdminRoleMembers(''), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getRoleMembers).not.toHaveBeenCalled();
  });
});

describe('useDeleteAdminRole', () => {
  it('should delete a role and invalidate roles query', async () => {
    vi.mocked(deleteRole).mockResolvedValueOnce(undefined);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteAdminRole(), { wrapper });

    result.current.mutate('admin');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(deleteRole).toHaveBeenCalledWith(expect.anything(), '/admin', 'admin');
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['openiddict-admin', 'roles'],
    });
  });

  it('should handle delete error when role has members', async () => {
    vi.mocked(deleteRole).mockRejectedValueOnce(new Error('Conflict'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteAdminRole(), { wrapper });

    result.current.mutate('admin');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Conflict');
  });
});
