import { createMockClient } from '@granit/testing';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useRolePermissions } from '../hooks/use-role-permissions';

import { createAuthorizationWrapper } from './test-wrapper';

import type { PermissionGrantResponse } from '@granit/authorization';

const MOCK_GRANT: PermissionGrantResponse = {
  roleName: 'admin',
  permissions: ['Invoices.Create', 'Invoices.Delete', 'Users.View'],
};

describe('useRolePermissions', () => {
  it('should fetch permissions for a given role', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: MOCK_GRANT });

    const { result } = renderHook(() => useRolePermissions({ roleName: 'admin' }), {
      wrapper: createAuthorizationWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(MOCK_GRANT);
    expect(client.get).toHaveBeenCalledWith('/api/v1/authorization/roles/admin');
  });

  it('should use custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: MOCK_GRANT });

    const { result } = renderHook(
      () => useRolePermissions({ roleName: 'editor', basePath: '/api/v1/authorization' }),
      { wrapper: createAuthorizationWrapper(client, { basePath: '/api/v1/authorization' }) }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v1/authorization/roles/editor');
  });

  it('should encode special characters in role name', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({
      data: { roleName: 'rôle spécial', permissions: [] },
    });

    const { result } = renderHook(() => useRolePermissions({ roleName: 'rôle spécial' }), {
      wrapper: createAuthorizationWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v1/authorization/roles/r%C3%B4le%20sp%C3%A9cial');
  });

  it('should not fetch when disabled', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useRolePermissions({ roleName: 'admin', enabled: false }), {
      wrapper: createAuthorizationWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValueOnce(new Error('Not Found'));

    const { result } = renderHook(() => useRolePermissions({ roleName: 'unknown' }), {
      wrapper: createAuthorizationWrapper(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Not Found');
  });
});
