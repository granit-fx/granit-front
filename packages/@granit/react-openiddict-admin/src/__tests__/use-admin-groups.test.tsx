import {
  addGroupMember,
  createGroup,
  deleteGroup,
  listGroups,
  removeGroupMember,
} from '@granit/openiddict-admin';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  useAddGroupMember,
  useAdminGroups,
  useCreateAdminGroup,
  useDeleteAdminGroup,
  useRemoveGroupMember,
} from '../hooks/use-admin-groups.js';
import { OpenIddictAdminProvider } from '../providers/openiddict-admin-provider.js';

import type { AdminGroup } from '@granit/openiddict-admin';

vi.mock('@granit/openiddict-admin', () => ({
  listGroups: vi.fn(),
  createGroup: vi.fn(),
  deleteGroup: vi.fn(),
  addGroupMember: vi.fn(),
  removeGroupMember: vi.fn(),
}));

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

const mockGroup: AdminGroup = {
  id: 'grp-001',
  name: 'Engineering',
  description: 'Engineering team',
  tenantId: null,
};

const mockGroups: readonly AdminGroup[] = [
  mockGroup,
  { id: 'grp-002', name: 'Marketing', description: null, tenantId: null },
];

describe('useAdminGroups', () => {
  it('should fetch all groups', async () => {
    vi.mocked(listGroups).mockResolvedValueOnce(mockGroups);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAdminGroups(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(listGroups).toHaveBeenCalledWith(expect.anything(), '/admin');
    expect(result.current.data).toEqual(mockGroups);
  });

  it('should handle fetch error', async () => {
    vi.mocked(listGroups).mockRejectedValueOnce(new Error('Server Error'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAdminGroups(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Server Error');
  });
});

describe('useCreateAdminGroup', () => {
  it('should create a group and invalidate groups query', async () => {
    vi.mocked(createGroup).mockResolvedValueOnce(mockGroup);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateAdminGroup(), { wrapper });

    result.current.mutate({ name: 'Engineering', description: 'Engineering team' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(createGroup).toHaveBeenCalledWith(expect.anything(), '/admin', {
      name: 'Engineering',
      description: 'Engineering team',
    });
    expect(result.current.data).toEqual(mockGroup);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['openiddict-admin', 'groups'],
    });
  });

  it('should handle creation error', async () => {
    vi.mocked(createGroup).mockRejectedValueOnce(new Error('Bad Request'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateAdminGroup(), { wrapper });

    result.current.mutate({ name: '' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Bad Request');
  });
});

describe('useDeleteAdminGroup', () => {
  it('should delete a group and invalidate groups query', async () => {
    vi.mocked(deleteGroup).mockResolvedValueOnce(undefined);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteAdminGroup(), { wrapper });

    result.current.mutate('grp-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(deleteGroup).toHaveBeenCalledWith(expect.anything(), '/admin', 'grp-001');
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['openiddict-admin', 'groups'],
    });
  });

  it('should handle delete error', async () => {
    vi.mocked(deleteGroup).mockRejectedValueOnce(new Error('Not Found'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteAdminGroup(), { wrapper });

    result.current.mutate('invalid-id');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Not Found');
  });
});

describe('useAddGroupMember', () => {
  it('should add a member and invalidate groups query', async () => {
    vi.mocked(addGroupMember).mockResolvedValueOnce(undefined);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useAddGroupMember(), { wrapper });

    result.current.mutate({ groupId: 'grp-001', request: { userId: 'usr-001' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(addGroupMember).toHaveBeenCalledWith(expect.anything(), '/admin', 'grp-001', {
      userId: 'usr-001',
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['openiddict-admin', 'groups'],
    });
  });

  it('should handle add member error', async () => {
    vi.mocked(addGroupMember).mockRejectedValueOnce(new Error('Conflict'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAddGroupMember(), { wrapper });

    result.current.mutate({ groupId: 'grp-001', request: { userId: 'usr-001' } });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Conflict');
  });
});

describe('useRemoveGroupMember', () => {
  it('should remove a member and invalidate groups query', async () => {
    vi.mocked(removeGroupMember).mockResolvedValueOnce(undefined);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRemoveGroupMember(), { wrapper });

    result.current.mutate({ groupId: 'grp-001', userId: 'usr-001' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(removeGroupMember).toHaveBeenCalledWith(
      expect.anything(),
      '/admin',
      'grp-001',
      'usr-001'
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['openiddict-admin', 'groups'],
    });
  });

  it('should handle remove member error', async () => {
    vi.mocked(removeGroupMember).mockRejectedValueOnce(new Error('Not Found'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRemoveGroupMember(), { wrapper });

    result.current.mutate({ groupId: 'grp-001', userId: 'invalid' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Not Found');
  });
});
