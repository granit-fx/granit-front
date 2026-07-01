import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { usePermissionGrant } from '../hooks/use-permission-grant';

import { createAuthorizationWrapper } from './test-wrapper';

import type { AxiosInstance } from '@granit/api-client';

function createWrapper(client: AxiosInstance, basePath?: string) {
  const queryClient = createTestQueryClient();
  return {
    wrapper: createAuthorizationWrapper(client, { basePath, queryClient }),
    queryClient,
  };
}

describe('usePermissionGrant', () => {
  it('should grant a permission via PUT', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValueOnce({ data: undefined });

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => usePermissionGrant(), { wrapper });

    result.current.grant.mutate({
      roleName: 'editor',
      permissionName: 'Invoices.Create',
    });

    await waitFor(() => expect(result.current.grant.isSuccess).toBe(true));

    expect(client.put).toHaveBeenCalledWith('/api/v1/authorization/roles/editor/Invoices.Create');
  });

  it('should revoke a permission via DELETE', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => usePermissionGrant(), { wrapper });

    result.current.revoke.mutate({
      roleName: 'editor',
      permissionName: 'Invoices.Delete',
    });

    await waitFor(() => expect(result.current.revoke.isSuccess).toBe(true));

    expect(client.delete).toHaveBeenCalledWith(
      '/api/v1/authorization/roles/editor/Invoices.Delete'
    );
  });

  it('should use custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValueOnce({ data: undefined });

    const { wrapper } = createWrapper(client, '/api/v1/authorization');
    const { result } = renderHook(() => usePermissionGrant({ basePath: '/api/v1/authorization' }), {
      wrapper,
    });

    result.current.grant.mutate({
      roleName: 'admin',
      permissionName: 'Users.View',
    });

    await waitFor(() => expect(result.current.grant.isSuccess).toBe(true));

    expect(client.put).toHaveBeenCalledWith('/api/v1/authorization/roles/admin/Users.View');
  });

  it('should invalidate role query on successful grant', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValueOnce({ data: undefined });

    const { wrapper, queryClient } = createWrapper(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => usePermissionGrant(), { wrapper });

    result.current.grant.mutate({
      roleName: 'editor',
      permissionName: 'Invoices.Create',
    });

    await waitFor(() => expect(result.current.grant.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['authorization', 'permissions', 'roles', 'editor'],
    });
  });

  it('should invalidate role query on successful revoke', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

    const { wrapper, queryClient } = createWrapper(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => usePermissionGrant(), { wrapper });

    result.current.revoke.mutate({
      roleName: 'admin',
      permissionName: 'Users.View',
    });

    await waitFor(() => expect(result.current.revoke.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['authorization', 'permissions', 'roles', 'admin'],
    });
  });

  it('should handle grant errors', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockRejectedValueOnce(new Error('Forbidden'));

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => usePermissionGrant(), { wrapper });

    result.current.grant.mutate({
      roleName: 'viewer',
      permissionName: 'Admin.Manage',
    });

    await waitFor(() => expect(result.current.grant.isError).toBe(true));

    expect(result.current.grant.error?.message).toBe('Forbidden');
  });

  it('should encode special characters in URL', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValueOnce({ data: undefined });

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => usePermissionGrant(), { wrapper });

    result.current.grant.mutate({
      roleName: 'rôle',
      permissionName: 'Perm.Spécial',
    });

    await waitFor(() => expect(result.current.grant.isSuccess).toBe(true));

    expect(client.put).toHaveBeenCalledWith(
      '/api/v1/authorization/roles/r%C3%B4le/Perm.Sp%C3%A9cial'
    );
  });
});
